import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

function decodeJwtPayload(token: string): { exp?: number } {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Token is not a JWT");
  }

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const payloadJson = Buffer.from(base64 + padding, "base64").toString("utf8");
  return JSON.parse(payloadJson) as { exp?: number };
}

function unauthorized(message: string): Error {
  return new Error(message);
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const authorization = req.header("authorization") ?? "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401);
      throw unauthorized("Missing or invalid Bearer token");
    }

    if (!supabaseAdmin) {
      res.status(500);
      throw new Error("Supabase auth is not configured");
    }

    const payload = decodeJwtPayload(token);
    if (typeof payload.exp !== "number") {
      res.status(401);
      throw unauthorized("Token does not include exp claim");
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowInSeconds) {
      res.status(401);
      throw unauthorized("Token expired");
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.id) {
      res.status(401);
      throw unauthorized("Invalid access token");
    }

    req.user = { id: data.user.id };
    next();
  } catch (error) {
    next(error);
  }
};
