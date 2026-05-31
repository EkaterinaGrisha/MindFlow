/**
 * lecturesEndpoint.ts
 *
 * Generates a "beautiful" structured lecture from a user's personal document.
 *
 *   POST   /api/lectures/generate         body: { sourceId }
 *   GET    /api/lectures                  list lecture cards
 *   GET    /api/lectures/:lectureId       full document
 *   DELETE /api/lectures/:lectureId
 */

import express from "express";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { requireAuth } from "./middleware/requireAuth";
import { requireSubscription } from "./middleware/requireSubscription";
import { resolveFromRepoRoot } from "./paths";
import type { LlmClient } from "./llmEndpoint";
import type { AuthenticatedRequest } from "./types/express";
import {
  validateLectureDocument,
  extractJsonObject,
  type LectureDocument,
} from "./llm/schemas/lectureDocument";

const MAX_CONTEXT_CHARS = 24_000;

function getAdmin() {
  if (!config.auth.supabaseUrl || !config.auth.supabaseServiceRoleKey) {
    throw new Error("Supabase service role not configured");
  }
  return createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey);
}

function loadLectureGeneratorPrompt(): string {
  return readFileSync(resolveFromRepoRoot("prompts", "lecture-generator.md"), "utf-8");
}

/**
 * Compress full document text into a budget. If the joined text fits — return
 * as is. Otherwise keep the head + uniformly sampled middle chunks marked
 * with [...] to give the LLM coverage without truncating one half away.
 */
function compressChunks(
  chunks: Array<{ chunk_text: string }>,
  budget: number,
): string {
  const joined = chunks.map((c) => c.chunk_text).join("\n\n");
  if (joined.length <= budget) return joined;

  const head = chunks.slice(0, Math.max(1, Math.floor(chunks.length * 0.3)));
  const headText = head.map((c) => c.chunk_text).join("\n\n");

  const remaining = budget - headText.length - 200;
  if (remaining <= 0) return headText.slice(0, budget);

  const tail = chunks.slice(head.length);
  // Take every Nth chunk to fit remaining budget.
  const step = Math.max(1, Math.ceil(tail.length / Math.max(1, Math.floor(remaining / 1200))));
  const sampled: string[] = [];
  let used = 0;
  for (let i = 0; i < tail.length; i += step) {
    const piece = tail[i].chunk_text;
    if (used + piece.length > remaining) break;
    sampled.push(piece);
    used += piece.length + 8;
  }
  return `${headText}\n\n[...]\n\n${sampled.join("\n\n[...]\n\n")}`;
}

function buildUserPrompt(title: string, body: string): string {
  return `НАЗВАНИЕ ИСХОДНОГО ДОКУМЕНТА: ${title}

КОНСПЕКТ (фрагменты в порядке оригинала, [...] = пропуск):

${body}

Собери на основе этого конспекта красивую лекцию строго по схеме (вернуть ТОЛЬКО валидный JSON).`;
}

