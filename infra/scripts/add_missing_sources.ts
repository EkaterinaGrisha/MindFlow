/**
 * add_missing_sources.ts
 *
 * Incremental ingest: load ONLY the sources that aren't yet in rag_chunks.
 * Today (2026-05-21) those are:
 *   - 9 authored MindFlow topics (theory.ts or theory-rich.tsx)
 *   - Beklemishev PDF (textbook)
 *
 * Why a separate script: the main infra/ingest/ingest.ts would re-upsert
 * the entire corpus (~2321 chunks) on every run, which wastes ~40 min of
 * embedding time after our Qwen3 migration. This one only touches what's
 * missing.
 *
 * Logic:
 *   1. Read rag_manifest, take approved entries.
 *   2. For each, check if its source_id already exists in rag_chunks.
 *   3. If not, build chunk batch:
 *        - For mindflow_* (authored): pick the best content file
 *          (theory-rich.tsx > big-theory.tsx > theory.ts), parse it.
 *        - For PDF entries: run the existing cascade extractor.
 *   4. Embed via Qwen3 and upsert.
 *
 * Run:
 *   npx tsx infra/scripts/add_missing_sources.ts [--dry-run]
 */

import "dotenv/config";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

import { config } from "../../apps/api/src/config";
import { _resetLocalEmbedderForTesting, embedPassageLocal } from "../../apps/api/src/llm/localEmbedder";
import { extractPdfText } from "../ingest/extractors";
import { extractRichTheoryBlocks, type TheoryBlock } from "../ingest/extractRichTsx";

const DRY_RUN = process.argv.includes("--dry-run");
const REPO_ROOT = path.resolve(__dirname, "..", "..");

// Topic display labels (must match infra/ingest/ingest.ts TOPIC_FOLDER_LABEL).
const TOPIC_FOLDER_LABEL: Record<string, string> = {
  "matrix-operations": "Операции с матрицами",
  "rank-basis": "Ранг и базис",
  "eigenvalues": "Собственные значения",
  "svd": "Сингулярное разложение (SVD)",
  "derivative-gradient": "Производная и градиент",
  "limits-continuity": "Пределы и непрерывность",
  "random-variables": "Случайные величины",
  "bayes": "Формула Байеса",
  "hypothesis-testing": "Проверка гипотез",
};

// Per-source topic tags for PDF books.
const PDF_TOPIC_TAGS: Record<string, string[]> = {
  beklemishev: ["matrix-operations", "rank-basis", "eigenvalues"],
};

interface ManifestItem {
  id: string;
  title: string;
  source_url?: string | null;
  approved_for_rag?: boolean;
  source_type?: string;
  local_path?: string | null;
}

interface ChunkBatch {
  source_id: string;
  source_title: string;
  source_url: string | null;
  topic_tags: string[];
  chunks: { text: string; page_hint: string | null }[];
}

// ─── plain theory.ts regex parser (same as ingest.ts parseTheoryBlocks) ──────

function parsePlainTheoryBlocks(source: string): TheoryBlock[] {
  const blocks: TheoryBlock[] = [];
  const pattern =
    /title:\s*(['"`])([\s\S]*?)\1\s*,\s*body:\s*(['"`])([\s\S]*?)\3\s*,?\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(source)) !== null) {
    const title = unescape(m[2]);
    const body = unescape(m[4]);
    if (title.trim() && body.trim()) blocks.push({ title: title.trim(), body: body.trim() });
  }
  return blocks;
}

function unescape(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, "\t")
    .replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\`/g, "`").replace(/\\\\/g, "\\");
}

// ─── Authored topic reader ────────────────────────────────────────────────────

function loadAuthoredTopic(folder: string): TheoryBlock[] {
  const folderRoot = path.join(
    REPO_ROOT, "apps", "web", "src", "components", "math-topic-content", folder,
  );

  // Try sources in order of richness:
  //   1. theory-rich.tsx — explicit rich variant
  //   2. theory.tsx if it's large (>15 KB → likely rich JSX, not plain)
  //   3. theory.ts (or theory.tsx if small) → plain regex parser
  const candidates = [
    { file: "theory-rich.tsx", parser: "rich" as const },
    { file: "theory.tsx",      parser: "auto" as const },
    { file: "theory.ts",       parser: "plain" as const },
  ];

  for (const c of candidates) {
    const full = path.join(folderRoot, c.file);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (!stat.isFile()) continue;

    let parser: "rich" | "plain" = c.parser === "auto"
      ? (stat.size > 15_000 ? "rich" : "plain")
      : c.parser;

    if (parser === "rich") {
      const blocks = extractRichTheoryBlocks(full);
      if (blocks.length > 0) {
        console.log(`[authored] ${folder}: rich ${c.file} → ${blocks.length} blocks`);
        return blocks;
      }
      console.warn(`[authored] ${folder}: ${c.file} rich parse yielded 0 blocks`);
    } else {
      const src = readFileSync(full, "utf-8");
      const blocks = parsePlainTheoryBlocks(src);
      if (blocks.length > 0) {
        console.log(`[authored] ${folder}: plain ${c.file} → ${blocks.length} blocks`);
        return blocks;
      }
    }
  }
  console.warn(`[authored] ${folder}: no parseable content`);
  return [];
}

