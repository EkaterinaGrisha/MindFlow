/**
 * ragQualityGate.ts
 *
 * Post-retrieval filter that drops chunks whose text looks like broken OCR.
 * Symptom: cyrillic glyphs misrecognised as latin look-alikes, producing words
 * like "BHuHclleHHe" (all latin + chaotic case), "co6cTBeHHbIX" (digit-in-word),
 * "TtopfiJtKa" (chaotic case). All-latin, no cyrillic — so a "latin+cyrillic
 * within one word" check misses it. The real signal is **chaotic structure
 * inside latin tokens**.
 *
 * Root cause should be fixed at ingest (infra/ingest/extractors.ts), but
 * broken chunks already in rag_chunks need a runtime safety net.
 */

const WORD_SPLIT = /[\s,.;:!?()«»"'\[\]{}+\-—–=*/<>№§]+/;

/**
 * Returns true when text contains too many garbled-OCR tokens.
 *
 * A token is "garbled" if any of:
 *   1. Contains both latin and cyrillic letters (frankenword like "PСА") — rare in real text
 *   2. Latin word with a digit between letters (digit not at start/end): "co6cTBeHHbIX"
 *   3. Length ≥ 5, no cyrillic, ≥ 3 case-switches between upper and lower: "BHuHclleHHe", "TtopfiJtKa"
 *
 * Threshold: >18 % of words ≥ 4 chars look garbled → drop the chunk.
 *
 * Threshold tuned against the auto_gelfand1971ru corpus (≈ 70 % garbled tokens)
 * vs clean Kostrikin / Hefferon / mixed legitimate RU-EN text (< 5 %).
 */
export function looksLikeGarbledOcr(text: string): boolean {
  if (!text || text.length < 50) return false;

  const words = text
    .split(WORD_SPLIT)
    .map((w) => w.replace(/[^A-Za-zА-Яа-яЁё0-9]/g, ""))
    .filter((w) => w.length >= 4);
  if (words.length < 10) return false;

  let garbled = 0;
  for (const w of words) {
    const hasCyr = /[А-Яа-яЁё]/.test(w);
    const hasLat = /[A-Za-z]/.test(w);

    // Rule 1: cyrillic + latin in same word
    if (hasCyr && hasLat) {
      garbled++;
      continue;
    }

    // Rule 2: latin word with digit between letters (digit not at edges)
    if (!hasCyr && /[A-Za-z][0-9]+[A-Za-z]/.test(w)) {
      garbled++;
      continue;
    }

    // Rule 3: latin-only word ≥ 5 chars with ≥ 3 case-switches.
    // Normal English: 0-1 switches per word. OCR mush: 3-10.
    if (!hasCyr && hasLat && w.length >= 5 && !/[0-9]/.test(w)) {
      let switches = 0;
      for (let i = 1; i < w.length; i++) {
        const a = w[i - 1];
        const b = w[i];
        if (/[A-Z]/.test(a) && /[a-z]/.test(b)) switches++;
        else if (/[a-z]/.test(a) && /[A-Z]/.test(b)) switches++;
        if (switches >= 3) break;
      }
      if (switches >= 3) {
        garbled++;
        continue;
      }
    }
  }

  return garbled / words.length > 0.18;
}

/**
 * Filters out garbled chunks from a retrieval candidate list.
 * Logs counts grouped by source_id — silent filtering hides corpus issues.
 */
export function filterGarbledChunks<T extends { chunk_id: string; text: string; source_id: string }>(
  chunks: T[],
): T[] {
  const kept: T[] = [];
  const dropped: { chunk_id: string; source_id: string }[] = [];
  for (const c of chunks) {
    if (looksLikeGarbledOcr(c.text)) {
      dropped.push({ chunk_id: c.chunk_id, source_id: c.source_id });
    } else {
      kept.push(c);
    }
  }
  if (dropped.length > 0) {
    const bySource = new Map<string, number>();
    for (const d of dropped) bySource.set(d.source_id, (bySource.get(d.source_id) ?? 0) + 1);
    const summary = [...bySource.entries()].map(([s, n]) => `${s}:${n}`).join(", ");
    console.warn(
      `[rag-quality-gate] dropped ${dropped.length}/${chunks.length} garbled chunks (${summary})`,
    );
  }
  return kept;
}
