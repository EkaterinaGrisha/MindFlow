/**
 * InteractiveBlocks — слайдер, fill-the-blank, drag-to-order, step-solver.
 *
 * Стиль строго совпадает с LectureRenderer / DiagramRenderer:
 * inline styles, палитра T, без Tailwind. Это нужно, чтобы print → PDF
 * сохранял внешний вид.
 */

import { useMemo, useState } from "react";
import {
  CheckCircle2, XCircle, GripVertical, Lightbulb, Sliders, ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { MarkdownRenderer } from "../MarkdownRenderer";
import { DiagramRenderer } from "./DiagramRenderer";
import {
  ACCENT_TO_HEX, T,
  type AccentKey, type Block, type Diagram, type ParametricFamily,
} from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="lecture-card"
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 14,
        ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
      }}
    >
      {children}
    </div>
  );
}

function TagLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 800, color, textTransform: "uppercase",
        letterSpacing: "0.14em",
      }}
    >
      {children}
    </span>
  );
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "").replace(/[{}()]/g, "");
}

// ─── 1. Slider explorer ─────────────────────────────────────────────────────

/** Resolve a ParametricFamily field that is either a number or a slider name. */
function resolveCoef(c: number | string, paramName: string, paramValue: number): number {
  return typeof c === "number" ? c : (c === paramName ? paramValue : NaN);
}

function evalAt(fn: ParametricFamily, x: number, paramName: string, paramValue: number): number {
  if (fn.family === "polynomial") {
    let y = 0;
    let xp = 1;
    for (const c of fn.coefficients) {
      y += resolveCoef(c, paramName, paramValue) * xp;
      xp *= x;
    }
    return y;
  }
  if (fn.family === "linear") {
    return resolveCoef(fn.slope, paramName, paramValue) * x +
           resolveCoef(fn.intercept, paramName, paramValue);
  }
  // gaussian
  const m = resolveCoef(fn.mean, paramName, paramValue);
  const s = Math.max(0.05, resolveCoef(fn.std, paramName, paramValue));
  return (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - m) ** 2) / (2 * s * s));
}

export function SliderExplorerBlock(b: Extract<Block, { kind: "slider_explorer" }>) {
  const [value, setValue] = useState<number>(b.param.default);
  const accentColor = ACCENT_TO_HEX[b.color ?? "primary"];

  const points = useMemo<Array<[number, number]>>(() => {
    const N = 120;
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= N; i++) {
      const x = b.xRange[0] + (i / N) * (b.xRange[1] - b.xRange[0]);
      const y = evalAt(b.function, x, b.param.name, value);
      if (Number.isFinite(y)) out.push([x, y]);
    }
    return out;
  }, [b, value]);

  const diagram: Diagram = {
    type: "function_plot",
    xRange: b.xRange,
    yRange: b.yRange,
    series: [{ points, color: b.color ?? "primary", label: `${b.param.name} = ${value.toFixed(2)}` }],
  };

  return (
    <Card accent={accentColor}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Sliders size={15} color={accentColor} />
        <TagLabel color={accentColor}>Интерактив</TagLabel>
      </div>
      <div style={{ marginBottom: 10 }}>
        <DiagramRenderer diagram={diagram} />
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: `${accentColor}10`, padding: "10px 14px", borderRadius: 12,
      }}>
        <div style={{ fontSize: 13, color: T.text, minWidth: 90 }}>
          <span style={{ color: T.muted }}>{b.param.label ?? b.param.name}</span>{" = "}
          <strong style={{ color: accentColor, fontVariantNumeric: "tabular-nums" }}>
            {value.toFixed(2)}
          </strong>
        </div>
        <input
          type="range"
          min={b.param.min}
          max={b.param.max}
          step={b.param.step}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor }}
        />
        <button
          type="button"
          onClick={() => setValue(b.param.default)}
          style={{
            background: "transparent", border: "none", color: T.muted, cursor: "pointer",
            display: "flex", alignItems: "center", padding: 4,
          }}
          title="Сброс"
          aria-label="Сброс"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {b.caption && (
        <div style={{ marginTop: 8, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
          {b.caption}
        </div>
      )}
    </Card>
  );
}

