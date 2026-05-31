/**
 * extractRichTsx.ts
 *
 * Extract clean human text from theory-rich.tsx files for RAG ingestion.
 *
 * theory-rich.tsx files are React components that render long-form authored
 * theory pages with custom styling. The plain `parseTheoryBlocks` regex in
 * ingest.ts only handles theory.ts files (which export `{title, body}[]`),
 * so the much richer rich-tsx content was excluded from RAG.
 *
 * Strategy:
 *   1. Parse the .tsx source via the TypeScript compiler API
 *   2. Walk the AST collecting text-bearing nodes:
 *      - JsxText nodes (literal text between JSX tags)
 *      - String/template literals that appear as JSX children
 *        (e.g. `{'некоторая строка'}` inside JSX)
 *      - String values of "content" JSX attributes (title, label,
 *        content, definition, formula — see CONTENT_ATTRS)
 *   3. Skip everything else: style objects, className, icons, callbacks,
 *      Tailwind colors, hex codes, numeric props.
 *   4. Group sequential text into blocks separated by SectionHeader-like
 *      components (heuristic: any JSX element whose tag contains "Header"
 *      or "Title" starts a new block).
 *
 * Result: TheoryBlock[] with the same shape as the regular theory.ts parser.
 */

import ts from "typescript";
import { readFileSync } from "node:fs";

export interface TheoryBlock {
  title: string;
  body: string;
}

// Attribute names whose string values are real content (not styling/refs).
const CONTENT_ATTRS = new Set([
  "title",
  "label",
  "subtitle",
  "heading",
  "caption",
  "content",
  "text",
  "description",
  "definition",
  "formula",
  "question",
  "answer",
  "hint",
  "explanation",
  "note",
  "summary",
  "body",
]);

// Heuristic: which JSX elements start a new block.
// Headers in MindFlow rich-tsx are typically <SectionHeader title="..." />,
// but also custom components like ConceptCard, DefinitionCard, etc.
const HEADER_LIKE = /(Header|Title|Section|Chapter|Step\d+|Card|Concept|Definition|Theorem|Example|Block)/;

interface Span {
  kind: "text" | "header";
  text: string;
}

