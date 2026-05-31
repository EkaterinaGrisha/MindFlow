import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  GraduationCap,
  Grid,
  Layers,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { buildApiHeaders, buildAuthOnlyHeaders, getApiBaseUrl } from "../../lib/api";
import { MarkdownRenderer } from "../MarkdownRenderer";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = "study" | "author";
type StudyTab = "materials" | "chat";
type AuthorTab = "upload" | "structure" | "chat";

type ImproveGoal = "add_examples" | "add_interactive" | "shorten" | "add_quiz" | "general";

type SourceRef = { num: number; title: string; pageHint: string | null; snippet?: string };
type ChatMessage = { role: "user" | "assistant"; content: string; sources?: SourceRef[] };

type PersonalDoc = { source_id: string; source_title: string; chunk_count: number };

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; doc: PersonalDoc }
  | { status: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_MAX_CHARS = 30_000;

const IMPROVE_GOALS: { value: ImproveGoal; label: string; icon: React.ElementType }[] = [
  { value: "general",          label: "Общие рекомендации",   icon: Lightbulb },
  { value: "add_examples",     label: "Добавить примеры",     icon: BookOpen },
  { value: "add_interactive",  label: "Предложить интерактив", icon: Sparkles },
  { value: "add_quiz",         label: "Добавить вопросы",     icon: Grid },
  { value: "shorten",          label: "Сократить",            icon: FileText },
];

const PLACEHOLDER_CONTENT = `Матрицы — прямоугольные таблицы чисел, с которыми можно выполнять арифметические операции.

Сложение матриц выполняется поэлементно: (A+B)ij = Aij + Bij. Матрицы должны иметь одинаковый размер.

Умножение матриц — более сложная операция. Элемент (AB)ij равен скалярному произведению i-й строки A на j-й столбец B.`;

// ─── API helpers ──────────────────────────────────────────────────────────────

async function callAuthorApi(path: string, body: Record<string, unknown>): Promise<string> {
  const headers = await buildApiHeaders();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { response: string };
  return data.response;
}

async function callLlmApi(body: Record<string, unknown>): Promise<{ answer: string; sources: SourceRef[] }> {
  const headers = await buildApiHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/llm/respond`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    answer?: string;
    rag?: {
      sourcesUsed?: { source_title: string; page_hint: string | null }[];
      citations?: { source_title: string; page_hint: string | null; snippet?: string }[];
    };
  };
  const answer = data.answer ?? "Пустой ответ от ментора.";
  const snippetBySource = new Map<string, string>();
  for (const c of data.rag?.citations ?? []) {
    const key = `${c.source_title}__${c.page_hint ?? ""}`;
    if (!snippetBySource.has(key) && c.snippet) {
      snippetBySource.set(key, c.snippet);
    }
  }
  const allSources: SourceRef[] = (data.rag?.sourcesUsed ?? []).map((s, i) => ({
    num: i + 1,
    title: s.source_title,
    pageHint: s.page_hint ?? null,
    snippet: snippetBySource.get(`${s.source_title}__${s.page_hint ?? ""}`),
  }));
  // keep only references that actually appear in the answer text
  const cited = new Set([...answer.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1])));
  const sources = cited.size > 0 ? allSources.filter((s) => cited.has(s.num)) : allSources.slice(0, 3);
  return { answer, sources };
}

function withInlineSourceTooltips(text: string, sources?: SourceRef[]): string {
  if (!sources || sources.length === 0) return text;
  const byNum = new Map(sources.map((s) => [s.num, s]));
  return text.replace(/\[(\d+)\]/g, (_m, nRaw: string) => {
    const n = Number.parseInt(nRaw, 10);
    const src = byNum.get(n);
    if (!src) return `[${nRaw}]`;
    const title = [src.title, src.pageHint ? `(${src.pageHint})` : "", src.snippet ?? ""]
      .filter(Boolean)
      .join(" • ")
      .replace(/"/g, "'");
    return `[[${nRaw}]](# "${title}")`;
  });
}

