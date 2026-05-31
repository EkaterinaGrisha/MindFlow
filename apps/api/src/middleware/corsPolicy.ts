import type { RequestHandler } from "express";
import { getAllowedOrigins } from "../config";

const allowedOrigins = new Set(getAllowedOrigins());

const ALLOW_HEADERS =
  "Content-Type, Authorization, x-request-id, apikey, Prefer, Range, X-Client-Info, x-supabase-api-version";
const ALLOW_METHODS = "GET,POST,PATCH,PUT,DELETE,OPTIONS";

export const corsPolicy: RequestHandler = (req, res, next) => {
  const origin = req.header("origin");
  const isAllowed = !origin || allowedOrigins.has(origin);

  // Preflight: всегда отдаём 204 с CORS-headers, эхим origin как есть.
  // Никаких данных в OPTIONS не отдаётся, поэтому это безопасно — реальный
  // запрос всё равно упрётся в allow-list ниже, если origin не разрешён.
  if (req.method === "OPTIONS") {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", ALLOW_HEADERS);
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, X-Total-Count");
    res.status(204).send();
    return;
  }

  if (isAllowed) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", ALLOW_HEADERS);
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, X-Total-Count");
    next();
    return;
  }

  res.status(403);
  next(new Error("CORS policy violation"));
};