function unescapeJsxText(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMeaningfulString(s: string): boolean {
  const t = s.trim();
  if (t.length < 3) return false;
  // Hex colors / Tailwind classes / camelCase tokens / pure numbers — skip.
  if (/^#[0-9a-f]+$/i.test(t)) return false;
  if (/^[a-z]+(-[a-z0-9]+)+$/i.test(t)) return false;       // kebab-case CSS-ish
  if (/^[A-Za-z]+\d+(:[A-Za-z0-9-]+)+$/.test(t)) return false; // tailwind "md:bg-gray-100"
  if (/^[\d.,\s+\-*/%px()]+$/.test(t)) return false;        // numeric/style values
  // Strings without any letters (only emoji/symbols) — probably icons.
  if (!/[A-Za-zА-Яа-яЁё]/.test(t)) return false;
  // Likely module path or component name — skip ("react", "../shared/X").
  if (/^[a-z][a-z0-9-]*(\/[a-zA-Z0-9_./-]+)*$/.test(t)) return false;
  if (/^\.\.?\//.test(t)) return false;                     // relative import paths
  // Content: must be either long enough OR contain multiple meaningful words.
  // Short single-word strings ("Play", "Пауза", "rows", "cols") are UI labels.
  const words = t.split(/\s+/).filter((w) => w.length >= 3);
  if (t.length < 50 && words.length < 3) return false;
  return true;
}

/**
 * Walk an AST node and emit text spans. Recursively descends into JSX
 * children but skips JsxAttribute children unless the attribute name is
 * in CONTENT_ATTRS.
 */
function* walk(node: ts.Node, src: ts.SourceFile): Generator<Span> {
  if (ts.isJsxText(node)) {
    const cleaned = unescapeJsxText(node.getText(src));
    if (isMeaningfulString(cleaned)) yield { kind: "text", text: cleaned };
    return;
  }

  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const tagName = opening.tagName.getText(src);

    // Header-like component → emit a header span using its `title` prop
    if (HEADER_LIKE.test(tagName)) {
      const titleAttr = opening.attributes.properties.find(
        (a): a is ts.JsxAttribute =>
          ts.isJsxAttribute(a) && a.name.getText(src) === "title",
      );
      let headerText = "";
      if (titleAttr && titleAttr.initializer) {
        headerText = extractAttrText(titleAttr.initializer, src);
      }
      if (!headerText) {
        // Fallback to label/subtitle/heading
        for (const attr of opening.attributes.properties) {
          if (!ts.isJsxAttribute(attr)) continue;
          const name = attr.name.getText(src);
          if (CONTENT_ATTRS.has(name) && attr.initializer) {
            headerText = extractAttrText(attr.initializer, src);
            if (headerText) break;
          }
        }
      }
      if (headerText && isMeaningfulString(headerText)) {
        yield { kind: "header", text: headerText };
      }
    }

    // Always recurse into attributes (for content-bearing ones) and children.
    for (const attr of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attr)) continue;
      const attrName = attr.name.getText(src);
      if (!CONTENT_ATTRS.has(attrName) || !attr.initializer) continue;
      const val = extractAttrText(attr.initializer, src);
      if (isMeaningfulString(val) && attrName !== "title") {
        yield { kind: "text", text: val };
      }
    }

    if (ts.isJsxElement(node)) {
      for (const child of node.children) yield* walk(child, src);
    }
    return;
  }

  if (ts.isJsxExpression(node) && node.expression) {
    yield* walk(node.expression, src);
    return;
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const val = node.text;
    if (isMeaningfulString(val)) yield { kind: "text", text: val };
    return;
  }

  if (ts.isTemplateExpression(node)) {
    let combined = node.head.text;
    for (const span of node.templateSpans) {
      combined += " " + span.literal.text;
    }
    if (isMeaningfulString(combined)) yield { kind: "text", text: combined };
    return;
  }

  // Don't recurse into object literals (they are usually style maps).
  if (ts.isObjectLiteralExpression(node)) return;

  // Skip identifiers, types, imports, etc. — only recurse for structural nodes
  // that may contain JSX. Collect children first (forEachChild callback can't
  // yield) then iterate.
  const children: ts.Node[] = [];
  node.forEachChild((c) => {
    if (!ts.isTypeNode(c)) children.push(c);
  });
  for (const c of children) yield* walk(c, src);
}

function extractAttrText(
  init: ts.JsxAttributeValue,
  src: ts.SourceFile,
): string {
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) {
    const e = init.expression;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    if (ts.isTemplateExpression(e)) return e.head.text;
  }
  return "";
}

/**
 * Public API: extract theory blocks from a theory-rich.tsx (or theory.tsx)
 * source file. Blocks are split on header-like JSX components; sequential
 * non-header text is joined with double newlines.
 */
export function extractRichTheoryBlocks(filePath: string): TheoryBlock[] {
  const source = readFileSync(filePath, "utf-8");
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const blocks: TheoryBlock[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  function flush() {
    if (currentBody.length > 0) {
      const body = currentBody.join("\n\n").trim();
      const hasTitle = currentTitle.trim().length > 0;
      const title = currentTitle.trim() || "Введение";
      // Skip very short blocks (probably just an icon caption).
      // Untitled "Введение" blocks need 300+ chars (UI labels accumulate here).
      const minLen = hasTitle ? 120 : 300;
      if (body.length >= minLen) {
        blocks.push({ title, body });
      }
    }
    currentBody = [];
  }

  for (const span of walk(sf, sf)) {
    if (span.kind === "header") {
      flush();
      currentTitle = span.text;
    } else {
      currentBody.push(span.text);
    }
  }
  flush();

  return blocks;
}

// CLI entry — for ad-hoc inspection: `npx tsx extractRichTsx.ts <file.tsx>`
if (
  typeof require !== "undefined" &&
  // @ts-expect-error require.main exists in CJS context but is fine for tsx
  require.main === module
) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: tsx extractRichTsx.ts <theory-rich.tsx>");
    process.exit(1);
  }
  const blocks = extractRichTheoryBlocks(file);
  console.log(`Parsed ${blocks.length} blocks:`);
  for (const b of blocks) {
    console.log(`\n=== ${b.title} (${b.body.length} chars) ===`);
    console.log(b.body.slice(0, 300));
    if (b.body.length > 300) console.log("...");
  }
}
