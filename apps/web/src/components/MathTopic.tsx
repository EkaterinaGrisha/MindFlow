import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Clock,
  Eye,
  EyeOff,
  FileQuestion,
  FlaskConical,
  Home,
  Lightbulb,
  Link2,
  Loader2,
  LogOut,
  PenTool,
  Play,
  Send,
  Sigma,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import type { LearningContext } from '@mindflow/shared/llmTypes';
import { useAuth, buildPersonalizationContext } from '../lib/useAuth';
import { useMathTopicProgress } from '../lib/useMathTopicProgress';
import { useMentorSession } from '../lib/useMentorSession';
import { buildApiHeaders, getApiBaseUrl } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useTextSelection } from '../lib/useTextSelection';
import FloatingExplainPopup from './FloatingExplainPopup';
import CitationPanel, { type Citation } from './CitationPanel';
import { MarkdownRenderer } from './MarkdownRenderer';
import FormulaInput from './FormulaInput';
import {
  TOPIC_CONTENT,
  TOPIC_RICH_THEORY,
  TOPIC_RICH_WORKED,
  type IndependentTask,
} from './math-topic-content';
import MatrixOperationsLabView from './math-topic-content/matrix-operations/labs';
import EigenvaluesLabView from './math-topic-content/eigenvalues/labs';
import RankBasisLabView from './math-topic-content/rank-basis/labs';
import SvdPart1LabView from './math-topic-content/svd/labs-part1';
import SvdPart2LabView from './math-topic-content/svd/labs-part2';
import LimitsContinuityLabView from './math-topic-content/limits-continuity/lab';
import DerivativeGradientLabView from './math-topic-content/derivative-gradient/labs';
import PartialDerivativesLabView from './math-topic-content/partial-derivatives/labs';
import GradientDescentPart1LabView from './math-topic-content/gradient-descent-part1/labs';
import GradientDescentPart2LabView from './math-topic-content/gradient-descent-part2/labs';
import type { Level } from './math-topic-content/types';
import { TOPIC_TOC } from './math-topic-content/topicTOC';

// ─── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'theory' | 'worked' | 'practice' | 'lab';
type ChatMessage = { role: 'user' | 'assistant'; text: string; aiRole?: string; citations?: Citation[] };

const TAB_META: { id: TabId; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'theory',   label: 'Теория',      desc: 'Понять',          icon: BookOpen },
  { id: 'worked',   label: 'Разбор',      desc: 'Увидеть как',     icon: PenTool },
  { id: 'practice', label: 'Практика',    desc: 'Решить самому',   icon: Target },
  { id: 'lab',      label: 'Лаборатория', desc: 'Исследовать',     icon: FlaskConical },
];

const ROLE_LABELS: Record<string, string> = {
  LECTURER: 'Лектор', MIRROR: 'Сократ', SANDBOX: 'Тренажёр', CHALLENGER: 'Оппонент',
};

const LEVEL_STYLES: Record<Level, string> = {
  'базовый':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'стандартный': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'продвинутый': 'bg-violet-50 text-violet-700 border-violet-200',
};

