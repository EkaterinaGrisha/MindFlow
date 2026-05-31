import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { requireAdmin } from "./middleware/requireAdmin";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows
    .map((row) => columns.map((col) => csvEscape(row[col])).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function createAdminRouter(): Router {
  const router = Router();

  /**
   * GET /api/admin/metrics — aggregate dashboard data for the report.
   * Returns DAU/WAU, mentor stats, RAG quality, NPS, conversion.
   */
  router.get("/api/admin/metrics", requireAdmin, async (_req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Supabase not configured" });
        return;
      }

      const day1 = isoDaysAgo(1);
      const day7 = isoDaysAgo(7);
      const day30 = isoDaysAgo(30);

      // ── Active users (DAU/WAU) — based on events table
      const { data: activeUsers } = await supabaseAdmin
        .from("events")
        .select("user_id, created_at")
        .gte("created_at", day30)
        .not("user_id", "is", null);

      const dauSet = new Set<string>();
      const wauSet = new Set<string>();
      const mauSet = new Set<string>();
      for (const ev of activeUsers ?? []) {
        const ts = ev.created_at as string;
        const uid = ev.user_id as string;
        if (!uid) continue;
        mauSet.add(uid);
        if (ts >= day7) wauSet.add(uid);
        if (ts >= day1) dauSet.add(uid);
      }

      // ── Mentor sessions and message stats
      const { data: sessions } = await supabaseAdmin
        .from("mentor_sessions")
        .select("id, message_count, started_at")
        .gte("started_at", day30);

      const sessionsLast7 = (sessions ?? []).filter((s) => (s.started_at as string) >= day7);
      const sessionMsgCounts = (sessions ?? []).map((s) => Number(s.message_count) || 0);
      const sessionsWithMin3 = sessionMsgCounts.filter((c) => c >= 3).length;
      const avgMessagesPerSession =
        sessionMsgCounts.length > 0
          ? sessionMsgCounts.reduce((a, b) => a + b, 0) / sessionMsgCounts.length
          : 0;

      const { count: totalMessages } = await supabaseAdmin
        .from("mentor_messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", day30);

      // ── RAG quality (precision, latency)
      const { data: ragMetrics } = await supabaseAdmin
        .from("rag_metrics")
        .select("precision_at_k, latency_ms, role_selected, embedding_provider")
        .gte("created_at", day30);

      const precisions = (ragMetrics ?? [])
        .map((r) => Number(r.precision_at_k))
        .filter((v) => !Number.isNaN(v));
      const latencies = (ragMetrics ?? [])
        .map((r) => Number(r.latency_ms))
        .filter((v) => !Number.isNaN(v))
        .sort((a, b) => a - b);

      const avgPrecisionAtK =
        precisions.length > 0 ? precisions.reduce((a, b) => a + b, 0) / precisions.length : 0;

      const roleDistribution: Record<string, number> = {};
      for (const r of ragMetrics ?? []) {
        const role = (r.role_selected as string) ?? "unknown";
        roleDistribution[role] = (roleDistribution[role] ?? 0) + 1;
      }

      // ── NPS / Feedback summary
      const { data: feedbackRows } = await supabaseAdmin
        .from("feedback")
        .select("nps, category, created_at")
        .gte("created_at", day30);

      const npsValues = (feedbackRows ?? [])
        .map((f) => f.nps as number | null)
        .filter((n): n is number => n !== null);
      const promoters = npsValues.filter((n) => n >= 9).length;
      const detractors = npsValues.filter((n) => n <= 6).length;
      const npsScore =
        npsValues.length > 0
          ? Math.round(((promoters - detractors) / npsValues.length) * 100)
          : null;
      const avgNps =
        npsValues.length > 0 ? npsValues.reduce((a, b) => a + b, 0) / npsValues.length : null;

      const feedbackByCategory: Record<string, number> = {};
      for (const f of feedbackRows ?? []) {
        const cat = (f.category as string) ?? "general";
        feedbackByCategory[cat] = (feedbackByCategory[cat] ?? 0) + 1;
      }

      // ── Subscription conversion
      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("plan, status");
      const proCount = (subs ?? []).filter((s) => s.plan === "pro").length;
      const totalSubs = subs?.length ?? 0;
      const conversionToPro = totalSubs > 0 ? proCount / totalSubs : 0;

      res.json({
        generatedAt: new Date().toISOString(),
        windowDays: 30,
        users: {
          dau: dauSet.size,
          wau: wauSet.size,
          mau: mauSet.size,
        },
        mentor: {
          totalSessions30d: sessions?.length ?? 0,
          totalSessions7d: sessionsLast7.length,
          totalMessages30d: totalMessages ?? 0,
          avgMessagesPerSession: Number(avgMessagesPerSession.toFixed(2)),
          sessionsWithMin3Messages: sessionsWithMin3,
          deepEngagementRate:
            sessionMsgCounts.length > 0
              ? Number((sessionsWithMin3 / sessionMsgCounts.length).toFixed(3))
              : 0,
        },
        rag: {
          totalQueries30d: ragMetrics?.length ?? 0,
          avgPrecisionAtK: Number(avgPrecisionAtK.toFixed(3)),
          latencyP50Ms: percentile(latencies, 50),
          latencyP95Ms: percentile(latencies, 95),
          roleDistribution,
        },
        feedback: {
          total30d: feedbackRows?.length ?? 0,
          npsResponses: npsValues.length,
          npsScore,
          avgNps: avgNps !== null ? Number(avgNps.toFixed(2)) : null,
          promoters,
          detractors,
          byCategory: feedbackByCategory,
        },
        billing: {
          totalSubscriptions: totalSubs,
          proCount,
          conversionToPro: Number(conversionToPro.toFixed(3)),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /** GET /api/admin/feedback.csv — export all feedback for the report */
  router.get("/api/admin/feedback.csv", requireAdmin, async (_req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Supabase not configured" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("feedback")
        .select("id, user_id, nps, category, message, contact_ok, contact_info, page_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw error;

      const csv = rowsToCsv(data ?? [], [
        "id",
        "user_id",
        "nps",
        "category",
        "message",
        "contact_ok",
        "contact_info",
        "page_url",
        "created_at",
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="feedback_${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  /** GET /api/admin/events.csv — export recent events for the report */
  router.get("/api/admin/events.csv", requireAdmin, async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Supabase not configured" });
        return;
      }

      const days = Math.min(90, Math.max(1, Number(req.query.days ?? 30)));
      const since = isoDaysAgo(days);

      const { data, error } = await supabaseAdmin
        .from("events")
        .select("id, user_id, event_type, payload, latency_ms, page_url, session_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20000);

      if (error) throw error;

      const csv = rowsToCsv(data ?? [], [
        "id",
        "user_id",
        "event_type",
        "payload",
        "latency_ms",
        "page_url",
        "session_id",
        "created_at",
      ]);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="events_${days}d_${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  /** GET /api/admin/feedback — JSON list for the dashboard preview */
  router.get("/api/admin/feedback", requireAdmin, async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Supabase not configured" });
        return;
      }

      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
      const { data, error } = await supabaseAdmin
        .from("feedback")
        .select("id, user_id, nps, category, message, contact_ok, contact_info, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      res.json({ items: data ?? [] });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
