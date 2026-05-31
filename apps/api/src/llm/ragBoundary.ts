/**
 * ragBoundary.ts
 *
 * Слой RAG: embeddings → MMR (Maximal Marginal Relevance) → reranker → citation builder.
 *
 * ИСПРАВЛЕНИЕ: embedQuery теперь graceful — если ни один провайдер не работает,
 * retrieveRelevantChunks возвращает пустой результат вместо того чтобы падать с 502.
 * DeepSeek убрал свой embedding API (deepseek-embed не существует).
 */

import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveFromRepoRoot } from "../paths";
import { config } from "../config";
import { embedQueryLocal, LOCAL_EMBEDDER_PROVIDER_ID } from "./localEmbedder";
import { filterGarbledChunks } from "./ragQualityGate";
import type { RelatedTopic } from "./graphRagBoundary";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RagSourceManifestItem {
  id: string;
  title: string;
  source_url?: string | null;
  approved_for_rag?: boolean;
  local_path?: string | null;
  notes?: string | null;
}

export interface RagChunk {
  chunk_id: string;
  source_id: string;
  source_title: string;
  text: string;
  score?: number;
  page_hint?: string | null;
  topic_tags?: string[];
  source_url?: string | null;
  /** 'corpus' = approved global RAG; 'personal' = user-uploaded private doc. */
  source_type?: 'corpus' | 'personal';
}

/** Citation for frontend display — step 9 */
export interface RagCitation {
  source_title: string;
  page_hint: string | null;
  chunk_id: string;
  score?: number;
  source_url?: string | null;
  snippet: string;
}

interface RagChunkWithEmbedding extends RagChunk {
  embedding: number[];
}

interface MatchChunkRow {
  chunk_id: string;
  source_id: string;
  source_title: string;
  chunk_text: string;
  score: number;
  page_hint?: string | null;
  topic_tags?: string[] | null;
}

interface MatchChunkWithEmbeddingRow extends MatchChunkRow {
  embedding: number[] | null;
}

interface HybridSearchRow {
  chunk_id: string;
  source_id: string;
  source_title: string;
  chunk_text: string;
  page_hint?: string | null;
  topic_tags?: string[] | null;
  dense_score: number;
  lex_score: number;
  rrf_score: number;
  embedding: number[] | string | null;
}

// ─── Supabase client ───────────────────────────────────────────────────────────

let ragSupabase: SupabaseClient | null =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : null;

/** Test seam — lets unit tests pin the Supabase client (or null). */
export function _setRagSupabaseForTesting(client: SupabaseClient | null): void {
  ragSupabase = client;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVG_CHARS_PER_TOKEN = 4;

// ─── Manifest ──────────────────────────────────────────────────────────────────

function parseManifest(): RagSourceManifestItem[] {
  const manifestPath = resolveFromRepoRoot("infra", "data", "rag_manifest.json");
  const raw = readFileSync(manifestPath, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as RagSourceManifestItem[]) : [];
}

export function loadApprovedRagSources(): RagSourceManifestItem[] {
  return parseManifest().filter((item) => item.approved_for_rag === true);
}

// ─── Cosine similarity ──────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Per-source cap ─────────────────────────────────────────────────────────────

function applyPerSourceCap<T extends { source_id: string }>(
  candidates: T[],
  cap: number,
): T[] {
  if (cap <= 0) return candidates;
  const seenCount = new Map<string, number>();
  const kept: T[] = [];
  for (const c of candidates) {
    const n = seenCount.get(c.source_id) ?? 0;
    if (n >= cap) continue;
    seenCount.set(c.source_id, n + 1);
    kept.push(c);
  }
  return kept;
}

// ─── MMR ────────────────────────────────────────────────────────────────────────

function applyMMR(
  candidates: RagChunkWithEmbedding[],
  queryEmbedding: number[],
  k: number,
  lambda: number = config.rag.mmrLambda,
): RagChunk[] {
  if (candidates.length === 0) return [];
  if (candidates.length <= k) {
    return candidates.map(({ embedding: _e, ...chunk }) => chunk);
  }

  const selected: RagChunkWithEmbedding[] = [];
  const remaining = [...candidates];

  while (selected.length < k && remaining.length > 0) {
    let bestScore = -Infinity;
    let bestIdx = 0;

    for (let i = 0; i < remaining.length; i++) {
      const relevance = cosineSimilarity(remaining[i].embedding, queryEmbedding);
      const maxRedundancy =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((s) => cosineSimilarity(remaining[i].embedding, s.embedding)));
      const mmrScore = lambda * relevance - (1 - lambda) * maxRedundancy;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected.map(({ embedding: _e, ...chunk }) => chunk);
}

// ─── Embedding providers ───────────────────────────────────────────────────────

async function embedWithCloudflare(question: string): Promise<number[]> {
  if (!config.llm.cloudflareApiToken || !config.llm.cloudflareAccountId) {
    throw new Error("Cloudflare embedding config missing");
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.llm.cloudflareAccountId}/ai/run/${config.llm.cloudflareEmbeddingModel}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.llm.cloudflareApiToken}`,
    },
    body: JSON.stringify({ text: question }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudflare embedding error: ${response.status} ${details}`);
  }

  const data = (await response.json()) as { result?: { data?: number[][] } };
  const embedding = data.result?.data?.[0];
  if (!embedding || embedding.length === 0) {
    throw new Error("Cloudflare embedding response is empty");
  }
  return embedding;
}

