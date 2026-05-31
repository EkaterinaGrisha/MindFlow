import express, { type Express, type RequestHandler } from "express";
import { config } from "./config";

const SKIP_REQ_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
]);

const SKIP_RES_HEADERS = new Set([
  "connection",
  "transfer-encoding",
  "content-encoding",
  "content-length",
]);

const MOUNT_PATH = "/supabase";

function createSupabaseProxyHandler(): RequestHandler {
  const supabaseUrl = config.auth.supabaseUrl;

  if (!supabaseUrl) {
    console.warn("[supabase-proxy] SUPABASE_URL не задана; прокси отключён.");
    return (_req, res) => {
      res.status(503).json({ error: "Supabase proxy not configured" });
    };
  }

  const base = supabaseUrl.replace(/\/$/, "");
  console.log(`[supabase-proxy] mounted at ${MOUNT_PATH}/* → ${base}`);

  return async (req, res, next) => {
    try {
      const subpath = req.originalUrl.startsWith(MOUNT_PATH)
        ? req.originalUrl.slice(MOUNT_PATH.length)
        : req.originalUrl;
      const target = base + subpath;

      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lower = key.toLowerCase();
        if (SKIP_REQ_HEADERS.has(lower)) continue;
        if (lower === "origin") continue;
        if (typeof value === "string") headers[key] = value;
        else if (Array.isArray(value)) headers[key] = value.join(", ");
      }

      let body: Buffer | undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        if (Buffer.isBuffer(req.body) && req.body.length > 0) {
          body = req.body;
        }
      }

      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body,
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (SKIP_RES_HEADERS.has(key.toLowerCase())) return;
        res.setHeader(key, value);
      });

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

export function mountSupabaseProxy(app: Express): void {
  app.use(
    MOUNT_PATH,
    express.raw({ type: "*/*", limit: "10mb" }),
    createSupabaseProxyHandler(),
  );
}
