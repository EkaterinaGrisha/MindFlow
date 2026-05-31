/**
 * infra/ingest/ingest.ts
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parse as parseHtml } from "node-html-parser";

import { config } from "../../apps/api/src/config";
import {
  embedPassageLocal,
  _resetLocalEmbedderForTesting,
} from "../../apps/api/src/llm/localEmbedder";
import {
  detectMojibake,
  extractPdfText,
  repairCp1251Mojibake,
  type ExtractionMethod,
} from "./extractors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

interface ManifestItem {
  id: string;
  title: string;
  approved_for_rag?: boolean;
  local_path?: string | null;
  notes?: string | null;
  source_type?: string;
  source_url?: string | null;
}

interface ChunkRow {
  source_id: string;
  source_title: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  page_hint: string | null;
  topic_tags: string[];
  source_url: string | null;
  metadata: Record<string, unknown> | null;
}

interface TheoryBlock {
  title: string;
  body: string;
}

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

const EXTERNAL_SOURCE_TOPIC_TAGS: Record<string, string[]> = {
  yandex_matrix: ["matrix-operations"],
  // Кострыкин "Введение в алгебру" (3 тома, ФИЗМАТЛИТ)
  kostrykin_part1: ["matrix-operations", "rank-basis"],
  kostrykin_part2: ["rank-basis", "eigenvalues"],
  kostrykin_part3: ["eigenvalues", "svd"],
  // Hefferon "Linear Algebra" (open-source, CC-BY)
  hefferon: ["matrix-operations", "rank-basis", "eigenvalues"],
  // MIT 18.06 Spring 2010 lecture zoom notes
  mit_18_06_zoom_notes: ["eigenvalues", "svd", "matrix-operations"],
  // Беклемишев "Курс аналитической геометрии и линейной алгебры"
  beklemishev: ["matrix-operations", "rank-basis", "eigenvalues"],
};

// ─── Auto-scan: topic inference from filename ─────────────────────────────────

const FILENAME_TAG_RULES: Array<{ pattern: RegExp; tags: string[] }> = [
  { pattern: /бекл|beclem/i,               tags: ["matrix-operations", "rank-basis", "eigenvalues"] },
  { pattern: /кост|kostr/i,                tags: ["matrix-operations", "rank-basis", "eigenvalues"] },
  { pattern: /hefferon/i,                  tags: ["matrix-operations", "rank-basis", "eigenvalues"] },
  { pattern: /strang|18[._]06|mit[_ ]/i,   tags: ["eigenvalues", "svd", "matrix-operations"] },
  { pattern: /вероят|probab|shiryaev|шир/i, tags: ["random-variables", "bayes", "hypothesis-testing"] },
  { pattern: /статист|statist|lagutin|лаг/i, tags: ["random-variables", "hypothesis-testing"] },
  { pattern: /байес|bayes/i,               tags: ["bayes"] },
  { pattern: /гипотез|hypothesis/i,        tags: ["hypothesis-testing"] },
  { pattern: /производн|gradient|диффер/i, tags: ["derivative-gradient"] },
  { pattern: /предел|limit|непрер|zorich|зорич/i, tags: ["limits-continuity"] },
  { pattern: /свд|svd|сингул/i,            tags: ["svd"] },
  { pattern: /собств|eigenval/i,           tags: ["eigenvalues"] },
  { pattern: /ранг|rank|basis|базис/i,     tags: ["rank-basis"] },
  { pattern: /матриц|matrix|алгебр|algebra|геометр/i, tags: ["matrix-operations", "rank-basis"] },
];

const DEFAULT_TAGS = ["matrix-operations"];

function inferTopicTags(filename: string): string[] {
  const name = path.basename(filename, path.extname(filename));
  for (const rule of FILENAME_TAG_RULES) {
    if (rule.pattern.test(name)) return rule.tags;
  }
  return DEFAULT_TAGS;
}

/** Returns slug-style id from a filename, e.g. "Беклемишев.pdf" → "auto_beкlemishev" */
function filenameToId(filename: string): string {
  const name = path.basename(filename, path.extname(filename));
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_Ѐ-ӿ]/g, "")
    .slice(0, 50);
  return `auto_${slug}`;
}

