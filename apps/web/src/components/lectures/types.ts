/**
 * Mirror of apps/api/src/llm/schemas/lectureDocument.ts — kept in sync by hand.
 * Frontend uses these types to render LectureDocument JSON returned by
 * GET /api/lectures/:id.
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
      /** Один из presets — рендерер сам считает PDF. */
      distribution: "normal" | "uniform" | "exponential";
      params: { mean?: number; std?: number; a?: number; b?: number; lambda?: number };
      /** Optional shaded area for tail/CI visualisation. */
      shade?: { from: number; to: number; color?: AccentKey; label?: string };
      xRange?: [number, number];
    };

/** Slider-driven parametric family — used by slider_explorer. */
export type ParametricFamily =
  | {
      family: "polynomial";
      /**
       * Each coefficient — either a constant number or the slider name (string).
       * Example: [0, "a", 1]  →  y = 0 + a·x + 1·x²
       */
      coefficients: Array<number | string>;
    }
  | {
      family: "linear";
      slope: number | string;
      intercept: number | string;
    }
  | {
      family: "gaussian";
      mean: number | string;
      std: number | string;
    };

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
      /** LaTeX-формула с маркерами {?1}, {?2}… на месте пропусков. */
      tex: string;
      blanks: Array<{ id: number; answer: string; hint?: string }>;
      /** Если true — сравнение игнорирует пробелы и скобки. */
      loose?: boolean;
    }
  | {
      kind: "drag_order";
      prompt: string;
      /** Items in the CORRECT order. UI shuffles them on mount. */
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

export interface LectureSummary {
  id: string;
  title: string;
  source_id: string;
  status: "pending" | "ready" | "failed";
  created_at: string;
}

export interface PersonalDocument {
  source_id: string;
  source_title: string;
  chunk_count: number;
}

// ─── Shared palette and helpers ──────────────────────────────────────────────

export const T = {
  text: "#1e293b",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  primary: "#6366f1",
  primaryLight: "#eef2ff",
  primaryBorder: "#c7d2fe",
  primaryDark: "#4f46e5",
  green: "#10b981",
  greenLight: "#d1fae5",
  amber: "#f59e0b",
  amberLight: "#fef3c7",
  red: "#ef4444",
  redLight: "#fee2e2",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  pink: "#ec4899",
  white: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",
} as const;

export const ACCENT_TO_HEX: Record<AccentKey, string> = {
  primary: T.primary,
  green:   T.green,
  amber:   T.amber,
  red:     T.red,
  cyan:    T.cyan,
  violet:  T.violet,
  pink:    T.pink,
};