// OpenRouter exposes an OpenAI-compatible /v1/embeddings endpoint.
// Default model is paid-but-cheap openai/text-embedding-3-small;
// override via OPENROUTER_EMBEDDING_MODEL.
async function embedWithOpenRouter(question: string): Promise<number[]> {
  if (!config.llm.openRouterApiKey) {
    throw new Error("OpenRouter embedding config missing");
  }
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.llm.openRouterApiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.openRouterEmbeddingModel,
      input: question,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenRouter embedding error: ${response.status} ${details}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const embedding = data.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error("OpenRouter embedding response is empty");
  }
  return embedding;
}

// ─── embedQuery — graceful fallback (null вместо throw) ──────────────────────
//
// DeepSeek НЕ поддерживает embeddings (модель deepseek-embed удалена).
// Поэтому функция возвращает null когда провайдеры недоступны,
// вместо того чтобы бросать исключение и валить весь запрос.
//
// Dim-guard. Прод-схема (rag_chunks.embedding) — vector(1024) под Qwen3-0.6B.
// Cloudflare (384/768) и OpenRouter (text-embedding-3-small, 1536) дают другие
// размерности; их вектор в hybrid_search_chunks упадёт с типовой ошибкой.
// Поэтому отбраковываем провайдера с несовпадающим dim — идём дальше по chain'у.

const EXPECTED_QUERY_EMBEDDING_DIM = 1024;

export async function embedQuery(
  question: string,
): Promise<{ embedding: number[]; provider: string } | null> {
  // Provider order: local Transformers.js first (no network, Qwen3 1024D), then
  // remote APIs as deprecated fallback. Force-select via EMBEDDING_PROVIDER=
  // local|openrouter|cloudflare.
  const preferred = config.llm.embeddingProvider?.toLowerCase();

  const tryLocal = async () => {
    if (!config.rag.localEmbedderEnabled) return null;
    try {
      const embedding = await embedQueryLocal(question);
      if (!embedding.length) return null;
      return { embedding, provider: LOCAL_EMBEDDER_PROVIDER_ID };
    } catch (error) {
      console.warn("[rag] Local embedder failed:", error instanceof Error ? error.message : error);
      return null;
    }
  };

  const tryOpenRouter = async () => {
    if (!config.llm.openRouterApiKey) return null;
    try {
      return { embedding: await embedWithOpenRouter(question), provider: "openrouter" };
    } catch (error) {
      console.warn("[rag] OpenRouter embedding failed:", error instanceof Error ? error.message : error);
      return null;
    }
  };

  const tryCloudflare = async () => {
    if (!config.llm.cloudflareApiToken || !config.llm.cloudflareAccountId) return null;
    try {
      return { embedding: await embedWithCloudflare(question), provider: "cloudflare" };
    } catch (error) {
      console.warn("[rag] Cloudflare embedding failed:", error instanceof Error ? error.message : error);
      return null;
    }
  };

  const chain =
    preferred === "cloudflare"
      ? [tryCloudflare, tryOpenRouter, tryLocal]
      : preferred === "openrouter"
        ? [tryOpenRouter, tryCloudflare, tryLocal]
        : [tryLocal, tryOpenRouter, tryCloudflare];

  for (const attempt of chain) {
    const result = await attempt();
    if (!result) continue;
    if (result.embedding.length !== EXPECTED_QUERY_EMBEDDING_DIM) {
      console.warn(
        `[rag] provider ${result.provider} returned dim=${result.embedding.length}, ` +
          `expected ${EXPECTED_QUERY_EMBEDDING_DIM} (БД vector(${EXPECTED_QUERY_EMBEDDING_DIM})). ` +
          `Пропускаем — пробуем следующий провайдер.`,
      );
      continue;
    }
    return result;
  }

  if (config.llm.deepseekApiKey) {
    console.warn("[rag] DeepSeek embedding API не поддерживается (deepseek-embed удалён). Пропускаем vector search.");
  }

  return null;
}

