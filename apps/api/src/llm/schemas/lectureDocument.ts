/**
 * Lecture document schema — structured JSON that LLM returns for a single
 * generated lecture. Mirror of the type lives in
 * apps/web/src/components/lectures/types.ts.
 *
 * The schema is intentionally narrow: every block has a fixed `kind`, every
 * diagram a fixed `type`. Closed enums make LLM output predictable and the
 * renderer simple (switch by tag).
 */

export type AccentKey =
  | "primary" | "green" | "amber" | "red" | "cyan" | "violet" | "pink";

export type IconKey =
  | "sparkles" | "target" | "zap" | "book" | "layers" | "brain"
  | "code" | "sigma" | "activity";

export type CalloutVariant =
  | "warning" | "insight" | "pitfall" | "tip" | "datascience";

export type Diagram =
  | {
      type: "function_plot";
      xRange: [number, number];
      yRange: [number, number];
      series: Array<{
        points: Array<[number, number]>;
        color?: AccentKey;
        label?: string;
      }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "coordinate_axes";
      xRange: [number, number];
      yRange: [number, number];
      vectors: Array<{
        from: [number, number];
        to: [number, number];
        color?: AccentKey;
        label?: string;
      }>;
    }
  | {
      type: "bar_chart";
      bars: Array<{ label: string; value: number; color?: AccentKey }>;
      max?: number;
    }
  | {
      type: "matrix_grid";
      rows: number;
      cols: number;
      cells: Array<Array<{ value: string; highlight?: AccentKey }>>;
      brackets?: boolean;
    }
  | {
      type: "concept_diagram";
      nodes: Array<{
        id: string;
        x: number;
        y: number;
        label: string;
        color?: AccentKey;
      }>;
      edges: Array<{ from: string; to: string; label?: string }>;
    }
  | {
      type: "number_line";
      range: [number, number];
      marks: Array<{
        at: number;
        label?: string;
        color?: AccentKey;
        emphasis?: "dot" | "tick" | "open";
      }>;
      segments?: Array<{
        from: number;
        to: number;
        color?: AccentKey;
        label?: string;
      }>;
    }
  | {
      type: "distribution_curve";
      distribution: "normal" | "uniform" | "exponential";
      params: { mean?: number; std?: number; a?: number; b?: number; lambda?: number };
      shade?: { from: number; to: number; color?: AccentKey; label?: string };
      xRange?: [number, number];
    };

export type ParametricFamily =
  | { family: "polynomial"; coefficients: Array<number | string> }
  | { family: "linear"; slope: number | string; intercept: number | string }
  | { family: "gaussian"; mean: number | string; std: number | string };

export type Block =
  | { kind: "paragraph"; md: string }
  | { kind: "formula"; tex: string; hint?: string; color?: AccentKey }
  | { kind: "definition"; term: string; md: string }
  | { kind: "example"; title: string; md: string }
  | { kind: "callout"; variant: CalloutVariant; title: string; md: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; lang: string; source: string }
  | { kind: "keyvalue"; rows: Array<{ label: string; value: string }> }
  | { kind: "figure"; caption?: string; diagram: Diagram }
  | {
      kind: "slider_explorer";
      caption?: string;
      param: { name: string; min: number; max: number; step: number; default: number; label?: string };
      function: ParametricFamily;
      xRange: [number, number];
      yRange: [number, number];
      color?: AccentKey;
    }
  | {
      kind: "fill_blank";
      prompt?: string;
      tex: string;
      blanks: Array<{ id: number; answer: string; hint?: string }>;
      loose?: boolean;
    }
  | {
      kind: "drag_order";
      prompt: string;
      items: Array<{ id: string; text: string }>;
      explanation?: string;
    }
  | {
      kind: "step_solver";
      problem: string;
      steps: Array<{
        prompt: string;
        accept: string[];
        hint?: string;
        explanation?: string;
      }>;
    };

export interface Section {
  id: string;
  heading: string;
  icon?: IconKey;
  accent?: AccentKey;
  blocks: Block[];
}

export type Question =
  | {
      kind: "mcq";
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }
  | { kind: "open"; prompt: string; expectedHint?: string };

export interface LectureDocument {
  version: "1";
  title: string;
  subtitle?: string;
  estimatedReadMin?: number;
  sections: Section[];
  questions: Question[];
}

// ─── Validation (no zod dependency) ──────────────────────────────────────────

const ACCENTS: AccentKey[] = ["primary", "green", "amber", "red", "cyan", "violet", "pink"];
const ICONS: IconKey[] = ["sparkles", "target", "zap", "book", "layers", "brain", "code", "sigma", "activity"];
const CALLOUT_VARIANTS: CalloutVariant[] = ["warning", "insight", "pitfall", "tip", "datascience"];
const BLOCK_KINDS = [
  "paragraph", "formula", "definition", "example", "callout", "list", "code", "keyvalue", "figure",
  "slider_explorer", "fill_blank", "drag_order", "step_solver",
] as const;
const DIAGRAM_TYPES = [
  "function_plot", "coordinate_axes", "bar_chart", "matrix_grid", "concept_diagram",
  "number_line", "distribution_curve",
] as const;
const FAMILIES = ["polynomial", "linear", "gaussian"] as const;
const DISTRIBUTIONS = ["normal", "uniform", "exponential"] as const;

