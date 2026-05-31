import type { RequestHandler } from "express";
import { config } from "../config";

type Counter = {
  count: number;
  resetAt: number;
};

const counters = new Map<string, Counter>();
const WINDOW_MS = 60_000;

// Ключ — user:UUID если есть авторизация, иначе ip:<addr>. Это значит middleware
// должен идти ПОСЛЕ optionalAuth/requireAuth — иначе req.user пуст и все
// залогиненные за NAT получат общий счётчик. Для anon работает trust proxy
// (см. app.ts), без него req.ip = прокси Railway, а не клиент.
function deriveKey(req: Parameters<RequestHandler>[0]): string {
  if (req.user?.id) return `user:${req.user.id}`;
  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

export const llmRateLimiter: RequestHandler = (req, res, next) => {
  const key = deriveKey(req);
  const now = Date.now();
  const current = counters.get(key);

  if (!current || current.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= config.rateLimit.llmPerMinute) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  current.count += 1;
  next();
};

// Сборщик мусора счётчиков с истёкшим resetAt. Иначе Map растёт неограниченно
// по уникальным IP/UUID (особенно на anon-трафике от ботов). В тестах не
// запускается — экспорт чисто для проверки логики и для shutdown-хука.
const SWEEP_INTERVAL_MS = 5 * 60_000;
export function sweepRateLimiterCounters(now: number = Date.now()): number {
  let removed = 0;
  for (const [key, ctr] of counters) {
    if (ctr.resetAt <= now) {
      counters.delete(key);
      removed += 1;
    }
  }
  return removed;
}
if (process.env.NODE_ENV !== "test") {
  setInterval(() => sweepRateLimiterCounters(), SWEEP_INTERVAL_MS).unref();
}

// Для тестов
export function _resetRateLimiterForTests(): void {
  counters.clear();
}
