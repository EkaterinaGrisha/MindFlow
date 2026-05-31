// ─── Block parser ────────────────────────────────────────────────────────────
// Parses [quiz] and [visualization] blocks from LLM responses into typed parts.

export type QuizType = "term" | "fill" | "error";

export type QuizData = {
  type: QuizType;
  question: string;
  answer: string;
  explanation: string;
};

export type ContentPart =
  | { type: "text"; content: string }
  | { type: "quiz"; data: QuizData; raw: string }
  | { type: "visualization"; code: string; raw: string };

const QUIZ_RE = /\[quiz\s+type="(term|fill|error)"\]([\s\S]*?)\[\/quiz\]/g;
const VIZ_RE = /\[visualization\]([\s\S]*?)\[\/visualization\]/g;

const QUESTION_LABELS: Record<QuizType, string[]> = {
  term: ["Вопрос", "Определение"],
  fill: ["Пропущенное слово", "Вопрос", "Предложение"],
  error: ["Утверждение", "Вопрос"],
};

function pickLine(lines: string[], labels: string[]): string {
  for (const label of labels) {
    const line = lines.find((l) => l.toLowerCase().startsWith(label.toLowerCase() + ":"));
    if (line) return line.slice(line.indexOf(":") + 1).trim();
  }
  return "";
}

function parseQuizBlock(type: QuizType, innerText: string): QuizData {
  const lines = innerText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    type,
    question: pickLine(lines, QUESTION_LABELS[type]),
    answer: pickLine(lines, ["Правильный ответ", "Ответ"]),
    explanation: pickLine(lines, ["Пояснение", "Объяснение"]),
  };
}

/**
 * Split message content into typed parts (text, quiz, visualization) for inline rendering.
 */
export function parseMessageContent(content: string): ContentPart[] {
  const hasQuiz = content.includes("[quiz");
  const hasViz = content.includes("[visualization]");
  if (!hasQuiz && !hasViz) return [{ type: "text", content }];

  type Block = { start: number; end: number; part: ContentPart };
  const blocks: Block[] = [];

  if (hasQuiz) {
    QUIZ_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = QUIZ_RE.exec(content)) !== null) {
      blocks.push({
        start: m.index,
        end: QUIZ_RE.lastIndex,
        part: { type: "quiz", data: parseQuizBlock(m[1] as QuizType, m[2]), raw: m[0] },
      });
    }
  }

  if (hasViz) {
    VIZ_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = VIZ_RE.exec(content)) !== null) {
      blocks.push({
        start: m.index,
        end: VIZ_RE.lastIndex,
        part: { type: "visualization", code: m[1].trim(), raw: m[0] },
      });
    }
  }

  blocks.sort((a, b) => a.start - b.start);

  const parts: ContentPart[] = [];
  let lastIdx = 0;
  for (const block of blocks) {
    if (block.start > lastIdx) {
      const before = content.slice(lastIdx, block.start).trim();
      if (before) parts.push({ type: "text", content: before });
    }
    parts.push(block.part);
    lastIdx = block.end;
  }
  if (lastIdx < content.length) {
    const tail = content.slice(lastIdx).trim();
    if (tail) parts.push({ type: "text", content: tail });
  }

  return parts;
}

/**
 * Instruction prepended to user_input when role === "examiner".
 */
export const EXAMINER_INSTRUCTION = `[Системная инструкция: Ты — экзаменатор. Когда хочешь проверить понимание, задавай ОДИН вопрос за раз в формате блока:

[quiz type="term"]
Вопрос: <определение или описание>
Правильный ответ: <термин>
Пояснение: <короткое объяснение почему это так>
[/quiz]

Типы: term (угадай термин по определению), fill (заполни пропуск — вопрос содержит «___»), error (найди ошибку — утверждение, в нём есть ошибка). Между вопросами давай короткий комментарий. На запрос «Дальше» — задавай следующий вопрос. Не задавай вопрос пока пользователь не подтвердил готовность.]`;

/**
 * Instruction injected into user_input to enable visualization blocks.
 * Tells the LLM to wrap JS canvas/SVG code in [visualization]...[/visualization].
 */
export const VISUALIZATION_INSTRUCTION = `[Системная подсказка: Когда объяснение выиграет от интерактивной визуализации (граф функции, геометрия, диаграмма, анимация) — добавь блок:
[visualization]
const root = document.getElementById('root');
// Пиши self-contained JS. Доступны: DOM API, Canvas 2D, SVG, requestAnimationFrame.
// root — div-контейнер 100%×100%. window.innerWidth и window.innerHeight доступны.
// Пример canvas: const c = document.createElement('canvas'); c.width=400; c.height=300; root.appendChild(c); const ctx=c.getContext('2d'); ...
[/visualization]
Используй блок максимум один раз за ответ.]`;
