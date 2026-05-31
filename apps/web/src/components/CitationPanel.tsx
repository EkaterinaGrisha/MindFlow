/**
 * CitationPanel.tsx
 * Путь: apps/web/src/components/CitationPanel.tsx
 *
 * Шаг 17: Отображение RAG-ссылок после каждого ответа AI.
 * Показывает источники из которых была взята информация,
 * с возможностью кликнуть и перейти к источнику.
 *
 * Использование в MathTopic.tsx (в AIMentorSidebar после каждого ответа):
 *
 *   import CitationPanel from './CitationPanel';
 *
 *   // В состоянии сообщений добавить citations:
 *   const [citations, setCitations] = useState<Citation[]>([]);
 *
 *   // После ответа API:
 *   setCitations(data.rag?.citations ?? []);
 *
 *   // Отображение:
 *   {citations.length > 0 && <CitationPanel citations={citations} />}
 *
 * Также используется в AILecturer.tsx — там уже есть citations state.
 */

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, X, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Citation {
  source_title: string;
  page_hint:    string | null;
  chunk_id:     string;
  score?:       number;
}

interface CitationPanelProps {
  citations:    Citation[];
  embeddingProvider?: string;
  mmrUsed?:     boolean;
  rerankerUsed?: boolean;
  latencyMs?:   number;
  /** Компактный режим — только список без деталей */
  compact?: boolean;
}

// ─── Вспомогательные ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return null;
  const pct   = Math.round(score * 100);
  const color =
    score >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
    score >= 0.5 ? 'bg-amber-100 text-amber-700' :
                   'bg-surface-container text-on-surface-variant';
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${color}`}>
      {pct}%
    </span>
  );
}

// ─── Chunk viewer modal ────────────────────────────────────────────────────────

interface ChunkViewerState {
  open: boolean;
  loading: boolean;
  title: string;
  pageHint: string | null;
  text: string | null;
}

function ChunkViewerModal({ state, onClose }: { state: ChunkViewerState; onClose: () => void }) {
  if (!state.open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} className="text-secondary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary leading-snug truncate">{state.title}</p>
              {state.pageHint && (
                <p className="text-[10px] text-on-surface-variant">стр. {state.pageHint}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {state.loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-on-surface-variant">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Загружаю фрагмент…</span>
            </div>
          ) : state.text ? (
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{state.text}</p>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-8">Текст недоступен</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Основной компонент ────────────────────────────────────────────────────────

export default function CitationPanel({
  citations,
  embeddingProvider,
  mmrUsed,
  rerankerUsed,
  latencyMs,
  compact = false,
}: CitationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState<ChunkViewerState>({
    open: false, loading: false, title: '', pageHint: null, text: null,
  });

  async function openChunk(chunk: Citation) {
    setViewer({ open: true, loading: true, title: chunk.source_title, pageHint: chunk.page_hint, text: null });
    const { data } = await supabase
      .from('rag_chunks')
      .select('chunk_text')
      .eq('id', chunk.chunk_id)
      .maybeSingle();
    setViewer((v) => ({ ...v, loading: false, text: (data as { chunk_text: string } | null)?.chunk_text ?? null }));
  }

  if (citations.length === 0) return null;

  const closeViewer = () => setViewer((v) => ({ ...v, open: false }));

  // Дедупликация по source_title — группируем чанки по источнику
  const bySource = citations.reduce<Map<string, Citation[]>>((acc, c) => {
    const key = c.source_title;
    (acc.get(key) ?? acc.set(key, []).get(key))!.push(c);
    return acc;
  }, new Map());

  return (
    <>
    <ChunkViewerModal state={viewer} onClose={closeViewer} />
    <div className={compact
      ? "border-t border-slate-100 pt-2 mt-2"
      : "mt-3 rounded-xl border border-outline-variant/20 bg-slate-50/60 overflow-hidden"
    }>
      {/* Заголовок */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-colors hover:bg-surface-container-low/50 ${
          compact ? 'py-1' : 'px-4 py-3'
        }`}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-secondary shrink-0" />
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wide">
            Источники ({bySource.size})
          </span>
          {!compact && latencyMs !== undefined && (
            <span className="text-[9px] text-on-surface-variant font-mono">
              {Math.round(latencyMs)}ms
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp  size={13} className="text-on-surface-variant" />
          : <ChevronDown size={13} className="text-on-surface-variant" />
        }
      </button>

      {/* Содержимое (раскрывается) */}
      {expanded && (
        <div className={compact ? 'pt-1.5 space-y-1' : 'px-4 pb-4 space-y-2'}>

          {/* Список источников */}
          {Array.from(bySource.entries()).map(([title, chunks]) => (
            <div
              key={title}
              className={compact
                ? 'rounded-lg bg-white border border-slate-100 px-2.5 py-2'
                : 'rounded-xl bg-white border border-outline-variant/20 p-3'
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-primary leading-snug ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {title}
                  </p>
                  {/* Список чанков с page_hint — кликабельны */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {chunks.map((c) => (
                      <button
                        key={c.chunk_id}
                        onClick={() => openChunk(c)}
                        title="Посмотреть фрагмент"
                        className="inline-flex items-center gap-1 text-[9px] text-on-surface-variant bg-surface-container-low rounded px-1.5 py-0.5 hover:bg-secondary/10 hover:text-secondary transition-colors cursor-pointer"
                      >
                        {c.page_hint ? `стр. ${c.page_hint}` : `чанк ${c.chunk_id.slice(-4)}`}
                        <ScoreBadge score={c.score} />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Клик открывает первый чанк */}
                <button
                  onClick={() => openChunk(chunks[0])}
                  title="Посмотреть фрагмент"
                  className="shrink-0 mt-0.5 text-outline-variant hover:text-secondary transition-colors"
                >
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
          ))}

          {/* Метаданные retrieval (только не-компактный режим) */}
          {!compact && (mmrUsed !== undefined || rerankerUsed !== undefined || embeddingProvider) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {embeddingProvider && (
                <span className="text-[9px] font-mono text-on-surface-variant bg-surface-container-low rounded px-1.5 py-0.5">
                  embed: {embeddingProvider}
                </span>
              )}
              {mmrUsed && (
                <span className="text-[9px] font-bold text-secondary bg-secondary/10 rounded px-1.5 py-0.5">
                  MMR ✓
                </span>
              )}
              {rerankerUsed && (
                <span className="text-[9px] font-bold text-purple-700 bg-purple-50 rounded px-1.5 py-0.5">
                  reranker ✓
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