async function fetchPersonalDocs(): Promise<PersonalDoc[]> {
  const headers = await buildApiHeaders();
  const res = await fetch(`${getApiBaseUrl()}/api/personal/documents`, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as { documents: PersonalDoc[] };
  return data.documents ?? [];
}

async function deletePersonalDoc(sourceId: string): Promise<void> {
  const headers = await buildApiHeaders();
  await fetch(`${getApiBaseUrl()}/api/personal/documents/${encodeURIComponent(sourceId)}`, {
    method: "DELETE",
    headers,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSectionsFromMarkdown(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => /^#{1,3}\s/.test(line))
    .map((line) => line.replace(/^#+\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 12); // cap to avoid overwhelming UI
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon: Icon, label, badge,
}: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      }`}
    >
      <Icon size={15} />
      {label}
      {badge && (
        <span className="ml-1 bg-indigo-100 text-indigo-700 text-[11px] rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Study: Materials tab ─────────────────────────────────────────────────────

function MaterialsTab({
  docs,
  uploadState,
  onUpload,
  onDelete,
}: {
  docs: PersonalDoc[];
  uploadState: UploadState;
  onUpload: (file: File) => void;
  onDelete: (sourceId: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file);
    },
    [onUpload],
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => uploadState.status !== "uploading" && fileRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          dragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ""; } }}
        />

        {uploadState.status === "uploading" ? (
          <div className="flex flex-col items-center gap-3 text-indigo-600">
            <Loader2 size={32} className="animate-spin" />
            <p className="font-medium text-sm">Извлекаем текст, создаём чанки, строим эмбеддинги…</p>
            <p className="text-xs text-slate-500">Для больших документов это может занять 30–60 секунд</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Upload size={32} />
            <div>
              <p className="font-semibold text-slate-700 text-sm">Перетащи файл или кликни</p>
              <p className="text-xs mt-1">PDF, DOCX, TXT, MD — до 20 МБ</p>
            </div>
          </div>
        )}

        {uploadState.status === "done" && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span>✓</span> Загружено
          </div>
        )}
      </div>

      {uploadState.status === "error" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {uploadState.message}
        </div>
      )}

      {docs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Мои учебники ({docs.length})
          </p>
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <div
                key={doc.source_id}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3"
              >
                <FileText size={16} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.source_title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.chunk_count} фрагментов</p>
                </div>
                <button
                  onClick={() => onDelete(doc.source_id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && uploadState.status === "idle" && (
        <p className="text-center text-sm text-slate-400">
          Загрузи учебник, конспект или любой PDF — ментор будет отвечать именно по нему.
        </p>
      )}
    </div>
  );
}

// ─── Chat tab (shared) ────────────────────────────────────────────────────────

function ChatTab({
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  placeholder,
  contextHint,
}: {
  messages: ChatMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  placeholder: string;
  contextHint?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && input.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {contextHint && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-xs text-indigo-700">
          <FileText size={13} className="mt-0.5 shrink-0" />
          <span>{contextHint}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 min-h-[50vh] max-h-[60vh] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
            <Bot size={28} className="text-indigo-300" />
            <span>{placeholder}</span>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col gap-1 max-w-[82%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.role === "assistant"
                    ? <MarkdownRenderer content={withInlineSourceTooltips(msg.content, msg.sources)} />
                    : msg.content}
                </div>
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-1">
                    {msg.sources.map((s) => (
                      <span
                        key={s.num}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 border border-slate-200"
                        title={s.pageHint ?? s.title}
                      >
                        <FileText size={10} className="shrink-0" />
                        [{s.num}] {s.title}
                        {s.pageHint && (
                          <span className="text-slate-400">· {s.pageHint}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 size={16} className="text-indigo-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Спроси… (Ctrl+Enter для отправки)"
          rows={2}
          className="flex-1 resize-none px-3 py-2 text-sm focus:outline-none bg-transparent leading-relaxed"
          disabled={loading}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors shrink-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center">Ctrl+Enter для отправки</p>
    </div>
  );
}

// ─── Author: Upload tab ───────────────────────────────────────────────────────

function AuthorUploadTab({
  content, topicHint, onContentChange, onTopicHintChange, onAnalyse, loading, error,
}: {
  content: string; topicHint: string;
  onContentChange: (v: string) => void; onTopicHintChange: (v: string) => void;
  onAnalyse: () => void; loading: boolean; error: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onContentChange((ev.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
  }

  const overLimit = content.length > CONTENT_MAX_CHARS;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Тема / раздел (необязательно)"
          value={topicHint}
          onChange={(e) => onTopicHintChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Upload size={14} /> Загрузить .txt / .md
        </button>
        <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFile} />
      </div>

      {overLimit && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            Материал слишком большой ({content.length.toLocaleString("ru")} символов).
            При анализе будут использованы первые {CONTENT_MAX_CHARS.toLocaleString("ru")} символов.
            Для работы со всем текстом загружай по главам.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={PLACEHOLDER_CONTENT}
        rows={16}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 leading-relaxed"
      />

      <div className="flex items-center justify-between">
        <span className={`text-xs ${overLimit ? "text-amber-600 font-medium" : "text-slate-400"}`}>
          {content.length.toLocaleString("ru")} / {CONTENT_MAX_CHARS.toLocaleString("ru")} символов
          {overLimit && " — будет обрезано"}
        </span>
        <button
          onClick={onAnalyse}
          disabled={!content.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          Анализировать структуру
        </button>
      </div>
    </div>
  );
}

// ─── Author: Structure tab ────────────────────────────────────────────────────

function StructureTab({
  structureResult, improveGoal, onImproveGoalChange, sectionText,
  onSectionTextChange, onImprove, improveResult, loading,
  parsedSections, generatingSection, generatedSections, onGenerateSection, onExport,
}: {
  structureResult: string; improveGoal: ImproveGoal;
  onImproveGoalChange: (g: ImproveGoal) => void;
  sectionText: string; onSectionTextChange: (v: string) => void;
  onImprove: () => void; improveResult: string; loading: boolean;
  parsedSections: string[];
  generatingSection: string | null;
  generatedSections: Record<string, string>;
  onGenerateSection: (title: string) => void;
  onExport: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const hasGenerated = Object.keys(generatedSections).length > 0;

  return (
    <div className="flex flex-col gap-6">
      {structureResult ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700">
            <Bot size={16} className="text-indigo-500" /> Анализ методиста
          </div>
          <MarkdownRenderer content={structureResult} />
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-sm">
          Сначала загрузи материал на вкладке «Материал» и нажми «Анализировать структуру»
        </div>
      )}

      {/* Per-section generation */}
      {parsedSections.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Zap size={16} className="text-indigo-500" /> Генерация учебного текста
            </div>
            {hasGenerated && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Download size={12} /> Экспорт .md
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Нажми «Сгенерировать» рядом с любым разделом — методист напишет учебный текст с формулами и примером.
          </p>
          <div className="flex flex-col gap-2">
            {parsedSections.map((title) => {
              const isGenerating = generatingSection === title;
              const generated = generatedSections[title];
              const isExpanded = expandedSection === title;
              return (
                <div key={title} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                    <span className="flex-1 text-sm font-medium text-slate-800 truncate">{title}</span>
                    {generated ? (
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : title)}
                        className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? "Скрыть" : "Показать"}
                      </button>
                    ) : null}
                    <button
                      onClick={() => onGenerateSection(title)}
                      disabled={isGenerating || !!generatingSection}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        generated
                          ? "border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                      }`}
                    >
                      {isGenerating ? (
                        <><Loader2 size={12} className="animate-spin" /> Генерирую…</>
                      ) : generated ? (
                        <><Sparkles size={12} /> Перегенерировать</>
                      ) : (
                        <><Sparkles size={12} /> Сгенерировать</>
                      )}
                    </button>
                  </div>
                  {generated && isExpanded && (
                    <div className="px-4 py-4 text-sm border-t border-slate-100 bg-white">
                      <MarkdownRenderer content={generated} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Improve section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
          <Wand2 size={16} className="text-indigo-500" /> Улучшить раздел
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {IMPROVE_GOALS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onImproveGoalChange(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                improveGoal === value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
        <textarea
          value={sectionText}
          onChange={(e) => onSectionTextChange(e.target.value)}
          placeholder="Вставь сюда текст конкретного раздела для улучшения…"
          rows={6}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
        />
        <div className="flex items-center justify-between mt-3">
          {loading && (
            <span className="flex items-center gap-1.5 text-sm text-indigo-600">
              <Loader2 size={14} className="animate-spin" /> Методист думает…
            </span>
          )}
          <button
            onClick={onImprove}
            disabled={!sectionText.trim() || loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            <Sparkles size={14} /> Улучшить
          </button>
        </div>
        {improveResult && (
          <div className="mt-4 bg-indigo-50 rounded-xl p-4 text-sm">
            <MarkdownRenderer content={improveResult} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AuthorWorkbench() {
  const [mode, setMode] = useState<Mode>("study");

  // Study mode state
  const [studyTab, setStudyTab] = useState<StudyTab>("materials");
  const [docs, setDocs] = useState<PersonalDoc[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [studyMessages, setStudyMessages] = useState<ChatMessage[]>([]);
  const [studyInput, setStudyInput] = useState("");
  const [studyLoading, setStudyLoading] = useState(false);

  // Author mode state
  const [authorTab, setAuthorTab] = useState<AuthorTab>("upload");
  const [content, setContent] = useState("");
  const [topicHint, setTopicHint] = useState("");
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [structureError, setStructureError] = useState("");
  const [structureResult, setStructureResult] = useState("");
  const [parsedSections, setParsedSections] = useState<string[]>([]);
  const [improveGoal, setImproveGoal] = useState<ImproveGoal>("general");
  const [sectionText, setSectionText] = useState("");
  const [improveResult, setImproveResult] = useState("");
  const [improveLoading, setImproveLoading] = useState(false);
  const [authorMessages, setAuthorMessages] = useState<ChatMessage[]>([]);
  const [authorInput, setAuthorInput] = useState("");
  const [authorLoading, setAuthorLoading] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [generatedSections, setGeneratedSections] = useState<Record<string, string>>({});

  // Load docs once when switching to study mode
  const loadDocs = useCallback(async () => {
    if (docsLoaded) return;
    const fetched = await fetchPersonalDocs();
    setDocs(fetched);
    setDocsLoaded(true);
  }, [docsLoaded]);

  const handleModeSwitch = (m: Mode) => {
    setMode(m);
    if (m === "study") loadDocs();
  };

  // ── Study: upload ──────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File) => {
    setUploadState({ status: "uploading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));

      const authHeaders = await buildAuthOnlyHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/personal/upload`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        source_id: string; source_title: string; chunks_inserted: number;
      };
      const newDoc: PersonalDoc = {
        source_id: data.source_id,
        source_title: data.source_title,
        chunk_count: data.chunks_inserted,
      };
      setDocs((prev) => {
        const without = prev.filter((d) => d.source_id !== newDoc.source_id);
        return [newDoc, ...without];
      });
      setUploadState({ status: "done", doc: newDoc });

      setTimeout(() => setUploadState({ status: "idle" }), 4000);
      setStudyTab("chat");
    } catch (err) {
      setUploadState({
        status: "error",
        message: err instanceof Error ? err.message : "Ошибка загрузки",
      });
    }
  }, []);

  // ── Study: delete ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (sourceId: string) => {
    await deletePersonalDoc(sourceId);
    setDocs((prev) => prev.filter((d) => d.source_id !== sourceId));
  }, []);

  // ── Study: chat ────────────────────────────────────────────────────────────

  const handleStudyChatSend = useCallback(async () => {
    if (!studyInput.trim() || studyLoading) return;
    const userMsg = studyInput.trim();
    setStudyMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStudyInput("");
    setStudyLoading(true);
    try {
      const { answer, sources } = await callLlmApi({
        current_topic: docs[0]?.source_title ?? "Личный учебник",
        retrieved_theory: "",
        recent_topics: "",
        experience: "не указан",
        level: "не указан",
        interests: "не указаны",
        mastered_concepts: "",
        weak_concepts: "",
        knowledge_graph_summary: "Пользователь изучает свой личный загруженный учебник.",
        current_page: "личный учебник",
        user_input: userMsg,
        personal_rag: true,
      });
      setStudyMessages((prev) => [...prev, { role: "assistant", content: answer, sources }]);
    } catch {
      setStudyMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Произошла ошибка. Попробуй ещё раз." },
      ]);
    } finally {
      setStudyLoading(false);
    }
  }, [studyInput, studyLoading, docs]);

  // ── Author: analyse structure ──────────────────────────────────────────────

  const handleAnalyse = useCallback(async () => {
    if (!content.trim()) return;
    setAnalyseLoading(true);
    setStructureError("");

    const contentToSend =
      content.length > CONTENT_MAX_CHARS ? content.slice(0, CONTENT_MAX_CHARS) : content;

    try {
      const result = await callAuthorApi("/api/author/structure", {
        content: contentToSend,
        topic_hint: topicHint || undefined,
      });
      setStructureResult(result);
      setParsedSections(parseSectionsFromMarkdown(result));
      setGeneratedSections({});
      setAuthorTab("structure");
    } catch (err) {
      setStructureError(err instanceof Error ? err.message : "Ошибка анализа. Попробуй ещё раз.");
    } finally {
      setAnalyseLoading(false);
    }
  }, [content, topicHint]);

  // ── Author: improve section ────────────────────────────────────────────────

  const handleImprove = useCallback(async () => {
    if (!sectionText.trim()) return;
    setImproveLoading(true);
    try {
      const result = await callAuthorApi("/api/author/improve", {
        section_text: sectionText,
        improve_goal: improveGoal,
      });
      setImproveResult(result);
    } catch { /* silent — user can retry */ }
    finally { setImproveLoading(false); }
  }, [sectionText, improveGoal]);

  // ── Author: generate theory for one section ────────────────────────────────

  const handleGenerateSection = useCallback(async (sectionTitle: string) => {
    setGeneratingSection(sectionTitle);
    try {
      const result = await callAuthorApi("/api/author/generate-theory", {
        section_title: sectionTitle,
        topic_hint: topicHint || undefined,
      });
      setGeneratedSections((prev) => ({ ...prev, [sectionTitle]: result }));
    } catch { /* silent */ }
    finally { setGeneratingSection(null); }
  }, [topicHint]);

  // ── Author: export generated content ──────────────────────────────────────

  const handleExport = useCallback(() => {
    const name = topicHint || "course-material";
    const parts: string[] = [`# ${topicHint || "Учебный материал"}\n`];

    for (const title of parsedSections) {
      parts.push(`\n## ${title}\n`);
      if (generatedSections[title]) {
        parts.push(generatedSections[title]);
      } else {
        parts.push("_Текст не сгенерирован_");
      }
    }

    if (structureResult) {
      parts.push("\n\n---\n\n## Анализ методиста\n\n" + structureResult);
    }

    downloadMarkdown(name, parts.join("\n"));
  }, [topicHint, parsedSections, generatedSections, structureResult]);

  // ── Author: methodist chat ─────────────────────────────────────────────────

  const handleAuthorChatSend = useCallback(async () => {
    if (!authorInput.trim() || authorLoading) return;
    const userMsg = authorInput.trim();
    setAuthorMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setAuthorInput("");
    setAuthorLoading(true);
    try {
      const result = await callAuthorApi("/api/author/chat", {
        author_request: userMsg,
        author_content: content || undefined,
        topic_hint: topicHint || undefined,
        history: authorMessages.slice(-10),
      });
      setAuthorMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } catch {
      setAuthorMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Произошла ошибка. Попробуй ещё раз." },
      ]);
    } finally {
      setAuthorLoading(false);
    }
  }, [authorInput, authorLoading, content, topicHint, authorMessages]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            {mode === "study" ? <GraduationCap size={18} className="text-white" /> : <Wand2 size={18} className="text-white" />}
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-base leading-tight">
              {mode === "study" ? "Личный учебник в AI" : "Рабочее место методиста"}
            </h1>
            <p className="text-xs text-slate-500">
              {mode === "study"
                ? "Загрузи свой учебник — ментор будет отвечать именно по нему"
                : "Загрузи учебный материал — AI-методист поможет упаковать в курс"}
            </p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => handleModeSwitch("study")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "study" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <GraduationCap size={13} /> Изучаю
              </button>
              <button
                onClick={() => handleModeSwitch("author")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === "author" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Wand2 size={13} /> Создаю курс
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-4xl mx-auto flex gap-1 py-2">
          {mode === "study" ? (
            <>
              <TabButton active={studyTab === "materials"} onClick={() => setStudyTab("materials")} icon={Upload} label="Мои материалы" badge={docs.length > 0 ? String(docs.length) : undefined} />
              <TabButton active={studyTab === "chat"} onClick={() => setStudyTab("chat")} icon={Bot} label="Чат с ментором" badge={studyMessages.length > 0 ? String(studyMessages.length) : undefined} />
            </>
          ) : (
            <>
              <TabButton active={authorTab === "upload"} onClick={() => setAuthorTab("upload")} icon={Upload} label="Материал" />
              <TabButton active={authorTab === "structure"} onClick={() => setAuthorTab("structure")} icon={Layers} label="Структура" badge={structureResult ? "✓" : undefined} />
              <TabButton active={authorTab === "chat"} onClick={() => setAuthorTab("chat")} icon={Bot} label="Чат с методистом" badge={authorMessages.length > 0 ? String(authorMessages.length) : undefined} />
            </>
          )}
        </div>
      </div>

      {/* How-it-works banner */}
      <div className="max-w-4xl mx-auto px-6 pt-5">
        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 text-sm text-indigo-800">
          <ChevronRight size={16} className="mt-0.5 shrink-0 text-indigo-500" />
          <span>
            {mode === "study" ? (
              <><strong>Как работать:</strong> загрузи PDF или DOCX своего учебника → переходи в «Чат с ментором» → задавай вопросы — ответы будут из твоего материала.</>
            ) : (
              <><strong>Как работать:</strong> вставь текст учебника или конспекта → нажми «Анализировать» → методист предложит структуру и разделы → нажми «Сгенерировать» рядом с любым разделом → экспортируй в .md.</>
            )}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <AnimatePresence mode="wait">
          {mode === "study" && studyTab === "materials" && (
            <motion.div key="study-materials" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <MaterialsTab docs={docs} uploadState={uploadState} onUpload={handleUpload} onDelete={handleDelete} />
            </motion.div>
          )}
          {mode === "study" && studyTab === "chat" && (
            <motion.div key="study-chat" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <ChatTab
                messages={studyMessages}
                input={studyInput}
                onInputChange={setStudyInput}
                onSend={handleStudyChatSend}
                loading={studyLoading}
                placeholder={docs.length > 0 ? "Задай вопрос по учебнику — ментор ответит на основе загруженного материала" : "Сначала загрузи учебник на вкладке «Мои материалы»"}
                contextHint={docs.length > 0 ? `Учебников в базе: ${docs.length}. Ментор ищет ответ именно в твоих материалах.` : undefined}
              />
            </motion.div>
          )}
          {mode === "author" && authorTab === "upload" && (
            <motion.div key="author-upload" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <AuthorUploadTab
                content={content}
                topicHint={topicHint}
                onContentChange={setContent}
                onTopicHintChange={setTopicHint}
                onAnalyse={handleAnalyse}
                loading={analyseLoading}
                error={structureError}
              />
            </motion.div>
          )}
          {mode === "author" && authorTab === "structure" && (
            <motion.div key="author-structure" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <StructureTab
                structureResult={structureResult}
                improveGoal={improveGoal}
                onImproveGoalChange={setImproveGoal}
                sectionText={sectionText}
                onSectionTextChange={setSectionText}
                onImprove={handleImprove}
                improveResult={improveResult}
                loading={improveLoading}
                parsedSections={parsedSections}
                generatingSection={generatingSection}
                generatedSections={generatedSections}
                onGenerateSection={handleGenerateSection}
                onExport={handleExport}
              />
            </motion.div>
          )}
          {mode === "author" && authorTab === "chat" && (
            <motion.div key="author-chat" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <ChatTab
                messages={authorMessages}
                input={authorInput}
                onInputChange={setAuthorInput}
                onSend={handleAuthorChatSend}
                loading={authorLoading}
                placeholder="Задай вопрос методисту — он поможет упаковать материал в курс"
                contextHint={content ? `Контекст: загружен материал (${content.length.toLocaleString("ru")} символов). Методист видит его при ответах.` : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