// ─── Chunking ────────────────────────────────────────────────────────────────

const CHUNK_MAX_CHARS = 1800;

function chunkLongBody(title: string, body: string): { text: string; page_hint: string | null }[] {
  if (body.length <= CHUNK_MAX_CHARS) {
    return [{ text: `${title}\n\n${body}`, page_hint: title }];
  }
  // Split on paragraph boundaries, then accumulate up to CHUNK_MAX_CHARS.
  const paragraphs = body.split(/\n{2,}/);
  const chunks: { text: string; page_hint: string | null }[] = [];
  let current: string[] = [];
  let length = 0;
  for (const p of paragraphs) {
    if (length + p.length > CHUNK_MAX_CHARS && current.length > 0) {
      chunks.push({ text: `${title}\n\n${current.join("\n\n")}`, page_hint: title });
      current = [];
      length = 0;
    }
    current.push(p);
    length += p.length + 2;
  }
  if (current.length > 0) {
    chunks.push({ text: `${title}\n\n${current.join("\n\n")}`, page_hint: title });
  }
  return chunks;
}

// ─── PDF reader ──────────────────────────────────────────────────────────────

async function loadPdfBatch(item: ManifestItem): Promise<ChunkBatch | null> {
  if (!item.local_path) return null;
  const candidates = [
    path.resolve(REPO_ROOT, item.local_path),
    path.resolve(REPO_ROOT, "infra", "data", path.basename(item.local_path)),
  ];
  const filePath = candidates.find((c) => {
    try { return statSync(c).isFile(); } catch { return false; }
  });
  if (!filePath) {
    console.warn(`[pdf] ${item.id}: file not found at ${item.local_path}`);
    return null;
  }
  console.log(`[pdf] ${item.id}: extracting from ${path.basename(filePath)} ...`);
  const { text, method, cyrillicRatio } = await extractPdfText(filePath);
  console.log(`[pdf] ${item.id}: method=${method}, cyrRatio=${cyrillicRatio.toFixed(2)}, chars=${text.length}`);
  if (text.trim().length < 1000) {
    console.warn(`[pdf] ${item.id}: text too short, skipping`);
    return null;
  }
  // Russian-named books (title contains Cyrillic OR known russian source) MUST
  // have non-trivial cyrillic ratio. Otherwise it's the same OCR-glyph-soup
  // pattern we saw with auto_gelfand1971ru — Apple Vision recognised cyrillic
  // glyphs as look-alike latin characters because ru-RU isn't available.
  const titleHasCyrillic = /[А-Яа-яЁё]/.test(item.title);
  if (titleHasCyrillic && cyrillicRatio < 0.30) {
    console.warn(
      `[pdf] ${item.id}: cyrRatio=${cyrillicRatio.toFixed(2)} too low for a Russian book — ` +
        `Apple Vision likely OCR'd cyrillic as look-alike latin. Skipping.`,
    );
    return null;
  }

  // Naive chunking: split on double newlines, group up to CHUNK_MAX_CHARS.
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  const chunks: { text: string; page_hint: string | null }[] = [];
  let current: string[] = [];
  let length = 0;
  for (const p of paragraphs) {
    if (length + p.length > CHUNK_MAX_CHARS && current.length > 0) {
      chunks.push({ text: current.join("\n\n"), page_hint: null });
      current = [];
      length = 0;
    }
    current.push(p);
    length += p.length + 2;
  }
  if (current.length > 0) chunks.push({ text: current.join("\n\n"), page_hint: null });

  return {
    source_id:    item.id,
    source_title: item.title,
    source_url:   item.source_url ?? null,
    topic_tags:   PDF_TOPIC_TAGS[item.id] ?? [],
    chunks,
  };
}

// ─── Authored batch builder ──────────────────────────────────────────────────

