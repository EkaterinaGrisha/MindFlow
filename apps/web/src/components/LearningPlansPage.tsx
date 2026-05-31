/**
 * LearningPlansPage.tsx — /plan
 *
 * Knowledge-graph-driven learning plans:
 *  - hero with goal, due date, real KG mastery vs checkbox progress
 *  - "focus today" card highlighting the next actionable item
 *  - items grouped by course section, with mastery-derived status
 *    (locked / ready / in_progress / mastered)
 *  - generate plan from goal (preset + AI)
 *  - DnD reorder within a plan, inline-edit title/goal/due-date
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Calendar,
  Check,
  GripVertical,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAuth } from '../lib/useAuth';
import { supabase } from '../lib/supabase';
import {
  createLearningPlan,
  deleteLearningPlan,
  deleteLearningPlanItem,
  listLearningPlans,
  updateLearningPlan,
  updateLearningPlanItem,
  type LearningPlan,
  type LearningPlanItem,
} from '../lib/learningPlans';
import {
  MATH_TOPIC_BY_CONCEPT_ID,
  MATH_ALL_EDGES,
  MATH_COURSE_ID,
} from '../lib/courseTopics';
import GeneratePlanModal from './GeneratePlanModal';

// ─── Mastery types ──────────────────────────────────────────────────────────────

type MasteryStatus = 'mastered' | 'in_progress' | 'weak_spot' | 'unknown' | 'fading';

interface MasteryRow {
  concept_id: string;
  p_mastery: number;
  status: MasteryStatus;
}

type MasteryByConcept = Map<string, { p_mastery: number; status: string }>;

type ItemStatus = 'locked' | 'ready' | 'in_progress' | 'mastered';

function deriveItemStatus(
  conceptId: string | null,
  isDone: boolean,
  mastery: MasteryByConcept,
): ItemStatus {
  if (!conceptId) return isDone ? 'mastered' : 'ready';
  const own = mastery.get(conceptId);
  if (own?.status === 'mastered' || isDone) return 'mastered';
  if (own && own.p_mastery > 0.15) return 'in_progress';
  // Locked if any prereq exists in the graph and isn't mastered yet.
  const prereqs = MATH_ALL_EDGES.filter((e) => e.to === conceptId).map((e) => e.from);
  if (prereqs.length === 0) return 'ready';
  const unmet = prereqs.some((p) => (mastery.get(p)?.status ?? 'unknown') !== 'mastered');
  return unmet ? 'locked' : 'ready';
}

// ─── Item label resolution ──────────────────────────────────────────────────────

function resolveItemLabel(item: LearningPlanItem): { name: string; route: string | null; section: string | null } {
  if (item.concept_id && MATH_TOPIC_BY_CONCEPT_ID[item.concept_id]) {
    const { topic, section } = MATH_TOPIC_BY_CONCEPT_ID[item.concept_id];
    return {
      name: topic.name,
      route: `/subjects/mathematics/topics/${encodeURIComponent(topic.name)}`,
      section: section.title,
    };
  }
  if (item.topic_slug) {
    let decoded = item.topic_slug;
    try { decoded = decodeURIComponent(item.topic_slug); } catch { /* keep raw */ }
    return { name: decoded, route: `/subjects/mathematics/topics/${item.topic_slug}`, section: null };
  }
  return { name: item.concept_id ?? 'Без названия', route: null, section: null };
}

// ─── Inline editable text ───────────────────────────────────────────────────────

function InlineEdit({
  value,
  placeholder,
  multiline = false,
  className = '',
  onCommit,
}: {
  value: string;
  placeholder: string;
  multiline?: boolean;
  className?: string;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`text-left hover:bg-surface-container-low rounded-md px-1 -mx-1 transition-colors ${className}`}
      >
        {value || <span className="text-on-surface-variant/60">{placeholder}</span>}
      </button>
    );
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value.trim()) onCommit(trimmed);
    setEditing(false);
  };

  const sharedProps = {
    autoFocus: true,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.shiftKey && multiline)) {
        e.preventDefault();
        commit();
      }
      if (e.key === 'Escape') {
        setDraft(value);
        setEditing(false);
      }
    },
    placeholder,
    className: `w-full outline-none bg-surface-container-low rounded-md px-1 -mx-1 ${className}`,
  };

  return multiline ? <textarea rows={2} {...sharedProps} /> : <input type="text" {...sharedProps} />;
}

