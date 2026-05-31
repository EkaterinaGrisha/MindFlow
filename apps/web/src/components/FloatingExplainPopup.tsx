import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import type { LearningContext } from '@mindflow/shared/llmTypes';
import type { SelectionState } from '../lib/useTextSelection';
import { buildApiHeaders, getApiBaseUrl } from '../lib/api';
import { buildPersonalizationContext } from '../lib/useAuth';
import type { UserProfile } from '../lib/supabase';
import { MarkdownRenderer } from './MarkdownRenderer';

interface FloatingExplainPopupProps {
  selection: SelectionState;
  topic: string;
  theoryText: string;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  onClose: () => void;
}

type ExplainState = 'idle' | 'loading' | 'done' | 'error';

const ROLE_LABELS_RU: Record<string, string> = {
  LECTURER: 'Лектор',
  MIRROR: 'Сократ',
  SANDBOX: 'Тренажёр',
  CHALLENGER: 'Оппонент',
};

export default function FloatingExplainPopup({
  selection,
  topic,
  theoryText,
  profile,
  isAuthenticated,
  onClose,
}: FloatingExplainPopupProps) {
  const [state, setState] = useState<ExplainState>('idle');
  const [answer, setAnswer] = useState('');
  const [aiRole, setAiRole] = useState<string>('LECTURER');
  const popupRef = useRef<HTMLDivElement>(null);

  // Сброс при смене выделения
  useEffect(() => {
    setState('idle');
    setAnswer('');
    setAiRole('LECTURER');
  }, [selection.text]);

  // Закрытие по клику вне попапа
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (state === 'done') {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [state, onClose]);

  if (!selection.isActive || !selection.rect) return null;

  // Позиция: над выделением, по центру
  const rect = selection.rect;
  const top = rect.top + window.scrollY - 52;
  const left = rect.left + window.scrollX + rect.width / 2;

  const handleExplain = async () => {
    setState('loading');

    const personalization = buildPersonalizationContext(profile);

    const ctx: LearningContext = {
      current_topic: topic,
      retrieved_theory: theoryText,
      recent_topics: '',
      experience: personalization.experience,
      level: personalization.level,
      interests: personalization.interests,
      mastered_concepts: '',
      weak_concepts: '',
      knowledge_graph_summary: personalization.knowledgeSummary,
      current_page: `теория — ${topic}`,
      user_input: `Объясни этот фрагмент из темы "${topic}" простыми словами с учётом моего уровня (${personalization.level}) и опыта (${personalization.experience}). Используй примеры. Фрагмент:\n\n"${selection.text}"`,
    };

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/llm/respond`, {
        method: 'POST',
        headers: await buildApiHeaders(),
        // force_role=LECTURER чтобы обойти оркестратор
        body: JSON.stringify({ ...ctx, force_role: 'LECTURER' }),
      });

      if (!res.ok) {
        setState('error');
        return;
      }

      const data = (await res.json()) as { answer?: string; role?: string };
      setAnswer(data.answer ?? 'Не удалось получить объяснение.');
      if (data.role) setAiRole(data.role);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-[9999] transform -translate-x-1/2 pointer-events-auto"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      {/* Кнопка — показывается сразу при выделении */}
      {state === 'idle' && (
        <div className="flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 py-2 shadow-lg shadow-slate-900/30 whitespace-nowrap">
          {isAuthenticated ? (
            <button
              onMouseDown={(e) => {
                e.preventDefault(); // не снимаем выделение
                handleExplain();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-300 transition-colors"
            >
              <Sparkles size={13} className="text-indigo-400" />
              Объяснить
            </button>
          ) : (
            <span className="text-xs text-white/60">Войдите для объяснения</span>
          )}
          <button
            onMouseDown={(e) => { e.preventDefault(); onClose(); }}
            className="text-white/40 hover:text-white ml-1 transition-colors"
          >
            <X size={11} />
          </button>
          {/* Маленький треугольник вниз */}
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 overflow-hidden"
            style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}
          >
            <span className="block w-3 h-3 bg-slate-900 rotate-45 translate-y-[-50%] translate-x-0 mx-auto" />
          </span>
        </div>
      )}

      {/* Загрузка */}
      {state === 'loading' && (
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 p-4 w-72 border border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin text-indigo-500" />
            ИИ-лектор объясняет фрагмент...
          </div>
        </div>
      )}

      {/* Ответ */}
      {state === 'done' && (
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 w-96 border border-slate-100 overflow-hidden">
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 border-b border-indigo-500">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-white" fill="currentColor" />
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                ИИ-объяснение
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Цитата выделенного текста */}
          <div className="px-4 pt-3 pb-0">
            <p className="text-[10px] text-slate-400 italic truncate">
              «{selection.text.slice(0, 80)}{selection.text.length > 80 ? '…' : ''}»
            </p>
          </div>

          {/* Ответ */}
          <div className="px-4 py-3 text-sm text-slate-700 leading-relaxed max-h-72 overflow-y-auto">
            <MarkdownRenderer content={answer} compact />
          </div>

          {/* Подвал */}
          <div className="px-4 py-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Роль: {ROLE_LABELS_RU[aiRole] ?? aiRole}</span>
            <button
              onClick={onClose}
              className="text-xs text-indigo-600 font-medium hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg w-72">
          <p className="text-xs text-red-700 flex-1">Ошибка запроса к API</p>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
