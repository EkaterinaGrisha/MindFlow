import test from "node:test";
import assert from "node:assert/strict";
import {
  _parseTheoryBlocksForTest as parseTheoryBlocks,
  _chunkByParagraphsForTest as chunkByParagraphs,
  _extractTextFromHtmlForTest as extractTextFromHtml,
} from "../../infra/ingest/ingest";

test("parseTheoryBlocks извлекает title/body из template-литералов", () => {
  const source = `
    import type { TheoryBlock } from '../types';
    export const x: TheoryBlock[] = [
      {
        title: 'Первая тема',
        body: \`Первая\n\nВторая строка с символом ' внутри.\`,
      },
      {
        title: "Вторая",
        body: 'Тело со словом "кавычки".',
      },
    ];
  `;
  const blocks = parseTheoryBlocks(source);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].title, "Первая тема");
  assert.match(blocks[0].body, /Вторая строка/);
  assert.equal(blocks[1].title, "Вторая");
  assert.match(blocks[1].body, /кавычки/);
});

test("parseTheoryBlocks возвращает пустой список на файле без блоков", () => {
  assert.deepEqual(parseTheoryBlocks("export const x = 1;"), []);
});

test("chunkByParagraphs объединяет короткие абзацы в один чанк", () => {
  const para = (n: number) =>
    Array.from({ length: 30 }, (_, i) => `слово${n}_${i}`).join(" ");
  const text = [para(1), para(2), para(3)].join("\n\n");
  const chunks = chunkByParagraphs(text);
  assert.equal(chunks.length, 1, "три средних абзаца должны влезть в один чанк");
  assert.match(chunks[0], /слово1_0/);
  assert.match(chunks[0], /слово3_0/);
});

test("chunkByParagraphs режет длинный текст на несколько чанков", () => {
  const longBody = Array.from({ length: 6 }, (_, i) =>
    Array.from({ length: 80 }, (_, j) => `слово${i}_${j}`).join(" "),
  ).join("\n\n");
  const longChunks = chunkByParagraphs(longBody);
  assert.ok(longChunks.length >= 2, "длинный текст должен делиться на несколько чанков");
  for (const chunk of longChunks) {
    const wordCount = chunk.split(/\s+/).length;
    assert.ok(wordCount <= 410, `чанк не должен сильно превышать целевой размер (got ${wordCount})`);
  }
});

test("chunkByParagraphs отбрасывает слишком короткие чанки", () => {
  assert.deepEqual(chunkByParagraphs("короткий текст"), []);
});

test("extractTextFromHtml выкидывает script/style и возвращает текст", () => {
  const html = `
    <html>
      <head><style>body { color: red; }</style></head>
      <body>
        <nav>Меню</nav>
        <article>
          <h1>Заголовок</h1>
          <p>Параграф один.</p>
          <script>alert(1)</script>
          <p>Параграф два.</p>
        </article>
        <footer>Подвал</footer>
      </body>
    </html>
  `;
  const text = extractTextFromHtml(html);
  assert.match(text, /Заголовок/);
  assert.match(text, /Параграф один/);
  assert.match(text, /Параграф два/);
  assert.doesNotMatch(text, /alert\(1\)/);
  assert.doesNotMatch(text, /color: red/);
  assert.doesNotMatch(text, /Меню/);
  assert.doesNotMatch(text, /Подвал/);
});
