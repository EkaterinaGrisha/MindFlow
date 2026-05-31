/**
 * extractors.ts
 *
 * Cascade PDF text extractor for Russian academic PDFs.
 *
 * Cascade order (each step kept only if it produces non-empty text):
 *   A. unpdf (pdfjs)        — fast, fine for clean modern PDFs
 *   B. mojibake repair      — Buffer.from(s,'latin1') → iconv win1251
 *   C. PyMuPDF (Python)     — best for FIZMATLIT books with broken ToUnicode
 *                             tables (Kostrikin etc.) — handled by
 *                             infra/scripts/extract_pdf_pymupdf.py
 *   D. pdftotext (poppler)  — last-resort CLI fallback
 *
 * Picks the candidate with the highest Cyrillic ratio. For English PDFs
 * (Hefferon, MIT 18.06) ratio is naturally 0 and we keep the unpdf result
 * because it's first and longest.
 *
 * Result includes `method` and `cyrillicRatio` for diagnostics — stored
 * in rag_chunks.metadata for the defence report.
 */

import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";
import iconv from "iconv-lite";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYMUPDF_SCRIPT = path.resolve(__dirname, "..", "scripts", "extract_pdf_pymupdf.py");
const APPLEVISION_SCRIPT = path.resolve(__dirname, "..", "scripts", "extract_pdf_applevision.py");

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtractionMethod =
  | "unpdf"
  | "unpdf+mojibake"
  | "pymupdf"
  | "pdftotext"
  | "applevision"
  | "failed";

export interface ExtractionResult {
  text: string;
  method: ExtractionMethod;
  cyrillicRatio: number;
}

// ─── Cyrillic / mojibake detection ───────────────────────────────────────────

export function computeCyrillicRatio(text: string): number {
  if (!text || text.length < 10) return 0;
  let cyrillic = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    // Cyrillic block U+0410–U+044F, plus Ё/ё U+0401/U+0451
    if ((c >= 0x0410 && c <= 0x044F) || c === 0x0401 || c === 0x0451) cyrillic++;
  }
  return cyrillic / text.length;
}

/**
 * Returns true when extracted text looks like CP1251 mojibake:
 * > 30 % of alpha chars are in the Latin Extended range 0xC0–0xFF
 * (which is how CP1251 Cyrillic bytes look when decoded as Latin-1),
 * and < 5 % are actual Cyrillic.
 */
export function detectMojibake(text: string): boolean {
  if (text.length < 100) return false;
  let mojibake = 0;
  let cyrillic = 0;
  let latin = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if ((c >= 0x0410 && c <= 0x044F) || c === 0x0401 || c === 0x0451) cyrillic++;
    else if (c >= 0xc0 && c <= 0xff) mojibake++; // Latin Ext — cp1252 zone
    else if ((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)) latin++;
  }
  const alpha = cyrillic + mojibake + latin;
  if (alpha < 50) return false;
  return mojibake / alpha > 0.3 && cyrillic / alpha < 0.05;
}

/**
 * Repairs CP1251 mojibake: the string was decoded as Latin-1 (one byte
 * per char), so we reverse that and decode as Windows-1251.
 */
export function repairCp1251Mojibake(text: string): string {
  const bytes = Buffer.from(text, "latin1");
  return iconv.decode(bytes, "win1251");
}

// ─── Individual extractors ───────────────────────────────────────────────────