type Issue = string;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStrArr(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === "string");
}

function isNumPair(v: unknown): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number";
}

function validateDiagram(d: unknown, path: string, issues: Issue[]): void {
  if (!isObj(d)) { issues.push(`${path}: not an object`); return; }
  if (!DIAGRAM_TYPES.includes(d.type as never)) {
    issues.push(`${path}.type: must be one of ${DIAGRAM_TYPES.join(", ")}`);
    return;
  }
  switch (d.type) {
    case "function_plot":
      if (!isNumPair(d.xRange)) issues.push(`${path}.xRange: expected [number, number]`);
      if (!isNumPair(d.yRange)) issues.push(`${path}.yRange: expected [number, number]`);
      if (!Array.isArray(d.series)) issues.push(`${path}.series: expected array`);
      break;
    case "coordinate_axes":
      if (!isNumPair(d.xRange)) issues.push(`${path}.xRange: expected [number, number]`);
      if (!isNumPair(d.yRange)) issues.push(`${path}.yRange: expected [number, number]`);
      if (!Array.isArray(d.vectors)) issues.push(`${path}.vectors: expected array`);
      break;
    case "bar_chart":
      if (!Array.isArray(d.bars)) issues.push(`${path}.bars: expected array`);
      break;
    case "matrix_grid":
      if (typeof d.rows !== "number") issues.push(`${path}.rows: number`);
      if (typeof d.cols !== "number") issues.push(`${path}.cols: number`);
      if (!Array.isArray(d.cells)) issues.push(`${path}.cells: 2D array`);
      break;
    case "concept_diagram":
      if (!Array.isArray(d.nodes)) issues.push(`${path}.nodes: expected array`);
      if (!Array.isArray(d.edges)) issues.push(`${path}.edges: expected array`);
      break;
    case "number_line":
      if (!isNumPair(d.range)) issues.push(`${path}.range: [number, number]`);
      if (!Array.isArray(d.marks)) issues.push(`${path}.marks: expected array`);
      break;
    case "distribution_curve":
      if (!DISTRIBUTIONS.includes(d.distribution as never)) {
        issues.push(`${path}.distribution: must be one of ${DISTRIBUTIONS.join(", ")}`);
      }
      if (!isObj(d.params)) issues.push(`${path}.params: object required`);
      break;
  }
}

function validateFamily(f: unknown, path: string, issues: Issue[]): void {
  if (!isObj(f)) { issues.push(`${path}: object required`); return; }
  if (!FAMILIES.includes(f.family as never)) {
    issues.push(`${path}.family: must be one of ${FAMILIES.join(", ")}`);
    return;
  }
  if (f.family === "polynomial") {
    if (!Array.isArray(f.coefficients) || f.coefficients.some(
      (c) => typeof c !== "number" && typeof c !== "string",
    )) {
      issues.push(`${path}.coefficients: array of number|string required`);
    }
  } else if (f.family === "linear") {
    if (typeof f.slope !== "number" && typeof f.slope !== "string") {
      issues.push(`${path}.slope: number|string required`);
    }
    if (typeof f.intercept !== "number" && typeof f.intercept !== "string") {
      issues.push(`${path}.intercept: number|string required`);
    }
  } else if (f.family === "gaussian") {
    if (typeof f.mean !== "number" && typeof f.mean !== "string") {
      issues.push(`${path}.mean: number|string required`);
    }
    if (typeof f.std !== "number" && typeof f.std !== "string") {
      issues.push(`${path}.std: number|string required`);
    }
  }
}

