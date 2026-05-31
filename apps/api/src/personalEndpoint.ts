/**
 * personalEndpoint.ts
 *
 * Routes for uploading personal documents (PDF / DOCX / TXT / MD) into
 * a user-scoped RAG namespace (separate table rag_chunks_personal, owner_user_id = user.id).
 *
 * POST /api/personal/upload  — upload + chunk + embed + store
 * GET  /api/personal/documents — list the user's personal documents
 * DELETE /api/personal/documents/:sourceId — delete all chunks for a document
 */

import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { getDocumentProxy, extractText } from "unpdf";
import mammoth from "mammoth";
import { config } from "./config";
import { requireAuth } from "./middleware/requireAuth";
import { requireSubscription } from "./middleware/requireSubscription";
import { embedPassageLocal } from "./llm/localEmbedder";
import type { AuthenticatedRequest } from "./types/express";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

// ─── Mojibake repair ──────────────────────────────────────────────────────────

function cyrillicRatio(text: string): number {
  if (!text.length) return 0;
  const cyr = (text.match(/[А-яЁё]/g) ?? []).length;
  return cyr / text.length;
}

// cp1251 bytes were decoded as latin1 (each byte became a char with the same code point).
// Re-encode to Buffer using latin1, then decode as cp1251 — but since Node has no
// built-in cp1251, we map the overlapping Windows-1251 block manually.
// cp1251 0x80–0xFF maps to specific Unicode code points (Cyrillic range mostly).
const CP1251_MAP: Record<number, number> = {
  0x80:0x0402,0x81:0x0403,0x82:0x201A,0x83:0x0453,0x84:0x201E,0x85:0x2026,0x86:0x2020,
  0x87:0x2021,0x88:0x20AC,0x89:0x2030,0x8A:0x0409,0x8B:0x2039,0x8C:0x040A,0x8D:0x040C,
  0x8E:0x040B,0x8F:0x040F,0x90:0x0452,0x91:0x2018,0x92:0x2019,0x93:0x201C,0x94:0x201D,
  0x95:0x2022,0x96:0x2013,0x97:0x2014,0x99:0x2122,0x9A:0x0459,0x9B:0x203A,0x9C:0x045A,
  0x9D:0x045C,0x9E:0x045B,0x9F:0x045F,0xA0:0x00A0,0xA1:0x040E,0xA2:0x045E,0xA3:0x0408,
  0xA4:0x00A4,0xA5:0x0490,0xA6:0x00A6,0xA7:0x00A7,0xA8:0x0401,0xA9:0x00A9,0xAA:0x0404,
  0xAB:0x00AB,0xAC:0x00AC,0xAD:0x00AD,0xAE:0x00AE,0xAF:0x0407,0xB0:0x00B0,0xB1:0x00B1,
  0xB2:0x0406,0xB3:0x0456,0xB4:0x0491,0xB5:0x00B5,0xB6:0x00B6,0xB7:0x00B7,0xB8:0x0451,
  0xB9:0x2116,0xBA:0x0454,0xBB:0x00BB,0xBC:0x0458,0xBD:0x0405,0xBE:0x0455,0xBF:0x0457,
};

function repairCp1251Mojibake(text: string): string {
  // Build a latin1 Buffer from the string (each char code ≤ 255 becomes one byte)
  const buf = Buffer.alloc(text.length);
  for (let i = 0; i < text.length; i++) buf[i] = text.charCodeAt(i) & 0xff;
  let result = "";
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b >= 0xC0 && b <= 0xFF) {
      // cp1251 Cyrillic block: 0xC0=А(U+0410) … 0xFF=я(U+044F), offset 0x0350 holds for all
      result += String.fromCharCode(b + 0x0350);
    } else if (CP1251_MAP[b] !== undefined) {
      result += String.fromCharCode(CP1251_MAP[b]);
    } else {
      result += String.fromCharCode(b);
    }
  }
  return result;
}

const CHUNK_TARGET_WORDS = 320;
const CHUNK_OVERLAP_WORDS = 40;
const CHUNK_HARD_MAX_WORDS = 400;
const CHUNK_MIN_WORDS = 12;

// ─── Multer ───────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (/\.(pdf|docx|txt|md)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Use PDF, DOCX, TXT or MD."));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(text: string): string {
  return text
    .replace(/\x00/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\r\n/g, "\n");
}

