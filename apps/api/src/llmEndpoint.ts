import express from "express";
import { llmRateLimiter } from "./middleware/rateLimiter";
import { optionalAuth } from "./middleware/optionalAuth";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";
import {
  buildContextMessage,
  buildOrchestratorUserMessage,
  buildSystemPrompt,
  loadOrchestratorTemplate,
  loadPromptTemplate,
} from "./llm/orchestration";
import type { LearningContext } from "@mindflow/shared/llmTypes";
import {
  buildRetrievedTheory,
  loadApprovedRagSources,
  retrieveRelevantChunks,
  type RagChunk,
  type RetrievalResult,
} from "./llm/ragBoundary";
import { enrichContextWithKG, logLearningActivity } from "./llm/knowledgeGraph";
import { buildGraphRagContext } from "./llm/graphRagBoundary";
import { extractAndSaveConceptsAsync } from "./llm/personalKnowledgeGraph";

// ─── LLM Client Interfaces ────────────────────────────────────────────────────

interface GenerateTextInput {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

import { estimateCostRub, sumUsage, type TokenUsage } from "./llm/llmPricing";

export interface GenerateTextResult {
  text: string;
  usage: TokenUsage | null;
}

export interface LlmClient {
  generateText(input: GenerateTextInput): Promise<string>;
  /**
   * Расширенный вариант для cost-tracking — возвращает текст + usage.
   * Опционален: не каждый клиент должен его реализовывать; вызывающий код
   * должен делать null-fallback и записывать NULL в БД.
   */
  generateTextWithUsage?(input: GenerateTextInput): Promise<GenerateTextResult>;
}

// ─── Cloudflare Workers AI ────────────────────────────────────────────────────

export class CloudflareWorkersAiLlmClient implements LlmClient {
  constructor(
    private readonly apiToken: string,
    private readonly accountId: string,
    private readonly model: string = config.llm.cloudflareModel,
  ) {}

  async generateText(input: GenerateTextInput): Promise<string> {
    const selectedModel = input.model ?? this.model;
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${selectedModel}`;
    if (config.llm.cloudflareDebug) {
      console.log(`[Cloudflare] → POST ${url.slice(0, 120)}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userPrompt },
          ],
          temperature: 0.2,
        }),
      });
    } catch (error) {
      console.error("[Cloudflare] fetch failed", error);
      throw error;
    }

    if (config.llm.cloudflareDebug) {
      console.log(`[Cloudflare] ← status ${response.status}`);
    }

    if (!response.ok) {
      const details = await response.text();
      if (config.llm.cloudflareDebug) {
        console.log(`[Cloudflare] ← body ${details.slice(0, 500)}`);
      }
      throw new Error(`Cloudflare Workers AI error: ${response.status} ${details}`);
    }

    const data = (await response.json()) as {
      result?: { response?: string };
      success?: boolean;
      errors?: Array<{ message?: string }>;
    };

    if (!data.success && data.errors?.length) {
      throw new Error(
        `Cloudflare Workers AI upstream error: ${data.errors.map((e) => e.message ?? "Unknown").join("; ")}`,
      );
    }

    return data.result?.response ?? "";
  }

  async generateTextWithUsage(input: GenerateTextInput): Promise<GenerateTextResult> {
    // Cloudflare нативно usage в /ai/run не возвращает — пишем null.
    // Можно было бы оценить токены по длине текста (1 token ≈ 4 chars),
    // но это враньё, поэтому честный null.
    const text = await this.generateText(input);
    return {
      text,
      usage: {
        provider: "cloudflare",
        model: input.model ?? this.model,
        inputTokens: null,
        outputTokens: null,
      },
    };
  }
}

// ─── DeepSeek ─────────────────────────────────────────────────────────────────

