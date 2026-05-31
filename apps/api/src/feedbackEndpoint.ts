import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { optionalAuth } from "./middleware/optionalAuth";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

const ALLOWED_CATEGORIES = new Set([
  "general",
  "bug",
  "feature_request",
  "content_quality",
  "ai_quality",
  "ux",
  "other",
]);

export function createFeedbackRouter(): Router {
  const router = Router();

  /** POST /api/feedback — submit a feedback entry (NPS + free text) */
  router.post("/api/feedback", optionalAuth, async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Feedback service not configured" });
        return;
      }

      const body = req.body as {
        nps?: number;
        category?: string;
        message?: string;
        contact_ok?: boolean;
        contact_info?: string;
        page_url?: string;
        metadata?: Record<string, unknown>;
      };

      const message = (body.message ?? "").trim();
      if (message.length === 0) {
        res.status(400).json({ error: "message is required" });
        return;
      }
      if (message.length > 4000) {
        res.status(400).json({ error: "message is too long (max 4000 chars)" });
        return;
      }

      const nps =
        typeof body.nps === "number" && body.nps >= 0 && body.nps <= 10
          ? Math.round(body.nps)
          : null;

      const category =
        body.category && ALLOWED_CATEGORIES.has(body.category) ? body.category : "general";

      const userAgent = (req.header("user-agent") ?? "").slice(0, 500);

      const { data, error } = await supabaseAdmin
        .from("feedback")
        .insert({
          user_id: req.user?.id ?? null,
          nps,
          category,
          message,
          contact_ok: Boolean(body.contact_ok),
          contact_info: body.contact_info?.slice(0, 200) ?? null,
          page_url: body.page_url?.slice(0, 500) ?? null,
          user_agent: userAgent || null,
          metadata: body.metadata ?? {},
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.warn("[feedback] insert failed:", error.message);
        res.status(500).json({ error: "Failed to save feedback" });
        return;
      }

      res.json({ ok: true, id: data.id, createdAt: data.created_at });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