// Static summaries for topics with rich theory
const TOPIC_SUMMARIES: Record<string, { learn: string[]; why: string; estimateMin: number; difficulty: string }> = {
  'Операции с матрицами': {
    learn: [
      'Понимать матрицу как оператор над данными, а не «таблицу чисел»',
      'Уверенно складывать, умножать на скаляр, перемножать матрицы',
      'Различать пять интерпретаций умножения AB',
      'Применять транспонирование и обратимость в задачах ML',
    ],
    why: 'Матричные операции — рабочий язык data science: feature engineering, регрессия, PCA, нейросети. Без них любая последующая тема будет плыть.',
    estimateMin: 35,
    difficulty: 'Базовый',
  },
  'Ранг и базис': {
    learn: [
      'Вычислять ранг матрицы методом Гаусса',
      'Находить базис столбцового и строкового пространства',
      'Понимать ядро как решение системы Ax = 0',
      'Применять ранг к диагностике признаков в ML',
    ],
    why: 'Ранг определяет, сколько независимой информации в матрице. Без этого PCA и регрессия теряют смысл.',
    estimateMin: 40,
    difficulty: 'Стандартный',
  },
  'Собственные значения': {
    learn: [
      'Решать характеристическое уравнение det(A − λI) = 0',
      'Находить собственные векторы для каждого λ',
      'Понимать геометрический смысл eigenvalues/eigenvectors',
      'Использовать спектр ковариационной матрицы в PCA',
    ],
    why: 'Каждая главная компонента PCA — это собственный вектор ковариационной матрицы. Eigenvalues — это «энергия» в направлении.',
    estimateMin: 45,
    difficulty: 'Стандартный',
  },
  'SVD': {
    learn: [
      'Понимать структуру разложения A = UΣVᵀ',
      'Различать полное, тонкое и усечённое SVD',
      'Применять SVD для сжатия изображений и снижения шума',
      'Видеть связь SVD с PCA и методом LoRA',
    ],
    why: 'SVD — самое универсальное разложение в data science: обработка текста, рекомендации, сжатие, основа LoRA для LLM.',
    estimateMin: 50,
    difficulty: 'Продвинутый',
  },
  'Сингулярное разложение (SVD) — часть 1': {
    learn: [
      'Понимать геометрический смысл A = UΣVᵀ как поворот, растяжение и поворот',
      'Находить σᵢ и vᵢ через собственные значения и векторы AᵀA',
      'Вручную собирать SVD для простой матрицы 2×2',
      'Читать ранг, нормы и фундаментальные подпространства через SVD',
    ],
    why: 'Первая часть строит фундамент: почему SVD существует всегда, что означают U, Σ, V и как сингулярные числа показывают структуру матрицы.',
    estimateMin: 28,
    difficulty: 'Стандартный',
  },
  'Сингулярное разложение (SVD) — часть 2': {
    learn: [
      'Использовать усечённое SVD Aₖ = UₖΣₖVₖᵀ',
      'Объяснять оптимальность низкорангового приближения',
      'Применять SVD к сжатию изображений, PCA и рекомендациям',
      'Строить псевдообратную матрицу через SVD',
    ],
    why: 'Вторая часть превращает SVD в прикладной инструмент data science: сжатие, снижение размерности, фильтрация шума и устойчивые решения систем.',
    estimateMin: 35,
    difficulty: 'Продвинутый',
  },
};