export class DeepSeekLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = config.llm.deepseekChatModel,
    private readonly baseUrl: string = config.llm.deepseekBaseUrl,
    private readonly cloudflareAiGatewayToken: string | undefined = config.llm.cloudflareAiGatewayToken,
  ) {}

  async generateText(input: GenerateTextInput): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(this.cloudflareAiGatewayToken
          ? { "cf-aig-authorization": `Bearer ${this.cloudflareAiGatewayToken}` }
          : {}),
      },
      body: JSON.stringify({
        model: input.model ?? this.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`DeepSeek error: ${response.status} ${details}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateTextWithUsage(input: GenerateTextInput): Promise<GenerateTextResult> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(this.cloudflareAiGatewayToken
          ? { "cf-aig-authorization": `Bearer ${this.cloudflareAiGatewayToken}` }
          : {}),
      },
      body: JSON.stringify({
        model: input.model ?? this.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`DeepSeek error: ${response.status} ${details}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: {
        provider: "deepseek",
        model: input.model ?? this.model,
        inputTokens: data.usage?.prompt_tokens ?? null,
        outputTokens: data.usage?.completion_tokens ?? null,
      },
    };
  }
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

export class OpenRouterLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "openrouter/free",
  ) {}

  async generateText(input: GenerateTextInput): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model ?? this.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${details}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateTextWithUsage(input: GenerateTextInput): Promise<GenerateTextResult> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model ?? this.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${details}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: {
        provider: "openrouter",
        model: input.model ?? this.model,
        inputTokens: data.usage?.prompt_tokens ?? null,
        outputTokens: data.usage?.completion_tokens ?? null,
      },
    };
  }
}

// ─── Fallback chain ───────────────────────────────────────────────────────────

export class FallbackLlmClient implements LlmClient {
  constructor(private readonly clients: LlmClient[]) {}