// ─── Step 8: Cross-encoder reranker ────────────────────────────────────────────

interface RerankScore {
  id?: number;
  index?: number;
  score: number;
}

async function rerankWithCloudflare(
  query: string,
  chunks: RagChunk[],
): Promise<RagChunk[]> {
  const rerankerModel = process.env.CLOUDFLARE_RERANKER_MODEL ?? "@cf/baai/bge-reranker-base";
  if (
    !config.llm.cloudflareApiToken ||
    !config.llm.cloudflareAccountId ||
    chunks.length === 0
  ) {
    return chunks;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${config.llm.cloudflareAccountId}/ai/run/${rerankerModel}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llm.cloudflareApiToken}`,
      },
      body: JSON.stringify({
        query,
        contexts: chunks.map((c) => ({ text: c.text })),
        top_k: chunks.length,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(
        `[reranker] HTTP ${response.status} — using original order. Body: ${body.slice(0, 200)}`,
      );
      return chunks;
    }

    const data = (await response.json()) as {
      result?: { response?: RerankScore[]; data?: RerankScore[] } | RerankScore[];
      success?: boolean;
    };

    const scores: RerankScore[] | undefined = Array.isArray(data.result)
      ? data.result
      : (data.result?.response ?? data.result?.data);
    if (!scores || scores.length === 0) return chunks;

    const positionOf = (s: RerankScore): number =>
      typeof s.id === "number" ? s.id : typeof s.index === "number" ? s.index : -1;

    const ranked = [...chunks]
      .map((chunk, i) => ({
        chunk,
        score: scores.find((s) => positionOf(s) === i)?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ chunk, score }) => ({ ...chunk, score }));

    return ranked;
  } catch (err) {
    console.warn("[reranker] Failed, using original order:", err instanceof Error ? err.message : err);
    return chunks;
  }
}

// ─── Step 9: Citation builder ──────────────────────────────────────────────────

export function buildCitations(chunks: RagChunk[]): RagCitation[] {
  return chunks.map((c) => ({
    source_title: c.source_title,
    page_hint: c.page_hint ?? null,
    chunk_id: c.chunk_id,
    score: c.score,
    source_url: c.source_url ?? null,
    snippet: c.text.slice(0, 320).trimEnd() + (c.text.length > 320 ? "…" : ""),
  }));
}

// ─── Token budget ───────────────────────────────────────────────────────────────

export function truncateChunksToTokenBudget(
  chunks: RagChunk[],
  maxTokens: number = 600,
): RagChunk[] {
  const maxChars = maxTokens * AVG_CHARS_PER_TOKEN;
  let currentChars = 0;

  const selected = chunks.filter((chunk) => {
    if (currentChars >= maxChars) return false;
    currentChars += chunk.text.length;
    return true;
  });

  if (selected.length === 0) return [];

  const maxCharsPerChunk = Math.floor(maxChars / selected.length);
  return selected.map((chunk) => ({
    ...chunk,
    text:
      chunk.text.length > maxCharsPerChunk
        ? `${chunk.text.slice(0, maxCharsPerChunk)}…`
        : chunk.text,
  }));
}

// ─── Retrieved theory string ───────────────────────────────────────────────────

export function buildRetrievedTheory(chunks: RagChunk[]): string {
  if (chunks.length === 0) {
    return "Подтверждённых фрагментов не найдено. Не выходи за рамки подтверждённого корпуса.";
  }
  return chunks
    .map((chunk, index) => {
      const origin = chunk.source_type === 'personal' ? '[Личный файл ученика]' : '[Учебник]';
      const pageSuffix = chunk.page_hint ? ` (${chunk.page_hint})` : "";
      return `[${index + 1}] ${origin} ${chunk.source_title}${pageSuffix} (${chunk.chunk_id}): ${chunk.text}`;
    })
    .join("\n");
}

/** Fetch every chunk of one personal document in original order.
 *  Используется методистом, которому нужен весь текст лекции целиком,
 *  а не top-k по embedding. */
export async function fetchAllPersonalChunks(
  userId: string,
  sourceId: string,
  maxChunks: number = 300,
): Promise<RagChunk[]> {
  if (!ragSupabase) return [];
  const { data, error } = await ragSupabase
    .from("rag_chunks_personal")
    .select("id, source_id, source_title, chunk_text, page_hint, topic_tags, source_url, chunk_index")
    .eq("owner_user_id", userId)
    .eq("source_id", sourceId)
    .order("chunk_index", { ascending: true })
    .limit(maxChunks);
  if (error || !data) return [];
  return data.map((row) => ({
    chunk_id: String(row.id),
    source_id: String(row.source_id),
    source_title: String(row.source_title),
    text: String(row.chunk_text),
    score: 1,
    page_hint: (row.page_hint as string | null) ?? null,
    topic_tags: (row.topic_tags as string[]) ?? [],
    source_url: (row.source_url as string | null) ?? null,
    source_type: "personal",
  }));
}

// ─── Main retrieval pipeline ───────────────────────────────────────────────────

export interface RetrievalResult {
  chunks: RagChunk[];
  citations: RagCitation[];
  /** Related concepts found via kg_edges graph traversal (populated after retrieval) */
  relatedTopics: RelatedTopic[];
  meta: {
    embeddingProvider: string;
    mmrUsed: boolean;
    rerankerUsed: boolean;
    hybridUsed: boolean;
    denseHits: number;
    lexHits: number;
    topicFilter: string[] | null;
    latencyMs: number;
    candidateCount: number;
  };
}

const EMPTY_RESULT = (startedAt: number, topicFilter: string[] | null = null): RetrievalResult => ({
  chunks: [],
  citations: [],
  relatedTopics: [],
  meta: {
    embeddingProvider: "none",
    mmrUsed: false,
    rerankerUsed: false,
    hybridUsed: false,
    denseHits: 0,
    lexHits: 0,
    topicFilter,
    latencyMs: Date.now() - startedAt,
    candidateCount: 0,
  },
});

export interface RrfWeights {
  dense: number;
  lex: number;
}

export async function retrieveRelevantChunks(
  question: string,
  fallbackChunks: RagChunk[] = [],
  limit: number = 4,
  topicFilter: string[] | null = null,
  userId: string | null = null,
  applyTokenBudget: boolean = true,
  rrfWeights: RrfWeights | null = null,
  personalSourceId: string | null = null,
): Promise<RetrievalResult> {
  try {
    return await retrieveRelevantChunksInner(
      question,
      fallbackChunks,
      limit,
      topicFilter,
      userId,
      applyTokenBudget,
      rrfWeights,
      personalSourceId,
    );
  } catch (error) {
    console.warn(
      "[rag] retrieveRelevantChunks failed, returning empty result:",
      error instanceof Error ? error.message : error,
    );
    return EMPTY_RESULT(Date.now(), null);
  }
}

async function retrieveRelevantChunksInner(
  question: string,
  fallbackChunks: RagChunk[] = [],
  limit: number = 4,
  topicFilter: string[] | null = null,
  userId: string | null = null,
  applyTokenBudget: boolean = true,
  rrfWeights: RrfWeights | null = null,
  personalSourceId: string | null = null,
): Promise<RetrievalResult> {
  const startedAt = Date.now();
  const normalizedTopicFilter =
    Array.isArray(topicFilter) && topicFilter.length > 0 ? topicFilter : null;

  if (!question.trim()) {
    return EMPTY_RESULT(startedAt, normalizedTopicFilter);
  }

  // Нет Supabase → используем fallback чанки
  if (!ragSupabase) {
    const truncated = truncateChunksToTokenBudget(fallbackChunks.slice(0, limit));
    return {
      chunks: truncated,
      citations: buildCitations(truncated),
      relatedTopics: [],
      meta: {
        embeddingProvider: "fallback",
        mmrUsed: false,
        rerankerUsed: false,
        hybridUsed: false,
        denseHits: 0,
        lexHits: 0,
        topicFilter: normalizedTopicFilter,
        latencyMs: Date.now() - startedAt,
        candidateCount: fallbackChunks.length,
      },
    };
  }

  // ── embedQuery возвращает null вместо throw — gracefully пустой результат ────
  const embedResult = await embedQuery(question);

  if (!embedResult) {
    console.warn("[rag] No embedding provider available — skipping vector search. LLM will answer without RAG context.");
    return EMPTY_RESULT(startedAt, normalizedTopicFilter);
  }

  const { embedding: queryEmbedding, provider: embeddingProvider } = embedResult;

  let mmrUsed = false;
  let hybridUsed = false;
  let denseHits = 0;
  let lexHits = 0;
  let candidateCount = 0;
  let finalChunks: RagChunk[];

  // When the user explicitly picked one of their uploaded documents, restrict
  // retrieval to that document — global corpus would dilute the answer and the
  // user's intent is clearly "ground the mentor in this file".
  const personalOnlyMode = Boolean(personalSourceId && userId);

  const candidatePool = Math.max(limit * 4, config.rag.mmrCandidatePool);

  const rpcParams: Record<string, unknown> = {
    query_embedding: queryEmbedding,
    query_text: question,
    match_count: candidatePool,
    topic_filter: normalizedTopicFilter,
    rrf_k: config.rag.rrfK,
  };
  if (rrfWeights) {
    rpcParams.dense_weight = rrfWeights.dense;
    rpcParams.lex_weight = rrfWeights.lex;
  } else if (config.rag.rrfWeightDense !== 1.0 || config.rag.rrfWeightLex !== 1.0) {
    rpcParams.dense_weight = config.rag.rrfWeightDense;
    rpcParams.lex_weight = config.rag.rrfWeightLex;
  }

  const { data: hybridRows, error: hybridError } = personalOnlyMode
    ? { data: null as HybridSearchRow[] | null, error: null }
    : await ragSupabase.rpc("hybrid_search_chunks", rpcParams);

  if (personalOnlyMode) {
    finalChunks = [];
    candidateCount = 0;
  } else if (!hybridError && Array.isArray(hybridRows) && hybridRows.length > 0) {
    hybridUsed = true;
    candidateCount = hybridRows.length;
    const rows = hybridRows as HybridSearchRow[];
    denseHits = rows.filter((r) => (r.dense_score ?? 0) > 0).length;
    lexHits = rows.filter((r) => (r.lex_score ?? 0) > 0).length;

    const withEmbeddings: RagChunkWithEmbedding[] = rows
      .map((row): RagChunkWithEmbedding | null => {
        const emb = Array.isArray(row.embedding)
          ? (row.embedding as number[])
          : parseEmbeddingFromPg(row.embedding as string | null);
        if (emb.length === 0) return null;
        return {
          chunk_id: row.chunk_id,
          source_id: row.source_id,
          source_title: row.source_title,
          text: row.chunk_text,
          score: row.rrf_score,
          page_hint: row.page_hint ?? null,
          topic_tags: row.topic_tags ?? [],
          embedding: emb,
        };
      })
      .filter((c): c is RagChunkWithEmbedding => c !== null);

    // Drop chunks whose text looks like broken OCR (latin glyphs substituted
    // for cyrillic, "frankenword" tokens). See ragQualityGate.ts.
    const cleanCandidates = filterGarbledChunks(withEmbeddings);

    // Diversity: keep at most N best-ranked chunks per source_id (preserving RRF order).
    // Two adjacent paragraphs from the same chapter live very close in embedding space,
    // so MMR alone doesn't ensure document-level diversity.
    const cappedByDocument = applyPerSourceCap(cleanCandidates, config.rag.perSourceCap);

    if (cappedByDocument.length > 0) {
      finalChunks = applyMMR(cappedByDocument, queryEmbedding, limit);
      mmrUsed = true;
    } else {
      finalChunks = rows.slice(0, limit).map((row) => ({
        chunk_id: row.chunk_id,
        source_id: row.source_id,
        source_title: row.source_title,
        text: row.chunk_text,
        score: row.rrf_score,
        page_hint: row.page_hint ?? null,
        topic_tags: row.topic_tags ?? [],
      }));
      finalChunks = filterGarbledChunks(finalChunks);
    }
  } else {
    if (hybridError) {
      console.warn(
        "[rag] hybrid_search_chunks failed:",
        hybridError.message,
        "— falling back to match_chunks",
      );
    }
    finalChunks = await basicSearch(ragSupabase, queryEmbedding, limit, normalizedTopicFilter);
    finalChunks = filterGarbledChunks(finalChunks);
    candidateCount = finalChunks.length;
  }

  // Optional Cloudflare cross-encoder reranker on top of hybrid results.
  let rerankerUsed = false;
  if (
    !personalOnlyMode &&
    config.llm.cloudflareApiToken &&
    config.llm.cloudflareAccountId &&
    finalChunks.length > 1
  ) {
    const reranked = await rerankWithCloudflare(question, finalChunks);
    if (reranked.length === finalChunks.length) {
      finalChunks = reranked;
      rerankerUsed = true;
    }
  }

  // Personal chunks: either a slice (added to global results) or the ONLY source
  // when the user pinned a specific uploaded document.
  if (userId && ragSupabase) {
    try {
      let personalQuery = ragSupabase
        .from("rag_chunks_personal")
        .select("id, source_id, source_title, chunk_text, embedding, page_hint, topic_tags, source_url")
        .eq("owner_user_id", userId);

      if (personalSourceId) {
        personalQuery = personalQuery.eq("source_id", personalSourceId);
      }

      const { data: personalRows } = await personalQuery.limit(personalOnlyMode ? 400 : 200);

      if (personalRows && personalRows.length > 0) {
        const personalScored = personalRows
          .map((row): RagChunk | null => {
            const emb = parseEmbeddingFromPg(row.embedding as string | number[] | null);
            if (emb.length === 0) return null;
            return {
              chunk_id: String(row.id),
              source_id: String(row.source_id),
              source_title: String(row.source_title),
              text: String(row.chunk_text),
              score: cosineSimilarity(queryEmbedding, emb),
              page_hint: (row.page_hint as string | null) ?? null,
              topic_tags: (row.topic_tags as string[]) ?? [],
              source_url: (row.source_url as string | null) ?? null,
              source_type: 'personal',
            };
          })
          .filter((c): c is RagChunk => c !== null)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, personalOnlyMode ? Math.max(limit * 2, 6) : 3);

        finalChunks = personalOnlyMode ? personalScored : [...finalChunks, ...personalScored];
        if (personalOnlyMode) {
          candidateCount = personalScored.length;
        }
      }
    } catch (personalErr) {
      console.warn("[rag] personal chunk retrieval failed:", personalErr);
    }
  }

  const budgetedChunks = applyTokenBudget
    ? truncateChunksToTokenBudget(finalChunks)
    : finalChunks;

  // Enrich chunks with source_url from manifest (lookup by source_id)
  const sourceUrlMap = new Map(parseManifest().map((m) => [m.id, m.source_url ?? null]));
  const enrichedChunks = budgetedChunks.map((c) => ({
    ...c,
    source_url: c.source_url ?? sourceUrlMap.get(c.source_id) ?? null,
  }));

  const citations = buildCitations(enrichedChunks);

  return {
    chunks: enrichedChunks,
    citations,
    relatedTopics: [],  // populated by llmEndpoint after graph enrichment
    meta: {
      embeddingProvider,
      mmrUsed,
      rerankerUsed,
      hybridUsed,
      denseHits,
      lexHits,
      topicFilter: normalizedTopicFilter,
      latencyMs: Date.now() - startedAt,
      candidateCount,
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function basicSearch(
  client: SupabaseClient,
  queryEmbedding: number[],
  limit: number,
  topicFilter: string[] | null = null,
): Promise<RagChunk[]> {
  const { data, error } = await client.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    similarity_threshold: 0.2,
    match_count: limit,
    topic_filter: topicFilter,
  });

  // Не бросаем — RAG не должен валить LLM. Логируем и отдаём пустой набор,
  // чтобы вызывающая сторона спокойно продолжила без RAG-контекста.
  if (error) {
    console.warn("[rag] match_chunks RPC failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as MatchChunkRow[];
  return rows.map((row) => ({
    chunk_id: row.chunk_id,
    source_id: row.source_id,
    source_title: row.source_title,
    text: row.chunk_text,
    score: row.score,
    page_hint: row.page_hint ?? null,
    topic_tags: row.topic_tags ?? [],
  }));
}

function parseEmbeddingFromPg(raw: string | number[] | null): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as number[];
  try {
    return JSON.parse(String(raw)) as number[];
  } catch {
    return [];
  }
}
