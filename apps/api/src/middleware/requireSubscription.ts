import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

export type SubscriptionStatus = {
  plan: "free" | "pro";
  status: "active" | "cancelled" | "expired";
  inTrial: boolean;
  trialEndsAt: string | null;
  expiresAt: string | null;
};

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status, trial_ends_at, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const inTrial = trialEndsAt !== null && trialEndsAt > now;

  return {
    plan: data.plan as "free" | "pro",
    status: data.status as "active" | "cancelled" | "expired",
    inTrial,
    trialEndsAt: data.trial_ends_at,
    expiresAt: data.expires_at,
  };
}

export function hasPlanAccess(sub: SubscriptionStatus | null): boolean {
  if (!sub) return false;
  if (sub.plan === "pro" && sub.status === "active") return true;
  if (sub.inTrial) return true;
  return false;
}

/** Middleware: requires active Pro plan or active trial. */
export const requireSubscription: RequestHandler = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const sub = await getSubscriptionStatus(userId);
  if (!hasPlanAccess(sub)) {
    res.status(403).json({
      error: "Pro subscription required",
      code: "SUBSCRIPTION_REQUIRED",
      trialAvailable: sub?.plan === "free" && !sub.inTrial,
    });
    return;
  }

  next();
};
