import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Trash2, Loader2, AlertCircle } from "lucide-react";
import LectureRenderer from "./LectureRenderer";
import { buildApiHeaders, getApiBaseUrl } from "../../lib/api";
import type { LectureDocument } from "./types";

interface LectureResponse {
  id: string;
  title: string;
  source_id: string;
  status: "pending" | "ready" | "failed";
  error?: string | null;
  document: LectureDocument;
  created_at: string;
}

export default function LectureViewPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<LectureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lectureId) return;
    let cancelled = false;

    (async () => {
      try {
        const headers = await buildApiHeaders();
        const res = await fetch(`${getApiBaseUrl()}/api/lectures/${lectureId}`, { headers });
        if (!res.ok) {
          const e = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(e.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as LectureResponse;
        if (!cancelled) setLecture(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [lectureId]);

  const handlePrint = useCallback(() => {
    document.body.classList.add("lecture-printing");
    // Allow style recalculation, then trigger native print dialog (which offers "Save as PDF")
    setTimeout(() => {
      window.print();
      document.body.classList.remove("lecture-printing");
    }, 50);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!lectureId) return;
    if (!confirm("Удалить эту лекцию?")) return;
    const headers = await buildApiHeaders();
    await fetch(`${getApiBaseUrl()}/api/lectures/${lectureId}`, { method: "DELETE", headers });
    navigate("/my-notes");
  }, [lectureId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Загружаем лекцию…
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error ?? "Лекция не найдена"}</span>
        </div>
        <button onClick={() => navigate("/my-notes")} className="mt-4 text-sm text-indigo-600 hover:underline">
          ← Вернуться к списку конспектов
        </button>
      </div>
    );
  }

  if (lecture.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Лекция не сгенерировалась: {lecture.error ?? "неизвестная ошибка"}.
          Попробуй удалить и сгенерировать заново.
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">Удалить</button>
          <button onClick={() => navigate("/my-notes")} className="text-sm text-indigo-600 hover:underline">К списку</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Toolbar (hidden in print) */}
      <div className="lecture-no-print max-w-3xl mx-auto flex items-center justify-between mb-6 px-2">
        <button
          onClick={() => navigate("/my-notes")}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> К конспектам
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Printer size={14} /> Экспорт в PDF
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
            title="Удалить лекцию"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <LectureRenderer doc={lecture.document} />
    </div>
  );
}
