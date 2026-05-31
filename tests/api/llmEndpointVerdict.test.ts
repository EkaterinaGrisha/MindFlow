/**
 * tests/api/llmEndpointVerdict.test.ts
 *
 * Smoke + behaviour for /api/llm/respond. Replaces the real LlmClient with a
 * stub that returns a scripted answer, and asserts:
 *   - VERDICT-marker parser sets correct=true|false|null
 *   - marker is stripped from the user-facing answer
 *   - missing marker → correct=null (это просто чат, не проверка)
 */

import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import { createLlmRouter, type LlmClient } from "../../apps/api/src/llmEndpoint";
import { _setRagSupabaseForTesting } from "../../apps/api/src/llm/ragBoundary";
import { _resetRateLimiterForTests } from "../../apps/api/src/middleware/rateLimiter";

// Force the deterministic no-RAG path — ragSearch returns empty result.
_setRagSupabaseForTesting(null);

class StubLlmClient implements LlmClient {
  constructor(public nextAnswer: string) {}
  async generateText(): Promise<string> {
    return this.nextAnswer;
  }
}

function buildAppWithStub(answer: string) {
  _resetRateLimiterForTests();
  const stub = new StubLlmClient(answer);
  const app = express();
  app.use(express.json());
  app.use(createLlmRouter(stub));
  return app;
}

async function callRespond(app: express.Express): Promise<{
  status: number;
  body: { answer?: string; correct?: boolean | null; error?: string };
}> {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const r = await fetch(`http://127.0.0.1:${port}/api/llm/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_input: "2x + 3 = 7, x = 2",
        current_topic: "Линейные уравнения",
        retrieved_theory: "",
        recent_topics: "",
        experience: "новичок",
        level: "базовый",
        interests: "",
        mastered_concepts: "",
        weak_concepts: "",
        knowledge_graph_summary: "",
        current_page: "практика",
      }),
    });
    const body = (await r.json()) as { answer?: string; correct?: boolean | null; error?: string };
    return { status: r.status, body };
  } finally {
    server.close();
  }
}

test("VERDICT: верно → correct=true, marker stripped", async () => {
  const raw = "[VERDICT: верно]\n\nОтлично, x=2 действительно решение.";
  const app = buildAppWithStub(raw);
  const { status, body } = await callRespond(app);
  assert.equal(status, 200);
  assert.equal(body.correct, true);
  assert.ok(body.answer, "answer required");
  assert.ok(!body.answer!.includes("[VERDICT"), "marker must be stripped");
});

test("VERDICT: неверно → correct=false", async () => {
  const raw = "[VERDICT: неверно]\n\nx должно быть 2, ты получил 4 — пересчитай.";
  const app = buildAppWithStub(raw);
  const { body } = await callRespond(app);
  assert.equal(body.correct, false);
  assert.ok(!body.answer!.includes("[VERDICT"));
});

test("VERDICT: частично → correct=null (не пишем в BKT)", async () => {
  const raw = "[VERDICT: частично]\n\nИдея верная, но забыл проверить знак.";
  const app = buildAppWithStub(raw);
  const { body } = await callRespond(app);
  assert.equal(body.correct, null);
  assert.ok(!body.answer!.includes("[VERDICT"));
});

test("без VERDICT → correct=null, ответ доходит как есть", async () => {
  const raw = "Это просто чат, не проверка. Расскажу про матрицы…";
  const app = buildAppWithStub(raw);
  const { body } = await callRespond(app);
  assert.equal(body.correct, null);
  assert.equal(body.answer, raw);
});

test("ложное упоминание «нет ошибки» не ломает correct (был баг старого regex)", async () => {
  // Без маркера — старый regex выставлял correct=false из-за слова «ошибки».
  // Теперь без маркера всегда null.
  const raw = "В твоём решении нет ошибки, всё чисто.";
  const app = buildAppWithStub(raw);
  const { body } = await callRespond(app);
  assert.equal(body.correct, null);
});