function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    chunks.push(buf.join(" "));
    buf = buf.length > CHUNK_OVERLAP_WORDS ? buf.slice(-CHUNK_OVERLAP_WORDS) : [];
  };

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    if (buf.length + words.length > CHUNK_TARGET_WORDS && buf.length > 0) flush();
    buf.push(...words);
    if (buf.length >= CHUNK_TARGET_WORDS) flush();
  }
  if (buf.length > 0) chunks.push(buf.join(" "));

  return chunks
    .filter((c) => c.split(/\s+/).length >= CHUNK_MIN_WORDS)
    .map((c) => {
      const words = c.split(/\s+/);
      return words.length > CHUNK_HARD_MAX_WORDS
        ? words.slice(0, CHUNK_HARD_MAX_WORDS).join(" ")
        : c;
    });
}

async function extractFromFile(buffer: Buffer, originalName: string): Promise<string> {
  const ext = (originalName.split(".").pop() ?? "").toLowerCase();

  if (ext === "pdf") {
    const proxy = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(proxy, { mergePages: false });
    const raw = Array.isArray(text) ? text.join("\n\n") : text;

    // If Cyrillic ratio is low but there are many high latin bytes, likely cp1251 mojibake
    const latinHighRatio = (raw.match(/[À-ÿ]/g) ?? []).length / (raw.length || 1);
    const fixed = latinHighRatio > 0.15 && cyrillicRatio(raw) < 0.05
      ? repairCp1251Mojibake(raw)
      : raw;

    return sanitize(fixed);
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return sanitize(result.value);
  }

  return sanitize(buffer.toString("utf-8"));
}

