/**
 * KnowledgeGraphTreePage — depth-based tree with cross-section connections.
 *
 * Layout idea (from the user's design sketch):
 *   depth(node) = max length of a prerequisite chain reaching this node.
 *   Nodes at the same depth share a horizontal layer.
 *   Bottom layer = "фундамент" (no prereqs).
 *   Top layer    = most advanced topics.
 *
 * Cross-section edges (e.g. "Матрицы → Градиентный спуск") are drawn as
 * dashed lines, intra-section as solid lines. Hovering a node lights up
 * its full dependency chain so the student can see WHAT IT UNLOCKS and
 * WHAT IT DEPENDS ON.
 *
 * Personalization layers:
 *   - kg_mastery_summary     → status + color
 *   - personal_kg_nodes      → AI-chat ring + mention badge (realtime!)
 *   - math_topic_progress    → practice tick + stats
 *   - Applications panel     → cross-domain synthesis ("ML, PageRank, A/B")
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  BookOpen,
  Target,
  TrendingUp,
  Zap,
  X,
  ArrowRight,
  Sparkles,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Maximize2,
  ListPlus,
  Check,
} from "lucide-react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import {
  listLearningPlans,
  createLearningPlan,
  addLearningPlanItem,
  type LearningPlan,
} from "../lib/learningPlans";
import {
  MATH_COURSE_ID,
  MATH_SECTIONS,
  MATH_ALL_EDGES,
  MATH_APPLICATIONS,
  MATH_CROSS_PREREQUISITES,
  MATH_TOPIC_BY_CONCEPT_ID,
  type MathApplication,
} from "../lib/courseTopics";

// ─── Types ──────────────────────────────────────────────────────────────────────

type MasteryStatus = "mastered" | "in_progress" | "weak_spot" | "unknown" | "fading";

interface MasteryRow {
  concept_id: string;
  p_mastery: number;
  status: MasteryStatus;
}

interface PersonalNode {
  id: string;
  label: string;
  domain: string;
  global_concept_id: string | null;
  mention_count: number;
  mastery_score: number;
  source_topic: string | null;
  last_seen_at: string;
  first_seen_at: string;
}

interface TopicProgressRow {
  topic: string;
  page_type: string;
  completed: boolean;
  score: number | null;
  time_spent_seconds: number;
  last_visited_at: string;
}

interface NodeData {
  conceptId: string;
  name: string;
  shortLabel: string;
  whyItMatters: string;
  section: string;
  sectionIdx: number;
  depth: number;
  p_mastery: number;
  status: MasteryStatus;
  mentionCount: number;
  personalNode: PersonalNode | null;
  practiceScore: number | null;
  practiceCompleted: boolean;
  timePracticed: number;
  practiceLastVisited: string | null;
  x: number;
  y: number;
}

interface EdgeData {
  from: string;
  to: string;
  cross: boolean;
  reason?: string;
}

// ─── Section colors ─────────────────────────────────────────────────────────────

const SECTION_COLORS = [
  { fill: "#4f46e5", mid: "#a5b4fc", stroke: "#3730a3", light: "#eef2ff" }, // indigo  – Лин. алгебра
  { fill: "#7c3aed", mid: "#c4b5fd", stroke: "#5b21b6", light: "#f5f3ff" }, // violet  – Мат. анализ
  { fill: "#0ea5e9", mid: "#7dd3fc", stroke: "#0369a1", light: "#f0f9ff" }, // sky     – Теор. вер.
  { fill: "#06b6d4", mid: "#67e8f9", stroke: "#0e7490", light: "#ecfeff" }, // cyan    – Мат. стат.
  { fill: "#10b981", mid: "#6ee7b7", stroke: "#065f46", light: "#ecfdf5" }, // emerald – Дискр. мат.
  { fill: "#f59e0b", mid: "#fcd34d", stroke: "#b45309", light: "#fffbeb" }, // amber   – Числ. методы
];

const OVERRIDE_FILL: Partial<Record<MasteryStatus, { fill: string; stroke: string; text: string }>> = {
  weak_spot: { fill: "#ef4444", stroke: "#b91c1c", text: "white" },
  fading:    { fill: "#f59e0b", stroke: "#d97706", text: "white" },
};

function nodeColor(sectionIdx: number, status: MasteryStatus) {
  if (OVERRIDE_FILL[status]) return OVERRIDE_FILL[status]!;
  const sc = SECTION_COLORS[sectionIdx] ?? SECTION_COLORS[0];
  if (status === "mastered")    return { fill: sc.fill,   stroke: sc.stroke, text: "white"   };
  if (status === "in_progress") return { fill: sc.mid,    stroke: sc.stroke, text: "#1e293b" };
  return { fill: "white", stroke: sc.stroke, text: sc.stroke };
}

const STATUS_LABEL: Record<MasteryStatus, string> = {
  mastered: "Освоено", in_progress: "В процессе", weak_spot: "Слабое место",
  fading: "Угасает",   unknown: "Не начато",
};

const STATUS_BADGE_CLS: Record<MasteryStatus, string> = {
  mastered:    "bg-emerald-100 text-emerald-800 border border-emerald-200",
  in_progress: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  weak_spot:   "bg-red-100 text-red-800 border border-red-200",
  fading:      "bg-amber-100 text-amber-800 border border-amber-200",
  unknown:     "bg-slate-100 text-slate-600 border border-slate-200",
};

const STATUS_BAR_CLS: Record<MasteryStatus, string> = {
  mastered: "bg-emerald-500", in_progress: "bg-indigo-500",
  weak_spot: "bg-red-500",    fading: "bg-amber-400", unknown: "bg-slate-300",
};

// ─── Layout constants ───────────────────────────────────────────────────────────

const NODE_R    = 20;
const PAD_X     = 60;
const PAD_TOP   = 56;
const PAD_BOT   = 80;
const LAYER_GAP = 110;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  if (s < 60) return `${s}с`;
  if (s < 3600) return `${Math.round(s / 60)}м`;
  return `${(s / 3600).toFixed(1)}ч`;
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
function topicRoute(name: string) {
  return `/subjects/mathematics/topics/${encodeURIComponent(name)}`;
}
function pluralRaz(n: number) {
  return n === 1 ? "раз" : n < 5 ? "раза" : "раз";
}

// ─── Depth-based layout (Sugiyama-lite: depth + barycenter ordering) ─────────────

function computeLayout(
  nodes: { conceptId: string; sectionIdx: number; name: string; shortLabel: string; whyItMatters: string; section: string }[],
  edges: EdgeData[],
  width: number,
): { positions: Map<string, { x: number; y: number; depth: number }>; height: number } {
  // depth = longest path from any root reaching this node
  const inEdges = new Map<string, string[]>();
  for (const n of nodes) inEdges.set(n.conceptId, []);
  for (const e of edges) inEdges.get(e.to)?.push(e.from);

  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  function dfs(id: string): number {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const pre = inEdges.get(id) ?? [];
    const d = pre.length === 0 ? 0 : 1 + Math.max(...pre.map(dfs));
    visiting.delete(id);
    depth.set(id, d);
    return d;
  }
  for (const n of nodes) dfs(n.conceptId);

  const maxDepth = Math.max(0, ...Array.from(depth.values()));
  const layers: string[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const n of nodes) layers[depth.get(n.conceptId) ?? 0].push(n.conceptId);

  // Initial ordering: by section index then by name length
  const sectionOf = new Map(nodes.map((n) => [n.conceptId, n.sectionIdx]));
  for (const layer of layers) {
    layer.sort((a, b) => {
      const sa = sectionOf.get(a) ?? 0;
      const sb = sectionOf.get(b) ?? 0;
      if (sa !== sb) return sa - sb;
      return a.localeCompare(b);
    });
  }

  // Barycenter sweep to reduce edge crossings (3 passes up, 3 down)
  const outEdges = new Map<string, string[]>();
  for (const n of nodes) outEdges.set(n.conceptId, []);
  for (const e of edges) outEdges.get(e.from)?.push(e.to);

  function positionInLayer(id: string, layer: string[]): number {
    return layer.indexOf(id);
  }

  for (let pass = 0; pass < 4; pass++) {
    // upward: order layer L by average position of its predecessors in L-1
    for (let li = 1; li <= maxDepth; li++) {
      const layer = layers[li];
      const prevLayer = layers[li - 1];
      layer.sort((a, b) => {
        const pa = (inEdges.get(a) ?? [])
          .map((p) => positionInLayer(p, prevLayer))
          .filter((p) => p >= 0);
        const pb = (inEdges.get(b) ?? [])
          .map((p) => positionInLayer(p, prevLayer))
          .filter((p) => p >= 0);
        const ba = pa.length ? pa.reduce((s, x) => s + x, 0) / pa.length : positionInLayer(a, layer);
        const bb = pb.length ? pb.reduce((s, x) => s + x, 0) / pb.length : positionInLayer(b, layer);
        return ba - bb;
      });
    }
    // downward: order layer L by average position of its successors in L+1
    for (let li = maxDepth - 1; li >= 0; li--) {
      const layer = layers[li];
      const nextLayer = layers[li + 1];
      layer.sort((a, b) => {
        const sa = (outEdges.get(a) ?? [])
          .map((s) => positionInLayer(s, nextLayer))
          .filter((p) => p >= 0);
        const sb = (outEdges.get(b) ?? [])
          .map((s) => positionInLayer(s, nextLayer))
          .filter((p) => p >= 0);
        const ba = sa.length ? sa.reduce((s, x) => s + x, 0) / sa.length : positionInLayer(a, layer);
        const bb = sb.length ? sb.reduce((s, x) => s + x, 0) / sb.length : positionInLayer(b, layer);
        return ba - bb;
      });
    }
  }

  // Assign coordinates
  const positions = new Map<string, { x: number; y: number; depth: number }>();
  const usableW = width - PAD_X * 2;
  const height = PAD_TOP + PAD_BOT + Math.max(1, maxDepth) * LAYER_GAP;

  layers.forEach((layer, li) => {
    const y = height - PAD_BOT - li * LAYER_GAP;
    const n = layer.length;
    layer.forEach((id, i) => {
      const x = n === 1 ? width / 2 : PAD_X + ((i + 0.5) / n) * usableW;
      positions.set(id, { x, y, depth: li });
    });
  });

  return { positions, height };
}

// ─── Stat chip ──────────────────────────────────────────────────────────────────

function Chip({ icon, value, label, color = "text-on-surface-variant" }: {
  icon: ReactNode; value: number; label: string; color?: string;
}) {
  if (value === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1
      rounded-full bg-surface-container border border-outline-variant/20 ${color}`}>
      {icon}<strong>{value}</strong>&nbsp;{label}
    </span>
  );
}

// ─── Toast for realtime new concept ─────────────────────────────────────────────

function NewConceptToast({ label, onDismiss }: { label: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5
      bg-violet-700 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl
      animate-in slide-in-from-bottom-3 duration-300">
      <Sparkles size={14} />
      <span>Новая тема в граф: <strong>{label}</strong></span>
      <button onClick={onDismiss} className="ml-1 opacity-70 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

// ─── Hover tooltip (Obsidian-style: deps + unlocks + reason) ────────────────────

function HoverCard({
  node,
  dependsOn,
  unlocks,
  x,
  y,
}: {
  node: NodeData;
  dependsOn: { node: NodeData; reason?: string; cross: boolean }[];
  unlocks: { node: NodeData; reason?: string; cross: boolean }[];
  x: number;
  y: number;
}) {
  // Position tooltip clamped to container
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${x}px`,
    top:  `${y + 30}px`,
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: 30,
  };
  const sc = SECTION_COLORS[node.sectionIdx] ?? SECTION_COLORS[0];

  return (
    <div style={style}
      className="w-72 rounded-xl bg-white shadow-xl border border-slate-200 p-3.5 space-y-2.5 animate-in fade-in duration-150">
      <div>
        <p className="text-[9px] uppercase tracking-[0.18em] mb-0.5" style={{ color: sc.fill }}>
          {node.section}
        </p>
        <p className="text-sm font-bold text-slate-900 leading-tight">{node.name}</p>
        {node.whyItMatters && (
          <p className="text-[11px] text-slate-600 mt-1 leading-snug">{node.whyItMatters}</p>
        )}
      </div>

      {/* Mastery mini bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${STATUS_BAR_CLS[node.status]}`}
            style={{ width: `${Math.max(Math.round(node.p_mastery * 100), 2)}%` }} />
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-700">
          {Math.round(node.p_mastery * 100)}%
        </span>
      </div>

      {dependsOn.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1 flex items-center gap-1">
            <ArrowDown size={9} /> Опирается на
          </p>
          <div className="space-y-1">
            {dependsOn.slice(0, 4).map(({ node: n, reason, cross }) => {
              const c = SECTION_COLORS[n.sectionIdx] ?? SECTION_COLORS[0];
              return (
                <div key={n.conceptId} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: c.fill }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">
                      {n.name}
                      {cross && (
                        <span className="ml-1 text-[9px] text-violet-600 font-normal">
                          ({n.section})
                        </span>
                      )}
                    </p>
                    {reason && <p className="text-[10px] text-slate-500 leading-snug">{reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unlocks.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mb-1 flex items-center gap-1">
            <ArrowUp size={9} /> Открывает темы
          </p>
          <div className="space-y-1">
            {unlocks.slice(0, 4).map(({ node: n, reason, cross }) => {
              const c = SECTION_COLORS[n.sectionIdx] ?? SECTION_COLORS[0];
              return (
                <div key={n.conceptId} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: c.fill }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">
                      {n.name}
                      {cross && (
                        <span className="ml-1 text-[9px] text-violet-600 font-normal">
                          ({n.section})
                        </span>
                      )}
                    </p>
                    {reason && <p className="text-[10px] text-slate-500 leading-snug">{reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-100">
        Клик — открыть детали и перейти к теме
      </p>
    </div>
  );
}

// ─── Add-to-plan button + popover ───────────────────────────────────────────────

function AddToPlanButton({ conceptId, conceptName }: { conceptId: string; conceptName: string }) {
  const { user } = useAuth();
  const [open, setOpen]         = useState(false);
  const [plans, setPlans]       = useState<LearningPlan[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  // Local optimistic tracking of plans that already contain this concept after we add it.
  const [addedTo, setAddedTo]   = useState<Set<string>>(new Set());
  const popRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset tracked-added set when concept changes (different node selected).
  useEffect(() => {
    setAddedTo(new Set());
    setError(null);
  }, [conceptId]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listLearningPlans();
      setPlans(list.filter((p) => !p.is_archived));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить планы');
    } finally {
      setLoading(false);
    }
  };

  const openPopover = () => {
    setOpen(true);
    if (plans === null) void loadPlans();
  };

  const containsConcept = (plan: LearningPlan): boolean =>
    addedTo.has(plan.id) || (plan.items ?? []).some((it) => it.concept_id === conceptId);

  const handleAdd = async (planId: string) => {
    setError(null);
    try {
      await addLearningPlanItem(planId, { conceptId });
      setAddedTo((prev) => new Set(prev).add(planId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить');
    }
  };

  const handleCreateAndAdd = async () => {
    setError(null);
    setLoading(true);
    try {
      const plan = await createLearningPlan({ title: 'Мой план' });
      await addLearningPlanItem(plan.id, { conceptId });
      setPlans((prev) => (prev ? [{ ...plan, items: [] }, ...prev] : [{ ...plan, items: [] }]));
      setAddedTo((prev) => new Set(prev).add(plan.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать план');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl
          border border-outline-variant/30 bg-surface-container text-on-surface-variant text-[11px] font-semibold
          hover:bg-surface-container-low transition-colors"
      >
        <span className="flex items-center gap-1.5"><ListPlus size={12} /> Добавить в план</span>
        <ArrowRight size={12} className={open ? 'rotate-90 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`Добавить «${conceptName}» в план обучения`}
          className="absolute z-30 right-0 mt-1.5 w-64 rounded-xl border border-outline-variant/30 bg-surface
            shadow-lg p-1.5 text-xs"
        >
          {loading && plans === null ? (
            <div className="px-3 py-2 text-on-surface-variant">Загружаю планы…</div>
          ) : (
            <>
              {plans && plans.length === 0 && (
                <div className="px-3 py-2 text-on-surface-variant leading-snug">
                  У тебя ещё нет планов. Создадим первый?
                </div>
              )}
              {plans && plans.length > 0 && (
                <ul className="max-h-56 overflow-y-auto">
                  {plans.map((p) => {
                    const already = containsConcept(p);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={already}
                          onClick={() => handleAdd(p.id)}
                          className={`flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left transition-colors ${
                            already
                              ? 'text-on-surface-variant cursor-default'
                              : 'hover:bg-surface-container-low text-primary'
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          {already ? <Check size={12} className="text-emerald-600 shrink-0 ml-2" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                onClick={handleCreateAndAdd}
                disabled={loading}
                className="flex items-center gap-1.5 w-full mt-1 px-2.5 py-2 rounded-lg
                  text-primary hover:bg-surface-container-low transition-colors disabled:opacity-60"
              >
                <Plus size={12} /> Новый план «Мой план»
              </button>
              {error && (
                <p className="px-2.5 py-1.5 text-[10px] text-red-600 leading-snug">{error}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ───────────────────────────────────────────────────────────────

function DetailPanel({
  node,
  isRecommended,
  personalNode,
  dependsOn,
  unlocks,
  applications,
  onClose,
}: {
  node: NodeData;
  isRecommended: boolean;
  personalNode: PersonalNode | null;
  dependsOn: { node: NodeData; reason?: string; cross: boolean }[];
  unlocks:   { node: NodeData; reason?: string; cross: boolean }[];
  applications: MathApplication[];
  onClose: () => void;
}) {
  const pct = Math.round(node.p_mastery * 100);
  const sc  = SECTION_COLORS[node.sectionIdx] ?? SECTION_COLORS[0];

  const dialoguePath = (() => {
    if (!personalNode) return null;
    if (personalNode.source_topic) return topicRoute(personalNode.source_topic);
    const entry = MATH_TOPIC_BY_CONCEPT_ID[node.conceptId];
    if (entry) return topicRoute(entry.topic.name);
    return "/mentor";
  })();

  return (
    <div className="w-80 shrink-0 rounded-2xl border border-outline-variant/20
      bg-surface-container-lowest p-5 space-y-4 animate-in slide-in-from-right-3 duration-200">

      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: sc.fill }}>
            {node.section}
          </p>
          <h3 className="text-sm font-bold text-primary leading-snug">{node.name}</h3>
        </div>
        <button onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant mt-0.5">
          <X size={14} />
        </button>
      </div>

      {/* Why it matters */}
      {node.whyItMatters && (
        <div className="rounded-xl p-3 text-[11px] leading-snug" style={{ background: sc.light, color: sc.stroke }}>
          <strong>Зачем это нужно: </strong>{node.whyItMatters}
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_CLS[node.status]}`}>
          {STATUS_LABEL[node.status]}
        </span>
        {isRecommended && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
            bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Zap size={9} /> Следующий шаг
          </span>
        )}
        {node.practiceCompleted && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
            bg-emerald-100 text-emerald-800 border border-emerald-200">✓ Практика</span>
        )}
      </div>

      {/* Mastery bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-on-surface-variant">Освоение (BKT)</span>
          <span className="font-mono font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR_CLS[node.status]}`}
            style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
      </div>

      <div className="border-t border-outline-variant/15" />

      {/* Dependencies */}
      {dependsOn.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant flex items-center gap-1">
            <ArrowDown size={9} /> Опирается на {dependsOn.length}
          </p>
          <div className="space-y-1.5">
            {dependsOn.map(({ node: n, reason, cross }) => {
              const c = SECTION_COLORS[n.sectionIdx] ?? SECTION_COLORS[0];
              return (
                <div key={n.conceptId} className="rounded-lg bg-surface-container p-2 space-y-0.5">
                  <Link to={topicRoute(n.name)} className="flex items-center gap-1.5 hover:underline">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.fill }} />
                    <span className="text-[11px] font-semibold text-primary flex-1">{n.name}</span>
                    {cross && <span className="text-[9px] text-violet-600">↗</span>}
                  </Link>
                  {reason && <p className="text-[10px] text-on-surface-variant/80 ml-3.5 leading-snug">{reason}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unlocks */}
      {unlocks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant flex items-center gap-1">
            <ArrowUp size={9} /> Открывает {unlocks.length}
          </p>
          <div className="space-y-1.5">
            {unlocks.map(({ node: n, reason, cross }) => {
              const c = SECTION_COLORS[n.sectionIdx] ?? SECTION_COLORS[0];
              return (
                <div key={n.conceptId} className="rounded-lg bg-surface-container p-2 space-y-0.5">
                  <Link to={topicRoute(n.name)} className="flex items-center gap-1.5 hover:underline">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.fill }} />
                    <span className="text-[11px] font-semibold text-primary flex-1">{n.name}</span>
                    {cross && <span className="text-[9px] text-violet-600">↗</span>}
                  </Link>
                  {reason && <p className="text-[10px] text-on-surface-variant/80 ml-3.5 leading-snug">{reason}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Applications using this topic */}
      {applications.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700 flex items-center gap-1">
            <Sparkles size={10} /> Применяется в
          </p>
          <ul className="space-y-1">
            {applications.map((a) => (
              <li key={a.id} className="text-[11px] text-amber-800">
                <span className="mr-1">{a.emoji}</span><strong>{a.title}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI chat */}
      {node.mentionCount > 0 && (
        <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5 space-y-2">
          <p className="text-[11px] text-violet-800 flex items-center gap-1.5">
            <MessageCircle size={12} className="text-violet-500" />
            Обсуждалось с ментором <strong>{node.mentionCount}</strong> {pluralRaz(node.mentionCount)}
          </p>
          {personalNode?.last_seen_at && (
            <p className="text-[10px] text-violet-600/70">Последний раз: {fmtDate(personalNode.last_seen_at)}</p>
          )}
          {dialoguePath && (
            <Link to={dialoguePath}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 hover:text-violet-900 transition-colors">
              <RotateCcw size={11} /> Вспомнить диалог →
            </Link>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <Link to={topicRoute(node.name)}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
          style={{ background: sc.fill }}>
          <span className="flex items-center gap-1.5"><BookOpen size={12} /> Теория и практика</span>
          <ArrowRight size={12} />
        </Link>
        <Link to={`/mentor?topic=${encodeURIComponent(node.name)}`}
          className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl
            border border-outline-variant/30 bg-surface-container text-on-surface-variant text-[11px] font-semibold
            hover:bg-surface-container-low transition-colors">
          <span className="flex items-center gap-1.5"><MessageCircle size={12} /> Спросить ментора</span>
          <ArrowRight size={12} />
        </Link>
        <AddToPlanButton conceptId={node.conceptId} conceptName={node.name} />
      </div>

      {/* Practice stats */}
      {node.practiceLastVisited && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl bg-surface-container p-2.5 text-center">
            <p className="text-base font-bold text-primary">
              {node.practiceScore !== null ? `${Math.round(node.practiceScore * 100)}%` : "—"}
            </p>
            <p className="text-[9px] text-on-surface-variant">Практика</p>
          </div>
          <div className="rounded-xl bg-surface-container p-2.5 text-center">
            <p className="text-base font-bold text-primary">{fmtTime(node.timePracticed)}</p>
            <p className="text-[9px] text-on-surface-variant">Времени</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Applications panel (real-world synthesis) ──────────────────────────────────

function ApplicationsPanel({
  apps,
  topicsByConceptId,
  onHighlight,
}: {
  apps: MathApplication[];
  topicsByConceptId: Map<string, NodeData>;
  onHighlight: (conceptIds: string[] | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-1">
          Зачем учить эти темы вместе?
        </p>
        <p className="text-sm font-bold text-primary">Реальные применения на стыке разделов</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">
          Наведи на карточку — на графе подсветятся темы, которые работают вместе.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {apps.map((app) => {
          const ready = app.topics.filter((id) => {
            const n = topicsByConceptId.get(id);
            return n && (n.status === "mastered" || n.status === "in_progress");
          }).length;
          const total = app.topics.length;
          return (
            <button
              key={app.id}
              onMouseEnter={() => onHighlight(app.topics)}
              onMouseLeave={() => onHighlight(null)}
              className="text-left rounded-2xl border border-outline-variant/20 bg-surface-container-lowest
                hover:border-amber-300 hover:shadow-md transition-all p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-2xl leading-none">{app.emoji}</div>
                <span className="text-[10px] font-mono text-on-surface-variant">{ready}/{total}</span>
              </div>
              <p className="text-sm font-bold text-primary leading-snug">{app.title}</p>
              <p className="text-[11px] text-on-surface-variant leading-snug">{app.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {app.topics.map((tid) => {
                  const n = topicsByConceptId.get(tid);
                  if (!n) return null;
                  const c = SECTION_COLORS[n.sectionIdx] ?? SECTION_COLORS[0];
                  const isReady = n.status === "mastered" || n.status === "in_progress";
                  return (
                    <span key={tid}
                      className="text-[9px] px-1.5 py-0.5 rounded-md border"
                      style={{
                        borderColor: c.fill,
                        background: isReady ? c.fill : "transparent",
                        color: isReady ? "white" : c.stroke,
                      }}>
                      {n.shortLabel ?? n.name.slice(0, 8)}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Personal cloud (non-course concepts from chat) ─────────────────────────────

function PersonalCloudPanel({
  nodes,
  onSelect,
}: {
  nodes: PersonalNode[];
  onSelect: (n: PersonalNode) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-violet-700 flex items-center gap-1.5">
          <Sparkles size={10} /> Открыто в диалогах с AI
        </p>
        <p className="text-[10px] text-violet-600/80 mt-1">
          Концепты, которые появились при общении с ментором и пока не входят в программу курса.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {nodes.map((n) => (
          <button key={n.id} onClick={() => onSelect(n)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
              bg-white border border-violet-200 text-[11px] font-medium text-violet-800
              hover:bg-violet-100 transition-colors">
            <MessageCircle size={10} className="text-violet-500" />
            {n.label}
            {n.mention_count > 1 && <span className="text-[9px] text-violet-500">×{n.mention_count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function PersonalConceptModal({ node, onClose }: { node: PersonalNode; onClose: () => void }) {
  const dialoguePath = node.source_topic ? topicRoute(node.source_topic) : "/mentor";
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-wide text-violet-600 mb-0.5">Личный концепт · {node.domain}</p>
            <h3 className="text-sm font-bold text-primary">{node.label}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant">
            <X size={14} />
          </button>
        </div>
        <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5 space-y-1.5">
          <p className="text-[11px] text-violet-800 flex items-center gap-1.5">
            <MessageCircle size={12} className="text-violet-500" />
            Упоминалось в чате <strong>{node.mention_count}</strong> {pluralRaz(node.mention_count)}
          </p>
          <p className="text-[10px] text-violet-600/70">Первый раз: {fmtDate(node.first_seen_at)}</p>
        </div>
        <div className="space-y-2">
          <Link to={dialoguePath}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl
              bg-violet-600 text-white text-[11px] font-semibold hover:opacity-90 transition-opacity">
            <span className="flex items-center gap-1.5"><RotateCcw size={12} /> Вспомнить диалог</span>
            <ArrowRight size={12} />
          </Link>
          <Link to={`/mentor?q=${encodeURIComponent(node.label)}`}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl
              border border-outline-variant/30 bg-surface-container text-on-surface-variant text-[11px] font-semibold
              hover:bg-surface-container-low transition-colors">
            <span className="flex items-center gap-1.5"><MessageCircle size={12} /> Обсудить снова</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function KnowledgeGraphTreePage() {
  const { user } = useAuth();

  const [masteryRows, setMasteryRows]     = useState<MasteryRow[]>([]);
  const [personalNodes, setPersonalNodes] = useState<PersonalNode[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgressRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [svgWidth, setSvgWidth]           = useState(1100);
  const [selected, setSelected]           = useState<string | null>(null);
  const [hoveredId, setHoveredId]         = useState<string | null>(null);
  const [hoverXY, setHoverXY]             = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [appHighlight, setAppHighlight]   = useState<Set<string> | null>(null);
  // Empty Set ⇒ "all sections shown"; non-empty ⇒ show only those section indices.
  const [sectionFilter, setSectionFilter] = useState<Set<number>>(new Set());
  const [searchParams, setSearchParams]   = useSearchParams();
  const searchQuery = (searchParams.get('q') ?? '').trim();
  const [toast, setToast]                 = useState<string | null>(null);
  const [cloudModal, setCloudModal]       = useState<PersonalNode | null>(null);
  const [newConceptId, setNewConceptId]   = useState<string | null>(null);
  const newConceptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomRef = useRef<ReactZoomPanPinchRef | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Track container width ────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(800, entries[0].contentRect.width - 16);
      setSvgWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Initial data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let mounted = true;
    Promise.all([
      supabase.from("kg_mastery_summary")
        .select("concept_id, p_mastery, status")
        .eq("user_id", user.id).eq("course_id", MATH_COURSE_ID),
      supabase.from("personal_kg_nodes")
        .select("id, label, domain, global_concept_id, mention_count, mastery_score, source_topic, last_seen_at, first_seen_at")
        .eq("user_id", user.id),
      supabase.from("math_topic_progress")
        .select("topic, page_type, completed, score, time_spent_seconds, last_visited_at")
        .eq("user_id", user.id),
    ]).then(([m, p, t]) => {
      if (!mounted) return;
      setMasteryRows((m.data as MasteryRow[]) ?? []);
      setPersonalNodes((p.data as PersonalNode[]) ?? []);
      setTopicProgress((t.data as TopicProgressRow[]) ?? []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [user?.id]);

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`personal-kg-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "personal_kg_nodes",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as PersonalNode;
        setPersonalNodes((prev) => prev.some((p) => p.id === n.id) ? prev : [...prev, n]);
        const animId = n.global_concept_id ?? n.label;
        setNewConceptId(animId);
        setToast(n.label);
        if (newConceptTimer.current) clearTimeout(newConceptTimer.current);
        newConceptTimer.current = setTimeout(() => setNewConceptId(null), 3500);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "personal_kg_nodes",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as PersonalNode;
        setPersonalNodes((prev) => prev.map((p) => (p.id === n.id ? n : p)));
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
      if (newConceptTimer.current) clearTimeout(newConceptTimer.current);
    };
  }, [user?.id]);

  // ── Maps from raw data ──────────────────────────────────────────────────────
  const masteryMap = useMemo(() => {
    const m = new Map<string, MasteryRow>();
    for (const r of masteryRows) m.set(r.concept_id, r);
    return m;
  }, [masteryRows]);

  const personalByCid = useMemo(() => {
    const m = new Map<string, PersonalNode>();
    for (const n of personalNodes) if (n.global_concept_id) m.set(n.global_concept_id, n);
    return m;
  }, [personalNodes]);

  const personalByLabel = useMemo(() => {
    const m = new Map<string, PersonalNode>();
    for (const n of personalNodes) m.set(n.label.toLowerCase().trim(), n);
    return m;
  }, [personalNodes]);

  const progressByTopic = useMemo(() => {
    const m = new Map<string, { score: number | null; completed: boolean; time: number; lastVisited: string }>();
    for (const r of topicProgress) {
      const k = r.topic.toLowerCase().trim();
      const ex = m.get(k);
      if (!ex || r.last_visited_at > ex.lastVisited) {
        m.set(k, { score: r.score, completed: r.completed, time: r.time_spent_seconds, lastVisited: r.last_visited_at });
      }
    }
    return m;
  }, [topicProgress]);

  // ── Compute layout once edges + width are known ─────────────────────────────
  const rawNodes = useMemo(() => MATH_SECTIONS.flatMap((s, si) =>
    s.topics.map((t) => ({
      conceptId:    t.conceptId,
      sectionIdx:   si,
      section:      s.title,
      name:         t.name,
      shortLabel:   t.shortLabel ?? t.name.slice(0, 8),
      whyItMatters: t.whyItMatters ?? "",
    })),
  ), []);

  const layout = useMemo(
    () => computeLayout(rawNodes, MATH_ALL_EDGES, svgWidth),
    [rawNodes, svgWidth],
  );

  // ── Final NodeData with mastery + personal + practice ───────────────────────
  const nodes = useMemo<NodeData[]>(() => {
    return rawNodes.map((rn) => {
      const pos = layout.positions.get(rn.conceptId);
      const mastery = masteryMap.get(rn.conceptId);
      const personal = personalByCid.get(rn.conceptId)
        ?? personalByLabel.get(rn.name.toLowerCase().trim());
      const prog = progressByTopic.get(rn.name.toLowerCase().trim());
      return {
        ...rn,
        depth: pos?.depth ?? 0,
        x: pos?.x ?? 0,
        y: pos?.y ?? 0,
        p_mastery: mastery?.p_mastery ?? 0,
        status: mastery?.status ?? "unknown",
        mentionCount: personal?.mention_count ?? 0,
        personalNode: personal ?? null,
        practiceScore: prog?.score ?? null,
        practiceCompleted: prog?.completed ?? false,
        timePracticed: prog?.time ?? 0,
        practiceLastVisited: prog?.lastVisited ?? null,
      };
    });
  }, [rawNodes, layout, masteryMap, personalByCid, personalByLabel, progressByTopic]);

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.conceptId, n])), [nodes]);

  // Cloud nodes (chat concepts not in course)
  const cloudNodes = useMemo(() =>
    personalNodes.filter((n) =>
      !n.global_concept_id
      && !nodes.some((nd) => nd.name.toLowerCase().trim() === n.label.toLowerCase().trim())),
    [personalNodes, nodes],
  );

  // Cross-prereq reasons lookup
  const reasonByEdge = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of MATH_CROSS_PREREQUISITES) m.set(`${e.from}→${e.to}`, e.reason);
    return m;
  }, []);

  // For a given node: its direct dependsOn / unlocks with reasons
  function buildNeighbors(nid: string) {
    const dependsOn: { node: NodeData; reason?: string; cross: boolean }[] = [];
    const unlocks:   { node: NodeData; reason?: string; cross: boolean }[] = [];
    for (const e of MATH_ALL_EDGES) {
      if (e.to === nid) {
        const n = nodesById.get(e.from);
        if (n) dependsOn.push({ node: n, reason: e.cross ? reasonByEdge.get(`${e.from}→${e.to}`) : undefined, cross: e.cross });
      }
      if (e.from === nid) {
        const n = nodesById.get(e.to);
        if (n) unlocks.push({ node: n, reason: e.cross ? reasonByEdge.get(`${e.from}→${e.to}`) : undefined, cross: e.cross });
      }
    }
    return { dependsOn, unlocks };
  }

  // Recommended next: first unknown node whose all prereqs are started or mastered
  const recommendedConceptId = useMemo(() => {
    const masterySet = new Set<string>();
    for (const r of masteryRows) {
      if (r.status === "mastered" || r.status === "in_progress" || r.status === "fading") masterySet.add(r.concept_id);
    }
    for (let depth = 0; depth <= Math.max(...nodes.map((n) => n.depth)); depth++) {
      for (const n of nodes) {
        if (n.depth !== depth) continue;
        if (n.status !== "unknown") continue;
        const prereqs = MATH_ALL_EDGES.filter((e) => e.to === n.conceptId).map((e) => e.from);
        const allReady = prereqs.length === 0 || prereqs.every((p) => masterySet.has(p));
        if (allReady) return n.conceptId;
      }
    }
    return null;
  }, [nodes, masteryRows]);

  // Stats
  const stats = useMemo(() => ({
    mastered:   nodes.filter((n) => n.status === "mastered").length,
    inProgress: nodes.filter((n) => n.status === "in_progress").length,
    weak:       nodes.filter((n) => n.status === "weak_spot").length,
    chatCount:  nodes.filter((n) => n.mentionCount > 0).length,
    practiced:  nodes.filter((n) => n.practiceCompleted).length,
    total:      nodes.length,
  }), [nodes]);

  const overallPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  // Search + section filter set: null ⇒ no filter active.
  // Search matches `name` or `shortLabel` (case-insensitive substring).
  // Section filter narrows to selected section indices.
  const filterIds = useMemo<Set<string> | null>(() => {
    const q = searchQuery.toLowerCase();
    const hasSearch  = q.length > 0;
    const hasSection = sectionFilter.size > 0;
    if (!hasSearch && !hasSection) return null;
    const s = new Set<string>();
    for (const n of nodes) {
      if (hasSection && !sectionFilter.has(n.sectionIdx)) continue;
      if (hasSearch) {
        const hay = `${n.name} ${n.shortLabel}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      s.add(n.conceptId);
    }
    return s;
  }, [nodes, searchQuery, sectionFilter]);

  // Hover preview wins exclusively (lets the user inspect connections that
  // would otherwise be dimmed by an active filter). When there's no hover,
  // appHighlight and filterIds combine via intersection so that "Application
  // foo + search bar" narrows down rather than fights.
  const litIds = useMemo(() => {
    if (hoveredId) {
      const s = new Set<string>([hoveredId]);
      for (const e of MATH_ALL_EDGES) {
        if (e.from === hoveredId) s.add(e.to);
        if (e.to === hoveredId)   s.add(e.from);
      }
      return s;
    }
    if (appHighlight && filterIds) {
      const out = new Set<string>();
      for (const id of filterIds) if (appHighlight.has(id)) out.add(id);
      return out;
    }
    return appHighlight ?? filterIds ?? null;
  }, [hoveredId, appHighlight, filterIds]);

  // Applications using selected node
  const selectedNodeApps = useMemo(() => {
    if (!selected) return [];
    return MATH_APPLICATIONS.filter((a) => a.topics.includes(selected));
  }, [selected]);

  const selectedNode = selected ? nodesById.get(selected) ?? null : null;
  const hoveredNode  = hoveredId ? nodesById.get(hoveredId) ?? null : null;
  const hoveredNeighbors = hoveredId ? buildNeighbors(hoveredId) : null;
  const selectedNeighbors = selected ? buildNeighbors(selected) : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  const svgHeight = layout.height;

  return (
    <div ref={containerRef} className="space-y-5 pb-12">
      {toast && <NewConceptToast label={toast} onDismiss={() => setToast(null)} />}
      {cloudModal && <PersonalConceptModal node={cloudModal} onClose={() => setCloudModal(null)} />}

      {/* Header */}
      <header>
        <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">
          Мой граф знаний
        </p>
        <h1 className="text-2xl font-extrabold text-primary leading-tight mb-1">
          Как темы связаны друг с другом
        </h1>
        <p className="text-sm text-on-surface-variant">
          {stats.total} тем · снизу — фундамент, сверху — продвинутое. Пунктирные стрелки —
          связи между разделами (например, «Матрицы → Градиентный спуск»).
        </p>
      </header>

      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-on-surface-variant">Общее освоение</span>
          <span className="font-mono font-bold text-secondary">{overallPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${Math.max(overallPct, 1)}%` }} />
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        <Chip icon={<TrendingUp size={11} />}    value={stats.mastered}   label="освоено"          color="text-emerald-600" />
        <Chip icon={<Zap size={11} />}           value={stats.inProgress} label="в процессе"       color="text-indigo-600" />
        <Chip icon={<Target size={11} />}        value={stats.weak}       label="слабых мест"      color="text-red-500" />
        <Chip icon={<MessageCircle size={11} />} value={stats.chatCount}  label="обсуждено с AI"   color="text-violet-600" />
        <Chip icon={<BookOpen size={11} />}      value={stats.practiced}  label="практик пройдено" color="text-blue-600" />
        {cloudNodes.length > 0 && (
          <Chip icon={<Sparkles size={11} />}    value={cloudNodes.length} label="открыто в чате"  color="text-violet-500" />
        )}
      </div>

      {/* Section filter + match counter */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-on-surface-variant mr-1">Разделы:</span>
        {MATH_SECTIONS.map((section, idx) => {
          const sc = SECTION_COLORS[idx] ?? SECTION_COLORS[0];
          const isOn = sectionFilter.size === 0 || sectionFilter.has(idx);
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setSectionFilter((prev) => {
                  const next = new Set(prev);
                  if (next.size === 0) {
                    // First toggle: switch from "all" to "only this one"
                    next.add(idx);
                  } else if (next.has(idx)) {
                    next.delete(idx);
                  } else {
                    next.add(idx);
                  }
                  // If user disabled everything ⇒ go back to "all"
                  if (next.size === 0) return new Set();
                  if (next.size === MATH_SECTIONS.length) return new Set();
                  return next;
                });
              }}
              aria-pressed={isOn}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all"
              style={{
                borderColor: isOn ? sc.fill : 'transparent',
                background: isOn ? sc.light : 'var(--color-surface-container-low, #f3f4f6)',
                color: isOn ? sc.stroke : '#94a3b8',
                opacity: isOn ? 1 : 0.6,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: sc.fill }}
              />
              {section.title}
            </button>
          );
        })}

        {(searchQuery || sectionFilter.size > 0) && (
          <>
            <span className="text-on-surface-variant ml-2">
              {filterIds ? `${filterIds.size} из ${nodes.length}` : `0 из ${nodes.length}`}
            </span>
            <button
              type="button"
              onClick={() => {
                setSectionFilter(new Set());
                if (searchQuery) {
                  const params = new URLSearchParams(searchParams);
                  params.delete('q');
                  setSearchParams(params, { replace: true });
                }
              }}
              className="ml-1 px-2 py-1 rounded-md text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
            >
              Сбросить
            </button>
          </>
        )}
      </div>

      {/* Main row */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 relative rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block" />
              Загружаю граф знаний…
            </div>
          ) : (
            <div className="relative">
              {/* Zoom controls (overlay) */}
              <div className="absolute right-2 top-2 z-20 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => zoomRef.current?.zoomIn(0.25)}
                  aria-label="Приблизить"
                  title="Приблизить"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant/30 bg-white/90 backdrop-blur hover:bg-white shadow-sm"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => zoomRef.current?.zoomOut(0.25)}
                  aria-label="Отдалить"
                  title="Отдалить"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant/30 bg-white/90 backdrop-blur hover:bg-white shadow-sm"
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => zoomRef.current?.resetTransform()}
                  aria-label="Уместить на экран"
                  title="Уместить на экран"
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant/30 bg-white/90 backdrop-blur hover:bg-white shadow-sm"
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              <TransformWrapper
                ref={zoomRef}
                minScale={0.4}
                maxScale={3}
                initialScale={1}
                limitToBounds={false}
                centerZoomedOut
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: true }}
                // Don't start a pan when the pointer goes down on a node — let the
                // node's own onClick run; pan only when grabbing empty canvas.
                panning={{ excluded: ["kg-tree-node"] }}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: svgHeight, cursor: "grab" }}
                  contentStyle={{ width: svgWidth, height: svgHeight }}
                >
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="block"
                style={{ fontFamily: "inherit" }}
                onClick={() => { setSelected(null); }}
              >
                <defs>
                  <marker id="kg-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L5,3 Z" fill="#94a3b8" />
                  </marker>
                  <marker id="kg-arrow-lit" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0 L0,7 L6,3.5 Z" fill="#6366f1" />
                  </marker>
                </defs>

                {/* Background depth lines */}
                {Array.from({ length: Math.floor((svgHeight - PAD_TOP - PAD_BOT) / LAYER_GAP) + 1 }).map((_, i) => {
                  const y = svgHeight - PAD_BOT - i * LAYER_GAP;
                  return (
                    <line key={i} x1={20} x2={svgWidth - 20} y1={y} y2={y}
                      stroke="#f1f5f9" strokeWidth={1} strokeDasharray="2 6" />
                  );
                })}

                {/* Axis labels */}
                <text x={20} y={svgHeight - 14} fontSize={9} letterSpacing={2}
                  fill="#94a3b8" fontWeight={700}>ФУНДАМЕНТ</text>
                <text x={20} y={20} fontSize={9} letterSpacing={2}
                  fill="#94a3b8" fontWeight={700}>ПРОДВИНУТОЕ</text>

                {/* Edges */}
                {MATH_ALL_EDGES.map((e, i) => {
                  const fromN = nodesById.get(e.from);
                  const toN   = nodesById.get(e.to);
                  if (!fromN || !toN) return null;
                  const lit = litIds && (litIds.has(e.from) || litIds.has(e.to));
                  const dim = litIds && !lit;
                  const sc  = SECTION_COLORS[fromN.sectionIdx] ?? SECTION_COLORS[0];
                  const sc2 = SECTION_COLORS[toN.sectionIdx]   ?? SECTION_COLORS[0];
                  // Cross edges: dashed, neutral color
                  // Intra edges: solid, section color
                  const stroke = lit ? "#6366f1" : e.cross ? "#cbd5e1" : sc.fill;
                  const my = (fromN.y + toN.y) / 2;
                  const d = `M ${fromN.x} ${fromN.y} C ${fromN.x} ${my}, ${toN.x} ${my}, ${toN.x} ${toN.y}`;
                  return (
                    <path key={i} d={d} fill="none"
                      stroke={stroke}
                      strokeWidth={lit ? 2.2 : 1.4}
                      strokeOpacity={dim ? 0.08 : e.cross ? 0.55 : 0.4}
                      strokeDasharray={e.cross && !lit ? "4 3" : undefined}
                      style={{ transition: "all 0.2s" }}
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const isSelected    = selected === node.conceptId;
                  const isHovered     = hoveredId === node.conceptId;
                  const isRecommended = node.conceptId === recommendedConceptId;
                  const isLit         = litIds?.has(node.conceptId) ?? true;
                  const isDim         = litIds && !isLit;
                  const isNew         = newConceptId === node.conceptId || newConceptId === node.personalNode?.label;
                  const hasMention    = node.mentionCount > 0;
                  const r = isSelected ? NODE_R + 3 : isHovered ? NODE_R + 2 : NODE_R;
                  const { fill, stroke, text } = nodeColor(node.sectionIdx, node.status);
                  const sc = SECTION_COLORS[node.sectionIdx] ?? SECTION_COLORS[0];

                  return (
                    <g key={node.conceptId}
                      className="kg-tree-node"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelected(isSelected ? null : node.conceptId);
                      }}
                      onMouseEnter={(ev) => {
                        setHoveredId(node.conceptId);
                        const svg = (ev.currentTarget as SVGGElement).ownerSVGElement;
                        if (svg) {
                          // Position the hover card in the coords of the nearest
                          // positioned ancestor (.relative) so it survives zoom/pan.
                          const rect = svg.getBoundingClientRect();
                          const anchor = (svg.closest('.relative') as HTMLElement | null) ?? svg.parentElement;
                          const anchorRect = anchor?.getBoundingClientRect();
                          const ox = anchorRect ? rect.left - anchorRect.left : 0;
                          const oy = anchorRect ? rect.top  - anchorRect.top  : 0;
                          const scale = rect.width / svgWidth;
                          setHoverXY({ x: ox + node.x * scale, y: oy + node.y * scale });
                        }
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ cursor: "pointer", opacity: isDim ? 0.2 : 1, transition: "opacity 0.2s" }}>

                      {/* Pulsing NEW ring */}
                      {isNew && (
                        <circle cx={node.x} cy={node.y} r={r + 14}
                          fill="none" stroke="#8b5cf6" strokeWidth={2.5} opacity={0.9}>
                          <animate attributeName="r" values={`${r+10};${r+18};${r+10}`} dur="1.4s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.4s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Pulsing RECOMMENDED ring */}
                      {isRecommended && !isNew && (
                        <circle cx={node.x} cy={node.y} r={r + 11}
                          fill="none" stroke="#f59e0b" strokeWidth={1.8}
                          strokeDasharray="4 3" opacity={0.8}>
                          <animate attributeName="r" values={`${r+8};${r+14};${r+8}`} dur="2.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.85;0.3;0.85" dur="2.2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* AI chat ring */}
                      {hasMention && !isSelected && (
                        <circle cx={node.x} cy={node.y} r={r + 6}
                          fill="none" stroke="#8b5cf6" strokeWidth={1.5}
                          strokeDasharray="3 3" opacity={0.75} />
                      )}

                      {/* Selection glow */}
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r={r + 9}
                          fill={sc.fill} opacity={0.18} />
                      )}

                      {/* Main circle */}
                      <circle cx={node.x} cy={node.y} r={r}
                        fill={fill}
                        stroke={isSelected ? sc.fill : isHovered ? "#1e293b" : stroke}
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2.5 : node.status === "unknown" ? 1.8 : 1.5}
                        style={{ transition: "r 0.15s, stroke-width 0.15s" }} />

                      {/* Short label inside */}
                      <text x={node.x} y={node.y + 3.5} textAnchor="middle"
                        fontSize={node.shortLabel.length > 4 ? 8 : 10}
                        fontWeight={700}
                        fill={text}
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        {node.shortLabel}
                      </text>

                      {/* Mention count badge */}
                      {hasMention && (
                        <g transform={`translate(${node.x + r - 3}, ${node.y - r + 3})`}>
                          <circle r={7} fill="#7c3aed" />
                          <text fontSize={7} textAnchor="middle" dy="0.35em" fill="white" fontWeight={700}
                            style={{ pointerEvents: "none", userSelect: "none" }}>
                            {node.mentionCount > 9 ? "9+" : node.mentionCount}
                          </text>
                        </g>
                      )}

                      {/* Practice tick */}
                      {node.practiceCompleted && (
                        <g transform={`translate(${node.x - r + 4}, ${node.y - r + 4})`}>
                          <circle r={6} fill="#059669" />
                          <text fontSize={8} textAnchor="middle" dy="0.35em" fill="white"
                            style={{ pointerEvents: "none", userSelect: "none" }}>✓</text>
                        </g>
                      )}

                      {/* Full name below */}
                      <text x={node.x} y={node.y + r + 14}
                        textAnchor="middle" fontSize={9.5}
                        fontWeight={isHovered || isSelected ? 700 : 500}
                        fill={node.p_mastery > 0.4 ? "#0f172a" : "#64748b"}
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        {node.name.length > 22 ? node.name.slice(0, 20) + "…" : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
                </TransformComponent>
              </TransformWrapper>

              {/* Hover tooltip overlay */}
              {hoveredNode && hoveredNeighbors && !selected && (
                <HoverCard
                  node={hoveredNode}
                  dependsOn={hoveredNeighbors.dependsOn}
                  unlocks={hoveredNeighbors.unlocks}
                  x={hoverXY.x}
                  y={hoverXY.y}
                />
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        {selectedNode && selectedNeighbors ? (
          <DetailPanel
            node={selectedNode}
            isRecommended={selectedNode.conceptId === recommendedConceptId}
            personalNode={selectedNode.personalNode}
            dependsOn={selectedNeighbors.dependsOn}
            unlocks={selectedNeighbors.unlocks}
            applications={selectedNodeApps}
            onClose={() => setSelected(null)}
          />
        ) : (
          <LegendPanel />
        )}
      </div>

      {/* Applications panel — the key feature: cross-domain synthesis */}
      <ApplicationsPanel
        apps={MATH_APPLICATIONS}
        topicsByConceptId={nodesById}
        onHighlight={(ids) => setAppHighlight(ids ? new Set(ids) : null)}
      />

      {/* Personal cloud */}
      {cloudNodes.length > 0 && (
        <PersonalCloudPanel nodes={cloudNodes} onSelect={(n) => setCloudModal(n)} />
      )}
    </div>
  );
}

// ─── Legend panel (shown on right when nothing selected) ────────────────────────

function LegendPanel() {
  return (
    <div className="w-72 shrink-0 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-1">Как читать граф</p>
        <p className="text-sm font-bold text-primary leading-snug">Снизу вверх</p>
        <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
          Чем выше тема, тем больше у неё пресуппозитов. Стрелки идут вверх — «ведут к».
        </p>
      </div>

      <div className="space-y-2.5 border-t border-outline-variant/10 pt-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Цвет = раздел</p>
        {MATH_SECTIONS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: SECTION_COLORS[i].fill }} />
            <span className="text-[11px] text-primary">{s.title}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-outline-variant/10 pt-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Заливка = освоение</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-white border-2" style={{ borderColor: "#3730a3" }} />
          <span className="text-[10px] text-on-surface-variant">Hollow — не начато</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#a5b4fc" }} />
          <span className="text-[10px] text-on-surface-variant">Светлая — в процессе</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#4f46e5" }} />
          <span className="text-[10px] text-on-surface-variant">Насыщенная — освоено</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[10px] text-on-surface-variant">Красная — слабое место</span>
        </div>
      </div>

      <div className="space-y-2 border-t border-outline-variant/10 pt-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Связи</p>
        <div className="flex items-center gap-2">
          <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="#4f46e5" strokeWidth="2" /></svg>
          <span className="text-[10px] text-on-surface-variant">Внутри раздела</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="32" height="8"><line x1="0" y1="4" x2="32" y2="4" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-on-surface-variant">Между разделами</span>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-outline-variant/10 pt-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">Маркеры</p>
        <div className="flex items-center gap-2">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
          <span className="text-[10px] text-on-surface-variant">Обсуждалось с AI</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
          <span className="text-[10px] text-on-surface-variant">Следующий шаг</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-emerald-600">✓</span>
          <span className="text-on-surface-variant">Практика завершена</span>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 pt-3">
        <p className="text-[11px] text-on-surface-variant italic leading-snug">
          Наведи на любую тему — увидишь, на чём она держится и что от неё зависит.
          Кликни — откроются детали с реальными применениями.
        </p>
      </div>
    </div>
  );
}
