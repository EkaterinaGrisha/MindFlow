/**
 * tests/api/rateLimiter.test.ts
 *
 * Unit tests for the per-user/per-IP in-memory rate limiter.
 * No HTTP — drives the middleware via fake req/res/next objects to
 * keep the test fast and deterministic.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  llmRateLimiter,
  sweepRateLimiterCounters,
  _resetRateLimiterForTests,
} from "../../apps/api/src/middleware/rateLimiter";
import { config } from "../../apps/api/src/config";

type FakeReq = {
  ip?: string;
  socket?: { remoteAddress?: string };
  user?: { id?: string };
};

function call(req: FakeReq): { status: number; body: unknown; passed: boolean } {
  let status = 200;
  let body: unknown = null;
  let passed = false;
  const res = {
    status(s: number) { status = s; return this; },
    json(b: unknown) { body = b; return this; },
  };
  llmRateLimiter(req as never, res as never, () => { passed = true; });
  return { status, body, passed };
}

test("per-IP: blocks after llmPerMinute requests", () => {
  _resetRateLimiterForTests();
  const limit = config.rateLimit.llmPerMinute;
  for (let i = 0; i < limit; i += 1) {
    const r = call({ ip: "1.2.3.4" });
    assert.ok(r.passed, `request ${i + 1} should pass`);
  }
  const blocked = call({ ip: "1.2.3.4" });
  assert.equal(blocked.passed, false);
  assert.equal(blocked.status, 429);
  assert.deepEqual(blocked.body, { error: "Too many requests" });
});

test("per-user: same UUID counted regardless of IP", () => {
  _resetRateLimiterForTests();
  const limit = config.rateLimit.llmPerMinute;
  for (let i = 0; i < limit; i += 1) {
    const r = call({ ip: `10.0.0.${i % 200}`, user: { id: "user-abc" } });
    assert.ok(r.passed);
  }
  // Same user from a totally different IP — still blocked.
  const blocked = call({ ip: "8.8.8.8", user: { id: "user-abc" } });
  assert.equal(blocked.status, 429);
});

test("different users share IP but have separate counters", () => {
  _resetRateLimiterForTests();
  const limit = config.rateLimit.llmPerMinute;
  for (let i = 0; i < limit; i += 1) {
    call({ ip: "10.0.0.1", user: { id: "user-a" } });
  }
  // user-a залит, user-b на том же IP — должен пройти.
  const userB = call({ ip: "10.0.0.1", user: { id: "user-b" } });
  assert.ok(userB.passed, "different user on same IP should not inherit the lock");
});

test("sweep removes expired counters", () => {
  _resetRateLimiterForTests();
  call({ ip: "1.2.3.4" });
  call({ ip: "5.6.7.8" });
  // Перематываем виртуальное «сейчас» на 2 минуты вперёд.
  const removed = sweepRateLimiterCounters(Date.now() + 120_000);
  assert.equal(removed, 2);
});
