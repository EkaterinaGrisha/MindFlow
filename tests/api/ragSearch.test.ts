/**
 * tests/api/ragSearch.test.ts
 *
 * Endpoint contract tests for POST /api/rag/search. Pins the RAG Supabase
 * client to null to force the deterministic fallback path (no model load,
 * no network).
 */

import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { _setRagSupabaseForTesting } from "../../apps/api/src/llm/ragBoundary";
import { createApp } from "../../apps/api/src/app";

_setRagSupabaseForTesting(null);

const app = createApp();
const server = app.listen(0);
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

test.after(() => {
  server.close();
});

test("POST /api/rag/search без query → 400", async () => {
  const response = await fetch(`${baseUrl}/api/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);
  const json = (await response.json()) as { error?: string; requestId?: string };
  assert.match(json.error ?? "", /query/);
  assert.equal(typeof json.requestId, "string");
});

test("POST /api/rag/search с пустой строкой → 400", async () => {
  const response = await fetch(`${baseUrl}/api/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "   " }),
  });
  assert.equal(response.status, 400);
});

test("POST /api/rag/search с валидным query → 200 + meta", async () => {
  const response = await fetch(`${baseUrl}/api/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "что такое матрица", top_k: 4 }),
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    chunks: unknown[];
    citations: unknown[];
    meta: { embeddingProvider: string; topicFilter: unknown };
  };
  assert.ok(Array.isArray(json.chunks));
  assert.ok(Array.isArray(json.citations));
  // Без supabase идёт ветка fallback (chunks пустые, поскольку candidate-fallback не передан).
  assert.equal(json.meta.embeddingProvider, "fallback");
  assert.equal(json.meta.topicFilter, null);
});

test("POST /api/rag/search пробрасывает topic_tags в meta.topicFilter", async () => {
  const response = await fetch(`${baseUrl}/api/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "детерминант",
      top_k: 2,
      topic_tags: ["matrix-operations"],
    }),
  });
  assert.equal(response.status, 200);
  const json = (await response.json()) as { meta: { topicFilter: string[] | null } };
  assert.deepEqual(json.meta.topicFilter, ["matrix-operations"]);
});

test("POST /api/rag/search ограничивает top_k сверху", async () => {
  const response = await fetch(`${baseUrl}/api/rag/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "матрицы", top_k: 9999 }),
  });
  assert.equal(response.status, 200);
});