/** Scans infra/data (and one level of subdirs) for PDFs not covered by the manifest. */
function findUnmanifestedPdfs(manifest: ManifestItem[], dataDir: string): ManifestItem[] {
  const coveredPaths = new Set(
    manifest
      .filter((m) => m.local_path)
      .map((m) => path.basename(m.local_path!).toLowerCase()),
  );

  const pdfs: string[] = [];
  const scanDir = (dir: string, depth = 0) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && depth === 0) {
        scanDir(full, 1); // one level of subdirs (e.g. папка с датой)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        if (!coveredPaths.has(entry.name.toLowerCase())) {
          pdfs.push(full);
        }
      }
    }
  };
  scanDir(dataDir);

  return pdfs.map((fp) => ({
    id: filenameToId(fp),
    title: path.basename(fp, ".pdf"),
    approved_for_rag: true,
    local_path: fp,
    source_type: "auto_scanned",
    source_url: null,
  }));
}

// ─── Text sanitization ────────────────────────────────────────────────────────

function sanitizeText(text: string): string {
  const repaired = detectMojibake(text) ? repairCp1251Mojibake(text) : text;

  return repaired
    .replace(/\x00/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\\([^nrtbfv0\\'"\`uUx\r\n])/g, "$1");
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

const CHUNK_TARGET_WORDS = 320;
const CHUNK_OVERLAP_WORDS = 40;
const CHUNK_HARD_MAX_WORDS = 400;

function chunkByParagraphs(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let bufferWords: string[] = [];

  const flush = () => {
    if (bufferWords.length === 0) return;
    chunks.push(bufferWords.join(" "));
    if (CHUNK_OVERLAP_WORDS > 0 && bufferWords.length > CHUNK_OVERLAP_WORDS) {
      bufferWords = bufferWords.slice(-CHUNK_OVERLAP_WORDS);
    } else {
      bufferWords = [];
    }
  };

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    if (bufferWords.length + words.length > CHUNK_TARGET_WORDS && bufferWords.length > 0) {
      flush();
    }
    bufferWords.push(...words);
    if (bufferWords.length >= CHUNK_TARGET_WORDS) {
      flush();
    }
  }
  if (bufferWords.length > 0) {
    chunks.push(bufferWords.join(" "));
  }

  return chunks
    .filter((c) => c.split(/\s+/).length >= 12)
    .map((c) => {
      const words = c.split(/\s+/);
      return words.length > CHUNK_HARD_MAX_WORDS
        ? words.slice(0, CHUNK_HARD_MAX_WORDS).join(" ")
        : c;
    });
}

// ─── HTML extraction ──────────────────────────────────────────────────────────

function extractTextFromHtml(html: string): string {
  const root = parseHtml(html, { blockTextElements: { script: false, style: false } });
  for (const sel of ["script", "style", "nav", "header", "footer", "noscript", "svg", "iframe"]) {
    root.querySelectorAll(sel).forEach((node) => node.remove());
  }
  const main = root.querySelector("article") ?? root.querySelector("main") ?? root;
  const raw = (main as unknown as { structuredText?: string }).structuredText ?? main.text;
  return raw.replace(/ /g, " ");
}

// PDF extraction is handled by infra/ingest/extractors.ts (cascade).

// ─── Theory.ts loader ─────────────────────────────────────────────────────────

async function loadTheoryBlocks(folder: string): Promise<TheoryBlock[]> {
  const folderRoot = path.join(
    REPO_ROOT,
    "apps",
    "web",
    "src",
    "components",
    "math-topic-content",
    folder,
  );
  for (const filename of ["theory.ts", "theory.tsx"]) {
    try {
      const source = readFileSync(path.join(folderRoot, filename), "utf-8");
      return parseTheoryBlocks(source);
    } catch {
      // try next extension
    }
  }
  return [];
}

export function parseTheoryBlocks(source: string): TheoryBlock[] {
  const blocks: TheoryBlock[] = [];
  const pattern =
    /title:\s*(['"`])([\s\S]*?)\1\s*,\s*body:\s*(['"`])([\s\S]*?)\3\s*,?\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const title = unescapeJsString(match[2]);
    const body = unescapeJsString(match[4]);
    if (title.trim() && body.trim()) {
      blocks.push({ title: title.trim(), body: body.trim() });
    }
  }
  return blocks;
}

function unescapeJsString(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, "\t")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\");
}

// ─── Manifest helpers ─────────────────────────────────────────────────────────

function loadManifest(): ManifestItem[] {
  const p = path.join(REPO_ROOT, "infra", "data", "rag_manifest.json");
  return JSON.parse(readFileSync(p, "utf-8")) as ManifestItem[];
}

function resolveLocalPath(localPath: string): string | null {
  const candidates = [
    path.resolve(REPO_ROOT, localPath),
    path.resolve(REPO_ROOT, "infra", "data", path.basename(localPath)),
  ];
  for (const c of candidates) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      // try next
    }
  }
  return null;
}

// ─── Source readers ───────────────────────────────────────────────────────────

interface SourceChunkBatch {
  source_id: string;
  source_title: string;
  topic_tags: string[];
  source_url: string | null;
  extraction_method?: ExtractionMethod;
  cyrillic_ratio?: number;
  chunks: { text: string; page_hint: string | null }[];
}

async function readManifestSource(item: ManifestItem): Promise<SourceChunkBatch | null> {
  if (!item.local_path) {
    console.warn(`[ingest] ${item.id}: no local_path`);
    return null;
  }
  const resolved = resolveLocalPath(item.local_path);
  if (!resolved) {
    console.warn(`[ingest] ${item.id}: file not found at ${item.local_path}`);
    return null;
  }
  const ext = path.extname(resolved).toLowerCase();
  let text: string;
  let extractionMethod: ExtractionMethod | undefined;
  let cyrillicRatio: number | undefined;

  if (ext === ".pdf") {
    try {
      const result = await extractPdfText(resolved);
      text = sanitizeText(result.text);
      extractionMethod = result.method;
      cyrillicRatio = result.cyrillicRatio;
      console.log(
        `[ingest] ${item.id}: PDF extracted via ${result.method}, ` +
          `cyrillic ratio ${(result.cyrillicRatio * 100).toFixed(1)}%`,
      );

      // Guard: if filename or title is Cyrillic but the extracted text has almost no
      // Cyrillic, the OCR mis-recognised the script (Apple Vision without ru-RU
      // language pack produces gibberish like "BBeAeHHe B anre6py"). Embedding
      // such text would poison the RAG index, so we skip the source entirely.
      const expectsRussian =
        /[А-Яа-яЁё]/.test(resolved) ||
        /[А-Яа-яЁё]/.test(item.title ?? "") ||
        /^kostry|^kostrik|^beklem|^gelfand|^shafarevich/i.test(item.id);
      if (expectsRussian && (result.cyrillicRatio ?? 0) < 0.1) {
        console.warn(
          `[ingest] ${item.id}: SKIPPED — expected Russian source but got ${(result.cyrillicRatio * 100).toFixed(1)}% Cyrillic. ` +
            `OCR likely mis-recognised the script. ` +
            `Fix: upgrade to macOS 13+ (Ventura) for native Russian Vision OCR, ` +
            `or install Tesseract with rus.traineddata: \`brew install tesseract tesseract-lang\`.`,
        );
        return null;
      }
    } catch (err) {
      console.warn(`[ingest] ${item.id}: PDF extraction failed:`, err instanceof Error ? err.message : err);
      return null;
    }
  } else if (ext === ".html" || ext === ".htm") {
    text = extractTextFromHtml(readFileSync(resolved, "utf-8"));
  } else {
    text = readFileSync(resolved, "utf-8");
  }
  const chunks = chunkByParagraphs(text);
  return {
    source_id: item.id,
    source_title: item.title,
    topic_tags:
      EXTERNAL_SOURCE_TOPIC_TAGS[item.id] ??
      (item.id.startsWith("auto_") ? inferTopicTags(item.local_path ?? item.id) : []),
    source_url: item.source_url ?? null,
    extraction_method: extractionMethod,
    cyrillic_ratio: cyrillicRatio,
    chunks: chunks.map((text, i) => ({
      text,
      page_hint: `chunk ${i + 1}`,
    })),
  };
}

async function readAuthoredSources(): Promise<SourceChunkBatch[]> {
  const root = path.join(REPO_ROOT, "apps", "web", "src", "components", "math-topic-content");
  const folders = readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name in TOPIC_FOLDER_LABEL);

  const batches: SourceChunkBatch[] = [];
  for (const folder of folders) {
    const blocks = await loadTheoryBlocks(folder);
    if (blocks.length === 0) {
      console.warn(`[ingest] mindflow_${folder}: no theory blocks parsed`);
      continue;
    }
    const label = TOPIC_FOLDER_LABEL[folder];
    batches.push({
      source_id: `mindflow_${folder}`,
      source_title: `MindFlow · ${label}`,
      topic_tags: [folder],
      source_url: `/subjects/mathematics/topics/${folder}`,
      chunks: blocks.map((b) => ({
        text: `${b.title}\n\n${b.body}`,
        page_hint: b.title,
      })),
    });
  }
  return batches;
}

