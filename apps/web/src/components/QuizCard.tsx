import { useRef, useState } from "react";
import { Check, X, ArrowRight, HelpCircle, AlertTriangle, Lightbulb } from "lucide-react";
import type { QuizData, QuizType } from "../lib/quizParser";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface QuizAttempt {
  correct:  boolean;
  timeMs:   number;
  answer:   string;
}

const TYPE_META: Record<QuizType, { label: string; icon: typeof HelpCircle; accent: string; questionLabel: string }> = {
  term: {
    label: "Угадай термин",
    icon: HelpCircle,
    accent: "amber",
    questionLabel: "Определение",
  },
  fill: {
    label: "Заполни пропуск",
    icon: Lightbulb,
    accent: "indigo",
    questionLabel: "Пропуск",
  },
  error: {
    label: "Найди ошибку",
    icon: AlertTriangle,
    accent: "rose",
    questionLabel: "Утверждение",
  },
};

const ACCENT_CLASSES: Record<string, { border: string; bg: string; text: string; chipBg: string; btn: string }> = {
  amber: {
    border: "border-amber-300/60",
    bg: "bg-amber-50/50",
    text: "text-amber-800",
    chipBg: "bg-amber-100",
    btn: "bg-amber-600 hover:bg-amber-700",
  },
  indigo: {
    border: "border-indigo-300/60",
    bg: "bg-indigo-50/50",
    text: "text-indigo-800",
    chipBg: "bg-indigo-100",
    btn: "bg-indigo-600 hover:bg-indigo-700",
  },
  rose: {
    border: "border-rose-300/60",
    bg: "bg-rose-50/50",
    text: "text-rose-800",
    chipBg: "bg-rose-100",
    btn: "bg-rose-600 hover:bg-rose-700",
  },
};

function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[ё]/g, "е")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ");
  const u = norm(userAnswer);
  const c = norm(correctAnswer);
  if (!u || !c) return false;
  if (u === c) return true;
  // Lenient: contained or substring match for short answers
  if (c.length <= 30 && (u.includes(c) || c.includes(u))) return true;
  return false;
}

export default function QuizCard({
  data,
  onNext,
  onAnswered,
  disabled,
}: {
  data: QuizData;
  onNext: () => void;
  onAnswered?: (attempt: QuizAttempt) => void;
  disabled?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  const meta = TYPE_META[data.type];
  const accent = ACCENT_CLASSES[meta.accent];
  const Icon = meta.icon;
  const correct = checked && isAnswerCorrect(answer, data.answer);

  const submit = () => {
    if (!answer.trim() || checked) return;
    const isCorrect = isAnswerCorrect(answer, data.answer);
    const timeMs = Date.now() - startedAtRef.current;
    setChecked(true);
    onAnswered?.({ correct: isCorrect, timeMs, answer });
  };

  return (
    <div className={`my-3 rounded-2xl border-2 ${accent.border} ${accent.bg} p-4 shadow-sm`}>
      {/* Header chip */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full ${accent.chipBg} ${accent.text} px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide`}>
          <Icon size={11} /> {meta.label}
        </span>
      </div>

      {/* Question */}
      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/70 mb-1">
        {meta.questionLabel}
      </p>
      <div className="text-sm font-medium text-primary leading-relaxed mb-4">
        {data.question ? (
          <MarkdownRenderer content={data.question} compact />
        ) : (
          <span className="text-on-surface-variant">(вопрос отсутствует)</span>
        )}
      </div>

      {!checked ? (
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && answer.trim()) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Твой ответ…"
            disabled={disabled}
            className="flex-1 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm text-primary placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!answer.trim() || disabled}
            className={`inline-flex items-center gap-1.5 rounded-xl ${accent.btn} px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Check size={13} /> Проверить
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              correct
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {correct ? <Check size={15} /> : <X size={15} />}
            {correct ? "Верно!" : "Неверно"}
          </div>

          <div className="rounded-xl bg-white border border-outline-variant/20 px-3 py-2.5 space-y-1.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/60">Твой ответ</p>
              <p className="text-sm text-primary">{answer || "(пусто)"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/60">Правильный ответ</p>
              <div className="text-sm font-semibold text-emerald-700">
                {data.answer ? (
                  <MarkdownRenderer content={data.answer} compact />
                ) : (
                  "(не указано)"
                )}
              </div>
            </div>
            {data.explanation && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/60">Пояснение</p>
                <div className="text-sm text-on-surface leading-relaxed">
                  <MarkdownRenderer content={data.explanation} compact />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onNext}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 rounded-xl ${accent.btn} px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Дальше <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
