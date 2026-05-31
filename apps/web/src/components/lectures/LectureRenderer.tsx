import { useState } from "react";
import {
  Sparkles, Target, Zap, BookOpen, Layers, Brain,
  Code2, Activity, Sigma,
  CheckCircle2, XCircle, HelpCircle, AlertTriangle, Lightbulb,
  TriangleAlert,
} from "lucide-react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { DiagramRenderer } from "./DiagramRenderer";
import {
  SliderExplorerBlock, FillBlankBlock, DragOrderBlock, StepSolverBlock,
} from "./InteractiveBlocks";
import {
  ACCENT_TO_HEX, T,
  type AccentKey, type Block, type CalloutVariant, type IconKey,
  type LectureDocument, type Question, type Section,
} from "./types";

// ─── Icon registry ───────────────────────────────────────────────────────────

const ICONS: Record<IconKey, React.ComponentType<{ size?: number }>> = {
  sparkles: Sparkles, target: Target, zap: Zap, book: BookOpen,
  layers: Layers, brain: Brain, code: Code2, sigma: Sigma, activity: Activity,
};

// ─── Visual primitives (mirror of theory-rich.tsx style) ─────────────────────

function SectionHeader({ icon, title, color }: { icon: IconKey; title: string; color: string }) {
  const Icon = ICONS[icon] ?? Sparkles;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} />
        </div>
      </div>
      <h2 style={{ margin: 0, color: T.text, fontSize: 25, fontWeight: 800, lineHeight: 1.25 }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="lecture-card" style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function FBox({ tex, hint, color }: { tex: string; hint?: string; color: string }) {
  const bg = color === T.primary ? T.primaryLight : `${color}12`;
  const border = color === T.primary ? T.primaryBorder : `${color}40`;
  return (
    <div className="lecture-fbox" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 22px", margin: "14px 0", textAlign: "center" }}>
      <MarkdownRenderer content={`$$${tex}$$`} />
      {hint && <div style={{ fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

// ─── Block renderers ─────────────────────────────────────────────────────────

const CALLOUT_STYLE: Record<CalloutVariant, { color: string; Icon: React.ComponentType<{ size?: number }> }> = {
  warning:     { color: T.amber,  Icon: AlertTriangle },
  insight:     { color: T.primary, Icon: Lightbulb },
  pitfall:     { color: T.red,    Icon: TriangleAlert },
  tip:         { color: T.green,  Icon: CheckCircle2 },
  datascience: { color: T.cyan,   Icon: Activity },
};

function CalloutBlock({ variant, title, md }: Extract<Block, { kind: "callout" }>) {
  const { color, Icon } = CALLOUT_STYLE[variant];
  return (
    <div className="lecture-card" style={{ background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 14, padding: "14px 18px", margin: "14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon size={15} />
        <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.12em" }}>{title}</span>
      </div>
      <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7 }}>
        <MarkdownRenderer content={md} />
      </div>
    </div>
  );
}

function DefinitionBlock({ term, md }: Extract<Block, { kind: "definition" }>) {
  return (
    <Card style={{ borderLeft: `4px solid ${T.primary}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Определение</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>{term}</div>
      <div style={{ fontSize: 14, color: T.text, lineHeight: 1.75 }}><MarkdownRenderer content={md} /></div>
    </Card>
  );
}

function ExampleBlock({ title, md }: Extract<Block, { kind: "example" }>) {
  return (
    <Card style={{ borderLeft: `4px solid ${T.violet}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.violet, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Пример</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: T.text, lineHeight: 1.75 }}><MarkdownRenderer content={md} /></div>
    </Card>
  );
}

function ListBlock({ ordered, items }: Extract<Block, { kind: "list" }>) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag style={{ paddingLeft: 22, margin: "10px 0", fontSize: 14, color: T.text, lineHeight: 1.7 }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          <MarkdownRenderer content={it} compact />
        </li>
      ))}
    </Tag>
  );
}

function CodeBlock({ lang, source }: Extract<Block, { kind: "code" }>) {
  return (
    <div className="lecture-card" style={{ margin: "12px 0", borderRadius: 12, overflow: "hidden", border: `1px solid #1e293b40` }}>
      <div style={{ background: "#0f172a", color: "#94a3b8", padding: "6px 14px", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.06em" }}>{lang}</div>
      <pre style={{ background: "#0f172a", color: "#e2e8f0", margin: 0, padding: "14px 18px", overflowX: "auto", fontSize: 13, lineHeight: 1.6, fontFamily: "monospace" }}>
        <code>{source}</code>
      </pre>
    </div>
  );
}

function KeyValueBlock({ rows }: Extract<Block, { kind: "keyvalue" }>) {
  return (
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <td style={{ padding: "8px 12px 8px 0", color: T.muted, fontWeight: 600, verticalAlign: "top", width: "30%" }}>{r.label}</td>
              <td style={{ padding: "8px 0", color: T.text }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function FigureBlock({ diagram, caption }: Extract<Block, { kind: "figure" }>) {
  return (
    <figure className="lecture-figure" style={{ margin: "18px 0", textAlign: "center" }}>
      <DiagramRenderer diagram={diagram} />
      {caption && <figcaption style={{ marginTop: 8, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{caption}</figcaption>}
    </figure>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <div style={{ fontSize: 14.5, color: T.text, lineHeight: 1.78, marginBottom: 12 }}>
          <MarkdownRenderer content={block.md} />
        </div>
      );
    case "formula":
      return <FBox tex={block.tex} hint={block.hint} color={ACCENT_TO_HEX[block.color ?? "primary"]} />;
    case "definition":       return <DefinitionBlock {...block} />;
    case "example":          return <ExampleBlock {...block} />;
    case "callout":          return <CalloutBlock {...block} />;
    case "list":             return <ListBlock {...block} />;
    case "code":             return <CodeBlock {...block} />;
    case "keyvalue":         return <KeyValueBlock {...block} />;
    case "figure":           return <FigureBlock {...block} />;
    case "slider_explorer":  return <SliderExplorerBlock {...block} />;
    case "fill_blank":       return <FillBlankBlock {...block} />;
    case "drag_order":       return <DragOrderBlock {...block} />;
    case "step_solver":      return <StepSolverBlock {...block} />;
  }
}

// ─── Questions ───────────────────────────────────────────────────────────────

function McqQuestion({ q, index }: { q: Extract<Question, { kind: "mcq" }>; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <HelpCircle size={16} color={T.primary} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, textTransform: "uppercase", letterSpacing: "0.12em" }}>Вопрос {index + 1}</span>
      </div>
      <div style={{ fontSize: 15, color: T.text, marginBottom: 10, lineHeight: 1.6 }}>
        <MarkdownRenderer content={q.prompt} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = i === picked;
          const showState = answered && (isCorrect || isPicked);
          const bg = !showState ? T.surface : isCorrect ? `${T.green}15` : `${T.red}15`;
          const border = !showState ? T.border : isCorrect ? T.green : T.red;
          return (
            <button
              key={i}
              type="button"
              onClick={() => !answered && setPicked(i)}
              disabled={answered}
              className="lecture-mcq-option"
              style={{
                textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                background: bg, border: `1px solid ${border}`, borderRadius: 10,
                padding: "10px 12px", fontSize: 14, color: T.text,
                cursor: answered ? "default" : "pointer",
              }}
            >
              {showState && isCorrect && <CheckCircle2 size={16} color={T.green} />}
              {showState && isPicked && !isCorrect && <XCircle size={16} color={T.red} />}
              {!showState && <span style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${T.mutedLight}`, flexShrink: 0 }} />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && q.explanation && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: T.primaryLight, borderRadius: 10, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
          <strong style={{ color: T.primary }}>Пояснение: </strong><MarkdownRenderer content={q.explanation} compact />
        </div>
      )}
    </Card>
  );
}

function OpenQuestion({ q, index }: { q: Extract<Question, { kind: "open" }>; index: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <HelpCircle size={16} color={T.violet} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.violet, textTransform: "uppercase", letterSpacing: "0.12em" }}>Вопрос {index + 1} · открытый</span>
      </div>
      <div style={{ fontSize: 15, color: T.text, marginBottom: 10, lineHeight: 1.6 }}>
        <MarkdownRenderer content={q.prompt} />
      </div>
      <textarea
        placeholder="Запиши ответ здесь — он не отправляется на сервер"
        className="lecture-open-area"
        style={{ width: "100%", minHeight: 90, padding: 10, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
      />
      {q.expectedHint && (
        <>
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              style={{ marginTop: 10, fontSize: 13, color: T.primary, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}
            >
              Показать ориентир для ответа
            </button>
          ) : (
            <div style={{ marginTop: 10, padding: "10px 14px", background: T.primaryLight, borderRadius: 10, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
              <strong style={{ color: T.primary }}>Ориентир: </strong>{q.expectedHint}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export interface LectureRendererProps {
  doc: LectureDocument;
  /** Hides interactive affordances and tightens spacing for print/PDF. */
  printMode?: boolean;
}

export default function LectureRenderer({ doc, printMode = false }: LectureRendererProps) {
  return (
    <article className={`lecture-root ${printMode ? "lecture-print" : ""}`} style={{ maxWidth: 820, margin: "0 auto", color: T.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: 28, paddingBottom: 18, borderBottom: `1px solid ${T.border}` }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.2, color: T.text }}>{doc.title}</h1>
        {doc.subtitle && (
          <p style={{ marginTop: 8, fontSize: 16, color: T.muted, lineHeight: 1.55 }}>{doc.subtitle}</p>
        )}
        {doc.estimatedReadMin && (
          <p style={{ marginTop: 10, fontSize: 12, color: T.mutedLight, letterSpacing: "0.05em" }}>
            ⏱ ≈ {doc.estimatedReadMin} мин чтения
          </p>
        )}
      </header>

      {/* Sections */}
      {doc.sections.map((s) => (
        <SectionView key={s.id} section={s} />
      ))}

      {/* Questions */}
      {doc.questions.length > 0 && (
        <section className="lecture-section" style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
          <SectionHeader icon="target" title="Проверь себя" color={T.primary} />
          {doc.questions.map((q, i) =>
            q.kind === "mcq"
              ? <McqQuestion key={i} q={q} index={i} />
              : <OpenQuestion key={i} q={q} index={i} />,
          )}
        </section>
      )}
    </article>
  );
}

function SectionView({ section }: { section: Section }) {
  const color = ACCENT_TO_HEX[(section.accent ?? "primary") as AccentKey];
  return (
    <section id={section.id} className="lecture-section" style={{ marginBottom: 36, scrollMarginTop: 24 }}>
      <SectionHeader icon={(section.icon ?? "sparkles") as IconKey} title={section.heading} color={color} />
      {section.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
    </section>
  );
}