function buildAuthoredBatch(folder: string, item: ManifestItem): ChunkBatch | null {
  const blocks = loadAuthoredTopic(folder);
  if (blocks.length === 0) return null;
  const chunks = blocks.flatMap((b) => chunkLongBody(b.title, b.body));
  return {
    source_id:    item.id,
    source_title: item.title,
    source_url:   item.source_url ?? null,
    topic_tags:   [folder],
    chunks,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  const supabase = createClient(url, key);

  _resetLocalEmbedderForTesting();
  console.log(`[ingest] Local embedder: ${config.rag.localEmbedderModel}`);

  // Find what's already in DB. Supabase REST caps per-request rows at db.max_rows
  // (default 1000) so we paginate via .range() until exhausted.
  const existingSourceIds = new Set<string>();
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("rag_chunks")
      .select("source_id")
      .order("id")
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) existingSourceIds.add((r as { source_id: string }).source_id);
    if (data.length < PAGE) break;
  }
  console.log(`[ingest] ${existingSourceIds.size} distinct source(s) already in rag_chunks:`);
  for (const s of [...existingSourceIds].sort()) console.log(`         · ${s}`);

  // Load manifest
  const manifestPath = path.join(REPO_ROOT, "infra", "data", "rag_manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ManifestItem[];

  const missing = manifest.filter(
    (m) => m.approved_for_rag === true && !existingSourceIds.has(m.id),
  );
  console.log(`[ingest] ${missing.length} missing approved source(s):`);
  for (const m of missing) console.log(`         - ${m.id} (${m.source_type})`);

  if (missing.length === 0) {
    console.log("[ingest] nothing to do");
    return;
  }

  // Build batches
  const batches: ChunkBatch[] = [];
  for (const m of missing) {
    if (m.id.startsWith("mindflow_")) {
      const folder = m.id.replace(/^mindflow_/, "");
      if (!(folder in TOPIC_FOLDER_LABEL)) {
        console.warn(`[ingest] ${m.id}: folder ${folder} not in TOPIC_FOLDER_LABEL — skip`);
        continue;
      }
      const batch = buildAuthoredBatch(folder, m);
      if (batch && batch.chunks.length > 0) batches.push(batch);
    } else if (m.source_type === "textbook_pdf" || m.source_type === "direct_pdf") {
      const batch = await loadPdfBatch(m);
      if (batch && batch.chunks.length > 0) batches.push(batch);
    } else {
      console.warn(`[ingest] ${m.id}: source_type=${m.source_type} not supported here — skip`);
    }
  }

  const totalChunks = batches.reduce((s, b) => s + b.chunks.length, 0);
  console.log(`[ingest] prepared ${batches.length} batch(es), ${totalChunks} chunk(s) total`);

  if (DRY_RUN) {
    console.log("[ingest] DRY RUN — not embedding or inserting");
    for (const b of batches) {
      console.log(`  ${b.source_id}: ${b.chunks.length} chunks, sample first 200 chars:`);
      console.log(`    ${b.chunks[0]?.text.slice(0, 200).replace(/\n/g, " ⏎ ")}`);
    }
    return;
  }

  // Embed and insert
  let done = 0;
  const t0 = Date.now();
  for (const batch of batches) {
    console.log(`[ingest] ${batch.source_id}: embedding ${batch.chunks.length} chunks...`);
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < batch.chunks.length; i++) {
      const c = batch.chunks[i];
      const cleanText = c.text.trim();
      const embedding = await embedPassageLocal(cleanText);
      if (embedding.length !== 1024) {
        throw new Error(`Unexpected embedding length ${embedding.length} for ${batch.source_id}#${i}`);
      }
      rows.push({
        source_id:     batch.source_id,
        source_title:  batch.source_title,
        chunk_index:   i,
        chunk_text:    cleanText,
        embedding,
        page_hint:     c.page_hint,
        topic_tags:    batch.topic_tags,
        source_url:    batch.source_url,
      });
      done++;
      if (done % 10 === 0) {
        const rate = done / ((Date.now() - t0) / 1000);
        console.log(`[ingest]   embedded ${done}/${totalChunks} (${rate.toFixed(2)} chunks/s)`);
      }
    }
    // Upsert in batches of 50 to stay under statement size limits.
    for (let off = 0; off < rows.length; off += 50) {
      const slice = rows.slice(off, off + 50);
      const { error } = await supabase
        .from("rag_chunks")
        .upsert(slice, { onConflict: "source_id,chunk_index" });
      if (error) throw new Error(`upsert failed for ${batch.source_id}: ${error.message}`);
    }
    console.log(`[ingest] ${batch.source_id}: done`);
  }

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`[ingest] Total: ${done} chunks in ${elapsed.toFixed(0)}s`);
}

main().catch((err) => {
  console.error("[ingest] FAILED:", err);
  process.exit(1);
});
