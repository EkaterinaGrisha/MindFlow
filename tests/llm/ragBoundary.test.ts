import test from "node:test";
import assert from "node:assert/strict";
import {
  _setRagSupabaseForTesting,
  buildRetrievedTheory,
  retrieveRelevantChunks,
  truncateChunksToTokenBudget,
  type RagChunk,
} from "../../apps/api/src/llm/ragBoundary";

// Force the no-Supabase code path so the fallback assertion is deterministic
// regardless of whether the developer has SUPABASE_URL set in their .env.
_setRagSupabaseForTesting(null);

const chunks: RagChunk[] = [
  {
    chunk_id: "c1",
    source_id: "s1",
    source_title: "Линейная алгебра",
    text: "Собственные значения матрицы определяются из характеристического многочлена.",
  },
  {
    chunk_id: "c2",
    source_id: "s1",
    source_title: "Линейная алгебра",
    text: "Базис векторного пространства задаёт координаты векторов.",
  },
  {
    chunk_id: "c3",
    source_id: "s2",
    source_title: "Теория вероятностей",
    text: "Закон больших чисел описывает сходимость средних.",
  },
];

test("retrieveRelevantChunks возвращает fallback-чанки без supabase-конфига", async () => {
  const result = await retrieveRelevantChunks("как найти собственные значения", chunks, 2);

  assert.equal(result.chunks.length, 2);
  assert.equal(result.chunks[0].chunk_id, "c1");
  assert.equal(result.chunks[1].chunk_id, "c2");

  assert.equal(result.citations.length, 2);
  assert.equal(result.citations[0].chunk_id, "c1");
  assert.equal(result.citations[0].source_title, "Линейная алгебра");

  assert.equal(result.meta.embeddingProvider, "fallback");
  assert.equal(result.meta.mmrUsed, false);
  assert.equal(result.meta.rerankerUsed, false);
  assert.equal(result.meta.hybridUsed, false);
  assert.equal(result.meta.denseHits, 0);
  assert.equal(result.meta.lexHits, 0);
  assert.equal(result.meta.topicFilter, null);
});

test("retrieveRelevantChunks нормализует пустой topicFilter в null", async () => {
  const result = await retrieveRelevantChunks("матрицы", chunks, 1, []);
  assert.equal(result.meta.topicFilter, null);
});

test("retrieveRelevantChunks пробрасывает topicFilter в meta", async () => {
  const result = await retrieveRelevantChunks("матрицы", chunks, 1, ["matrix-operations"]);
  assert.deepEqual(result.meta.topicFilter, ["matrix-operations"]);
});

test("retrieveRelevantChunks с пустым вопросом не падает и сохраняет topicFilter", async () => {
  const result = await retrieveRelevantChunks("   ", chunks, 2, ["bayes"]);
  assert.equal(result.chunks.length, 0);
  assert.deepEqual(result.meta.topicFilter, ["bayes"]);
});

test("buildRetrievedTheory формирует прозрачные выдержки", () => {
  const result = buildRetrievedTheory([chunks[0], chunks[2]]);
  // Префис [Учебник] добавляется для source_type='corpus' (см. ragBoundary.ts:436).
  assert.match(result, /\[1\] \[Учебник\] Линейная алгебра \(c1\):/);
  assert.match(result, /\[2\] \[Учебник\] Теория вероятностей \(c3\):/);
});

test("buildRetrievedTheory возвращает guardrail если чанков нет", () => {
  const result = buildRetrievedTheory([]);
  assert.match(result, /Подтверждённых фрагментов не найдено/);
});

test("truncateChunksToTokenBudget ограничивает объём контекста", () => {
  const result = truncateChunksToTokenBudget(chunks, 10);
  assert.equal(result.length, 1);
  assert.ok(result[0].text.length <= 41);
});
