/**
 * reembed_to_new_column.ts
 *
 * Re-embed every chunk in rag_chunks using the current local embedder
 * (configured via config.rag.localEmbedderModel — set to Qwen3-Embedding-0.6B)
 * and write into the rag_chunks.embedding_new column added by migration 024.
 *
 * This does NOT re-download PDFs, re-OCR, or re-chunk — text is fixed.
 * Only the vectors change.
 *
 * After this completes and is verified, a follow-up migration will:
 *   - DROP COLUMN embedding (the old 384D column)
 *   - ALTER TABLE rag_chunks RENAME COLUMN embedding_new TO embedding
 *   - Update hybrid_search_chunks and match_chunks RPCs accordingly.
 *
 * Run:
 *   npx tsx infra/scripts/reembed_to_new_column.ts [--batch=32] [--resume]
 *
 * The script is idempotent — chunks whose embedding_new is already non-null
 * are skipped. So you can stop and resume freely.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "../../apps/api/src/config";
import { embedPassageLocal } from "../../apps/api/src/llm/localEmbedder";

const BATCH_SIZE = parseInt(process.argv.find((a) => a.startsWith("--batch="))?.slice(8) ?? "32", 10);
const PAGE_SIZE = 200;

interface ChunkRow {
  id: string;
  chunk_text: string;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  const supabase = createClient(url, key);

  console.log(`[reembed] model: ${config.rag.localEmbedderModel}`);
  console.log(`[reembed] batch=${BATCH_SIZE}, page=${PAGE_SIZE}`);

  // Total to do
  const { count: totalToDo } = await supabase
    .from("rag_chunks")
    .select("*", { count: "exact", head: true })
    .is("embedding_new", null);

  if (totalToDo === 0) {
    console.log("[reembed] nothing to do — every chunk already has embedding_new");
    return;
  }
  console.log(`[reembed] ${totalToDo} chunks pending`);

  const t0 = Date.now();
  let done = 0;

  while (true) {
    // Fetch a page of chunks that don't yet have a new embedding.
    // No OFFSET — we always grab the next batch with embedding_new IS NULL,
    // so as we fill them in, the queue naturally drains.
    const { data, error } = await supabase
      .from("rag_chunks")
      .select("id, chunk_text")
      .is("embedding_new", null)
      .limit(PAGE_SIZE);

    if (error) throw error;
    if (!data || data.length === 0) break;

    const rows = data as ChunkRow[];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      // Embed sequentially within batch — local embedder is single-pipeline
      // and doesn't benefit from JS-level parallelism.
      for (const row of batch) {
        const vec = await embedPassageLocal(row.chunk_text);
        if (vec.length !== 1024) {
          throw new Error(
            `Unexpected embedding length ${vec.length} for chunk ${row.id} — expected 1024`,
          );
        }

        // Retry transient network errors (UND_ERR_SOCKET etc.) — Supabase REST
        // can drop a connection on long runs. Don't retry validation errors.
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 5; attempt++) {
          const { error: updErr } = await supabase
            .from("rag_chunks")
            .update({ embedding_new: vec })
            .eq("id", row.id);
          if (!updErr) {
            lastErr = null;
            break;
          }
          lastErr = updErr;
          const msg = updErr.message ?? String(updErr);
          // Only retry network-level errors
          if (!/fetch failed|SocketError|ECONNRESET|UND_ERR/i.test(msg)) {
            throw updErr;
          }
          const delayMs = 1000 * attempt;
          console.warn(`[reembed]   update retry ${attempt}/5 for ${row.id}: ${msg} — sleeping ${delayMs}ms`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
        if (lastErr) throw lastErr;

        done++;
      }

      const elapsed = (Date.now() - t0) / 1000;
      const rate = done / elapsed;
      const eta = totalToDo ? (totalToDo - done) / rate : 0;
      console.log(
        `[reembed] ${done}/${totalToDo}  ` +
          `rate=${rate.toFixed(2)} chunks/s  ` +
          `elapsed=${elapsed.toFixed(0)}s  ` +
          `ETA=${eta.toFixed(0)}s`,
      );
    }
  }

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`[reembed] Done. ${done} chunks in ${elapsed.toFixed(0)}s`);
}

main().catch((err) => {
  console.error("[reembed] FAILED:", err);
  process.exit(1);
});
