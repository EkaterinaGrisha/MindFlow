/**
 * diagnose_pdf_encoding.ts
 *
 * Diagnostic script for Russian academic PDFs.
 * For each PDF in infra/data/ it prints a table:
 *
 *   File                   | Method           | Cyrillic% | Mojibake% | Status
 *   Кострыкин_Часть1.pdf   | unpdf+mojibake   | 72.3%     | 0.1%      | ✅ OK
 *   Hefferon.pdf           | unpdf            | 0.0%      | 0.0%      | ✅ OK (English)
 *
 * Run:
 *   npx tsx infra/scripts/diagnose_pdf_encoding.ts
 *
 * The output is also written to infra/reports/pdf_encoding_<date>.md
 * for the defence report artefact.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractPdfText,
  computeCyrillicRatio,
  detectMojibake,
} from "../ingest/extractors.js";

const execFileAsync = promisify(execFile);

async function preflightPyMuPdf(): Promise<{ ok: boolean; message: string }> {
  try {
    const { stdout } = await execFileAsync("python3", [
      "-c",
      "import fitz; print(fitz.__version__)",
    ]);
    return { ok: true, message: `✅ PyMuPDF ${stdout.trim()} найден` };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string };
    if (e.code === "ENOENT") {
      return { ok: false, message: "❌ python3 не найден на PATH. Установи Python 3." };
    }
    if ((e.stderr ?? "").includes("ModuleNotFoundError") || (e.stderr ?? "").includes("No module")) {
      return {
        ok: false,
        message:
          "❌ PyMuPDF не установлен. Запусти:  pip3 install pymupdf  (или python3 -m pip install pymupdf)",
      };
    }
    return { ok: false, message: `❌ PyMuPDF недоступен: ${(e.stderr ?? e.message ?? "").trim()}` };
  }
}

interface PyMuPdfDiag {
  charCount: number;
  scannedPages: number;
  totalPages: number;
  isScanned: boolean;
}

/** Run PyMuPDF directly in --debug mode to see raw extraction details. */
async function debugPyMuPdf(pdfPath: string): Promise<PyMuPdfDiag> {
  try {
    const { stdout, stderr } = await execFileAsync(
      "python3",
      [PYMUPDF_SCRIPT, pdfPath, "--debug"],
      { maxBuffer: 50 * 1024 * 1024, encoding: "utf-8" },
    );
    const charCount = stdout.length;
    const scannedPages = (stderr.match(/SCANNED PAGE/g) ?? []).length;
    const pagesMatch = stderr.match(/^Pages: (\d+)/m);
    const totalPages = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
    const isScanned = totalPages > 0 && scannedPages / totalPages > 0.5;

    if (isScanned) {
      console.log(
        `    📷 СКАН: ${scannedPages}/${totalPages} страниц без текстового слоя — нужен OCR`,
      );
      console.log(
        `    PyMuPDF собрал ${charCount} символов (вероятно — номера страниц)`,
      );
    } else {
      console.log(`    PyMuPDF direct: ${charCount} chars extracted (scanned ${scannedPages}/${totalPages})`);
      if (charCount > 0) {
        console.log(`    Preview: ${stdout.trim().slice(0, 200).replace(/\n/g, " ")}`);
      }
    }
    return { charCount, scannedPages, totalPages, isScanned };
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    console.log(`    PyMuPDF direct FAILED: ${(e.stderr ?? e.message ?? "").toString().slice(0, 200)}`);
    return { charCount: 0, scannedPages: 0, totalPages: 0, isScanned: false };
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(REPO_ROOT, "infra", "data");
const REPORTS_DIR = path.join(REPO_ROOT, "infra", "reports");
const PYMUPDF_SCRIPT = path.resolve(__dirname, "..", "scripts", "extract_pdf_pymupdf.py");

interface Row {
  file: string;
  method: string;
  cyrillicPct: string;
  mojibakePct: string;
  status: string;
  charCount: number;
}

function computeMojibakePct(text: string): number {
  if (!text || text.length < 10) return 0;
  let mojibake = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 0xc0 && c <= 0xff) mojibake++;
  }
  return mojibake / text.length;
}

