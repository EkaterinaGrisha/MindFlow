/**
 * tests/api/health.test.ts
 *
 * Integration tests for the Express app.
 * Spin up the app on a random port — no external services needed.
 *
 * Covered:
 *   1. GET /health → 200 { status: "ok", providers: number }
 *   2. POST /api/llm/respond without token → NOT 401 (guest allowed)
 *      Response carries requestId + timestamp regardless of LLM failure.
 *   3. POST /api/llm/respond with malformed token → 401
 *   4. POST /api/llm/respond with empty user_input → 400 structured error
 */

import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../../apps/api/src/app";

const app = createApp();
const server = app.listen(0);
const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

test.after(() => {
  server.close();
});

// ── 1. Health check ────────────────────────────────────────────────────────────
test("GET /health returns 200 with status ok and providers count", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const json = (await response.json()) as { status: string; providers: number };

  assert.equal(response.status, 200, "Expected HTTP 200");
  assert.equal(json.status, "ok", "Expected status: ok");
  assert.equal(
    typeof json.providers,
    "number",
    "Expected providers to be a number",
  );
});

// ── 2. Guest access — optionalAuth must NOT block guests ───────────────────────
test("POST /api/llm/respond without token is allowed for guests (not 401)", async () => {
  const response = await fetch(`${baseUrl}/api/llm/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_input: "Что такое матрица?",
      current_topic: "Линейная алгебра",
      retrieved_theory: "",
      recent_topics: "",
      experience: "гость",
      level: "базовый",
      interests: "математика",
      mastered_concepts: "",
      weak_concepts: "",
      knowledge_graph_summary: "",
      current_page: "теория",
    }),
  });

  const json = (await response.json()) as {
    error?: string;
    requestId?: string;
    timestamp?: string;
    answer?: string;
  };

  // Must NOT be an auth error
  assert.notEqual(response.status, 401, "Guest should not receive 401");
  assert.notEqual(
    json.error,
    "Missing or invalid Bearer token",
    "Guest should not get auth error message",
  );

  // Every response (success or LLM failure) must include requestId + timestamp
  assert.equal(
    typeof json.requestId,
    "string",
    "Response must include requestId",
  );
  assert.ok(json.requestId!.length > 0, "requestId must not be empty");

  assert.equal(
    typeof json.timestamp,
    "string",
    "Response must include timestamp",
  );
  assert.ok(
    !isNaN(Date.parse(json.timestamp!)),
    "timestamp must be a valid ISO date",
  );
});

// ── 3. Invalid Bearer token → 401 ─────────────────────────────────────────────
test("POST /api/llm/respond with malformed token returns 401", async () => {
  const response = await fetch(`${baseUrl}/api/llm/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer this.is.not.a.valid.jwt",
    },
    body: JSON.stringify({ user_input: "test" }),
  });

  // optionalAuth must reject any malformed Bearer token with 401, even when
  // Supabase is not configured (structural JWT validation runs first).
  assert.equal(response.status, 401, `Expected 401, got ${response.status}`);

  const json = (await response.json()) as {
    error?: string;
    requestId?: string;
    timestamp?: string;
  };
  assert.match(json.error ?? "", /token|access/i);
  assert.equal(typeof json.requestId, "string");
  assert.equal(typeof json.timestamp, "string");
});

// ── 4. Empty user_input → 400 structured error ────────────────────────────────
test("POST /api/llm/respond with empty user_input returns 400", async () => {
  const response = await fetch(`${baseUrl}/api/llm/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_input: "   " }),
  });

  const json = (await response.json()) as {
    error?: string;
    requestId?: string;
    timestamp?: string;
  };

  assert.equal(response.status, 400, "Empty input should return 400");
  assert.match(
    json.error ?? "",
    /user_input/,
    "Error message should mention user_input",
  );
  assert.equal(typeof json.requestId, "string", "400 response must have requestId");
  assert.equal(
    typeof json.timestamp,
    "string",
    "400 response must have timestamp",
  );
});

// ── 5. x-request-id header is echoed back ─────────────────────────────────────
test("GET /health echoes back x-request-id if provided", async () => {
  const customId = "test-req-id-12345";
  const response = await fetch(`${baseUrl}/health`, {
    headers: { "x-request-id": customId },
  });

  assert.equal(
    response.headers.get("x-request-id"),
    customId,
    "Server should echo the provided x-request-id header",
  );
});
