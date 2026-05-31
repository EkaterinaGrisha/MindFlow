/**
 * sample_chunks.ts
 *
 * Pulls 20 random chunks per source from rag_chunks and writes them to
 * infra/reports/rag_quality_<date>.md.
 *
 * Use this as a "сэмплер" before and after ingest to visually verify that
 * Russian text is clean (no mojibake), chunks are the right length, and
 * topic_tags are assigned.
 *
 * Run:
 *   npx tsx infra/scripts/sample_chunks.ts
 *   npx tsx infra/scripts/sample_chunks.ts --source kostrykin_part1
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../../apps/api/src/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const REPORTS_DIR = path.join(REPO_ROOT, "infra", "reports");

const SAMPLES_PER_SOURCE = 20;

async function main() {
  if (!config.auth.supabaseUrl || !config.auth.supabaseServiceRoleKey) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
  }

  const client = createClient(
    config.auth.supabaseUrl,
    config.auth.supabaseServiceRoleKey,
  );

  // Optional single-source filter
  const sourceFilter = process.argv.find((a) => a.startsWith("--source="))?.slice(9) ??
    process.argv[process.argv.indexOf("--source") + 1];

  // Get all distinct source_ids
  let sourceIds: string[];
  if (sourceFilter) {
    sourceIds = [sourceFilter];
  } else {
    const { data, error } = await client
      .from("rag_chunks")
      .select("source_id")
      .limit(1000);
    if (error) throw new Error(error.message);
    sourceIds = [...new Set((data ?? []).map((r: { source_id: string }) => r.source_id))];
  }

  console.log(`\nSampling ${SAMPLES_PER_SOURCE} chunks from ${sourceIds.length} source(s)…\n`);

  const sections: string[] = [
    `# RAG Quality Sample — ${new Date().toISOString().slice(0, 10)}`,
    "",
    `Sources checked: ${sourceIds.join(", ")}`,
    "",
  ];

  let totalChunks = 0;
  let mojibakeCount = 0;

  for (const sid of sourceIds) {
    // Fetch all chunks for source, take a random sample
    const { data, error } = await client
      .from("rag_chunks")
      .select("chunk_index, chunk_text, page_hint, topic_tags, metadata")
      .eq("source_id", sid)
      .order("chunk_index", { ascending: true })
      .limit(500);

    if (error) {
      console.warn(`[sample] ${sid}: query failed — ${error.message}`);
      continue;
    }
    if (!data || data.length === 0) {
      console.log(`[sample] ${sid}: 0 chunks in DB — run ingest first`);
      continue;
    }

    // Random sample without replacement
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, SAMPLES_PER_SOURCE);

    // Detect leftover mojibake in any sample chunk
    const hasMojibake = (text: string) => {
      let mb = 0;
      for (const ch of text) {
        const c = ch.charCodeAt(0);
        if (c >= 0xc0 && c <= 0xff) mb++;
      }
      return mb / text.length > 0.15;
    };

    const meta = (data[0] as { metadata?: { extraction_method?: string; cyrillic_ratio?: number } | null }).metadata;
    const methodStr = meta?.extraction_method ?? "unknown";
    const ratioStr =
      meta?.cyrillic_ratio != null
        ? `${(meta.cyrillic_ratio * 100).toFixed(1)}%`
        : "—";

    sections.push(`## Source: \`${sid}\``);
    sections.push(`- Total chunks in DB: ${data.length}`);
    sections.push(`- Extraction method: \`${methodStr}\``);
    sections.push(`- Cyrillic ratio: ${ratioStr}`);
    sections.push(`- Sampled: ${sample.length}`);
    sections.push("");

    for (const chunk of sample) {
      const text = (chunk as { chunk_text: string }).chunk_text;
      const idx = (chunk as { chunk_index: number }).chunk_index;
      const hint = (chunk as { page_hint: string | null }).page_hint;
      const tags = ((chunk as { topic_tags: string[] }).topic_tags ?? []).join(", ");
      const words = text.split(/\s+/).length;
      const mb = hasMojibake(text);
      if (mb) mojibakeCount++;
      totalChunks++;

      sections.push(`### Chunk #${idx}${hint ? ` — ${hint}` : ""}${mb ? " ⚠️ MOJIBAKE" : ""}`);
      sections.push(`> tags: \`${tags || "—"}\` · words: ${words}`);
      sections.push("");
      // Show first 400 chars
      sections.push("```");
      sections.push(text.slice(0, 400) + (text.length > 400 ? "…" : ""));
      sections.push("```");
      sections.push("");
    }
  }

  sections.push("---");
  sections.push(
    `**Summary:** ${totalChunks} chunks sampled, ` +
      `${mojibakeCount > 0 ? `⚠️ ${mojibakeCount} with residual mojibake` : "✅ no mojibake detected"}.`,
  );

  mkdirSync(REPORTS_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const outPath = path.join(REPORTS_DIR, `rag_quality_${dateStr}.md`);
  writeFileSync(outPath, sections.join("\n"), "utf-8");

  console.log(`Done. Report: ${outPath}`);
  console.log(
    `Summary: ${totalChunks} chunks sampled, ` +
      (mojibakeCount > 0 ? `⚠️  ${mojibakeCount} with residual mojibake` : "✅  no mojibake detected"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
