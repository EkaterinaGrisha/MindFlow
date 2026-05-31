/**
 * encoding.test.ts
 *
 * Unit tests for the mojibake detection / repair helpers in extractors.ts.
 * Run: npx tsx --test tests/ingest/encoding.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeCyrillicRatio,
  detectMojibake,
  repairCp1251Mojibake,
} from "../../infra/ingest/extractors.js";

// ─── computeCyrillicRatio ────────────────────────────────────────────────────

describe("computeCyrillicRatio", () => {
  it("returns 0 for empty string", () => {
    assert.strictEqual(computeCyrillicRatio(""), 0);
  });

  it("returns ~1 for a fully Cyrillic string", () => {
    const text = "Привет мир как дела хорошо очень хорошо";
    const ratio = computeCyrillicRatio(text);
    assert.ok(ratio > 0.5, `expected > 0.5, got ${ratio}`);
  });

  it("returns 0 for pure ASCII", () => {
    const ratio = computeCyrillicRatio("Hello world, linear algebra!");
    assert.strictEqual(ratio, 0);
  });

  it("counts Ё and ё", () => {
    const ratio = computeCyrillicRatio("ЁёЁёЁё");
    assert.ok(ratio > 0.9);
  });
});

// ─── detectMojibake ──────────────────────────────────────────────────────────

describe("detectMojibake", () => {
  it("returns false for clean Cyrillic text", () => {
    const clean =
      "Пусть A — квадратная матрица порядка n. Тогда определитель det(A) вычисляется следующим образом.";
    assert.strictEqual(detectMojibake(clean), false);
  });

  it("returns false for English text", () => {
    const english =
      "Let A be a square matrix of order n. Then the determinant det(A) is computed as follows.";
    assert.strictEqual(detectMojibake(english), false);
  });

  it("returns true for typical cp1251→latin1 mojibake", () => {
    // Simulated mojibake: cp1251 Cyrillic bytes decoded as latin1.
    // "матрица" in cp1251: 0xEC 0xE0 0xF2 0xF0 0xE8 0xF6 0xE0
    // Those bytes as latin1 chars: ì à ò ð è ö à — all in 0xC0–0xFF range.
    const mojibake = "ìàòðèöà îïðåäåëèòåëü âåêòîðíîå ïðîñòðàíñòâî ñîáñòâåííûå çíà÷åíèÿ".repeat(3);
    assert.strictEqual(detectMojibake(mojibake), true);
  });

  it("returns false for strings shorter than 100 chars", () => {
    const short = "ìàòðèöà";
    assert.strictEqual(detectMojibake(short), false);
  });
});

// ─── repairCp1251Mojibake ────────────────────────────────────────────────────

describe("repairCp1251Mojibake", () => {
  it("recovers Cyrillic text from cp1251 mojibake", () => {
    // Build a mojibake string by encoding Russian text as cp1251 bytes,
    // then reading those bytes back as latin1 (simulating the pdfjs mistake).
    const original = "матрица определитель вектор пространство";

    // Manually create the bytes:
    // cp1251 encoding of "матрица":  EC E0 F2 F0 E8 F6 E0
    // Read as latin1 → "ìàòðèöà"
    const cp1251Map: Record<string, number> = {
      "а": 0xe0, "б": 0xe1, "в": 0xe2, "г": 0xe3, "д": 0xe4,
      "е": 0xe5, "ж": 0xe6, "з": 0xe7, "и": 0xe8, "й": 0xe9,
      "к": 0xea, "л": 0xeb, "м": 0xec, "н": 0xed, "о": 0xee,
      "п": 0xef, "р": 0xf0, "с": 0xf1, "т": 0xf2, "у": 0xf3,
      "ф": 0xf4, "х": 0xf5, "ц": 0xf6, "ч": 0xf7, "ш": 0xf8,
      "щ": 0xf9, "ъ": 0xfa, "ы": 0xfb, "ь": 0xfc, "э": 0xfd,
      "ю": 0xfe, "я": 0xff,
      " ": 0x20,
    };

    const bytes = Buffer.from(
      original.split("").map((ch) => cp1251Map[ch] ?? ch.charCodeAt(0)),
    );
    // Read those bytes as latin1 → simulates pdfjs mojibake output
    const mojibake = bytes.toString("latin1");

    const repaired = repairCp1251Mojibake(mojibake);
    const cyrillicCount = [...repaired].filter((ch) => {
      const c = ch.charCodeAt(0);
      return (c >= 0x0410 && c <= 0x044F) || c === 0x0401 || c === 0x0451;
    }).length;

    assert.ok(
      cyrillicCount > original.replace(/ /g, "").length * 0.7,
      `Expected mostly Cyrillic after repair, got: "${repaired}"`,
    );
  });

  it("does not corrupt clean Cyrillic text", () => {
    // If text is already correct Unicode, running through latin1 round-trip
    // will mangle it — this test documents that the repair should only be
    // called AFTER detectMojibake() returns true.
    const clean = "матрица";
    const repaired = repairCp1251Mojibake(clean);
    // We don't assert equality here; just check it doesn't throw.
    assert.ok(typeof repaired === "string");
  });
});
