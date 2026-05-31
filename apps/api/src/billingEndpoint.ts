import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { requireAuth } from "./middleware/requireAuth";
import { getSubscriptionStatus } from "./middleware/requireSubscription";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

export function createBillingRouter(): Router {
  const router = Router();

  /** GET /api/billing/status — returns current subscription state */
  router.get("/api/billing/status", requireAuth, async (req, res, next) => {
    try {
      const sub = await getSubscriptionStatus(req.user!.id);
      if (!sub) {
        res.status(404).json({ error: "Subscription not found" });
        return;
      }
      res.json(sub);
    } catch (error) {
      next(error);
    }
  });

  /** POST /api/billing/start-trial — idempotent, creates trial if not already started */
  router.post("/api/billing/start-trial", requireAuth, async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Billing service not configured" });
        return;
      }

      const userId = req.user!.id;
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("trial_ends_at, plan")
        .eq("user_id", userId)
        .single();

      if (existing?.trial_ends_at) {
        res.json({ ok: true, message: "Trial already active", trialEndsAt: existing.trial_ends_at });
        return;
      }

      const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert({ user_id: userId, plan: "free", status: "active", trial_ends_at: trialEndsAt }, { onConflict: "user_id" });

      if (error) throw error;

      res.json({ ok: true, message: "Trial started", trialEndsAt });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/billing/upgrade удалён: ранее выдавал plan='pro' без проверки
  // платежа (любой залогиненный мог получить Pro). Апгрейд должен прилетать
  // вебхуком от платёжки (YooKassa/Stripe) с проверкой подписи — отдельный
  // защищённый роут, когда подключим.

  return router;
}