async function extractViaUnpdf(pdfPath: string): Promise<string> {
  const buffer = readFileSync(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return Array.isArray(text) ? text.join("\n\n") : text;
}

/**
 * Calls `pdftotext` (poppler-utils). On Mac install with `brew install poppler`,
 * on Linux with `apt install poppler-utils`. Logs the actual error so we know
 * why it failed (not on PATH vs. parse error vs. encrypted PDF).
 */
async function extractViaPdftotext(pdfPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "pdftotext",
      ["-enc", "UTF-8", "-layout", pdfPath, "-"],
      { maxBuffer: 100 * 1024 * 1024 },
    );
    return stdout;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[extractor] pdftotext failed for ${path.basename(pdfPath)}: ${msg}`);
    return null;
  }
}

/**
 * Calls the Python helper that uses PyMuPDF (fitz). Best for Russian PDFs
 * with broken ToUnicode tables — PyMuPDF reconstructs glyph mappings.
 *
 * Requires `pip install pymupdf` on the host machine. If python3 or pymupdf
 * is missing we log the actual error (exit 2 = pymupdf missing).
 */
async function extractViaPyMuPdf(pdfPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "python3",
      [PYMUPDF_SCRIPT, pdfPath],
      { maxBuffer: 100 * 1024 * 1024, encoding: "utf-8" },
    );
    return stdout;
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string; code?: number | string };
    const stderr = (e.stderr ?? "").toString().trim();
    const code = e.code;
    if (code === "ENOENT") {
      console.warn(
        `[extractor] python3 not found on PATH — skipping PyMuPDF. ` +
          `Install Python 3 to enable PyMuPDF fallback.`,
      );
    } else if (String(code) === "2") {
      console.warn(
        `[extractor] PyMuPDF not installed. Run: pip install pymupdf`,
      );
    } else {
      console.warn(
        `[extractor] PyMuPDF failed for ${path.basename(pdfPath)}: ${stderr || e.message}`,
      );
    }
    return null;
  }
}

/**
 * Heuristic: text looks like a real English (or otherwise Latin-script) PDF
 * — mostly latin letters, low symbol/control noise. Used so we don't trigger
 * extra fallbacks for Hefferon / MIT notes just because cyrillic ratio is 0.
 */
function isLikelyMeaningfulLatin(text: string): boolean {
  if (text.length < 500) return false;
  let latin = 0;
  let printable = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if ((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)) latin++;
    if (c >= 0x20 && c <= 0x7e) printable++;
  }
  return printable > 200 && latin / printable > 0.4;
}

/**
 * macOS-only: uses Apple Vision framework (same engine as Live Text) to OCR
 * scanned PDF pages. Requires pip3 install pyobjc-framework-Vision pymupdf.
 * Returns null on non-macOS or when dependencies are missing.
 *
 * Writes OCR output to a temp file and reads it back, so 500K+ char results
 * don't have to round-trip through stdout buffers.
 */
async function extractViaAppleVision(pdfPath: string): Promise<string | null> {
  if (process.platform !== "darwin") return null;

  const { mkdtempSync, readFileSync, unlinkSync, rmdirSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const tmpDir = mkdtempSync(path.join(tmpdir(), "applevision-"));
  const outputPath = path.join(tmpDir, "ocr.txt");

  // If filename is Cyrillic, require Russian support; the script will exit 4
  // immediately if macOS lacks ru-RU instead of producing English-OCR garbage.
  const expectsRussian = /[А-Яа-яЁё]/.test(path.basename(pdfPath));
  const args = [APPLEVISION_SCRIPT, pdfPath, "--output", outputPath];
  if (expectsRussian) args.push("--require-language", "ru-RU");

  try {
    const { stderr } = await execFileAsync(
      "python3",
      args,
      { maxBuffer: 50 * 1024 * 1024, encoding: "utf-8", timeout: 30 * 60 * 1000 },
    );
    if (stderr.trim()) process.stderr.write(stderr);
    try {
      return readFileSync(outputPath, "utf-8");
    } catch {
      return null;
    }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string; code?: number | string };
    const stderr = (e.stderr ?? "").toString().trim();
    if (e.code === "ENOENT") {
      console.warn(`[extractor] python3 not found — skipping Apple Vision OCR.`);
    } else if (e.code === 4) {
      console.warn(
        `[extractor] Skipped Apple Vision for ${path.basename(pdfPath)}: ` +
          `Russian OCR not available on this macOS. ` +
          `Upgrade to Ventura+ or install Tesseract (brew install tesseract tesseract-lang).`,
      );
    } else if (stderr.includes("pyobjc-framework-Vision")) {
      console.warn(
        `[extractor] Apple Vision bindings missing. Run: pip3 install pyobjc-framework-Vision`,
      );
    } else {
      console.warn(
        `[extractor] Apple Vision OCR failed for ${path.basename(pdfPath)}: ${stderr.slice(-500) || e.message}`,
      );
    }
    // Even on error, the script may have written partial output to the file
    try {
      const partial = readFileSync(outputPath, "utf-8");
      if (partial.length > 50) {
        console.warn(`[extractor]   recovered ${partial.length} chars from partial output`);
        return partial;
      }
    } catch {
      // no file
    }
    return null;
  } finally {
    try { unlinkSync(outputPath); } catch {}
    try { rmdirSync(tmpDir); } catch {}
  }
}

// ─── Cascade ─────────────────────────────────────────────────────────────────

/**
 * Extracts text from a PDF trying multiple methods in order and returning
 * the result with the highest Cyrillic character ratio. For English PDFs
 * (Cyrillic ratio = 0) the longest meaningful candidate wins.
 *
 * Usage:
 *   const { text, method, cyrillicRatio } = await extractPdfText(path);
 *   // store method + cyrillicRatio in rag_chunks.metadata
 */
export async function extractPdfText(pdfPath: string): Promise<ExtractionResult> {
  const candidates: { text: string; method: ExtractionMethod }[] = [];

  // ── A: unpdf ──────────────────────────────────────────────────────────────
  let rawText = "";
  try {
    rawText = await extractViaUnpdf(pdfPath);
    if (rawText.trim().length > 50) candidates.push({ text: rawText, method: "unpdf" });
  } catch (err) {
    console.warn(
      `[extractor] unpdf failed: ${err instanceof Error ? err.message : err}`,
    );
  }

  // ── B: mojibake repair ────────────────────────────────────────────────────
  if (detectMojibake(rawText)) {
    const repaired = repairCp1251Mojibake(rawText);
    if (repaired.trim().length > 50) {
      candidates.push({ text: repaired, method: "unpdf+mojibake" });
    }
  }

  // After A+B: do we already have a usable result? Either lots of Cyrillic
  // OR clearly meaningful Latin text (English PDF case).
  const hasGoodCandidate = () =>
    candidates.some(
      (c) =>
        c.text.length > 1000 &&
        (computeCyrillicRatio(c.text) > 0.15 || isLikelyMeaningfulLatin(c.text)),
    );

  // ── C: PyMuPDF (Python) — best for FIZMATLIT books ────────────────────────
  if (!hasGoodCandidate()) {
    const py = await extractViaPyMuPdf(pdfPath);
    if (py && py.trim().length > 50) {
      candidates.push({ text: py, method: "pymupdf" });
    }
  }

  // ── D: pdftotext (poppler) — last resort ──────────────────────────────────
  if (!hasGoodCandidate()) {
    const pt = await extractViaPdftotext(pdfPath);
    if (pt && pt.trim().length > 50) {
      candidates.push({ text: pt, method: "pdftotext" });
    }
  }

  // ── E: Apple Vision OCR — macOS only, for scanned PDFs ────────────────────
  // Only runs when all text-based methods failed (scanned images).
  if (!hasGoodCandidate() && process.platform === "darwin") {
    console.log(`[extractor] ${path.basename(pdfPath)}: trying Apple Vision OCR (may take a few minutes)…`);
    const av = await extractViaAppleVision(pdfPath);
    if (av && av.trim().length > 50) {
      candidates.push({ text: av, method: "applevision" });
    }
  }

  if (candidates.length === 0) {
    return { text: "", method: "failed", cyrillicRatio: 0 };
  }

  // Pick the best:
  //   1. Highest Cyrillic ratio (clear winner if > 5 % gap)
  //   2. On a near-tie, take the longest text — typically more complete
  let best = candidates[0];
  for (const c of candidates.slice(1)) {
    const cR = computeCyrillicRatio(c.text);
    const bR = computeCyrillicRatio(best.text);
    if (cR > bR + 0.05) best = c;
    else if (Math.abs(cR - bR) < 0.05 && c.text.length > best.text.length) best = c;
  }

  const ratio = computeCyrillicRatio(best.text);
  return { text: best.text, method: best.method, cyrillicRatio: ratio };
}
