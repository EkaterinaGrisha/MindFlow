import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Loader2, FileText, Sparkles, Trash2, ChevronRight, AlertCircle,
  Search, ArrowUpDown, CheckCircle2, BookOpen, Activity, Sliders, Layers,
} from "lucide-react";
import { buildApiHeaders, buildAuthOnlyHeaders, getApiBaseUrl } from "../../lib/api";
import { T } from "./types";
import type { LectureSummary, PersonalDocument } from "./types";

// ─── Types ──────────────────────────────────────────────────────────────────

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; sourceId: string }
  | { status: "error"; message: string };

type PerRowState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "error"; message: string };

type SortKey = "recent" | "name" | "status";

// ─── API ────────────────────────────────────────────────────────────────────

async function fetchDocuments(): Promise<PersonalDocument[]> {
  const headers = await buildApiHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/personal/documents`, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as { documents: PersonalDocument[] };
  return data.documents ?? [];
}

async function fetchLectures(): Promise<LectureSummary[]> {
  const headers = await buildApiHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/lectures`, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as { lectures: LectureSummary[] };
  return data.lectures ?? [];
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MyNotesPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<PersonalDocument[]>([]);
  const [lectures, setLectures] = useState<LectureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [rowState, setRowState] = useState<Record<string, PerRowState>>({});
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // ── Load & poll status ─────────────────────────────────────────────────
  // refresh() намеренно ничего не бросает: если fetch упал (CORS / сеть /
  // 5xx) — оставляем то, что уже было в state, и снимаем loading. Иначе
  // временный сбой стирал свежезагруженный документ из списка.
  const refresh = useCallback(async () => {
    try {
      const [d, l] = await Promise.all([fetchDocuments(), fetchLectures()]);
      setDocs(d);
      setLectures(l);
    } catch (err) {
      console.warn("[MyNotesPage] refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Poll while any lecture is still pending or any row is "generating".
  const anyPending = useMemo(
    () => lectures.some((l) => l.status === "pending") ||
          Object.values(rowState).some((r) => r.status === "generating"),
    [lectures, rowState],
  );
  useEffect(() => {
    if (!anyPending) return;
    const id = setInterval(() => { void fetchLectures().then(setLectures); }, 4000);
    return () => clearInterval(id);
  }, [anyPending]);

  // Map sourceId → most recent ready lecture
  const lectureBySource = useMemo(() => {
    const map = new Map<string, LectureSummary>();
    // newest first thanks to backend order; but be defensive
    const sorted = [...lectures].sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );
    for (const l of sorted) {
      if (!map.has(l.source_id)) map.set(l.source_id, l);
    }
    return map;
  }, [lectures]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? docs.filter((d) => d.source_title.toLowerCase().includes(q))
      : [...docs];
    if (sortKey === "name") {
      list.sort((a, b) => a.source_title.localeCompare(b.source_title));
    } else if (sortKey === "status") {
      const rank = (d: PersonalDocument): number => {
        const l = lectureBySource.get(d.source_id);
        if (!l) return 3;
        if (l.status === "pending") return 0;
        if (l.status === "ready")   return 1;
        return 2;
      };
      list.sort((a, b) => rank(a) - rank(b));
    }
    // "recent" stays as-is (backend already orders by created_at desc)
    return list;
  }, [docs, search, sortKey, lectureBySource]);

  const readyCount = useMemo(
    () => lectures.filter((l) => l.status === "ready").length,
    [lectures],
  );

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    setUploadState({ status: "uploading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));

      const headers = await buildAuthOnlyHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/personal/upload`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        source_id: string;
        source_title?: string;
        chunks_inserted?: number;
      };

      // Optimistic update: документ сразу появляется в списке, даже если
      // последующий refresh упадёт по CORS/сети. Бэк уже сохранил его в БД.
      const newDoc: PersonalDocument = {
        source_id: data.source_id,
        source_title:
          data.source_title ??
          file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "),
        chunk_count: data.chunks_inserted ?? 0,
      };
      setDocs((prev) => [newDoc, ...prev.filter((d) => d.source_id !== newDoc.source_id)]);

      setUploadState({ status: "done", sourceId: data.source_id });
      await refresh(); // refresh теперь сам ловит ошибки
      setTimeout(() => setUploadState({ status: "idle" }), 3000);
    } catch (e) {
      setUploadState({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, [refresh]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  // ── Generate lecture ────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (sourceId: string) => {
    setRowState((s) => ({ ...s, [sourceId]: { status: "generating" } }));
    try {
      const headers = await buildApiHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/lectures/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sourceId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { lectureId: string };
      navigate(`/my-notes/${data.lectureId}`);
    } catch (e) {
      setRowState((s) => ({
        ...s,
        [sourceId]: { status: "error", message: e instanceof Error ? e.message : String(e) },
      }));
    }
  }, [navigate]);

  // ── Delete document ─────────────────────────────────────────────────────
  const handleDeleteDoc = useCallback(async (sourceId: string) => {
    if (!confirm("Удалить документ и связанные с ним лекции?")) return;
    const headers = await buildApiHeaders();
    await fetch(`${getApiBaseUrl()}/api/personal/documents/${encodeURIComponent(sourceId)}`, {
      method: "DELETE",
      headers,
    });
    await refresh();
  }, [refresh]);

  return (
    <div
      className="lecture-no-print"
      style={{
        maxWidth: 920, margin: "0 auto", padding: "32px 24px 48px",
        color: T.text, fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.22em",
          textTransform: "uppercase", marginBottom: 6,
        }}>
          Мои конспекты
        </div>
        <h1 style={{
          margin: 0, fontSize: 30, fontWeight: 800, color: T.text, lineHeight: 1.2,
        }}>
          Превращаем твои PDF в интерактивные лекции
        </h1>
        <p style={{
          marginTop: 10, fontSize: 14, color: T.muted, lineHeight: 1.65, maxWidth: 620,
        }}>
          Загрузи документ — MindFlow соберёт из него структурированный материал
          с формулами, графиками, слайдерами и пошаговыми задачами.
        </p>

        {/* mini-stats */}
        {(docs.length > 0 || lectures.length > 0) && (
          <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
            <Stat icon={<FileText size={14} />} label="документов" value={docs.length} color={T.primary} />
            <Stat icon={<CheckCircle2 size={14} />} label="лекций готово" value={readyCount} color={T.green} />
            {anyPending && (
              <Stat icon={<Loader2 size={14} className="lecture-spin" />} label="генерируется" value={
                lectures.filter((l) => l.status === "pending").length +
                Object.values(rowState).filter((r) => r.status === "generating").length
              } color={T.amber} />
            )}
          </div>
        )}
      </header>

      {/* ── Dropzone ─────────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => uploadState.status !== "uploading" && fileRef.current?.click()}
        style={{
          borderRadius: 18,
          border: `2px dashed ${dragging ? T.primary : T.border}`,
          background: dragging ? T.primaryLight : T.surface,
          padding: "32px 24px", textAlign: "center", cursor: "pointer",
          transition: "all 0.2s", marginBottom: 28,
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleUpload(f); e.target.value = ""; } }}
        />
        {uploadState.status === "uploading" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: T.primary }}>
            <Loader2 size={30} className="lecture-spin" />
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Загружаем и обрабатываем документ…</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>30–60 секунд для больших файлов</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: T.muted }}>
            <Upload size={28} color={dragging ? T.primary : T.muted} />
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
              {dragging ? "Отпусти, чтобы загрузить" : "Перетащи файл или кликни"}
            </p>
            <p style={{ fontSize: 12, color: T.mutedLight, margin: 0 }}>PDF, DOCX, TXT, MD — до 20 МБ</p>
          </div>
        )}
      </div>

      {uploadState.status === "error" && (
        <div style={{
          borderRadius: 14, background: T.redLight, border: `1px solid ${T.red}40`,
          padding: "10px 14px", fontSize: 13, color: T.red, marginBottom: 20,
          display: "flex", alignItems: "start", gap: 8,
        }}>
          <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{uploadState.message}</span>
        </div>
      )}

      {/* ── Documents list ───────────────────────────────────────────────── */}
      {!loading && docs.length === 0 ? (
        <EmptyOnboarding />
      ) : (
        <>
          {/* Toolbar */}
          {docs.length > 1 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
              flexWrap: "wrap",
            }}>
              <div style={{
                flex: 1, minWidth: 200, position: "relative",
              }}>
                <Search size={14} style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: T.mutedLight,
                }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию"
                  style={{
                    width: "100%", padding: "8px 12px 8px 34px", fontSize: 13,
                    border: `1px solid ${T.border}`, borderRadius: 10,
                    background: T.white, color: T.text, outline: "none",
                  }}
                />
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: T.white, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "0 4px 0 10px",
              }}>
                <ArrowUpDown size={12} color={T.mutedLight} />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  style={{
                    border: "none", outline: "none", background: "transparent",
                    fontSize: 13, color: T.text, padding: "8px 6px", cursor: "pointer",
                  }}
                >
                  <option value="recent">Свежие сверху</option>
                  <option value="name">По названию</option>
                  <option value="status">По статусу</option>
                </select>
              </div>
            </div>
          )}

          <h2 style={{
            fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.22em",
            textTransform: "uppercase", margin: "0 0 12px 4px",
          }}>
            Загруженные документы
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: T.muted, fontSize: 13 }}>
              <Loader2 size={16} className="lecture-spin" style={{ verticalAlign: "middle", marginRight: 8 }} />
              Загружаем…
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{
              borderRadius: 14, background: T.white, border: `1px solid ${T.border}`,
              padding: "20px", textAlign: "center", color: T.muted, fontSize: 13,
            }}>
              Ничего не найдено по запросу «{search}».
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredDocs.map((d) => (
                <DocCard
                  key={d.source_id}
                  doc={d}
                  lecture={lectureBySource.get(d.source_id)}
                  rowState={rowState[d.source_id]}
                  onGenerate={() => handleGenerate(d.source_id)}
                  onOpen={(lectureId) => navigate(`/my-notes/${lectureId}`)}
                  onDelete={() => handleDeleteDoc(d.source_id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Local CSS for spin */}
      <style>{`
        @keyframes lecture-spin { to { transform: rotate(360deg); } }
        .lecture-spin { animation: lecture-spin 0.9s linear infinite; transform-origin: center; }
      `}</style>
    </div>
  );
}

// ─── Stat chip ──────────────────────────────────────────────────────────────

function Stat({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <span style={{ color, display: "flex" }}>{icon}</span>
      <strong style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
      <span style={{ color: T.muted }}>{label}</span>
    </div>
  );
}

// ─── Document card ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "generating" | "ready" | "pending" | "failed" | "idle" }) {
  const cfg = {
    generating: { color: T.amber, bg: T.amberLight, label: "генерируется" },
    pending:    { color: T.amber, bg: T.amberLight, label: "в очереди" },
    ready:      { color: T.green, bg: T.greenLight, label: "лекция готова" },
    failed:     { color: T.red,   bg: T.redLight,   label: "ошибка" },
    idle:       { color: T.muted, bg: T.surface,    label: "ещё нет лекции" },
  }[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
      padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function DocCard({
  doc, lecture, rowState, onGenerate, onOpen, onDelete,
}: {
  doc: PersonalDocument;
  lecture?: LectureSummary;
  rowState?: PerRowState;
  onGenerate: () => void;
  onOpen: (lectureId: string) => void;
  onDelete: () => void;
}) {
  const isGenerating = rowState?.status === "generating" ||
                       (lecture && lecture.status === "pending");
  const status = isGenerating ? "generating"
              : lecture?.status === "ready"  ? "ready"
              : lecture?.status === "failed" ? "failed"
              : "idle";
  const accent = status === "ready"      ? T.green
              : status === "generating"  ? T.amber
              : status === "failed"      ? T.red
              : T.primary;

  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${accent}`, borderRadius: 14,
      padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: `${accent}14`,
        color: accent, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <FileText size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {doc.source_title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.muted }}>
          <StatusBadge status={status} />
          <span>{doc.chunk_count} фрагментов</span>
        </div>
        {rowState?.status === "error" && (
          <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{rowState.message}</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {status === "ready" && lecture ? (
          <button
            onClick={() => onOpen(lecture.id)}
            style={{
              background: T.primary, color: T.white, border: "none",
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            Открыть <ChevronRight size={13} />
          </button>
        ) : status === "generating" ? (
          <span style={{
            color: T.amber, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            padding: "8px 12px",
          }}>
            <Loader2 size={13} className="lecture-spin" /> 30–60 сек
          </span>
        ) : (
          <button
            onClick={onGenerate}
            style={{
              background: T.primaryLight, color: T.primaryDark,
              border: `1px solid ${T.primaryBorder}`,
              padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Sparkles size={13} />
            Сгенерировать
          </button>
        )}
        <button
          onClick={onDelete}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: T.mutedLight, padding: 6, display: "flex",
          }}
          title="Удалить документ"
          aria-label="Удалить"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Empty onboarding ───────────────────────────────────────────────────────

function EmptyOnboarding() {
  const features = [
    { Icon: BookOpen, color: T.primary, title: "Структурированная теория",
      text: "Определения, формулы, callout'ы, KaTeX-формулы — оформлено как печатный учебник." },
    { Icon: Activity, color: T.green, title: "Графики и диаграммы",
      text: "Функции, векторы, распределения, числовая ось — рендерятся в SVG." },
    { Icon: Sliders, color: T.violet, title: "Интерактивы",
      text: "Слайдер-эксплорер параметров, заполни пропуски, расставь шаги по порядку." },
    { Icon: Layers, color: T.cyan, title: "Пошаговое решение",
      text: "Задачи с проверкой каждого шага и подсказками." },
  ];

  return (
    <div style={{
      borderRadius: 16, background: T.white, border: `1px solid ${T.border}`,
      padding: "26px 28px",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: T.primary, letterSpacing: "0.18em",
        textTransform: "uppercase", marginBottom: 8,
      }}>
        Как это работает
      </div>
      <h3 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 800, color: T.text }}>
        Что появится после загрузки документа
      </h3>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
      }}>
        {features.map(({ Icon, color, title, text }, i) => (
          <div key={i} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: `${color}18`,
              color, display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              <Icon size={16} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              {text}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 16, padding: "10px 14px", background: T.primaryLight,
        border: `1px solid ${T.primaryBorder}`, borderRadius: 10,
        fontSize: 12, color: T.text, lineHeight: 1.55,
      }}>
        <strong style={{ color: T.primaryDark }}>Совет: </strong>
        чем структурированнее исходный конспект (заголовки, формулы, примеры) — тем больше блоков соберёт генератор.
      </div>
    </div>
  );
}