function validateBlock(b: unknown, path: string, issues: Issue[]): void {
  if (!isObj(b)) { issues.push(`${path}: not an object`); return; }
  if (!BLOCK_KINDS.includes(b.kind as never)) {
    issues.push(`${path}.kind: must be one of ${BLOCK_KINDS.join(", ")}`);
    return;
  }
  switch (b.kind) {
    case "paragraph":
      if (typeof b.md !== "string") issues.push(`${path}.md: string required`);
      break;
    case "formula":
      if (typeof b.tex !== "string") issues.push(`${path}.tex: string required`);
      if (b.color !== undefined && !ACCENTS.includes(b.color as AccentKey)) {
        issues.push(`${path}.color: invalid accent`);
      }
      break;
    case "definition":
      if (typeof b.term !== "string") issues.push(`${path}.term: string required`);
      if (typeof b.md !== "string") issues.push(`${path}.md: string required`);
      break;
    case "example":
      if (typeof b.title !== "string") issues.push(`${path}.title: string required`);
      if (typeof b.md !== "string") issues.push(`${path}.md: string required`);
      break;
    case "callout":
      if (!CALLOUT_VARIANTS.includes(b.variant as CalloutVariant)) {
        issues.push(`${path}.variant: invalid`);
      }
      if (typeof b.title !== "string") issues.push(`${path}.title: string required`);
      if (typeof b.md !== "string") issues.push(`${path}.md: string required`);
      break;
    case "list":
      if (typeof b.ordered !== "boolean") issues.push(`${path}.ordered: boolean required`);
      if (!isStrArr(b.items)) issues.push(`${path}.items: string[] required`);
      break;
    case "code":
      if (typeof b.lang !== "string") issues.push(`${path}.lang: string required`);
      if (typeof b.source !== "string") issues.push(`${path}.source: string required`);
      break;
    case "keyvalue":
      if (!Array.isArray(b.rows)) issues.push(`${path}.rows: array required`);
      break;
    case "figure":
      validateDiagram(b.diagram, `${path}.diagram`, issues);
      break;
    case "slider_explorer":
      if (!isObj(b.param)) issues.push(`${path}.param: object required`);
      else {
        if (typeof (b.param as Record<string, unknown>).name !== "string") issues.push(`${path}.param.name: string`);
        if (typeof (b.param as Record<string, unknown>).min !== "number") issues.push(`${path}.param.min: number`);
        if (typeof (b.param as Record<string, unknown>).max !== "number") issues.push(`${path}.param.max: number`);
        if (typeof (b.param as Record<string, unknown>).default !== "number") issues.push(`${path}.param.default: number`);
      }
      validateFamily(b.function, `${path}.function`, issues);
      if (!isNumPair(b.xRange)) issues.push(`${path}.xRange: [number, number]`);
      if (!isNumPair(b.yRange)) issues.push(`${path}.yRange: [number, number]`);
      break;
    case "fill_blank":
      if (typeof b.tex !== "string") issues.push(`${path}.tex: string required`);
      if (!Array.isArray(b.blanks) || b.blanks.length === 0) {
        issues.push(`${path}.blanks: non-empty array required`);
      }
      break;
    case "drag_order":
      if (typeof b.prompt !== "string") issues.push(`${path}.prompt: string required`);
      if (!Array.isArray(b.items) || b.items.length < 2) {
        issues.push(`${path}.items: at least 2 items required`);
      }
      break;
    case "step_solver":
      if (typeof b.problem !== "string") issues.push(`${path}.problem: string required`);
      if (!Array.isArray(b.steps) || b.steps.length === 0) {
        issues.push(`${path}.steps: non-empty array required`);
      }
      break;
  }
}

function validateQuestion(q: unknown, path: string, issues: Issue[]): void {
  if (!isObj(q)) { issues.push(`${path}: not an object`); return; }
  if (q.kind === "mcq") {
    if (typeof q.prompt !== "string") issues.push(`${path}.prompt: string required`);
    if (!isStrArr(q.options) || q.options.length < 2) {
      issues.push(`${path}.options: >=2 strings required`);
    }
    if (typeof q.correctIndex !== "number") {
      issues.push(`${path}.correctIndex: number required`);
    } else if (isStrArr(q.options) && (q.correctIndex < 0 || q.correctIndex >= q.options.length)) {
      issues.push(`${path}.correctIndex: out of range`);
    }
  } else if (q.kind === "open") {
    if (typeof q.prompt !== "string") issues.push(`${path}.prompt: string required`);
  } else {
    issues.push(`${path}.kind: must be 'mcq' or 'open'`);
  }
}

export interface ValidationResult {
  ok: boolean;
  doc?: LectureDocument;
  issues: string[];
}

export function validateLectureDocument(raw: unknown): ValidationResult {
  const issues: Issue[] = [];

  if (!isObj(raw)) {
    return { ok: false, issues: ["root: expected object"] };
  }
  if (raw.version !== "1") issues.push(`version: must be "1"`);
  if (typeof raw.title !== "string" || !raw.title.trim()) {
    issues.push(`title: non-empty string required`);
  }
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    issues.push(`sections: non-empty array required`);
  } else {
    raw.sections.forEach((s, si) => {
      const sp = `sections[${si}]`;
      if (!isObj(s)) { issues.push(`${sp}: not an object`); return; }
      if (typeof s.id !== "string" || !s.id) issues.push(`${sp}.id: string required`);
      if (typeof s.heading !== "string" || !s.heading) issues.push(`${sp}.heading: string required`);
      if (s.icon !== undefined && !ICONS.includes(s.icon as IconKey)) {
        issues.push(`${sp}.icon: invalid`);
      }
      if (s.accent !== undefined && !ACCENTS.includes(s.accent as AccentKey)) {
        issues.push(`${sp}.accent: invalid`);
      }
      if (!Array.isArray(s.blocks)) {
        issues.push(`${sp}.blocks: array required`);
      } else {
        s.blocks.forEach((b: unknown, bi: number) => validateBlock(b, `${sp}.blocks[${bi}]`, issues));
      }
    });
  }
  if (!Array.isArray(raw.questions)) {
    issues.push(`questions: array required`);
  } else {
    raw.questions.forEach((q: unknown, qi: number) => validateQuestion(q, `questions[${qi}]`, issues));
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, doc: raw as unknown as LectureDocument, issues: [] };
}

/**
 * Extract the first balanced top-level JSON object from a raw LLM response.
 * LLM may wrap output in ```json fences or add explanatory prose around it.
 */
export function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;

  const start = candidate.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}
