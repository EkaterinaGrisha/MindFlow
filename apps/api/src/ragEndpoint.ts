import express from "express";
import { llmRateLimiter } from "./middleware/rateLimiter";
import { optionalAuth } from "./middleware/optionalAuth";
import { retrieveRelevantChunks } from "./llm/ragBoundary";

const MAX_TOP_K = 12;
const DEFAULT_TOP_K = 4;

export function createRagRouter(): express.Router {
  const router = express.Router();

  router.use("/api/rag", llmRateLimiter);
  router.use("/api/rag/search", optionalAuth);

  router.post("/api/rag/search", async (req, res, next) => {
    try {
      const body = req.body as {
        query?: unknown;
        top_k?: unknown;
        topic_tags?: unknown;
        dense_weight?: unknown;
        lex_weight?: unknown;
      } | undefined;

      const query = typeof body?.query === "string" ? body.query.trim() : "";
      if (!query) {
        res.status(400).json({
          error: "Invalid payload: 'query' is required and must be a non-empty string",
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const requestedTopK =
        typeof body?.top_k === "number" && Number.isFinite(body.top_k)
          ? Math.floor(body.top_k)
          : DEFAULT_TOP_K;
      const topK = Math.max(1, Math.min(MAX_TOP_K, requestedTopK));

      const topicTags = Array.isArray(body?.topic_tags)
        ? body.topic_tags.filter((t): t is string => typeof t === "string" && t.length > 0)
        : null;

      const denseW =
        typeof body?.dense_weight === "number" && Number.isFinite(body.dense_weight)
          ? body.dense_weight
          : null;
      const lexW =
        typeof body?.lex_weight === "number" && Number.isFinite(body.lex_weight)
          ? body.lex_weight
          : null;
      const rrfWeights =
        denseW !== null || lexW !== null
          ? { dense: denseW ?? 1.0, lex: lexW ?? 1.0 }
          : null;

      const result = await retrieveRelevantChunks(
        query,
        [],
        topK,
        topicTags && topicTags.length > 0 ? topicTags : null,
        null,
        false, // /api/rag/search is used for evaluation; LLM context-budget capping doesn't apply here
        rrfWeights,
      );

      res.json({
        chunks: result.chunks,
        citations: result.citations,
        meta: result.meta,
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