// ─── Small shared components ───────────────────────────────────────────────────
function LevelPill({ level }: { level: Level }) {
  return (
    <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${LEVEL_STYLES[level]}`}>
      {level}
    </span>
  );
}


// ─── Lab dispatcher: рендерит лаб по теме ────────────────────────────────────
function LabView({ topicName, onGoTheory }: { topicName: string; onGoTheory: () => void }) {
  if (topicName === 'Операции с матрицами') return <MatrixOperationsLabView />;
  if (topicName === 'Собственные значения') return <EigenvaluesLabView />;
  if (topicName === 'Ранг и базис') return <RankBasisLabView onGoTheory={onGoTheory} />;
  if (topicName === 'Сингулярное разложение (SVD) — часть 1') return <SvdPart1LabView />;
  if (topicName === 'Сингулярное разложение (SVD) — часть 2') return <SvdPart2LabView />;
  if (topicName === 'Предел и непрерывность') return <LimitsContinuityLabView />;
  if (topicName === 'Производная и градиент') return <DerivativeGradientLabView />;
  if (topicName === 'Частные производные') return <PartialDerivativesLabView />;
  if (topicName === 'Градиентный спуск — часть 1') return <GradientDescentPart1LabView />;
  if (topicName === 'Градиентный спуск — часть 2') return <GradientDescentPart2LabView />;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <FlaskConical size={20} />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-1">Лаборатория</div>
            <h3 className="text-xl font-extrabold text-slate-900 leading-tight">Лаборатории скоро появятся</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">
              Для этой темы исследовательские стенды ещё в работе. Возвращайся к теории и разборам, а лаборатории откроем поэтапно.
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl bg-slate-900 text-white p-7 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400 mb-2">Пока что</div>
          <div className="text-lg font-bold">Повтори теорию или реши задачи.</div>
          <div className="text-sm text-slate-300 mt-1">Лаборатория работает лучше после разбора примеров.</div>
        </div>
        <button onClick={onGoTheory} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 inline-flex items-center gap-2">
          К теории <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── TopicSummary (theory tab) ─────────────────────────────────────────────────
function TopicSummary({ topicName }: { topicName: string }) {
  const summary = TOPIC_SUMMARIES[topicName];
  if (!summary) return null;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">О теме</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Clock size={12} /> ≈ {summary.estimateMin} мин
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          <BarChart3 size={12} /> {summary.difficulty}
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 mb-2">Что узнаешь</div>
          <ul className="space-y-1.5">
            {summary.learn.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                <Check size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 mb-2">Зачем это в DS</div>
          <p className="text-sm text-slate-600 leading-relaxed">{summary.why}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Theory TOC ───────────────────────────────────────────────────────────────
function TheoryTOC({ topicName, activeId }: { topicName: string; activeId: string }) {
  const items = TOPIC_TOC[topicName];
  if (!items?.length) return null;
  const [open, setOpen] = useState(true);

  function jump(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Содержание темы</span>
        <span className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? 'Свернуть' : 'Развернуть'}
        </span>
      </button>
      {open && (
        <nav className="space-y-1 mt-4">
          {items.map((it, i) => {
            const active = activeId === it.id;
            return (
              <button
                key={it.id}
                onClick={() => jump(it.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm leading-snug transition-all flex items-start gap-2 ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-500 pl-[10px]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-400 mt-0.5 shrink-0">{i + 1}</span>
                <span className="flex-1">{it.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </section>
  );
}

// ─── Worked view (practice step-through) ─────────────────────────────────────
function WorkedItem({
  item, index, onGoTheory,
}: {
  item: { id: string; title: string; steps: string[]; level?: Level };
  index: number;
  onGoTheory: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

  function toggle(i: number) { setExpanded((s) => ({ ...s, [i]: !s[i] })); }

  return (
    <article className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Разбор {index + 1}</span>
            {item.level && <LevelPill level={item.level} />}
            <button onClick={onGoTheory} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full">
              <Link2 size={10} /> К теории
            </button>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{item.title}</h2>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => { setHidden(!hidden); setAllOpen(false); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all inline-flex items-center gap-1.5 ${
              hidden ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            {hidden ? 'Решаю сам' : 'Скрыть'}
          </button>
          {!hidden && (
            <button
              onClick={() => setAllOpen((v) => !v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              {allOpen ? <ChevronsUp size={12} /> : <ChevronsDown size={12} />}
              {allOpen ? 'Свернуть' : 'Все шаги'}
            </button>
          )}
        </div>
      </div>

      {!hidden ? (
        <div className="space-y-3">
          {item.steps.map((step, i) => {
            const open = allOpen || !!expanded[i];
            const isLast = i === item.steps.length - 1;
            const isConclusion = step.startsWith('Главная мысль');
            return (
              <div key={i} className={`rounded-2xl border overflow-hidden ${isConclusion ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
                {isConclusion ? (
                  <div className="p-4 flex gap-3">
                    <Lightbulb size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-700 mb-1">Главная мысль</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{step.replace(/^Главная мысль:\s*/, '')}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => toggle(i)}
                      className="w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                        {!isLast && <div className="w-px flex-1 min-h-[8px] bg-slate-200" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1">Шаг {i + 1}</div>
                        <div className="text-sm font-semibold text-slate-900 leading-relaxed line-clamp-2">{step}</div>
                      </div>
                      {open ? <ChevronUp size={16} className="text-slate-400 mt-1.5 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 mt-1.5 shrink-0" />}
                    </button>
                    {open && (
                      <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                        <p className="text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">{step}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-amber-50/60 border border-amber-200 p-4 text-sm text-amber-900">
          Попробуй решить самостоятельно. Когда будешь готов — отключи «Скрыть» чтобы сверить решение.
        </div>
      )}
    </article>
  );
}

// ─── Independent task card (practice tab) ────────────────────────────────────
function IndependentTaskCard({ task, index, onSubmit }: {
  task: IndependentTask; index: number;
  onSubmit: (taskId: string, answer: string, meta: { timeMs: number; hintCount: number }) => Promise<string>;
}) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [done, setDone] = useState(false);
  const [showFormulaTask, setShowFormulaTask] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  // Per-attempt timing: starts when the card mounts, captured on submit.
  const startedAtRef = useRef<number>(Date.now());

  async function handleSubmit() {
    if (!answer.trim() || loading) return;
    setLoading(true);
    const timeMs = Date.now() - startedAtRef.current;
    const fb = await onSubmit(task.id, answer, { timeMs, hintCount });
    setFeedback(fb);
    setDone(true);
    setLoading(false);
  }

  return (
    <article className={`bg-white rounded-3xl border p-6 transition-all ${done ? 'border-emerald-300' : 'border-slate-200'}`}>
      <div className="flex items-start gap-4 mb-4">
        <span className="w-9 h-9 rounded-xl bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Задача {index + 1}</span>
            {task.level && <LevelPill level={task.level} />}
            {done && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Проверено
              </span>
            )}
          </div>
          <div className="text-[15px] text-slate-800 leading-relaxed [&_.katex]:text-base">
            <MarkdownRenderer content={task.prompt} />
          </div>
        </div>
      </div>

      {!done ? (
        <>
          <textarea
            value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3}
            placeholder="Напишите решение или рассуждение…"
            className="w-full font-mono text-sm border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
          />
          {showFormulaTask && (
            <div className="mt-2">
              <FormulaInput
                onInsert={(tex) => { setAnswer((prev) => prev + tex); setShowFormulaTask(false); }}
                onClose={() => setShowFormulaTask(false)}
              />
            </div>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              onClick={() => setShowHint((v) => {
                const next = !v;
                if (next) setHintCount((c) => c + 1);
                return next;
              })}
              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
            >
              <Lightbulb size={12} /> {showHint ? 'Скрыть подсказку' : 'Подсказка'}
            </button>
            <button
              onClick={() => setShowFormulaTask((v) => !v)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
              title="Вставить формулу"
            >
              <Sigma size={12} /> Формула
            </button>
            <button
              onClick={handleSubmit} disabled={!answer.trim() || loading}
              className="ml-auto bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-100"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Проверить с AI
            </button>
          </div>
          {showHint && (
            <div className="mt-4 rounded-xl bg-amber-50/70 border border-amber-200 px-4 py-3 text-sm text-amber-900 flex gap-2">
              <span className="font-extrabold text-amber-600 shrink-0">💡</span>
              <div className="leading-relaxed [&_.katex]:text-sm">
                <MarkdownRenderer content={task.hint} compact />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600 mb-1">Ответ AI-ментора</div>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <MarkdownRenderer content={feedback} compact />
                </div>
              </div>
            </div>
          </div>
          {task.solution && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowSolution((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                <span className="flex items-center gap-2"><BookOpen size={13} /> Краткое решение</span>
                <ChevronRight size={13} className={`transition-transform ${showSolution ? 'rotate-90' : ''}`} />
              </button>
              {showSolution && (
                <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed [&_.katex]:text-sm border-t border-slate-200">
                  <MarkdownRenderer content={task.solution} compact />
                </div>
              )}
            </div>
          )}
          <button onClick={() => { setDone(false); setFeedback(''); setAnswer(''); setShowSolution(false); }}
            className="text-xs text-indigo-600 font-medium hover:underline">
            Попробовать снова
          </button>
        </div>
      )}
    </article>
  );
}

// ─── AI Mentor panel (floating button + modal) ────────────────────────────────
type ApiRagMeta = { mmrUsed?: boolean; rerankerUsed?: boolean; latencyMs?: number; embeddingProvider?: string };

function AIMentorPanel({
  topic, activeTab, personalization, currentTheory, onSaveMessage,
}: {
  topic: string; activeTab: TabId;
  personalization: ReturnType<typeof buildPersonalizationContext>;
  currentTheory: string;
  onSaveMessage: (msg: { role: 'user' | 'assistant'; content: string; aiRole?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const apiBase = getApiBaseUrl();

  const role = activeTab === 'theory' ? 'Лектор' : activeTab === 'worked' ? 'Наставник' : 'Сократ';
  const tabLabel = TAB_META.find((t) => t.id === activeTab)?.label.toLowerCase() ?? '';

  function appendFormula(text: string) { setInput((prev) => prev ? `${prev} ${text}` : text); }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const pageLabel: Record<TabId, string> = {
    theory: 'теория', worked: 'разбор задач', practice: 'практика', lab: 'лаборатория',
  };

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    onSaveMessage({ role: 'user', content: userText });
    setLoading(true);
    const ctx: LearningContext = {
      current_topic: topic, retrieved_theory: currentTheory, recent_topics: '',
      experience: personalization.experience, level: personalization.level,
      interests: personalization.interests, mastered_concepts: '', weak_concepts: '',
      knowledge_graph_summary: personalization.knowledgeSummary,
      current_page: `${pageLabel[activeTab]} — ${topic}`, user_input: userText,
    };
    try {
      const res = await fetch(`${apiBase}/api/llm/respond`, {
        method: 'POST', headers: await buildApiHeaders(), body: JSON.stringify(ctx),
      });
      const data = (await res.json()) as {
        answer?: string; role?: string; rag?: { citations?: Citation[]; meta?: ApiRagMeta };
      };
      const txt = data.answer ?? 'Нет ответа от API.';
      const citations = data.rag?.citations ?? [];
      setMessages((m) => [...m, { role: 'assistant', text: txt, aiRole: data.role, citations }]);
      onSaveMessage({ role: 'assistant', content: txt, aiRole: data.role });
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Ошибка. Убедись, что запущен npm run dev:api' }]);
    } finally { setLoading(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 px-5 py-3.5 inline-flex items-center gap-2 font-bold text-sm hover:bg-indigo-700 transition-colors"
      >
        <Sparkles size={15} /> AI Ментор
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-end p-4 md:p-6 bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.currentTarget === e.target) setOpen(false); }}
        >
          <div className="bg-white rounded-3xl w-full md:w-[440px] h-[80vh] md:h-[600px] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                <Sparkles size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-900 text-sm">AI Ментор</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  Режим: {role} · {tabLabel}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
              {messages.length === 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed">
                  Привет! Я AI-ментор по теме <b>{topic}</b>.{' '}
                  В режиме <b>{role}</b>{' '}
                  {role === 'Лектор' ? 'объясняю структурно от определений.' : role === 'Наставник' ? 'веду через шаги решения.' : 'задаю вопросы, чтобы ты дошёл сам.'}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'assistant' && msg.aiRole && (
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide px-2">
                        {ROLE_LABELS[msg.aiRole] ?? msg.aiRole}
                      </span>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                      {msg.role === 'user' ? (
                        <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                      ) : (
                        <MarkdownRenderer content={msg.text} compact />
                      )}
                    </div>
                  </div>
                  {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                    <div className="pl-1 pr-1">
                      <CitationPanel citations={msg.citations} compact />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3">
                    <Loader2 size={15} className="animate-spin text-indigo-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
              {showFormula && (
                <FormulaInput onInsert={appendFormula} onClose={() => setShowFormula(false)} />
              )}
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Задай вопрос…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={() => setShowFormula((v) => !v)}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    showFormula ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                >
                  <Sigma size={15} />
                </button>
                <button
                  onClick={sendMessage} disabled={loading || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MathTopic() {
  const navigate = useNavigate();
  const { topicName } = useParams<{ topicName: string }>();
  const decodedTopic = topicName ? decodeURIComponent(topicName) : '';
  const [activeTab, setActiveTab] = useState<TabId>('theory');
  const [tocActiveId, setTocActiveId] = useState('');

  const { user, profile } = useAuth();
  const personalization = buildPersonalizationContext(profile);
  const content = TOPIC_CONTENT[decodedTopic];
  const section = content?.section ?? 'Математика';
  const RichTheory = TOPIC_RICH_THEORY[decodedTopic];
  const RichWorked = TOPIC_RICH_WORKED[decodedTopic];

  const { progress, markCompleted, updateVisit } = useMathTopicProgress(user, section, decodedTopic);
  const { saveMessage } = useMentorSession(user, decodedTopic, activeTab === 'worked' ? 'practice' : activeTab === 'practice' ? 'independent' : 'theory');

  const theoryContainerRef = useRef<HTMLElement | null>(null);
  const { selection, clearSelection } = useTextSelection(theoryContainerRef);
  const theoryText = content?.theory.map((b) => `## ${b.title}\n${b.body}`).join('\n\n') ?? '';
  const apiBase = getApiBaseUrl();

  const tocItems = TOPIC_TOC[decodedTopic] ?? [];

  function jumpToToc(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // Track TOC active section
  useEffect(() => {
    if (!tocItems.length || activeTab !== 'theory') return;
    function onScroll() {
      const headings = tocItems.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
      const top = window.innerHeight * 0.25;
      let current = headings[0]?.id ?? '';
      for (const h of headings) {
        if (h.getBoundingClientRect().top - top <= 0) current = h.id;
      }
      setTocActiveId(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [tocItems, activeTab]);

  useEffect(() => {
    const pt = activeTab === 'worked' ? 'practice' : activeTab === 'practice' ? 'independent' : 'theory';
    if (pt === 'theory' || pt === 'practice' || pt === 'independent') updateVisit(pt);
  }, [activeTab, updateVisit]);

  function changeTab(id: TabId) {
    if (activeTab === 'theory' && id === 'worked') markCompleted('theory');
    if (activeTab === 'worked' && id === 'practice') markCompleted('practice');
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function checkTask(
    taskId: string,
    answer: string,
    meta: { timeMs: number; hintCount: number },
  ): Promise<string> {
    const task = content?.independent.find((t) => t.id === taskId);
    if (!task) return 'Задача не найдена.';
    const ctx: LearningContext = {
      current_topic: decodedTopic, retrieved_theory: theoryText, recent_topics: section,
      experience: personalization.experience, level: personalization.level,
      interests: personalization.interests, mastered_concepts: '', weak_concepts: '',
      knowledge_graph_summary: personalization.knowledgeSummary,
      current_page: 'практика',
      user_input: `Задача: "${task.prompt}"\n\nОтвет студента: "${answer}"\n\nПроверь ответ. Укажи: верно/неверно, в чём ошибка если есть, покажи правильное решение кратко.`,
    };
    try {
      const headers = await buildApiHeaders();
      const res = await fetch(`${apiBase}/api/llm/respond`, { method: 'POST', headers, body: JSON.stringify(ctx) });
      const data = (await res.json()) as { answer?: string; correct?: boolean | null };
      await markCompleted('independent');
      if (user && data.correct !== null && data.correct !== undefined) {
        fetch(`${apiBase}/api/user/mastery`, {
          method: 'POST', headers,
          body: JSON.stringify({
            conceptName: decodedTopic,
            courseId:    'math-for-data-science',
            correct:     data.correct,
            itemId:      task.id,
            source:      'sandbox',
            timeMs:      meta.timeMs,
            hintCount:   meta.hintCount,
          }),
        }).catch(() => {});
      }
      return data.answer ?? 'Нет ответа.';
    } catch { return 'Ошибка API. Проверь, запущен ли `npm run dev:api`.'; }
  }

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ЕГ';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-40">
        <div className="p-5 border-b border-slate-100">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">MindFlow</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Adaptive Learning</div>
        </div>

        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base shrink-0">Σ</div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{section}</div>
              <div className="text-sm font-bold text-slate-900 truncate">{decodedTopic}</div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 px-3 py-2">Путь по теме</div>
          {TAB_META.map((t) => {
            const isActive = activeTab === t.id;
            const done = t.id === 'theory' ? progress.theory : t.id === 'worked' ? progress.practice : t.id === 'practice' ? progress.independent : false;
            const Icon = t.icon;
            const showToc = t.id === 'theory' && isActive && tocItems.length > 0;
            return (
              <div key={t.id}>
                <button
                  onClick={() => changeTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {done && !isActive ? <Check size={13} /> : <Icon size={13} />}
                  </span>
                  <div className="text-left flex-1 min-w-0">
                    <div className={`font-bold leading-none ${isActive ? 'text-indigo-700' : 'text-slate-900'}`}>{t.label}</div>
                    <div className="text-[10px] font-medium text-slate-400 mt-0.5">{t.desc}</div>
                  </div>
                  {showToc ? (
                    <ChevronDown size={14} className="text-indigo-400 shrink-0" />
                  ) : isActive ? (
                    <ChevronRight size={14} className="text-indigo-400 shrink-0" />
                  ) : null}
                </button>
                {showToc && (
                  <div className="ml-4 mt-1 mb-2 pl-3 border-l border-slate-200 space-y-0.5">
                    {tocItems.map((item, i) => {
                      const tocActive = tocActiveId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => jumpToToc(item.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] leading-snug flex items-start gap-2 transition-colors ${
                            tocActive
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`font-mono text-[10px] mt-0.5 shrink-0 ${tocActive ? 'text-indigo-500' : 'text-slate-400'}`}>{i + 1}</span>
                          <span className="flex-1">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100 shrink-0">
          <button
            onClick={() => navigate('/subjects/mathematics')}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 py-2"
          >
            <ArrowLeft size={13} /> Все разделы
          </button>
        </div>
      </aside>

      {/* ── TopBar ── */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 lg:ml-64">
        <div className="px-6 md:px-10 h-16 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
            <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
              <Home size={11} />
            </Link>
            <ChevronRight size={11} className="text-slate-300" />
            <Link to="/subjects/mathematics" className="hover:text-slate-900 transition-colors">
              Математика
            </Link>
            <ChevronRight size={11} className="text-slate-300" />
            <Link to="/subjects/mathematics" className="hover:text-slate-900 transition-colors">
              {section}
            </Link>
            <ChevronRight size={11} className="text-slate-300" />
            <span className="font-bold text-slate-900 truncate">{decodedTopic}</span>
          </nav>
          <div className="flex items-center gap-2">
            {/* Pill tab switcher (md+) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-full p-1">
              {TAB_META.map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTab(t.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {user ? (
              <>
                <button className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">
                  <Bell size={15} />
                </button>
                <button
                  onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                  className="w-9 h-9 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center hover:bg-slate-700"
                  title="Выйти"
                >
                  {userInitials}
                </button>
              </>
            ) : (
              <>
                <button className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Bell size={15} />
                </button>
                <Link to="/login"
                  className="text-xs font-semibold text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all">
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="lg:ml-64 px-6 md:px-10 py-10">
        {/* Mobile tab switcher */}
        <div className="lg:hidden grid grid-cols-4 gap-2 mb-8">
          {TAB_META.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => changeTab(t.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${
                  activeTab === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'
                }`}>
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Topic header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">{section}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {TAB_META.find((t) => t.id === activeTab)?.label} · {TAB_META.find((t) => t.id === activeTab)?.desc}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{decodedTopic}</h1>
        </header>

        {/* ── THEORY TAB ── */}
        {activeTab === 'theory' && content && (
          <div className="space-y-10 min-w-0">
            <TopicSummary topicName={decodedTopic} />
            <div className="lg:hidden">
              <TheoryTOC topicName={decodedTopic} activeId={tocActiveId} />
            </div>

            <section ref={theoryContainerRef as React.RefObject<HTMLElement>}>
              {RichTheory ? (
                <RichTheory />
              ) : (
                <div className="space-y-8">
                  {content.theory.map((block, i) => (
                    <div key={i} id={`theory-${i}`} className="scroll-mt-28 bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-4">{i + 1}. {block.title}</h2>
                      <p className="text-base text-slate-600 leading-8 whitespace-pre-wrap">{block.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="rounded-3xl bg-slate-900 text-white p-7 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400 mb-2">Теория освоена</div>
                <div className="text-lg font-bold">Закрепи знания на разборе задач.</div>
                <div className="text-sm text-slate-300 mt-1">Или сразу исследуй в Лаборатории — без оценок.</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => changeTab('lab')}
                  className="bg-white/10 text-white border border-white/20 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-colors inline-flex items-center gap-2"
                >
                  <FlaskConical size={14} /> В лабораторию
                </button>
                <button
                  onClick={() => changeTab('worked')}
                  className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
                >
                  К разбору задач <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKED (РАЗБОР) TAB ── */}
        {activeTab === 'worked' && content && (
          <div className="space-y-8">
            {RichWorked ? (
              <RichWorked
                onGoTheory={() => changeTab('theory')}
                onGoPractice={() => changeTab('practice')}
              />
            ) : (
              <>
            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <PenTool size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-slate-900">Разбор задач</h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Пошаговые разборы с объяснением каждого шага. Можно скрыть решение и сначала попробовать самому.
                  </p>
                </div>
              </div>
            </div>

            {content.practice.map((item, i) => (
              <WorkedItem
                key={item.id}
                item={item}
                index={i}
                onGoTheory={() => changeTab('theory')}
              />
            ))}

            <div className="rounded-3xl bg-slate-900 text-white p-7 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400 mb-2">Разборы пройдены</div>
                <div className="text-lg font-bold">Готов решать сам?</div>
                <div className="text-sm text-slate-300 mt-1">{content.independent.length} задач с AI-проверкой.</div>
              </div>
              <button onClick={() => changeTab('practice')} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 inline-flex items-center gap-2">
                К практике <ArrowRight size={15} />
              </button>
            </div>
              </>
            )}
          </div>
        )}

        {/* ── PRACTICE (САМОСТОЯТЕЛЬНАЯ) TAB ── */}
        {activeTab === 'practice' && content && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Практика — тренажёр</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Реши задачи самостоятельно. AI-ментор проверит ответ и объяснит ошибки.
                  </p>
                </div>
              </div>
            </div>

            {content.independent.map((task, i) => (
              <IndependentTaskCard key={task.id} task={task} index={i} onSubmit={checkTask} />
            ))}

            {progress.independent && (
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-7 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-100 mb-2">Тема пройдена</div>
                  <div className="text-lg font-extrabold flex items-center gap-2">
                    <Trophy size={20} /> Молодец! Задачи выполнены.
                  </div>
                  <div className="text-sm text-emerald-50 mt-1">Теория, разбор и практика — всё пройдено.</div>
                </div>
                <button
                  onClick={() => navigate('/subjects/mathematics')}
                  className="bg-white text-emerald-700 px-6 py-3 rounded-2xl font-bold text-sm inline-flex items-center gap-2 hover:bg-emerald-50"
                >
                  К другим темам <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── LAB TAB ── */}
        {activeTab === 'lab' && (
          <LabView topicName={decodedTopic} onGoTheory={() => changeTab('theory')} />
        )}

        {/* ── No content fallback ── */}
        {!content && activeTab !== 'lab' && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <BookOpen className="mx-auto mb-4 text-slate-300" size={40} />
            <p className="font-semibold text-slate-700">Материал для «{decodedTopic}» готовится</p>
            <p className="text-sm mt-2 text-slate-400 mb-6">
              Доступны: Операции с матрицами, Ранг и базис, Собственные значения, SVD — часть 1, SVD — часть 2, Производная и градиент, Случайные величины, Формула Байеса, Проверка гипотез.
            </p>
            <Link to="/subjects/mathematics" className="inline-flex text-sm font-semibold text-indigo-600 hover:underline items-center gap-1">
              <ArrowLeft size={14} /> Выбрать другую тему
            </Link>
          </div>
        )}
      </main>

      <footer className="lg:ml-64 py-10 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">MindFlow Adaptive · Academic License 2026</p>
      </footer>

      {/* Floating AI Mentor */}
      <AIMentorPanel
        topic={decodedTopic}
        activeTab={activeTab}
        personalization={personalization}
        currentTheory={theoryText}
        onSaveMessage={(msg) => saveMessage({ role: msg.role, content: msg.content, aiRole: msg.aiRole })}
      />

      {/* Text-selection popup */}
      <FloatingExplainPopup
        selection={selection}
        topic={decodedTopic}
        theoryText={theoryText}
        profile={profile}
        isAuthenticated={!!user}
        onClose={clearSelection}
      />
    </div>
  );
}
