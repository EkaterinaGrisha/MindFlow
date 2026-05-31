/**
 * GeneratePlanModal — диалог создания плана.
 *
 * Два режима:
 *  - Preset: выбор готовой цели из MATH_APPLICATIONS (мгновенно)
 *  - LLM:    свободный ввод цели → POST /api/learning-plans/generate
 *
 * После выбора цели — превью списка concept_ids с возможностью убрать темы,
 * задать заголовок и опциональный дедлайн. Сохранение через bulk POST.
 */

import { useMemo, useState } from "react";
import { Loader2, Sparkles, Target, X } from "lucide-react";
import {
  MATH_APPLICATIONS,
  MATH_TOPIC_BY_CONCEPT_ID,
  MATH_ALL_EDGES,
} from "../lib/courseTopics";
import {
  createLearningPlan,
  generateLearningPlan,
  type LearningPlan,
} from "../lib/learningPlans";

type MasteryByConcept = Map<string, { p_mastery: number; status: string }>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (plan: LearningPlan) => void;
  masteryByConcept: MasteryByConcept;
}

type Step = "pick" | "preview";

interface Draft {
  title: string;
  goal: string;
  conceptIds: string[];
  dueDate: string | null;
}

/** Топологически отсортировать concept_ids с учётом MATH_ALL_EDGES. */
function topoSort(ids: string[]): string[] {
  const set = new Set(ids);
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of ids) inDegree.set(id, 0);
  for (const e of MATH_ALL_EDGES) {
    if (!set.has(e.from) || !set.has(e.to)) continue;
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    const arr = adj.get(e.from) ?? [];
    arr.push(e.to);
    adj.set(e.from, arr);
  }
  const queue: string[] = [];
  for (const [id, deg] of inDegree) if (deg === 0) queue.push(id);
  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const next of adj.get(id) ?? []) {
      const nd = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, nd);
      if (nd === 0) queue.push(next);
    }
  }
  // Любые оставшиеся (циклы — не должно быть) добавим в хвост.
  for (const id of ids) if (!sorted.includes(id)) sorted.push(id);
  return sorted;
}

/** Отфильтровать уже освоенные темы (status === 'mastered'). */
function filterMastered(ids: string[], mastery: MasteryByConcept): string[] {
  return ids.filter((id) => mastery.get(id)?.status !== "mastered");
}

