import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { optionalAuth } from "./middleware/optionalAuth";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

const ALLOWED_EVENT_TYPES = new Set([
  "chat_session_started",
  "chat_message_sent",
  "mentor_response_received",
  "topic_opened",
  "practice_attempt",
  "solution_revealed",
  "diagnostic_started",
  "diagnostic_completed",
  "payment_started",
  "payment_succeeded",
  "payment_cancelled",
  "feedback_submitted",
  "feedback_error",
  "onboarding_step_completed",
  "subscription_upgraded",
  "page_view",
]);

export function createEventsRouter(): Router {
  const router = Router();

  /** POST /api/events — accept any authenticated or anon event */
  router.post("/api/events", optionalAuth, async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        // Silent no-op — events should never break the app
        res.json({ ok: true, persisted: false });
        return;
      }

      const body = req.body as {
        event_type?: string;
        payload?: Record<string, unknown>;
        latency_ms?: number;
        page_url?: string;
        session_id?: string;
      };

      if (!body.event_type || !ALLOWED_EVENT_TYPES.has(body.event_type)) {
        res.status(400).json({ error: "Invalid or missing event_type" });
        return;
      }

      const { error } = await supabaseAdmin.from("events").insert({
        user_id: req.user?.id ?? null,
        event_type: body.event_type,
        payload: body.payload ?? {},
        latency_ms: typeof body.latency_ms === "number" ? body.latency_ms : null,
        page_url: typeof body.page_url === "string" ? body.page_url.slice(0, 500) : null,
        session_id: body.session_id ?? null,
      });

      if (error) {
        console.warn("[events] insert failed:", error.message);
        res.json({ ok: true, persisted: false });
        return;
      }

      res.json({ ok: true, persisted: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