// ─── Status chip ────────────────────────────────────────────────────────────────

function StatusChip({ status, mastery }: { status: ItemStatus; mastery: number | null }) {
  const label =
    status === 'mastered'    ? 'освоено'    :
    status === 'in_progress' ? 'в работе'   :
    status === 'locked'      ? 'заблок.'    : 'готово';
  const colorClass =
    status === 'mastered'    ? 'bg-emerald-500/10 text-emerald-700' :
    status === 'in_progress' ? 'bg-secondary/10 text-secondary'      :
    status === 'locked'      ? 'bg-surface-container text-on-surface-variant' :
                                'bg-teal-500/10 text-teal-700';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-0.5 ${colorClass}`}>
      {status === 'locked' && <Lock size={10} />}
      {label}
      {mastery !== null && status !== 'locked' && (
        <span className="font-mono">· {Math.round(mastery * 100)}%</span>
      )}
    </span>
  );
}

// ─── Sortable item row ──────────────────────────────────────────────────────────

function ItemRow({
  item,
  status,
  mastery,
  onToggleDone,
  onDelete,
  onAskMentor,
}: {
  item: LearningPlanItem;
  status: ItemStatus;
  mastery: number | null;
  onToggleDone: (next: boolean) => void;
  onDelete: () => void;
  onAskMentor: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const { name, route } = resolveItemLabel(item);
  const isLocked = status === 'locked';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors ${
        isLocked
          ? 'border-outline-variant/10 bg-surface-container-low/40 opacity-70'
          : status === 'mastered'
          ? 'border-emerald-500/20 bg-emerald-50/30'
          : 'border-outline-variant/15 bg-surface-container-lowest'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Перетащить"
        className="cursor-grab active:cursor-grabbing text-on-surface-variant hover:text-primary"
      >
        <GripVertical size={14} />
      </button>

      <button
        type="button"
        onClick={() => onToggleDone(!item.is_done)}
        aria-pressed={item.is_done}
        aria-label={item.is_done ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
          item.is_done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-outline-variant/40 hover:border-emerald-500'
        }`}
      >
        {item.is_done && <Check size={12} />}
      </button>

      <div className="flex-1 min-w-0">
        {route ? (
          <Link
            to={route}
            className={`text-sm truncate hover:underline ${
              item.is_done ? 'line-through text-on-surface-variant' : 'text-primary'
            }`}
          >
            {name}
          </Link>
        ) : (
          <span className={`text-sm truncate ${item.is_done ? 'line-through text-on-surface-variant' : 'text-primary'}`}>
            {name}
          </span>
        )}
        {item.note && (
          <p className="text-[11px] text-on-surface-variant/80 truncate">{item.note}</p>
        )}
      </div>

      <StatusChip status={status} mastery={mastery} />

      <button
        type="button"
        onClick={onAskMentor}
        aria-label="Спросить ментора"
        title="Спросить ментора"
        className="text-on-surface-variant hover:text-secondary transition-colors p-1"
      >
        <MessageCircle size={14} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Удалить из плана"
        className="text-on-surface-variant hover:text-red-600 transition-colors p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  masteryByConcept,
  onPatch,
  onDelete,
  onItemsChange,
}: {
  plan: LearningPlan;
  masteryByConcept: MasteryByConcept;
  onPatch: (patch: { title?: string; goal?: string; isArchived?: boolean; dueDate?: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onItemsChange: (next: LearningPlanItem[]) => void;
}) {
  const navigate = useNavigate();
  const items = plan.items ?? [];
  const doneCount = items.filter((i) => i.is_done).length;
  const checkPct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  const itemStatuses = useMemo(() => {
    const map = new Map<string, ItemStatus>();
    for (const it of items) {
      map.set(it.id, deriveItemStatus(it.concept_id, it.is_done, masteryByConcept));
    }
    return map;
  }, [items, masteryByConcept]);

  const masteryPct = useMemo(() => {
    if (items.length === 0) return 0;
    let sum = 0;
    let count = 0;
    for (const it of items) {
      if (!it.concept_id) continue;
      const m = masteryByConcept.get(it.concept_id);
      if (m) {
        sum += m.p_mastery;
        count++;
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) : 0;
  }, [items, masteryByConcept]);

  const readyCount = useMemo(
    () => items.filter((it) => !it.is_done && itemStatuses.get(it.id) === 'ready').length,
    [items, itemStatuses],
  );

  /** First actionable item: in_progress > ready. Skips locked and mastered/done. */
  const focusItem = useMemo(() => {
    const inProgress = items.find(
      (it) => !it.is_done && itemStatuses.get(it.id) === 'in_progress',
    );
    if (inProgress) return inProgress;
    return items.find((it) => !it.is_done && itemStatuses.get(it.id) === 'ready') ?? null;
  }, [items, itemStatuses]);

  const daysLeft = useMemo(() => {
    if (!plan.due_date) return null;
    const due = new Date(plan.due_date + 'T23:59:59');
    const diff = due.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [plan.due_date]);

  const remainingTopics = items.length - doneCount;
  const paceHint = useMemo(() => {
    if (!daysLeft || daysLeft <= 0 || remainingTopics <= 0) return null;
    const perDay = Math.ceil(remainingTopics / daysLeft);
    if (perDay <= 1) return 'по 1 теме в день — комфортно';
    return `по ~${perDay} темы/день к дедлайну`;
  }, [daysLeft, remainingTopics]);

  // Group items by section, preserving overall position order.
  const groupedItems = useMemo(() => {
    const groups = new Map<string, LearningPlanItem[]>();
    const order: string[] = [];
    for (const it of items) {
      const { section } = resolveItemLabel(it);
      const key = section ?? 'Без раздела';
      if (!groups.has(key)) {
        groups.set(key, []);
        order.push(key);
      }
      groups.get(key)!.push(it);
    }
    return order.map((title) => ({ title, items: groups.get(title)! }));
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const renumbered = reordered.map((it, idx) => ({ ...it, position: idx }));
    onItemsChange(renumbered);

    const moved = renumbered.filter((it, idx) => items[idx]?.id !== it.id);
    await Promise.all(
      moved.map((it) => updateLearningPlanItem(plan.id, it.id, { position: it.position })),
    );
  };

  const handleToggleDone = async (itemId: string, isDone: boolean) => {
    const next = items.map((it) =>
      it.id === itemId
        ? { ...it, is_done: isDone, done_at: isDone ? new Date().toISOString() : null }
        : it,
    );
    onItemsChange(next);
    await updateLearningPlanItem(plan.id, itemId, { isDone });
  };

  const handleDeleteItem = async (itemId: string) => {
    onItemsChange(items.filter((it) => it.id !== itemId));
    await deleteLearningPlanItem(plan.id, itemId);
  };

  const handleAskMentor = (item: LearningPlanItem) => {
    const { name } = resolveItemLabel(item);
    navigate(`/workspace?topic=${encodeURIComponent(name)}`);
  };

  const handleOpenItem = (item: LearningPlanItem) => {
    const { route } = resolveItemLabel(item);
    if (route) navigate(route);
  };

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
      {/* Hero */}
      <div className="p-5 border-b border-outline-variant/10 bg-gradient-to-br from-surface-container-lowest to-secondary/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0 space-y-1">
            <InlineEdit
              value={plan.title}
              placeholder="Название плана"
              className="text-xl font-extrabold text-primary leading-tight"
              onCommit={(title) => onPatch({ title })}
            />
            <InlineEdit
              value={plan.goal ?? ''}
              placeholder="Опиши цель (по желанию)"
              multiline
              className="text-xs text-on-surface-variant leading-snug"
              onCommit={(goal) => onPatch({ goal })}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onPatch({ isArchived: !plan.is_archived })}
              aria-label={plan.is_archived ? 'Разархивировать' : 'Архивировать'}
              title={plan.is_archived ? 'Разархивировать' : 'Архивировать'}
              className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
            >
              {plan.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Удалить план «${plan.title}»? Это действие нельзя отменить.`)) {
                  void onDelete();
                }
              }}
              aria-label="Удалить план"
              title="Удалить план"
              className="p-1.5 rounded-md text-on-surface-variant hover:text-red-600 hover:bg-surface-container-low transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant mb-0.5">Mastery</p>
            <p className="text-lg font-extrabold text-secondary leading-none">{masteryPct}%</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">по графу знаний</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant mb-0.5">Выполнено</p>
            <p className="text-lg font-extrabold text-primary leading-none">{checkPct}%</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{doneCount} из {items.length}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant mb-0.5">Доступно</p>
            <p className="text-lg font-extrabold text-teal-700 leading-none">{readyCount}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">тем готовы</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant mb-0.5">Дедлайн</p>
            {plan.due_date ? (
              <>
                <p className={`text-lg font-extrabold leading-none ${daysLeft !== null && daysLeft <= 3 ? 'text-orange-600' : 'text-primary'}`}>
                  {daysLeft !== null && daysLeft > 0 ? `${daysLeft} дн` : daysLeft === 0 ? 'сегодня' : 'прошёл'}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{paceHint ?? 'до цели'}</p>
              </>
            ) : (
              <p className="text-[11px] text-on-surface-variant/80 mt-1">
                <label className="inline-flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                  <Calendar size={11} />
                  <input
                    type="date"
                    className="bg-transparent outline-none text-[11px]"
                    onChange={(e) => { if (e.target.value) void onPatch({ dueDate: e.target.value }); }}
                  />
                </label>
              </p>
            )}
          </div>
        </div>

        {/* Two-layer progress bar */}
        <div className="h-2 rounded-full bg-surface-container-high overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-secondary/40 transition-all duration-500"
            style={{ width: `${masteryPct}%` }}
            title="Mastery"
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.max(checkPct, items.length > 0 ? 2 : 0)}%`, opacity: 0.85 }}
            title="Галочки"
          />
        </div>

        {plan.due_date && (
          <button
            type="button"
            onClick={() => onPatch({ dueDate: null })}
            className="mt-2 text-[10px] text-on-surface-variant hover:text-red-600 transition-colors"
          >
            Дедлайн: {new Date(plan.due_date).toLocaleDateString('ru-RU')} · убрать
          </button>
        )}
      </div>

      {/* Focus today */}
      {focusItem && (
        <div className="px-5 py-4 border-b border-outline-variant/10 bg-secondary/[0.04]">
          <p className="text-[9px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">
            ◆ Сегодня учим это
          </p>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-primary text-base leading-tight">
                {resolveItemLabel(focusItem).name}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {resolveItemLabel(focusItem).section ?? 'Тема плана'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleOpenItem(focusItem)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Открыть →
              </button>
              <button
                onClick={() => handleAskMentor(focusItem)}
                className="inline-flex items-center gap-1 rounded-lg border border-secondary/30 text-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/5 transition-colors"
              >
                <MessageCircle size={12} /> Ментор
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items grouped by section */}
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-xs text-on-surface-variant rounded-lg bg-surface-container-low p-3 text-center">
            В этом плане пока пусто. Открой{' '}
            <Link to="/graph" className="text-primary font-semibold hover:underline">граф знаний</Link>
            {' '}и добавь концепты или сгенерируй план под цель.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {groupedItems.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant font-semibold">
                      {group.title} · {group.items.length}
                    </p>
                    <div className="space-y-1.5">
                      {group.items.map((item) => {
                        const status = itemStatuses.get(item.id) ?? 'ready';
                        const masteryVal = item.concept_id
                          ? masteryByConcept.get(item.concept_id)?.p_mastery ?? null
                          : null;
                        return (
                          <ItemRow
                            key={item.id}
                            item={item}
                            status={status}
                            mastery={masteryVal}
                            onToggleDone={(next) => handleToggleDone(item.id, next)}
                            onDelete={() => handleDeleteItem(item.id)}
                            onAskMentor={() => handleAskMentor(item)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function LearningPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans]     = useState<LearningPlan[] | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [masteryRows, setMasteryRows] = useState<MasteryRow[]>([]);

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setMasteryRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const [list, masteryRes] = await Promise.all([
          listLearningPlans(),
          supabase
            .from('kg_mastery_summary')
            .select('concept_id, p_mastery, status')
            .eq('user_id', user.id)
            .eq('course_id', MATH_COURSE_ID),
        ]);
        if (cancelled) return;
        setPlans(list);
        if (masteryRes.data) setMasteryRows(masteryRes.data as MasteryRow[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить планы');
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const masteryByConcept: MasteryByConcept = useMemo(() => {
    const m = new Map<string, { p_mastery: number; status: string }>();
    for (const row of masteryRows) {
      m.set(row.concept_id, { p_mastery: row.p_mastery, status: row.status });
    }
    return m;
  }, [masteryRows]);

  const visiblePlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter((p) => showArchived || !p.is_archived);
  }, [plans, showArchived]);

  const archivedCount = (plans ?? []).filter((p) => p.is_archived).length;

  const handleCreateEmpty = async () => {
    setCreating(true);
    setError(null);
    try {
      const plan = await createLearningPlan({ title: 'Новый план' });
      setPlans((prev) => [{ ...plan, items: [] }, ...(prev ?? [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать план');
    } finally {
      setCreating(false);
    }
  };

  const handlePatchPlan = async (
    planId: string,
    patch: { title?: string; goal?: string; isArchived?: boolean; dueDate?: string | null },
  ) => {
    setError(null);
    setPlans((prev) =>
      prev?.map((p) =>
        p.id === planId
          ? {
              ...p,
              ...(patch.title !== undefined ? { title: patch.title } : {}),
              ...(patch.goal !== undefined ? { goal: patch.goal || null } : {}),
              ...(patch.isArchived !== undefined ? { is_archived: patch.isArchived } : {}),
              ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
            }
          : p,
      ) ?? null,
    );
    try {
      await updateLearningPlan(planId, patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    setError(null);
    setPlans((prev) => prev?.filter((p) => p.id !== planId) ?? null);
    try {
      await deleteLearningPlan(planId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить план');
    }
  };

  const handleItemsChange = (planId: string, next: LearningPlanItem[]) => {
    setPlans((prev) => prev?.map((p) => (p.id === planId ? { ...p, items: next } : p)) ?? null);
  };

  const handleGeneratedPlan = (plan: LearningPlan) => {
    setPlans((prev) => [plan, ...(prev ?? [])]);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-3">
        <h1 className="text-2xl font-extrabold text-primary">Мои планы обучения</h1>
        <p className="text-sm text-on-surface-variant">
          Войди в аккаунт, чтобы создавать планы и отслеживать прогресс.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">Обучение</p>
          <h1 className="text-2xl font-extrabold text-primary leading-tight">Мои планы</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            План — это твоя траектория по графу знаний. Mastery подтягивается из реальной работы с темами.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-secondary/40 text-secondary text-sm font-semibold hover:bg-secondary/5 transition-colors"
          >
            <Sparkles size={14} />
            Под цель
          </button>
          <button
            type="button"
            onClick={handleCreateEmpty}
            disabled={creating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Пустой
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {plans === null ? (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Загружаю планы…
        </div>
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-8 text-center space-y-3">
          <p className="text-sm text-on-surface-variant">
            У тебя пока нет {showArchived ? '' : 'активных '}планов.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles size={14} /> Сгенерировать под цель
            </button>
            <Link
              to="/graph"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
            >
              Граф знаний <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              masteryByConcept={masteryByConcept}
              onPatch={(patch) => handlePatchPlan(plan.id, patch)}
              onDelete={() => handleDeletePlan(plan.id)}
              onItemsChange={(next) => handleItemsChange(plan.id, next)}
            />
          ))}
        </div>
      )}

      {archivedCount > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            {showArchived ? 'Скрыть архив' : `Показать архив (${archivedCount})`}
          </button>
        </div>
      )}

      <GeneratePlanModal
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onCreated={handleGeneratedPlan}
        masteryByConcept={masteryByConcept}
      />
    </div>
  );
}