async function callLlmForLecture(
  llm: LlmClient,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ raw: string; doc: LectureDocument } | { error: string; raw?: string }> {
  let raw: string;
  try {
    raw = await llm.generateText({ systemPrompt, userPrompt });
  } catch (e) {
    return { error: `LLM call failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const json = extractJsonObject(raw);
  if (!json) return { error: "No JSON object found in LLM response", raw };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { error: `JSON parse error: ${(e as Error).message}`, raw };
  }

  const result = validateLectureDocument(parsed);
  if (!result.ok) return { error: `Schema validation failed: ${result.issues.join("; ")}`, raw };
  return { raw, doc: result.doc! };
}

export function createLecturesRouter(llm: LlmClient) {
  const router = express.Router();

  // Все /api/lectures/* — за Pro/trial.
  router.use(requireAuth, requireSubscription);

  // ── POST /api/lectures/generate ───────────────────────────────────────────

  router.post("/api/lectures/generate", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { sourceId } = (req.body ?? {}) as { sourceId?: string };

      if (typeof sourceId !== "string" || !sourceId) {
        res.status(400).json({ error: "sourceId is required" });
        return;
      }

      const supabase = getAdmin();
      const { data: chunks, error: chunksErr } = await supabase
        .from("rag_chunks_personal")
        .select("chunk_index, chunk_text, source_title")
        .eq("owner_user_id", userId)
        .eq("source_id", sourceId)
        .order("chunk_index", { ascending: true });

      if (chunksErr) {
        res.status(500).json({ error: chunksErr.message });
        return;
      }
      if (!chunks || chunks.length === 0) {
        res.status(404).json({ error: "Document not found or empty" });
        return;
      }

      const sourceTitle = (chunks[0].source_title as string) || "Конспект";
      const body = compressChunks(
        chunks.map((c) => ({ chunk_text: c.chunk_text as string })),
        MAX_CONTEXT_CHARS,
      );
      const systemPrompt = loadLectureGeneratorPrompt();
      const userPrompt = buildUserPrompt(sourceTitle, body);

      // First attempt
      let attempt = await callLlmForLecture(llm, systemPrompt, userPrompt);

      // Retry once with stricter reminder if validation failed
      if ("error" in attempt) {
        console.warn("[lectures] first attempt failed:", attempt.error);
        const retryPrompt = `${userPrompt}\n\nВНИМАНИЕ: предыдущая попытка вернула невалидный JSON. Верни СТРОГО валидный JSON-объект по схеме, без \`\`\` и без текста снаружи.`;
        attempt = await callLlmForLecture(llm, systemPrompt, retryPrompt);
      }

      if ("error" in attempt) {
        // Persist failure for diagnostics
        await supabase.from("user_lectures").insert({
          owner_user_id: userId,
          source_id: sourceId,
          title: sourceTitle,
          document: { version: "1", title: sourceTitle, sections: [], questions: [] },
          status: "failed",
          error: attempt.error.slice(0, 500),
        });
        res.status(502).json({ error: "Lecture generation failed", details: attempt.error });
        return;
      }

      const { doc } = attempt;
      const { data: inserted, error: insertErr } = await supabase
        .from("user_lectures")
        .insert({
          owner_user_id: userId,
          source_id: sourceId,
          title: doc.title || sourceTitle,
          document: doc,
          status: "ready",
          model: config.llm.deepseekChatModel ?? null,
        })
        .select("id, title, source_id, created_at")
        .single();

      if (insertErr || !inserted) {
        res.status(500).json({ error: insertErr?.message ?? "Insert failed" });
        return;
      }

      res.json({ lectureId: inserted.id, document: doc });
    } catch (error) {
      next(error);
    }
  });

  // ── GET /api/lectures ─────────────────────────────────────────────────────

  router.get("/api/lectures", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const supabase = getAdmin();

      const { data, error } = await supabase
        .from("user_lectures")
        .select("id, title, source_id, status, created_at")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json({ lectures: data ?? [] });
    } catch (error) {
      next(error);
    }
  });

  // ── GET /api/lectures/:lectureId ──────────────────────────────────────────

  router.get("/api/lectures/:lectureId", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { lectureId } = req.params;
      const supabase = getAdmin();

      const { data, error } = await supabase
        .from("user_lectures")
        .select("id, title, source_id, status, error, document, created_at")
        .eq("owner_user_id", userId)
        .eq("id", lectureId)
        .maybeSingle();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      if (!data) {
        res.status(404).json({ error: "Lecture not found" });
        return;
      }
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ── DELETE /api/lectures/:lectureId ───────────────────────────────────────

  router.delete("/api/lectures/:lectureId", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { lectureId } = req.params;
      const supabase = getAdmin();

      const { error, count } = await supabase
        .from("user_lectures")
        .delete({ count: "exact" })
        .eq("owner_user_id", userId)
        .eq("id", lectureId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json({ deleted: count ?? 0 });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