function getAdmin() {
  if (!config.auth.supabaseUrl || !config.auth.supabaseServiceRoleKey) {
    throw new Error("Supabase service role not configured");
  }
  return createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function createPersonalRouter() {
  const router = express.Router();

  // Все /api/personal/* — за Pro/trial.
  router.use(requireAuth, requireSubscription);

  // ── POST /api/personal/upload ─────────────────────────────────────────────

  router.post(
    "/api/personal/upload",
    upload.single("file"),
    async (req, res, next) => {
      try {
        const userId = (req as AuthenticatedRequest).user.id;

        if (!req.file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }

        const originalName = req.file.originalname;
        const sourceTitle =
          (req.body as { title?: string }).title ||
          originalName.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();

        // Use a stable source_id: if user uploads same filename, it replaces previous
        const safeName = originalName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 40);
        const sourceId = `personal_${userId.slice(0, 8)}_${safeName}`;

        // Extract text
        let rawText: string;
        try {
          rawText = await extractFromFile(req.file.buffer, originalName);
        } catch (extractErr) {
          console.error("[personal] text extraction failed:", extractErr);
          res
            .status(422)
            .json({ error: "Could not extract text from the file. Make sure it is not encrypted." });
          return;
        }

        if (!rawText.trim()) {
          res.status(422).json({ error: "The file appears to be empty or contains no readable text." });
          return;
        }

        // Chunk
        const chunks = chunkText(rawText);
        if (chunks.length === 0) {
          res.status(422).json({ error: "Document too short to process (less than 12 words)." });
          return;
        }

        // Прогрев эмбеддера ДО старта цикла. Если модель ещё не загружена
        // (холодный старт контейнера) — один await поднимет её. Если она
        // упадёт здесь — 503 с понятным сообщением, без частичного insert.
        try {
          await embedPassageLocal("warmup");
        } catch (warmupErr) {
          console.error("[personal] embedder warmup failed:", warmupErr);
          res.status(503).json({
            error:
              "Поисковая модель ещё не загрузилась — попробуйте через минуту. Если ошибка повторяется — обратитесь в поддержку.",
          });
          return;
        }

        // Embed + upsert sequentially (embedder is a singleton, not safe to parallelise)
        const supabase = getAdmin();
        let inserted = 0;
        const embedErrors: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
          let embedding: number[];
          try {
            embedding = await embedPassageLocal(chunks[i]);
          } catch (embedErr) {
            const msg = embedErr instanceof Error ? embedErr.message : String(embedErr);
            console.warn(`[personal] embed failed for chunk ${i}: ${msg}`);
            embedErrors.push(`chunk ${i}: ${msg}`);
            continue;
          }

          const { error } = await supabase.from("rag_chunks_personal").upsert(
            {
              source_id: sourceId,
              source_title: sourceTitle,
              chunk_index: i,
              chunk_text: chunks[i],
              embedding,
              page_hint: `Часть ${i + 1} из ${chunks.length}`,
              topic_tags: [],
              source_url: null,
              owner_user_id: userId,
              language: "ru",
            },
            { onConflict: "source_id,chunk_index" },
          );

          if (error) {
            console.error(`[personal] upsert failed for chunk ${i}:`, error.message);
          } else {
            inserted++;
          }
        }

        // Fail fast: если эмбеддер уронил ВСЕ чанки — нет смысла
        // возвращать 200, потому что в БД ничего нет → ментор не найдёт
        // документ, а юзер думает что загрузилось.
        if (inserted === 0) {
          console.error(
            `[personal] indexing failed: 0/${chunks.length} chunks inserted for ${sourceId}. Errors:`,
            embedErrors.slice(0, 5),
          );
          res.status(503).json({
            error:
              "Не удалось проиндексировать документ — попробуйте через минуту.",
            details: embedErrors[0] ?? "unknown embed error",
          });
          return;
        }

        res.json({
          source_id: sourceId,
          source_title: sourceTitle,
          chunks_total: chunks.length,
          chunks_inserted: inserted,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // ── GET /api/personal/documents ───────────────────────────────────────────

  router.get("/api/personal/documents", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const supabase = getAdmin();

      const { data, error } = await supabase
        .from("rag_chunks_personal")
        .select("source_id, source_title")
        .eq("owner_user_id", userId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      // Aggregate: count chunks per source
      const map = new Map<string, { source_id: string; source_title: string; chunk_count: number }>();
      for (const row of data ?? []) {
        const existing = map.get(row.source_id as string);
        if (existing) {
          existing.chunk_count++;
        } else {
          map.set(row.source_id as string, {
            source_id: row.source_id as string,
            source_title: row.source_title as string,
            chunk_count: 1,
          });
        }
      }

      res.json({ documents: Array.from(map.values()) });
    } catch (error) {
      next(error);
    }
  });

  // ── GET /api/personal/documents/:sourceId/text ────────────────────────────
  // Returns all extracted text chunks of a personal document for the reader UI.

  router.get("/api/personal/documents/:sourceId/text", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const sourceId = req.params.sourceId;
      const supabase = getAdmin();

      const { data, error } = await supabase
        .from("rag_chunks_personal")
        .select("chunk_index, chunk_text, page_hint, source_title")
        .eq("owner_user_id", userId)
        .eq("source_id", sourceId)
        .order("chunk_index", { ascending: true });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      if (!data || data.length === 0) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      res.json({
        source_id: sourceId,
        source_title: data[0].source_title as string,
        chunks: data.map((d) => ({
          chunk_index: d.chunk_index as number,
          chunk_text: d.chunk_text as string,
          page_hint: (d.page_hint as string | null) ?? null,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  // ── GET /api/personal/kg ──────────────────────────────────────────────────
  // Returns the user's personal knowledge graph (nodes + edges).

  router.get("/api/personal/kg", async (req, res, next) => {
    try {
      const userId  = (req as AuthenticatedRequest).user.id;
      const supabase = getAdmin();

      const [nodesRes, edgesRes] = await Promise.all([
        supabase
          .from("personal_kg_nodes")
          .select("id, label, domain, mention_count, mastery_score, global_concept_id, first_seen_at, last_seen_at")
          .eq("user_id", userId)
          .order("mention_count", { ascending: false })
          .limit(80),
        supabase
          .from("personal_kg_edges")
          .select("id, from_label, to_label, relation, strength")
          .eq("user_id", userId)
          .order("strength", { ascending: false })
          .limit(120),
      ]);

      if (nodesRes.error) { res.status(500).json({ error: nodesRes.error.message }); return; }
      if (edgesRes.error) { res.status(500).json({ error: edgesRes.error.message }); return; }

      res.json({ nodes: nodesRes.data ?? [], edges: edgesRes.data ?? [] });
    } catch (error) {
      next(error);
    }
  });

  // ── DELETE /api/personal/documents/:sourceId ──────────────────────────────

  router.delete("/api/personal/documents/:sourceId", async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const { sourceId } = req.params;
      const supabase = getAdmin();

      const { error, count } = await supabase
        .from("rag_chunks_personal")
        .delete({ count: "exact" })
        .eq("owner_user_id", userId)
        .eq("source_id", sourceId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ deleted_count: count ?? 0 });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
