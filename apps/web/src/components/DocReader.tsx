import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2, MessageSquare, X } from "lucide-react";
import { buildApiHeaders, getApiBaseUrl } from "../lib/api";

type ReaderChunk = {
  chunk_index: number;
  chunk_text: string;
  page_hint: string | null;
};

export default function DocReader({
  sourceId, sourceTitle, onClose, onAsk,
}: {
  sourceId: string;
  sourceTitle: string;
  onClose: () => void;
  onAsk: (selectedText: string) => void;
}) {
  const [chunks, setChunks] = useState<ReaderChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageIdx, setPageIdx] = useState(0);
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch chunks
  useEffect(() => {
    setLoading(true);
    setError("");
    buildApiHeaders()
      .then((headers) =>
        fetch(`${getApiBaseUrl()}/api/personal/documents/${encodeURIComponent(sourceId)}/text`, { headers })
      )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { chunks: ReaderChunk[] }) => {
        setChunks(data.chunks);
        setPageIdx(0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [sourceId]);

  // Track text selection inside the content area
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setPopup(null); return; }
      const text = sel.toString().trim();
      if (!text || text.length < 3) { setPopup(null); return; }
      const anchor = sel.anchorNode;
      if (!anchor || !contentRef.current?.contains(anchor)) { setPopup(null); return; }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPopup(null); return; }
      setPopup({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
      });
    };
    document.addEventListener("mouseup", handler);
    document.addEventListener("touchend", handler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("touchend", handler);
    };
  }, []);

  // Close popup on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPopup(null); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Clear popup when changing pages
  useEffect(() => { setPopup(null); }, [pageIdx]);

  const handleAsk = () => {
    if (!popup) return;
    onAsk(popup.text);
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  };

  const current = chunks[pageIdx];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/20 bg-surface-container-low shrink-0">
        <FileText size={15} className="text-secondary shrink-0" />
        <span className="text-sm font-semibold text-primary truncate flex-1">{sourceTitle}</span>
        {chunks.length > 0 && (
          <span className="text-xs text-on-surface-variant shrink-0">
            {current?.page_hint || `${pageIdx + 1} / ${chunks.length}`}
          </span>
        )}
        <button onClick={onClose} title="Закрыть (Esc)"
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>

      {/* Hint banner */}
      <div className="px-4 py-2 bg-secondary/5 border-b border-secondary/15 text-[11px] text-secondary shrink-0">
        💡 Выдели любой фрагмент текста — появится кнопка «Спросить об этом»
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-secondary" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : current ? (
          <article
            className="text-[15px] leading-relaxed text-primary whitespace-pre-wrap select-text max-w-3xl mx-auto font-serif"
            style={{ textRendering: "optimizeLegibility" }}
          >
            {current.chunk_text}
          </article>
        ) : (
          <p className="text-on-surface-variant text-sm">Документ пуст</p>
        )}
      </div>

      {/* Pagination */}
      {chunks.length > 1 && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-outline-variant/20 bg-surface-container-low shrink-0">
          <button
            onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
            disabled={pageIdx === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-white px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} /> Назад
          </button>
          <span className="text-xs text-on-surface-variant flex-1 text-center">
            Фрагмент <span className="font-semibold text-primary">{pageIdx + 1}</span> из {chunks.length}
          </span>
          <button
            onClick={() => setPageIdx((i) => Math.min(chunks.length - 1, i + 1))}
            disabled={pageIdx === chunks.length - 1}
            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-white px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Вперёд <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Selection popup */}
      {popup && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAsk}
          style={{ left: popup.x, top: popup.y - 42, transform: "translateX(-50%)" }}
          className="fixed z-[60] inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-bold text-white shadow-xl hover:bg-secondary/90 transition-colors"
        >
          <MessageSquare size={12} /> Спросить об этом
        </button>
      )}
    </div>
  );
}