  async generateText(input: GenerateTextInput): Promise<string> {
    const errors: string[] = [];
    for (const client of this.clients) {
      try {
        return await client.generateText(input);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    throw new Error(`All LLM providers failed. ${errors.join(" | ")}`);
  }

  async generateTextWithUsage(input: GenerateTextInput): Promise<GenerateTextResult> {
    const errors: string[] = [];
    for (const client of this.clients) {
      try {
        if (client.generateTextWithUsage) {
          return await client.generateTextWithUsage(input);
        }
        const text = await client.generateText(input);
        return { text, usage: null };
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    throw new Error(`All LLM providers failed. ${errors.join(" | ")}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJsonOrUndefined(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return undefined;
  }
}

// ─── Strategy 0: Keyword-based quick router (skips orchestrator LLM call) ─────
//
// Handles ~40% of requests with obvious role mapping using regex patterns.
// Returns null if pattern doesn't match — falls through to full orchestrator.

function quickRouter(input: string): import("./llm/orchestration").SelectedRole | null {
  const lower = input.toLowerCase().trim();
  if (lower.length < 60 && /^(что такое|что такие|как называется|дай определение|объясни что)/.test(lower)) {
    return "LECTURER";
  }
  if (/не понима|не могу понять|запутал|сомнева|объясни.*ещё раз/.test(lower)) {
    return "MIRROR";
  }
  if (/^дай.*задач|^придума.*задан|^хочу.*попрактик|^дай.*пример для решения/.test(lower)) {
    return "SANDBOX";
  }
  return null;
}

// ─── Strategy 1: Compact JSON profile (saves 200-400 tokens/request) ─────────
//
// Replaces verbose text fields with structured compact JSON.
// BEFORE: "experience: работал 3 года аналитиком в банке, знаю Python и Excel..."
// AFTER:  {"exp":"analyst/3y","lvl":"L2","int":"ML,DS,finance"}

function compactProfile(ctx: LearningContext): string {
  const expShort = ctx.experience.slice(0, 60).replace(/\s+/g, " ").trim();
  const intShort = ctx.interests
    .split(/[,;]/)
    .slice(0, 3)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
  const masterShort = ctx.mastered_concepts
    .split(/[,;]/)
    .slice(0, 4)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
  const weakShort = ctx.weak_concepts
    .split(/[,;]/)
    .slice(0, 3)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");

  return JSON.stringify({
    exp: expShort || "unknown",
    lvl: ctx.level || "unknown",
    int: intShort || "general",
    mastered: masterShort || "none",
    weak: weakShort || "none",
  });
}

// Build a context with compacted profile fields injected as a single
// compact_profile key — the system prompts reference {{experience}},
// {{level}}, {{interests}} etc., so we still keep originals but ALSO
// pass the compact version for orchestrator (which doesn't need full text).
function buildCompactOrchestratorContext(ctx: LearningContext): LearningContext {
  const compact = compactProfile(ctx);
  return {
    ...ctx,
    // Overwrite verbose fields with compact versions for orchestrator call
    experience: compact,
    // Keep level as-is (already short)
    // Truncate knowledge_graph_summary for orchestrator — it only needs role decision
    knowledge_graph_summary: ctx.knowledge_graph_summary.slice(0, 200),
    // Don't send full theory to orchestrator — just topic hint
    retrieved_theory: `[topic: ${ctx.current_topic}]`,
  };
}

// ─── Strategy 2b: Compact profile for main response (saves ~300 tokens) ──────
//
// Applies per-field truncation to the context passed to the main LLM call.
// The orchestrator already uses buildCompactOrchestratorContext; this is a
// lighter version for the main response that preserves field names for templates.

function buildMainResponseContext(ctx: LearningContext): LearningContext {
  const truncList = (s: string, max: number) =>
    s.split(/[,;]/).slice(0, max).map((x) => x.trim()).filter(Boolean).join(", ") || "none";

  return {
    ...ctx,
    experience:              ctx.experience.slice(0, 100).trim(),
    interests:               truncList(ctx.interests, 4),
    mastered_concepts:       truncList(ctx.mastered_concepts, 5),
    weak_concepts:           truncList(ctx.weak_concepts, 4),
    knowledge_graph_summary: ctx.knowledge_graph_summary.slice(0, 400),
  };
}

// ─── Strategy 3: Role-adaptive RAG token budget ───────────────────────────────
//
// LECTURER needs full context; CHALLENGER needs almost none.
// Approx. 4 chars per token.

const RAG_CHAR_BUDGET: Record<string, number> = {
  LECTURER:   2400,  // ~600 tokens
  MIRROR:      800,  // ~200 tokens
  SANDBOX:    1200,  // ~300 tokens
  CHALLENGER:  600,  // ~150 tokens
};

function applyRagBudget(theory: string, role: string): string {
  const budget = RAG_CHAR_BUDGET[role] ?? 2400;
  if (theory.length <= budget) return theory;
  return `${theory.slice(0, budget)}\n[...сокращено]`;
}

// ─── RAG metrics (fire-and-forget) ────────────────────────────────────────────

const metricsSupabase: SupabaseClient | null =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : null;

// Shared Supabase client for graph RAG lookups (reuses service role key)
const graphSupabase: SupabaseClient | null = metricsSupabase;

// Citation rate. Раньше тут была псевдо-precision: ищет source_title как
// подстроку в ответе — почти всегда 0, потому что LLM редко вставляет полное
// название источника. Теперь честно: считаем сколько уникальных [N]-маркеров
// модель реально оставила в ответе (где N — индекс источника, 1..topK).
// citedSourceIndices — какие именно (для отладки в metadata).
function computeCitationStats(
  answer: string,
  sources: RagChunk[],
): { topK: number; citedCount: number; citationRate: number; citedSourceIndices: number[] } {
  const topK = sources.length;
  if (topK === 0) return { topK: 0, citedCount: 0, citationRate: 0, citedSourceIndices: [] };
  const seen = new Set<number>();
  const re = /\[(\d{1,2})\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    const n = Number(m[1]);
    if (Number.isInteger(n) && n >= 1 && n <= topK) seen.add(n);
  }
  const citedSourceIndices = [...seen].sort((a, b) => a - b);
  return { topK, citedCount: seen.size, citationRate: seen.size / topK, citedSourceIndices };
}

async function logRetrievalMetric(
  requestId: string | undefined,
  queryText: string,
  answer: string,
  retrieval: RetrievalResult,
  roleSelected?: string,
  tokenOptMeta?: Record<string, unknown>,
): Promise<void> {
  if (!metricsSupabase || retrieval.chunks.length === 0) return;

  const stats = computeCitationStats(answer, retrieval.chunks);

  const { error } = await metricsSupabase.from("rag_metrics").insert({
    request_id: requestId ?? "unknown",
    query_text: queryText,
    top_k: stats.topK,
    used_chunks: stats.citedCount,
    // precision_at_k теперь хранит citation rate (cited unique / topK).
    // Колонка не переименована, чтобы не мигрировать БД и не ломать графики.
    precision_at_k: stats.citationRate,
    latency_ms: retrieval.meta.latencyMs,
    mmr_used: retrieval.meta.mmrUsed,
    reranker_used: retrieval.meta.rerankerUsed,
    role_selected: roleSelected ?? null,
    embedding_provider: retrieval.meta.embeddingProvider,
    metadata: {
      chunk_ids: retrieval.chunks.map((c) => c.chunk_id),
      source_ids: retrieval.chunks.map((c) => c.source_id),
      cited_source_indices: stats.citedSourceIndices,
      metric_kind: "citation_rate_v1",
      candidate_count: retrieval.meta.candidateCount,
      ...(tokenOptMeta ?? {}),
    },
  });

  if (error) console.warn(`Failed to log rag_metrics: ${error.message}`);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function createLlmRouter(llmClient: LlmClient): express.Router {
  const router = express.Router();

  // Порядок важен: optionalAuth выставляет req.user, чтобы rate-limiter
  // считал по user-id для залогиненных (а не по IP за NAT).
  router.use("/api/llm/respond", optionalAuth);
  router.use("/api/llm", llmRateLimiter);

  router.post("/api/llm/respond", async (req, res, next) => {
    try {
      const body = req.body as LearningContext & {
        vector_index_chunks?: RagChunk[];
        force_role?: string;
      };

      if (
        !body ||
        typeof body.user_input !== "string" ||
        body.user_input.trim().length === 0
      ) {
        res.status(400).json({
          error: "Invalid payload: context.user_input is required",
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ── RAG retrieval ────────────────────────────────────────────────────────
      // Любой сбой здесь (нет manifest, нет embeddings, нет Supabase, RPC упал) —
      // НЕ должен валить LLM-ответ. Деградируем тихо до пустого RAG-контекста.
      let approvedSources: ReturnType<typeof loadApprovedRagSources> = [];
      let retrieval = {
        chunks: [] as RagChunk[],
        citations: [],
        relatedTopics: [],
        meta: {
          embeddingProvider: "none",
          mmrUsed: false,
          rerankerUsed: false,
          hybridUsed: false,
          denseHits: 0,
          lexHits: 0,
          topicFilter: null as string[] | null,
          latencyMs: 0,
          candidateCount: 0,
        },
      } as RetrievalResult;

      try {
        approvedSources = loadApprovedRagSources();
        const approvedSourceIds = new Set(approvedSources.map((s) => s.id));

        const candidateChunks: RagChunk[] = Array.isArray(body.vector_index_chunks)
          ? body.vector_index_chunks.filter((c: RagChunk) => approvedSourceIds.has(c.source_id))
          : [];

        const personalUserId = body.personal_rag && req.user?.id ? req.user.id : null;
        const personalSourceId =
          personalUserId && typeof body.personal_source_id === "string" && body.personal_source_id.trim().length > 0
            ? body.personal_source_id.trim()
            : null;
        retrieval = await retrieveRelevantChunks(
          body.user_input,
          candidateChunks,
          4,
          null,
          personalUserId,
          true,
          null,
          personalSourceId,
        );
      } catch (ragErr) {
        console.warn(
          "[rag] block failed, continuing without retrieval:",
          ragErr instanceof Error ? ragErr.message : ragErr,
        );
      }

      const retrievedChunks = retrieval.chunks;

      // ── Graph RAG enrichment ─────────────────────────────────────────────────
      // After vector retrieval, look up related concepts via kg_edges.
      // Fires only when chunks were found AND Supabase is available.
      let graphRagContextString = "";
      if (retrievedChunks.length > 0 && graphSupabase) {
        try {
          const graphCtx = await buildGraphRagContext(retrievedChunks, graphSupabase);
          graphRagContextString = graphCtx.contextString;
          retrieval.relatedTopics = graphCtx.relatedTopics;
        } catch (graphErr) {
          console.warn(
            "[graph-rag] enrichment failed, continuing without graph context:",
            graphErr instanceof Error ? graphErr.message : graphErr,
          );
        }
      }

      // ── Build LearningContext ────────────────────────────────────────────────
      const userId = req.user?.id ?? null;
      const baseContext: LearningContext = {
        ...body,
        retrieved_theory: buildRetrievedTheory(retrievedChunks),
        graph_context: graphRagContextString || undefined,
        experience: body.experience ?? "не указан",
        level: body.level ?? "не указан",
        interests: body.interests ?? "не указаны",
      };
      const context: LearningContext = {
        ...baseContext,
        ...(await enrichContextWithKG(userId, baseContext as unknown as Record<string, unknown>) as Partial<LearningContext>),
      };

      // ── Orchestrator or force_role ───────────────────────────────────────────
      // System prompts are now placeholder-free → byte-identical across calls,
      // which lets DeepSeek/OpenRouter prefix-cache them. All dynamic context
      // (profile, RAG, KG, user_input) is packed into the user message.
      const forceRole = body.force_role;
      let role: import("./llm/orchestration").SelectedRole;
      let systemPrompt: string;
      let usedFallback: boolean;
      let orchestratorRaw = "";
      let orchestratorUsage: TokenUsage | null = null;
      let routedBy = "orchestrator";

      const validRoles = ["LECTURER", "MIRROR", "SANDBOX", "CHALLENGER"];

      const buildBudgetedContext = (selectedRole: string): LearningContext => ({
        ...buildMainResponseContext(context),
        retrieved_theory: applyRagBudget(context.retrieved_theory, selectedRole),
      });

      if (forceRole && validRoles.includes(forceRole)) {
        role = forceRole as import("./llm/orchestration").SelectedRole;
        systemPrompt = loadPromptTemplate(role);
        usedFallback = false;
        orchestratorRaw = `{"force_role":"${role}"}`;
        routedBy = "force_role";
      } else {
        const quickRole = quickRouter(context.user_input);

        if (quickRole) {
          role = quickRole;
          systemPrompt = loadPromptTemplate(role);
          usedFallback = false;
          orchestratorRaw = `{"quick_route":"${role}"}`;
          routedBy = "quick_router";
        } else {
          // Static orchestrator system prompt → cacheable. Compact context goes
          // into the user message so per-request cost stays low.
          const orchestratorContext = buildCompactOrchestratorContext(context);
          const orchestratorSystemPrompt = loadOrchestratorTemplate();
          const orchestratorUserPrompt = buildOrchestratorUserMessage(orchestratorContext);

          try {
            const orchRes = llmClient.generateTextWithUsage
              ? await llmClient.generateTextWithUsage({
                  systemPrompt: orchestratorSystemPrompt,
                  userPrompt: orchestratorUserPrompt,
                })
              : { text: await llmClient.generateText({
                  systemPrompt: orchestratorSystemPrompt,
                  userPrompt: orchestratorUserPrompt,
                }), usage: null };
            orchestratorRaw = orchRes.text;
            orchestratorUsage = orchRes.usage;
          } catch (orchErr) {
            console.warn("[orchestrator] LLM call failed, using localPolicyRouter:",
              orchErr instanceof Error ? orchErr.message : orchErr);
            orchestratorRaw = "{}";
          }

          const orchestratorJson = parseJsonOrUndefined(orchestratorRaw);
          ({ role, systemPrompt, usedFallback } = buildSystemPrompt(context, orchestratorJson));
        }
      }

      const budgetedContext = buildBudgetedContext(role);
      const userMessage = buildContextMessage(budgetedContext);

      // ── Main LLM call ────────────────────────────────────────────────────────
      const mainRes = llmClient.generateTextWithUsage
        ? await llmClient.generateTextWithUsage({
            systemPrompt,
            userPrompt: userMessage,
          })
        : { text: await llmClient.generateText({
            systemPrompt,
            userPrompt: userMessage,
          }), usage: null };
      const rawAnswer = mainRes.text;
      const mainUsage = mainRes.usage;

      // Вердикт для BKT — структурный маркер `[VERDICT: верно|неверно|частично]`
      // первой строкой ответа (см. prompts/sandbox.md, prompts/challenger.md).
      // Старый regex по словам «неверно/ошибка» ловил false-positive на фразах
      // вроде «здесь нет ошибки», поэтому BKT висел мёртвым.
      let answer = rawAnswer;
      let correct: boolean | null = null;
      const verdictMatch = answer.match(
        /^\s*\[VERDICT:\s*(верно|неверно|частично)\s*\]\s*\n?/i,
      );
      if (verdictMatch) {
        const v = verdictMatch[1].toLowerCase();
        correct = v === "верно" ? true : v === "неверно" ? false : null;
        answer = answer.slice(verdictMatch[0].length);
      }

      // Суммарный usage запроса — orchestrator (опционально) + main.
      // Пишем в learning_activities для unit-экономики Pro.
      const combinedUsage = sumUsage([orchestratorUsage, mainUsage]);
      const costRub = combinedUsage
        ? estimateCostRub(
            combinedUsage.provider,
            combinedUsage.model,
            combinedUsage.inputTokens,
            combinedUsage.outputTokens,
          )
        : null;

      // Fire-and-forget: записываем активность обучения для авторизованных пользователей
      if (userId) {
        logLearningActivity({
          userId,
          pageContext: context.current_page ?? context.current_topic ?? "unknown",
          userQuery:   context.user_input,
          aiResponse:  answer,
          selectedRole: role,
          usage: combinedUsage
            ? {
                provider: combinedUsage.provider,
                model: combinedUsage.model,
                inputTokens: combinedUsage.inputTokens,
                outputTokens: combinedUsage.outputTokens,
                costRub,
              }
            : null,
        }).catch((err) => console.warn("logLearningActivity:", err));

        // Extract mathematical concepts from this dialog and build user's personal KG
        if (graphSupabase) {
          const sourceTopic = context.current_topic && context.current_topic !== "не указана"
            ? context.current_topic
            : undefined;
          extractAndSaveConceptsAsync(
            userId,
            context.user_input,
            answer,
            llmClient,
            graphSupabase,
            sourceTopic,
          );
        }
      }

      // Fire-and-forget metrics (includes token optimisation audit trail)
      logRetrievalMetric(
        req.requestId,
        context.user_input,
        answer,
        retrieval,
        role,
        {
          routed_by:         routedBy,
          rag_budget_chars:  RAG_CHAR_BUDGET[role] ?? 2400,
          rag_original_chars: context.retrieved_theory.length,
          rag_saved_chars:   Math.max(0, context.retrieved_theory.length - (RAG_CHAR_BUDGET[role] ?? 2400)),
        },
      ).catch((err) => console.warn("logRetrievalMetric:", err));

      // Debug flag: when MENTOR_DEBUG_CHUNKS=1 or ?debug=1, include full chunk
      // text in sourcesUsed so offline tooling (faithfulness judge, eval harness)
      // can verify the model against its actual sources without re-querying RAG.
      const debugChunks =
        process.env.MENTOR_DEBUG_CHUNKS === "1" || req.query?.debug === "1";

      return res.json({
        role,
        usedFallback,
        routedBy,
        orchestratorRaw,
        answer,
        correct,
        userId: req.user?.id ?? null,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        rag: {
          sourcesUsed: retrievedChunks.map((c) => ({
            source_id: c.source_id,
            source_title: c.source_title,
            chunk_id: c.chunk_id,
            score: c.score ?? 0,
            page_hint: c.page_hint ?? null,
            ...(debugChunks ? { text: c.text } : {}),
          })),
          citations: retrieval.citations,
          relatedTopics: retrieval.relatedTopics,
          approvedSources: approvedSources.map((s) => ({
            id: s.id,
            title: s.title,
          })),
          meta: {
            mmrUsed: retrieval.meta.mmrUsed,
            rerankerUsed: retrieval.meta.rerankerUsed,
            latencyMs: retrieval.meta.latencyMs,
            embeddingProvider: retrieval.meta.embeddingProvider,
          },
        },
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : "Unknown LLM error";
      res.status(502);
      next(new Error(`LLM upstream failure: ${details}`));
    }
  });

  return router;
}