export default function GeneratePlanModal({ open, onClose, onCreated, masteryByConcept }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [goalInput, setGoalInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const presets = useMemo(() => MATH_APPLICATIONS, []);

  const reset = () => {
    setStep("pick");
    setGoalInput("");
    setGenerating(false);
    setSaving(false);
    setError(null);
    setDraft(null);
  };

  const handleClose = () => {
    if (saving || generating) return;
    reset();
    onClose();
  };

  const choosePreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const ordered = topoSort(filterMastered(preset.topics, masteryByConcept));
    setDraft({
      title: preset.title,
      goal: preset.description,
      conceptIds: ordered,
      dueDate: null,
    });
    setStep("preview");
  };

  const generateFromGoal = async () => {
    const goal = goalInput.trim();
    if (goal.length < 5) {
      setError("Опиши цель хотя бы 5 символами");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await generateLearningPlan(goal);
      if (result.conceptIds.length === 0) {
        setError("Не удалось подобрать темы под цель. Попробуй сформулировать иначе.");
        return;
      }
      const ordered = topoSort(filterMastered(result.conceptIds, masteryByConcept));
      setDraft({
        title: result.suggestedTitle,
        goal: result.goal,
        conceptIds: ordered.length > 0 ? ordered : result.conceptIds,
        dueDate: null,
      });
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сгенерировать план");
    } finally {
      setGenerating(false);
    }
  };

  const toggleConceptInDraft = (conceptId: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      conceptIds: draft.conceptIds.includes(conceptId)
        ? draft.conceptIds.filter((id) => id !== conceptId)
        : [...draft.conceptIds, conceptId],
    });
  };

  const save = async () => {
    if (!draft) return;
    if (draft.conceptIds.length === 0) {
      setError("В плане должна быть хотя бы одна тема");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const plan = await createLearningPlan({
        title: draft.title || "Новый план",
        goal: draft.goal,
        dueDate: draft.dueDate,
        conceptIds: draft.conceptIds,
      });
      onCreated(plan);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить план");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant/15">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-0.5">
              {step === "pick" ? "Новый план" : "Превью плана"}
            </p>
            <h2 className="text-lg font-extrabold text-primary leading-tight">
              {step === "pick" ? "Под какую цель собираем?" : draft?.title || "Без названия"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving || generating}
            className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors disabled:opacity-50"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {step === "pick" && (
            <div className="space-y-5">
              {/* Preset list */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant flex items-center gap-1.5">
                  <Target size={12} /> Готовые цели
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => choosePreset(p.id)}
                      className="text-left rounded-xl border border-outline-variant/15 bg-surface-container-low hover:border-secondary/30 hover:bg-secondary/5 transition-all px-3 py-3 group"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-lg leading-none">{p.emoji}</span>
                        <span className="font-semibold text-primary text-sm leading-tight">{p.title}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-snug line-clamp-2">
                        {p.description}
                      </p>
                      <p className="text-[10px] text-secondary font-semibold mt-1.5">
                        {p.topics.length} тем
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Or LLM input */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant flex items-center gap-1.5">
                  <Sparkles size={12} /> Свободная цель
                </p>
                <textarea
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Например: подготовиться к собесу по ML, разобраться с PCA, прорешать линал с нуля"
                  rows={3}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-primary placeholder:text-on-surface-variant/60 outline-none focus:border-secondary/40 transition-colors resize-none"
                  disabled={generating}
                />
                <button
                  onClick={generateFromGoal}
                  disabled={generating || goalInput.trim().length < 5}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? "AI собирает план…" : "Сгенерировать с AI"}
                </button>
              </div>
            </div>
          )}

          {step === "preview" && draft && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-1 block">
                  Название
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-primary outline-none focus:border-secondary/40 transition-colors"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-1 block">
                  Цель
                </label>
                <textarea
                  value={draft.goal}
                  onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-primary outline-none focus:border-secondary/40 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant mb-1 block">
                  Дедлайн (опционально)
                </label>
                <input
                  type="date"
                  value={draft.dueDate ?? ""}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-primary outline-none focus:border-secondary/40 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
                    Темы в плане ({draft.conceptIds.length})
                  </label>
                  {draft.conceptIds.length === 0 && (
                    <span className="text-[10px] text-red-600">Добавь хотя бы одну</span>
                  )}
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {draft.conceptIds.map((conceptId, idx) => {
                    const entry = MATH_TOPIC_BY_CONCEPT_ID[conceptId];
                    if (!entry) return null;
                    const mast = masteryByConcept.get(conceptId);
                    return (
                      <div
                        key={conceptId}
                        className="flex items-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-2"
                      >
                        <span className="text-[10px] font-mono text-on-surface-variant w-5">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {entry.topic.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                            {entry.section.title}
                          </p>
                        </div>
                        {mast && (
                          <span className="text-[10px] font-bold text-secondary shrink-0">
                            {Math.round(mast.p_mastery * 100)}%
                          </span>
                        )}
                        <button
                          onClick={() => toggleConceptInDraft(conceptId)}
                          className="text-on-surface-variant hover:text-red-600 transition-colors p-1"
                          aria-label="Убрать"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && draft && (
          <div className="px-6 py-3 border-t border-outline-variant/15 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setStep("pick");
                setDraft(null);
                setError(null);
              }}
              disabled={saving}
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              ← Назад
            </button>
            <button
              onClick={save}
              disabled={saving || draft.conceptIds.length === 0 || !draft.title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Сохраняю…" : "Сохранить план"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