// ─── 2. Fill the blank ──────────────────────────────────────────────────────

export function FillBlankBlock(b: Extract<Block, { kind: "fill_blank" }>) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});

  // Replace {?N} markers in tex with \boxed{?_N} so KaTeX renders placeholders.
  const previewTex = useMemo(
    () => b.tex.replace(/\{\?(\d+)\}/g, (_, n) => `\\boxed{\\,?_{${n}}\\,}`),
    [b.tex],
  );

  const isCorrect = (id: number): boolean => {
    const v = values[id] ?? "";
    const blank = b.blanks.find((bl) => bl.id === id);
    if (!blank) return false;
    if (b.loose) return normalize(v) === normalize(blank.answer);
    return v.trim() === blank.answer.trim();
  };

  const allCorrect = checked && b.blanks.every((bl) => isCorrect(bl.id));

  return (
    <Card accent={T.primary}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <TagLabel color={T.primary}>Заполни пропуски</TagLabel>
      </div>
      {b.prompt && (
        <div style={{ fontSize: 14, color: T.text, marginBottom: 10, lineHeight: 1.6 }}>
          <MarkdownRenderer content={b.prompt} compact />
        </div>
      )}
      <div style={{
        background: T.primaryLight, border: `1px solid ${T.primaryBorder}`,
        borderRadius: 12, padding: "14px 18px", margin: "10px 0", textAlign: "center",
      }}>
        <MarkdownRenderer content={`$$${previewTex}$$`} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {b.blanks.map((bl) => {
          const ok = isCorrect(bl.id);
          const showState = checked;
          return (
            <div key={bl.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 12, color: T.muted, minWidth: 84, fontFamily: "monospace",
              }}>
                Пропуск {bl.id}:
              </span>
              <input
                type="text"
                value={values[bl.id] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [bl.id]: e.target.value }))}
                disabled={showState && ok}
                style={{
                  flex: 1, padding: "8px 12px", fontSize: 14, fontFamily: "monospace",
                  border: `1px solid ${showState ? (ok ? T.green : T.red) : T.border}`,
                  borderRadius: 8, outline: "none",
                  background: showState ? (ok ? `${T.green}10` : `${T.red}10`) : T.white,
                  color: T.text,
                }}
                placeholder="ответ"
              />
              {showState && ok && <CheckCircle2 size={16} color={T.green} />}
              {showState && !ok && <XCircle size={16} color={T.red} />}
              {bl.hint && (
                <button
                  type="button"
                  onClick={() => setShowHints((s) => ({ ...s, [bl.id]: !s[bl.id] }))}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: T.amber, padding: 4, display: "flex",
                  }}
                  title="Подсказка"
                >
                  <Lightbulb size={15} />
                </button>
              )}
            </div>
          );
        })}
        {b.blanks.map((bl) => showHints[bl.id] && bl.hint && (
          <div key={`h${bl.id}`} style={{
            background: T.amberLight, border: `1px solid ${T.amber}40`, borderRadius: 8,
            padding: "8px 12px", fontSize: 12, color: T.text,
          }}>
            <strong style={{ color: T.amber }}>Подсказка для пропуска {bl.id}:</strong> {bl.hint}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={Object.keys(values).length === 0}
          style={{
            background: T.primary, color: T.white, border: "none",
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", opacity: Object.keys(values).length === 0 ? 0.5 : 1,
          }}
        >
          Проверить
        </button>
        {checked && (
          <button
            type="button"
            onClick={() => { setChecked(false); setValues({}); }}
            style={{
              background: "transparent", color: T.muted, border: "none",
              fontSize: 12, cursor: "pointer",
            }}
          >
            Сбросить
          </button>
        )}
        {allCorrect && (
          <span style={{
            fontSize: 12, fontWeight: 700, color: T.green, marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <CheckCircle2 size={14} /> Все верно
          </span>
        )}
      </div>
    </Card>
  );
}

// ─── 3. Drag to order ───────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Avoid identity shuffle for short arrays.
  if (a.length > 1 && a.every((v, i) => v === arr[i])) return shuffle(arr);
  return a;
}

function SortableTextRow({ id, text, index, status }: {
  id: string; text: string; index: number; status: "idle" | "ok" | "bad";
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: status === "ok" ? `${T.green}10` :
                status === "bad" ? `${T.red}10` : T.surface,
    border: `1px solid ${status === "ok" ? T.green : status === "bad" ? T.red : T.border}`,
    borderRadius: 10, padding: "10px 12px",
    display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: T.text,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Перетащить"
        style={{
          cursor: "grab", border: "none", background: "transparent",
          color: T.muted, display: "flex", padding: 2,
        }}
      >
        <GripVertical size={14} />
      </button>
      <span style={{
        fontSize: 11, fontWeight: 700, color: T.muted, minWidth: 18, fontFamily: "monospace",
      }}>
        {index + 1}.
      </span>
      <span style={{ flex: 1 }}>{text}</span>
      {status === "ok" && <CheckCircle2 size={15} color={T.green} />}
      {status === "bad" && <XCircle size={15} color={T.red} />}
    </div>
  );
}

export function DragOrderBlock(b: Extract<Block, { kind: "drag_order" }>) {
  const correctOrder = useMemo(() => b.items.map((it) => it.id), [b.items]);
  const [order, setOrder] = useState<string[]>(() => shuffle(correctOrder));
  const [checked, setChecked] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = order.indexOf(String(active.id));
    const newIdx = order.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    setOrder(arrayMove(order, oldIdx, newIdx));
    setChecked(false);
  };

  const itemsById = useMemo(() => {
    const m = new Map(b.items.map((it) => [it.id, it.text]));
    return m;
  }, [b.items]);

  const allCorrect = checked && order.every((id, i) => id === correctOrder[i]);

  return (
    <Card accent={T.violet}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <TagLabel color={T.violet}>Расставь по порядку</TagLabel>
      </div>
      <div style={{ fontSize: 14, color: T.text, marginBottom: 10, lineHeight: 1.6 }}>
        <MarkdownRenderer content={b.prompt} compact />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {order.map((id, i) => {
              const status: "idle" | "ok" | "bad" = !checked ? "idle"
                : id === correctOrder[i] ? "ok" : "bad";
              return (
                <SortableTextRow
                  key={id}
                  id={id}
                  text={itemsById.get(id) ?? id}
                  index={i}
                  status={status}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setChecked(true)}
          style={{
            background: T.violet, color: T.white, border: "none",
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Проверить
        </button>
        <button
          type="button"
          onClick={() => { setOrder(shuffle(correctOrder)); setChecked(false); }}
          style={{
            background: "transparent", color: T.muted, border: "none",
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <RotateCcw size={12} /> Перемешать
        </button>
        {allCorrect && (
          <span style={{
            fontSize: 12, fontWeight: 700, color: T.green, marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <CheckCircle2 size={14} /> Порядок верный
          </span>
        )}
      </div>
      {checked && allCorrect && b.explanation && (
        <div style={{
          marginTop: 10, padding: "10px 14px", background: `${T.violet}10`,
          borderRadius: 10, fontSize: 13, color: T.text, lineHeight: 1.6,
        }}>
          <strong style={{ color: T.violet }}>Почему так: </strong>
          <MarkdownRenderer content={b.explanation} compact />
        </div>
      )}
    </Card>
  );
}

// ─── 4. Step solver ─────────────────────────────────────────────────────────

export function StepSolverBlock(b: Extract<Block, { kind: "step_solver" }>) {
  const [activeStep, setActiveStep] = useState(0);
  const [values, setValues] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, "ok" | "bad">>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});

  const tryStep = (idx: number) => {
    const v = values[idx] ?? "";
    const step = b.steps[idx];
    const ok = step.accept.some((a) => normalize(v) === normalize(a));
    setResults((s) => ({ ...s, [idx]: ok ? "ok" : "bad" }));
    if (ok && idx < b.steps.length - 1) setActiveStep(idx + 1);
  };

  const completed = Object.values(results).filter((r) => r === "ok").length;
  const total = b.steps.length;

  return (
    <Card accent={T.cyan}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8, gap: 8,
      }}>
        <TagLabel color={T.cyan}>Решаем по шагам</TagLabel>
        <span style={{
          fontSize: 11, color: T.muted, fontFamily: "monospace",
        }}>
          {completed} / {total}
        </span>
      </div>
      <div style={{ fontSize: 14, color: T.text, marginBottom: 14, lineHeight: 1.7 }}>
        <MarkdownRenderer content={b.problem} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {b.steps.map((step, idx) => {
          const result = results[idx];
          const isActive = idx === activeStep;
          const isPassed = result === "ok";
          const isLocked = idx > activeStep;

          return (
            <div
              key={idx}
              style={{
                background: isPassed ? `${T.green}08`
                          : isLocked  ? T.surface
                          : T.white,
                border: `1px solid ${isPassed ? T.green : isActive ? T.cyan : T.border}`,
                borderRadius: 12, padding: "12px 14px", opacity: isLocked ? 0.55 : 1,
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                  background: isPassed ? T.green : isActive ? T.cyan : T.border,
                  color: T.white, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                }}>
                  {isPassed ? <CheckCircle2 size={13} /> : idx + 1}
                </div>
                <div style={{ flex: 1, fontSize: 14, color: T.text, lineHeight: 1.55 }}>
                  <MarkdownRenderer content={step.prompt} compact />
                </div>
              </div>
              {!isLocked && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 30 }}>
                  <input
                    type="text"
                    value={values[idx] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [idx]: e.target.value }))}
                    disabled={isPassed}
                    placeholder="твой ответ"
                    style={{
                      flex: 1, padding: "8px 12px", fontSize: 14, fontFamily: "monospace",
                      border: `1px solid ${result === "ok" ? T.green : result === "bad" ? T.red : T.border}`,
                      borderRadius: 8, outline: "none",
                      background: result === "ok" ? `${T.green}10`
                                : result === "bad" ? `${T.red}10` : T.white,
                      color: T.text,
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") tryStep(idx); }}
                  />
                  {!isPassed && (
                    <button
                      type="button"
                      onClick={() => tryStep(idx)}
                      style={{
                        background: T.cyan, color: T.white, border: "none",
                        padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  )}
                  {step.hint && !isPassed && (
                    <button
                      type="button"
                      onClick={() => setShowHints((s) => ({ ...s, [idx]: !s[idx] }))}
                      style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: T.amber, padding: 4, display: "flex",
                      }}
                      title="Подсказка"
                    >
                      <Lightbulb size={14} />
                    </button>
                  )}
                </div>
              )}
              {showHints[idx] && step.hint && !isPassed && (
                <div style={{
                  marginTop: 8, marginLeft: 30, padding: "8px 12px", background: T.amberLight,
                  borderRadius: 8, fontSize: 12, color: T.text, lineHeight: 1.5,
                }}>
                  <strong style={{ color: T.amber }}>Подсказка: </strong>{step.hint}
                </div>
              )}
              {isPassed && step.explanation && (
                <div style={{
                  marginTop: 8, marginLeft: 30, padding: "8px 12px", background: `${T.green}10`,
                  borderRadius: 8, fontSize: 12, color: T.text, lineHeight: 1.55,
                }}>
                  <strong style={{ color: T.green }}>Верно: </strong>
                  <MarkdownRenderer content={step.explanation} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