async function analyseFile(filePath: string): Promise<Row> {
  const fileName = path.basename(filePath);
  console.log(`  Analysing: ${fileName} …`);

  try {
    const result = await extractPdfText(filePath);
    const cyrillic = computeCyrillicRatio(result.text);
    const mojibake = computeMojibakePct(result.text);
    const charCount = result.text.length;

    let status: string;
    if (result.method === "failed" || charCount < 100) {
      // PyMuPDF is installed but still failed — run debug extraction to diagnose why
      console.log(`    ↳ cascade returned 0 chars — running PyMuPDF directly to diagnose:`);
      const diag = await debugPyMuPdf(filePath);
      if (diag.isScanned) {
        status = `📷 СКАН ${diag.scannedPages}/${diag.totalPages} стр. — нужен OCR (Tesseract)`;
      } else {
        status = "❌ FAILED — см. отладку выше";
      }
    } else if (cyrillic >= 0.15) {
      status = `✅ OK (${charCount.toLocaleString()} chars)`;
    } else if (cyrillic >= 0.05) {
      status = "⚠️  СЛАБО — мало кириллицы, проверь визуально";
    } else if (mojibake > 0.1) {
      status = "❌ MOJIBAKE — поставь PyMuPDF: pip3 install pymupdf";
    } else {
      // English PDF or non-Cyrillic — OK
      status = `✅ OK не-кир (${charCount.toLocaleString()} chars)`;
    }

    return {
      file: fileName,
      method: result.method,
      cyrillicPct: `${(cyrillic * 100).toFixed(1)}%`,
      mojibakePct: `${(mojibake * 100).toFixed(1)}%`,
      status,
      charCount,
    };
  } catch (err) {
    return {
      file: fileName,
      method: "ERROR",
      cyrillicPct: "—",
      mojibakePct: "—",
      status: `❌ ${err instanceof Error ? err.message : String(err)}`,
      charCount: 0,
    };
  }
}

function padEnd(s: string, n: number) {
  return s.length >= n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
}

async function main() {
  const pdfFiles = readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(DATA_DIR, f));

  if (pdfFiles.length === 0) {
    console.log(`No PDF files found in ${DATA_DIR}.`);
    console.log("Copy PDFs to infra/data/ first (they are gitignored — do not commit).");
    process.exit(0);
  }

  console.log(`\nDiagnosing ${pdfFiles.length} PDF(s) in ${DATA_DIR}\n`);

  // Preflight: проверь, что PyMuPDF (главный fallback для русских PDF) доступен.
  const pre = await preflightPyMuPdf();
  console.log(pre.message);
  if (!pre.ok) {
    console.log(
      "    Без PyMuPDF русские PDF Кострыкина / Беклемишева не извлекутся (ToUnicode битый).\n",
    );
  } else {
    console.log("");
  }

  const rows: Row[] = [];
  for (const fp of pdfFiles) {
    rows.push(await analyseFile(fp));
  }

  // ── Console table ──────────────────────────────────────────────────────────
  const W = [38, 16, 10, 10, 60];
  const header = [
    padEnd("Файл", W[0]),
    padEnd("Метод", W[1]),
    padEnd("Кирилл.", W[2]),
    padEnd("Mojibake", W[3]),
    padEnd("Статус", W[4]),
  ].join(" | ");

  const divider = W.map((w) => "-".repeat(w)).join("-+-");
  console.log(header);
  console.log(divider);

  for (const r of rows) {
    console.log(
      [
        padEnd(r.file, W[0]),
        padEnd(r.method, W[1]),
        padEnd(r.cyrillicPct, W[2]),
        padEnd(r.mojibakePct, W[3]),
        padEnd(r.status, W[4]),
      ].join(" | "),
    );
  }

  // ── Markdown report ────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().slice(0, 10);
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `pdf_encoding_${dateStr}.md`);

  const md = [
    `# Диагностика кодировки PDF — ${dateStr}`,
    "",
    "| Файл | Метод | Кирилл. % | Mojibake % | Статус |",
    "|------|-------|-----------|------------|--------|",
    ...rows.map(
      (r) =>
        `| ${r.file} | \`${r.method}\` | ${r.cyrillicPct} | ${r.mojibakePct} | ${r.status} |`,
    ),
    "",
    `Итого: ${rows.length} файл(ов). ` +
      `Готовых (✅): ${rows.filter((r) => r.status.startsWith("✅")).length}. ` +
      `Проблемных: ${rows.filter((r) => r.status.startsWith("❌") || r.status.startsWith("⚠️")).length}.`,
    "",
    "> Сгенерировано: `npx tsx infra/scripts/diagnose_pdf_encoding.ts`",
  ].join("\n");

  writeFileSync(reportPath, md, "utf-8");
  console.log(`\nReport written to: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