// ─── Upsert (with batching to avoid statement timeout) ────────────────────────

const UPSERT_BATCH_SIZE = 50;

async function upsertChunks(rows: ChunkRow[]): Promise<void> {
  if (!config.auth.supabaseUrl || !config.auth.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const client = createClient(
    config.auth.supabaseUrl,
    config.auth.supabaseServiceRoleKey,
  );

  for (let start = 0; start < rows.length; start += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(start, start + UPSERT_BATCH_SIZE);
    const { error } = await client
      .from("rag_chunks")
      .upsert(batch, { onConflict: "source_id,chunk_index" });
    if (error) {
      throw new Error(
        `Supabase upsert failed at rows ${start}–${start + batch.length - 1}: ${error.message}`
      );
    }
    console.log(
      `[ingest]   flushed rows ${start + 1}–${Math.min(start + UPSERT_BATCH_SIZE, rows.length)} / ${rows.length}`
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  _resetLocalEmbedderForTesting();
  console.log(`[ingest] Local embedder: ${config.rag.localEmbedderModel}`);

  const manifest = loadManifest();
  const approved = manifest.filter((m) => m.approved_for_rag === true);

  // Auto-scan: pick up any PDFs in infra/data/ not already in the manifest
  const DATA_DIR = path.join(REPO_ROOT, "infra", "data");
  const autoItems = findUnmanifestedPdfs(manifest, DATA_DIR);
  if (autoItems.length > 0) {
    console.log(
      `[ingest] Auto-scan found ${autoItems.length} new PDF(s): ` +
        autoItems.map((m) => path.basename(m.local_path!)).join(", "),
    );
  }

  const externalBatches: SourceChunkBatch[] = [];
  for (const item of [...approved, ...autoItems]) {
    if (item.id.startsWith("mindflow_")) continue;
    const batch = await readManifestSource(item);
    if (batch) externalBatches.push(batch);
  }

  const authoredBatches = await readAuthoredSources();
  const batches = [...externalBatches, ...authoredBatches];

  let totalChunks = 0;
  for (const batch of batches) {
    if (batch.chunks.length === 0) {
      console.log(`[ingest] ${batch.source_id}: 0 chunks, skipping`);
      continue;
    }
    console.log(`[ingest] ${batch.source_id}: embedding ${batch.chunks.length} chunks`);
    const rows: ChunkRow[] = [];
    const chunkMeta: Record<string, unknown> | null =
      batch.extraction_method
        ? { extraction_method: batch.extraction_method, cyrillic_ratio: batch.cyrillic_ratio }
        : null;

    for (let i = 0; i < batch.chunks.length; i++) {
      const c = batch.chunks[i];
      const cleanText = sanitizeText(c.text);
      const embedding = await embedPassageLocal(cleanText);
      rows.push({
        source_id: batch.source_id,
        source_title: batch.source_title,
        chunk_index: i,
        chunk_text: cleanText,
        embedding,
        page_hint: c.page_hint,
        topic_tags: batch.topic_tags,
        source_url: batch.source_url,
        metadata: chunkMeta,
      });
    }
    await upsertChunks(rows);
    totalChunks += rows.length;
    console.log(`[ingest] ${batch.source_id}: upserted ${rows.length} chunks`);
  }

  console.log(`Done. Inserted ${totalChunks} chunks across ${batches.length} sources.`);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  main().catch((err) => {
    console.error("[ingest] failed:", err);
    process.exit(1);
  });
}

export { main, parseTheoryBlocks as _parseTheoryBlocksForTest, chunkByParagraphs as _chunkByParagraphsForTest, extractTextFromHtml as _extractTextFromHtmlForTest };
