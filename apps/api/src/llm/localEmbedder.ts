/**
 * localEmbedder.ts
 *
 * Локальный эмбеддер на @huggingface/transformers v4
 * (onnx-community/Qwen3-Embedding-0.6B-ONNX, 1024 dim).
 * Singleton-pipeline, last-token pooling (как у Qwen3-Embedding),
 * L2-normalize, query/passage форматирование по Qwen3-конвенции.
 *
 * Кеш на 256 запросов на случай повторных эмбеддов одного вопроса
 * в рамках сессии.
 *
 * Миграция с Xenova/multilingual-e5-small (384D) — см.
 * reports/embedding-benchmark.md. Qwen3-0.6B даёт +107 % NDCG@10
 * над baseline на корпусе MindFlow.
 */

import { config } from "../config";

type FeatureExtractionPipeline = (
  input: string | string[],
  options?: { pooling?: "mean" | "cls" | "none" | "last_token"; normalize?: boolean },
) => Promise<{ data: Float32Array | number[]; dims: number[] }>;

let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

export type EmbedderStatus = "not_started" | "loading" | "ready" | "failed";
let embedderStatus: EmbedderStatus = "not_started";
let embedderLastError: string | null = null;

export function getEmbedderStatus(): { status: EmbedderStatus; lastError: string | null } {
  return { status: embedderStatus, lastError: embedderLastError };
}

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!pipelinePromise) {
    embedderStatus = "loading";
    embedderLastError = null;
    pipelinePromise = (async () => {
      const transformers = await import("@huggingface/transformers");
      transformers.env.allowLocalModels = true;
      transformers.env.allowRemoteModels = true;
      // node_modules read-only в Docker → EACCES при дефолтном cacheDir.
      (transformers.env as { cacheDir?: string }).cacheDir =
        process.env.HF_CACHE_DIR ?? "/tmp/transformers-cache";
      const pipeline = await transformers.pipeline(
        "feature-extraction",
        config.rag.localEmbedderModel,
        // Qwen3-Embedding-0.6B is ~600M params. Default q4f16 ONNX is ~540 MB.
        // Override via LOCAL_EMBEDDER_DTYPE env (e.g. "fp16", "int8", "q4") if needed.
        { dtype: config.rag.localEmbedderDtype } as Record<string, unknown>,
      );
      embedderStatus = "ready";
      return pipeline as unknown as FeatureExtractionPipeline;
    })().catch((error) => {
      embedderStatus = "failed";
      embedderLastError = error instanceof Error ? error.message : String(error);
      pipelinePromise = null;
      throw error;
    });
  }
  return pipelinePromise;
}

// ─── In-memory LRU cache ───────────────────────────────────────────────────────

const CACHE_LIMIT = 256;
const cache = new Map<string, number[]>();

function cacheGet(key: string): number[] | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function cacheSet(key: string, value: number[]): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_LIMIT) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
}

// ─── Qwen3 prompt formatting ──────────────────────────────────────────────────
//
// Qwen3-Embedding accepts an explicit `Instruct: <task>\nQuery: <text>` for
// queries, and plain text (no prefix) for documents. The task description was
// chosen to match the retrieval setting we benchmark against — same wording
// used in infra/scripts/embed_benchmark.py for honest CPU benchmark numbers.

const QWEN3_TASK =
  "Given a student's question about math, retrieve relevant explanations from a textbook.";

function formatInput(prefix: "query" | "passage", text: string): string {
  if (prefix === "query") {
    return `Instruct: ${QWEN3_TASK}\nQuery: ${text}`;
  }
  return text;
}

// ─── Public API ────────────────────────────────────────────────────────────────

async function embed(prefix: "query" | "passage", text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const cacheKey = `${prefix}:${trimmed}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const pipe = await getPipeline();
  const input = formatInput(prefix, trimmed);
  // Qwen3-Embedding uses last-token pooling (it's an LLM with causal attention,
  // the final token absorbs the full sequence context).
  const output = await pipe(input, { pooling: "last_token", normalize: true });
  const vector = Array.from(output.data as Float32Array | number[]);

  cacheSet(cacheKey, vector);
  return vector;
}

export async function embedQueryLocal(text: string): Promise<number[]> {
  return embed("query", text);
}

export async function embedPassageLocal(text: string): Promise<number[]> {
  return embed("passage", text);
}

export async function embedPassagesLocal(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedPassageLocal(text));
  }
  return results;
}

/** Test seam: drop cache and pipeline so a fresh model can be pinned. */
export function _resetLocalEmbedderForTesting(): void {
  cache.clear();
  pipelinePromise = null;
}

export const LOCAL_EMBEDDER_PROVIDER_ID = "local-qwen3-0.6b";
