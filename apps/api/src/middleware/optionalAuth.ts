/**
 * optionalAuth.ts
 *
 * Unlike requireAuth (which returns 401 for missing tokens),
 * this middleware is used on endpoints accessible to guests.
 *
 * Behaviour:
 *   - No Authorization header → pass through, req.user stays undefined (guest)
 *   - Bearer token present but expired / invalid → 401 (prevents token replay)
 *   - Bearer token present and valid → populate req.user.id, pass through
 *
 * Use this on /api/llm/respond so both guests and authenticated users
 * can reach the endpoint, but authenticated requests get personalization.
 */

import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(
      Buffer.from(base64 + padding, "base64").toString("utf8"),
    ) as { exp?: number };
  } catch {
    return null;
  }
}

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (!authorization || scheme !== "Bearer" || !token) {
    return next();
  }

  const reject = (message: string) => {
    res.status(401).json({
      error: message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  };

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return reject("Invalid access token");
  }
  if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) {
    return reject("Token expired");
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user?.id) {
        return reject("Invalid access token");
      }
      req.user = { id: data.user.id };
    } catch {
      return reject("Auth check failed");
    }
  }

  next();
};
