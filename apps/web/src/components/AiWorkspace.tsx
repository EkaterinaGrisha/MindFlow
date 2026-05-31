import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  GripVertical,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquare,
  PenSquare,
  Plus,
  Save,
  Send,
  Sigma,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import type { LearningContext } from "@mindflow/shared/llmTypes";
import { buildApiHeaders, buildAuthOnlyHeaders, getApiBaseUrl } from "../lib/api";
import { MarkdownRenderer } from "./MarkdownRenderer";
import FormulaInput from "./FormulaInput";
import QuizCard from "./QuizCard";
import VisualizationCard from "./VisualizationCard";
import DocReader from "./DocReader";
import { useAuth } from "../lib/useAuth";
import { useMentorSession, type SessionPreview } from "../lib/useMentorSession";
import { parseMessageContent, EXAMINER_INSTRUCTION, VISUALIZATION_INSTRUCTION } from "../lib/quizParser";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceMode = "topic" | "text" | "files";
type AiRole = "mentor" | "methodist" | "examiner";
type ImproveGoal = "add_examples" | "add_interactive" | "shorten" | "add_quiz" | "general";

type ApiCitation = {
  source_title: string;
  page_hint?: string | null;
  chunk_id: string;
  source_url?: string | null;
  snippet?: string;
};
type RelatedTopic = {
  concept_id: string;
  name: string;
  description: string | null;
  topic_slug: string | null;
  route_name: string | null;
  direction: "prerequisite" | "next_step";
  weight?: number;
};
type ChatMessage = {
  id?: number;
  role: "user" | "assistant";
  content: string;
  citations: ApiCitation[];
  relatedTopics: RelatedTopic[];
  aiRole?: string;
  createdAt?: string;
};
type PersonalDoc = { source_id: string; source_title: string; chunk_count: number };
type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; name: string }
  | { status: "error"; message: string };

type ActiveSource =
  | { type: "none" }
  | { type: "topic"; name: string }
  | { type: "text"; content: string; preview: string }
  | { type: "file"; doc: PersonalDoc };

// Course structure types
type CourseSubsection = { id: string; title: string; generated?: string };
type CourseSection = { id: string; title: string; children: CourseSubsection[]; generated?: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const BUILT_IN_TOPICS = [
  "Линейная алгебра",
  "Операции с матрицами",
  "Ранг и базис",
  "Собственные значения",
  "Сингулярное разложение (SVD)",
  "Предел и непрерывность",
  "Производная и градиент",
  "Случайные величины",
  "Формула Байеса",
  "Проверка гипотез",
] as const;

const ROLE_LABELS: Record<string, string> = {
  LECTURER: "Лектор",
  MIRROR: "Зеркало",
  SANDBOX: "Практика",
  CHALLENGER: "Критик",
  METHODIST: "Методист",
  EXAMINER: "Экзаменатор",
};
const ROLE_COLORS: Record<string, string> = {
  LECTURER: "bg-blue-100 text-blue-700",
  MIRROR: "bg-violet-100 text-violet-700",
  SANDBOX: "bg-emerald-100 text-emerald-700",
  CHALLENGER: "bg-amber-100 text-amber-700",
  METHODIST: "bg-indigo-100 text-indigo-700",
  EXAMINER: "bg-rose-100 text-rose-700",
};

const SOURCE_LABELS: Record<SourceMode, string> = { topic: "Темы", text: "Текст", files: "Файлы" };

const IMPROVE_GOAL_OPTIONS: { value: ImproveGoal; label: string }[] = [
  { value: "general", label: "Общие рекомендации" },
  { value: "add_examples", label: "Добавить примеры" },
  { value: "add_interactive", label: "Предложить интерактив" },
  { value: "add_quiz", label: "Добавить вопросы" },
  { value: "shorten", label: "Сократить" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function groupByDate(sessions: SessionPreview[]): [string, SessionPreview[]][] {
  const groups = new Map<string, SessionPreview[]>();
  for (const s of sessions) {
    const label = formatSessionDate(s.started_at);
    const arr = groups.get(label) ?? [];
    arr.push(s);
    groups.set(label, arr);
  }
  return Array.from(groups.entries());
}

function describeActiveSource(src: ActiveSource): string {
  switch (src.type) {
    case "topic": return `Тема: ${src.name}`;
    case "text": return `Текстовый конспект (${src.content.length.toLocaleString()} симв.)`;
    case "file": return `Файл: ${src.doc.source_title}`;
    case "none": return "Источник не выбран — AI отвечает на основе общих знаний";
  }
}

function sourceForSessionTopic(src: ActiveSource): string {
  switch (src.type) {
    case "topic": return src.name;
    case "text": return "Пользовательский текст";
    case "file": return src.doc.source_title;
    case "none": return "AI Workspace";
  }
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

let _idSeq = 0;
function genId() { return `cs_${++_idSeq}_${Date.now()}`; }

function parseSectionsTree(text: string): CourseSection[] {
  const lines = text.split("\n").filter((l) => /^#{1,3}\s/.test(l));
  const sections: CourseSection[] = [];
  let cur: CourseSection | null = null;

  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.*)/);
    if (!m) continue;
    const level = m[1].length;
    const title = m[2].trim();
    if (level === 1 || (sections.length === 0 && level <= 2)) {
      cur = { id: genId(), title, children: [] };
      sections.push(cur);
    } else {
      if (!cur) { cur = { id: genId(), title: "Без раздела", children: [] }; sections.push(cur); }
      cur.children.push({ id: genId(), title });
    }
  }
  return sections.slice(0, 20);
}

function sectionsToMarkdown(sections: CourseSection[], topicHint: string): string {
  const parts: string[] = topicHint ? [`# ${topicHint}\n`] : [];
  for (const s of sections) {
    parts.push(`\n## ${s.title}\n`);
    if (s.generated) parts.push(s.generated + "\n");
    else parts.push("_Текст не сгенерирован_\n");
    for (const sub of s.children) {
      parts.push(`\n### ${sub.title}\n`);
      if (sub.generated) parts.push(sub.generated + "\n");
      else parts.push("_Текст не сгенерирован_\n");
    }
  }
  return parts.join("\n");
}

// ─── Citation Tooltip ─────────────────────────────────────────────────────────

function CitationTooltip({ citation, index }: { citation: ApiCitation; index: number }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => { if (timer.current) clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };

  return (
    <span className="relative inline-block">
      <button onMouseEnter={show} onMouseLeave={hide} onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-secondary/30 bg-secondary/8 px-1.5 py-0.5 text-[11px] font-semibold text-secondary hover:bg-secondary/15 transition-colors leading-none">
        [{index + 1}]
      </button>
      {open && (
        <span onMouseEnter={show} onMouseLeave={hide}
          className="absolute bottom-full left-0 z-50 mb-2 w-72 max-w-[90vw] rounded-xl border border-outline-variant/30 bg-white shadow-xl">
          <span className="absolute -bottom-[6px] left-3 h-3 w-3 rotate-45 border-b border-r border-outline-variant/30 bg-white" />
          <span className="block px-3.5 pt-3 pb-2 border-b border-outline-variant/15">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-secondary truncate">{citation.source_title}</span>
            {citation.page_hint && <span className="block text-[10px] text-on-surface-variant mt-0.5">{citation.page_hint}</span>}
          </span>
          {citation.snippet ? (
            <span className="block px-3.5 py-2.5 text-xs text-on-surface leading-relaxed max-h-40 overflow-y-auto">{citation.snippet}</span>
          ) : (
            <span className="block px-3.5 py-2.5 text-xs text-on-surface-variant italic">Фрагмент недоступен</span>
          )}
        </span>
      )}
    </span>
  );
}

// ─── Sessions Sidebar ─────────────────────────────────────────────────────────

function SessionsSidebar({
  sessions, activeSessionId, loading, onSelectSession, onNewChat, collapsed, onToggleCollapse,
}: {
  sessions: SessionPreview[]; activeSessionId: string | null; loading: boolean;
  onSelectSession: (id: string) => void; onNewChat: () => void;
  collapsed: boolean; onToggleCollapse: () => void;
}) {
  const grouped = groupByDate(sessions);
  return (
    <aside className={["flex flex-col border-r border-outline-variant/20 bg-surface-container-lowest transition-all duration-200", collapsed ? "w-10" : "w-60 shrink-0"].join(" ")}>
      <div className="flex items-center justify-between px-2 py-3 border-b border-outline-variant/20">
        {!collapsed && <span className="text-xs font-bold uppercase tracking-widest text-secondary pl-1">История</span>}
        <button onClick={onToggleCollapse} className="ml-auto p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="px-2 py-2">
            <button onClick={onNewChat} className="flex w-full items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/5 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/10 transition-colors">
              <Plus size={13} /> Новый чат
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loading ? (
              <div className="flex items-center justify-center py-8"><span className="text-xs text-on-surface-variant">Загрузка...</span></div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <Clock size={20} className="text-outline-variant/40" />
                <span className="text-xs text-on-surface-variant">Нет истории</span>
              </div>
            ) : (
              grouped.map(([label, group]) => (
                <div key={label} className="mb-1">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">{label}</p>
                  {group.map((s) => (
                    <button key={s.id} onClick={() => onSelectSession(s.id)}
                      className={["w-full text-left rounded-xl px-2.5 py-2 mb-0.5 transition-colors", s.id === activeSessionId ? "bg-secondary/10 text-secondary" : "hover:bg-surface-container text-on-surface"].join(" ")}>
                      <p className="text-xs font-medium leading-snug line-clamp-2">{s.preview ?? s.topic ?? "Диалог"}</p>
                      <p className={["mt-0.5 text-[10px]", s.id === activeSessionId ? "text-secondary/70" : "text-on-surface-variant/60"].join(" ")}>
                        {s.message_count} сообщ.
                      </p>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
      {collapsed && (
        <div className="flex flex-col items-center py-2">
          <button onClick={onNewChat} className="p-2 rounded-xl hover:bg-surface-container text-secondary transition-colors"><Plus size={14} /></button>
        </div>
      )}
    </aside>
  );
}

// ─── Source Panel ─────────────────────────────────────────────────────────────

function SourcePanel({
  sourceMode, onSourceMode,
  topicSelected, onTopicSelected, onApplyTopic,
  textDraft, onTextDraft, onSaveText, textIsActive,
  docs, activeFileId, onSelectFile, onViewFile,
  uploadState, onUpload, onDelete,
  isLoggedIn,
}: {
  sourceMode: SourceMode; onSourceMode: (m: SourceMode) => void;
  topicSelected: string; onTopicSelected: (t: string) => void; onApplyTopic: () => void;
  textDraft: string; onTextDraft: (t: string) => void; onSaveText: () => void; textIsActive: boolean;
  docs: PersonalDoc[]; activeFileId: string | null; onSelectFile: (id: string) => void; onViewFile: (doc: PersonalDoc) => void;
  uploadState: UploadState; onUpload: (f: File) => void; onDelete: (id: string) => void;
  isLoggedIn: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="border-b border-outline-variant/20">
      <div className="flex items-center gap-1 px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/60 mr-2">Источник</span>
        {(["topic", "text", "files"] as SourceMode[]).map((mode) => (
          <button key={mode} onClick={() => { onSourceMode(mode); setExpanded(true); }}
            className={["rounded-lg px-3 py-1 text-xs font-semibold transition-colors", sourceMode === mode ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant hover:text-primary"].join(" ")}>
            {SOURCE_LABELS[mode]}
          </button>
        ))}
        <button onClick={() => setExpanded((v) => !v)} className="ml-auto p-1 rounded text-on-surface-variant hover:text-primary transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-outline-variant/10">
          {sourceMode === "topic" && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <p className="mb-1.5 text-xs text-on-surface-variant">Выбери тему из библиотеки.</p>
                <select value={topicSelected} onChange={(e) => onTopicSelected(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm text-primary focus:border-secondary focus:outline-none">
                  {BUILT_IN_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={onApplyTopic}
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                <Check size={12} /> Установить
              </button>
            </div>
          )}

          {sourceMode === "text" && (
            <div>
              <p className="mb-1.5 text-xs text-on-surface-variant">Вставь любой текст — конспект, статью, главу. Затем нажми «Сохранить как источник».</p>
              <textarea value={textDraft} onChange={(e) => onTextDraft(e.target.value)} rows={6}
                placeholder="Вставь сюда учебный текст…"
                className="w-full resize-none rounded-xl border border-outline-variant/40 bg-white px-3 py-2.5 text-sm text-primary placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant/60">
                  {textDraft.length.toLocaleString()} символов{textIsActive ? " · сохранён как активный" : ""}
                </span>
                <button onClick={onSaveText} disabled={!textDraft.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40">
                  <Save size={12} /> Сохранить как источник
                </button>
              </div>
            </div>
          )}

          {sourceMode === "files" && (
            <div className="space-y-3">
              {!isLoggedIn ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Для загрузки файлов нужно <a href="/login" className="font-semibold underline">войти в аккаунт</a>.
                </div>
              ) : (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onUpload(f); }}
                    onClick={() => uploadState.status !== "uploading" && fileRef.current?.click()}
                    className={["relative rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all",
                      dragging ? "border-secondary bg-secondary/5" : "border-outline-variant/40 bg-surface-container-low hover:border-secondary/40 hover:bg-secondary/5"].join(" ")}
                  >
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ""; } }} />
                    {uploadState.status === "uploading" ? (
                      <div className="flex flex-col items-center gap-2 text-secondary">
                        <Loader2 size={22} className="animate-spin" />
                        <p className="text-xs font-medium">Индексируем документ…</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                        <Upload size={22} />
                        <p className="text-sm font-semibold text-primary">Перетащи файл или кликни</p>
                        <p className="text-xs">PDF, DOCX, TXT, MD — до 20 МБ</p>
                      </div>
                    )}
                  </div>

                  {uploadState.status === "error" && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{uploadState.message}</div>
                  )}

                  {docs.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60">Выбери активный файл ({docs.length})</p>
                      {docs.map((doc) => {
                        const isActive = activeFileId === doc.source_id;
                        return (
                          <div key={doc.source_id}
                            onClick={() => onSelectFile(doc.source_id)}
                            className={["flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors",
                              isActive ? "border-secondary bg-secondary/5" : "border-outline-variant/20 bg-white hover:border-secondary/40"].join(" ")}>
                            <div className={["flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                              isActive ? "border-secondary bg-secondary" : "border-outline-variant/40"].join(" ")}>
                              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <FileText size={14} className="text-secondary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-primary truncate">{doc.source_title}</p>
                              <p className="text-[11px] text-on-surface-variant">{doc.chunk_count} фрагм.</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onViewFile(doc); }}
                              className="p-1 rounded text-on-surface-variant/50 hover:text-secondary transition-colors" title="Просмотреть">
                              <Eye size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(doc.source_id); }}
                              className="p-1 rounded text-on-surface-variant/50 hover:text-red-500 transition-colors" title="Удалить">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Indicator Strip ──────────────────────────────────────────────────────────

function IndicatorStrip({ role, source }: { role: AiRole; source: ActiveSource }) {
  const roleConfig = {
    mentor: { label: "Ментор", icon: Brain, color: "text-secondary bg-secondary/10" },
    methodist: { label: "Методист", icon: PenSquare, color: "text-indigo-700 bg-indigo-100" },
    examiner: { label: "Экзаменатор", icon: GraduationCap, color: "text-rose-700 bg-rose-100" },
  }[role];
  const Icon = roleConfig.icon;
  const sourceDesc = describeActiveSource(source);
  const hasSource = source.type !== "none";

  return (
    <div className="flex items-center gap-2 border-b border-outline-variant/20 bg-surface-container-low px-4 py-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleConfig.color}`}>
        <Icon size={11} /> {roleConfig.label}
      </span>
      <span className="text-on-surface-variant/40">|</span>
      <span className={`text-xs truncate ${hasSource ? "text-primary font-medium" : "text-on-surface-variant italic"}`}>
        {sourceDesc}
      </span>
    </div>
  );
}

// ─── Role Toggle ──────────────────────────────────────────────────────────────

function RoleToggle({ role, onRole, autoMentor, onAutoMentor }: {
  role: AiRole; onRole: (r: AiRole) => void;
  autoMentor: boolean; onAutoMentor: (v: boolean) => void;
}) {
  const roles: { value: AiRole; label: string; icon: typeof Brain; activeBg: string }[] = [
    { value: "mentor", label: "Ментор", icon: Brain, activeBg: "bg-secondary text-white" },
    { value: "methodist", label: "Методист", icon: PenSquare, activeBg: "bg-indigo-600 text-white" },
    { value: "examiner", label: "Экзаменатор", icon: GraduationCap, activeBg: "bg-rose-600 text-white" },
  ];

  return (
    <div className="flex items-center flex-wrap gap-2 px-4 py-2.5 border-b border-outline-variant/20">
      <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant/60 mr-1">Роль</span>
      {roles.map(({ value, label, icon: Icon, activeBg }) => (
        <button key={value} onClick={() => onRole(value)}
          className={["rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5",
            role === value ? activeBg : "bg-surface-container text-on-surface-variant hover:text-primary"].join(" ")}>
          <Icon size={12} /> {label}
        </button>
      ))}

      {role === "mentor" && (
        <label className="ml-auto inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoMentor} onChange={(e) => onAutoMentor(e.target.checked)} className="sr-only peer" />
          <span className="relative w-9 h-5 bg-surface-container rounded-full peer-checked:bg-secondary transition-colors">
            <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </span>
          <span className="text-xs font-medium text-on-surface-variant">Авто-Ментор</span>
        </label>
      )}
    </div>
  );
}

// ─── Examiner Quick Actions ───────────────────────────────────────────────────

function ExaminerActions({ onAction, disabled }: { onAction: (mode: "term" | "fill" | "error") => void; disabled: boolean }) {
  return (
    <div className="border-b border-outline-variant/20 bg-rose-50/40 px-4 py-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-rose-700">Выбери формат проверки</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onAction("term")} disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50">
          <HelpCircle size={12} /> Угадай термин
        </button>
        <button onClick={() => onAction("fill")} disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition-colors disabled:opacity-50">
          <Layers size={12} /> Логическая цепочка
        </button>
        <button onClick={() => onAction("error")} disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50">
          <X size={12} /> Найди ошибку
        </button>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onQuizNext,
  onQuizAnswered,
}: {
  msg: ChatMessage;
  onQuizNext: () => void;
  onQuizAnswered?: (attempt: { correct: boolean; timeMs: number }) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  const roleLabel = msg.aiRole ? (ROLE_LABELS[msg.aiRole] ?? msg.aiRole) : null;
  const roleColor = msg.aiRole ? (ROLE_COLORS[msg.aiRole] ?? "bg-slate-100 text-slate-700") : "";
  const parts = parseMessageContent(msg.content);

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary text-xs font-bold select-none">
        AI
      </div>
      <div className="flex-1 min-w-0">
        {roleLabel && (
          <span className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${roleColor}`}>{roleLabel}</span>
        )}
        <div className="rounded-2xl rounded-tl-sm border border-outline-variant/20 bg-white px-4 py-3 text-sm leading-relaxed text-primary shadow-sm">
          {parts.map((part, idx) => {
            if (part.type === "text") return <MarkdownRenderer key={idx} content={part.content} />;
            if (part.type === "visualization") return <VisualizationCard key={`${msg.id ?? "x"}-viz-${idx}`} code={part.code} />;
            return (
              <QuizCard
                key={`${msg.id ?? "x"}-quiz-${idx}`}
                data={part.data}
                onNext={onQuizNext}
                onAnswered={onQuizAnswered}
              />
            );
          })}
        </div>

        {msg.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-on-surface-variant/60 font-medium">Источники:</span>
            {msg.citations.map((c, i) => <CitationTooltip key={`${c.chunk_id}-${i}`} citation={c} index={i} />)}
          </div>
        )}

        {msg.relatedTopics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.relatedTopics.map((topic) => {
              const w = typeof topic.weight === "number" ? topic.weight : 1;
              return (
                <a key={`${topic.concept_id}-${topic.direction}`}
                  href={topic.route_name ? `/subjects/mathematics/topics/${encodeURIComponent(topic.route_name)}` : undefined}
                  style={{ opacity: Math.max(0.55, w) }}
                  className={["inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium transition",
                    topic.direction === "prerequisite" ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                    !topic.route_name ? "cursor-default" : "cursor-pointer"].join(" ")}>
                  {topic.direction === "prerequisite" ? "⬅" : "➡"} {topic.name}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Course Structure Panel ───────────────────────────────────────────────────

type DragItem =
  | { type: "section"; si: number }
  | { type: "sub"; si: number; ssi: number };

function CourseStructurePanel({
  sections, onSections, loading, error, processingId,
  onAnalyse, onGenerateContent, onImproveContent, onExport, canAnalyse,
}: {
  sections: CourseSection[];
  onSections: (s: CourseSection[]) => void;
  loading: boolean;
  error: string;
  processingId: string | null;
  onAnalyse: () => void;
  onGenerateContent: (id: string, title: string, parentTitle?: string) => void;
  onImproveContent: (id: string, text: string, goal: ImproveGoal) => void;
  onExport: () => void;
  canAnalyse: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [improveGoal, setImproveGoal] = useState<ImproveGoal>("general");
  const [improvingPanelId, setImprovingPanelId] = useState<string | null>(null);
  const [dropHighlight, setDropHighlight] = useState<string | null>(null);
  const dragItemRef = useRef<DragItem | null>(null);

  const startEdit = (id: string, title: string) => { setEditingId(id); setEditTitle(title); };
  const commitEdit = () => {
    if (!editingId || !editTitle.trim()) { setEditingId(null); return; }
    onSections(sections.map((s) => {
      if (s.id === editingId) return { ...s, title: editTitle.trim() };
      return { ...s, children: s.children.map((c) => c.id === editingId ? { ...c, title: editTitle.trim() } : c) };
    }));
    setEditingId(null);
  };

  const addSection = () => {
    const id = genId();
    onSections([...sections, { id, title: "Новый раздел", children: [] }]);
    startEdit(id, "Новый раздел");
  };

  const deleteSection = (sectionId: string) => onSections(sections.filter((s) => s.id !== sectionId));

  const addSubsection = (sectionId: string) => {
    const id = genId();
    onSections(sections.map((s) => s.id === sectionId ? { ...s, children: [...s.children, { id, title: "Новый подраздел" }] } : s));
    startEdit(id, "Новый подраздел");
    setExpandedIds((prev) => new Set(prev).add(sectionId));
  };

  const deleteSubsection = (sectionId: string, subId: string) =>
    onSections(sections.map((s) => s.id === sectionId ? { ...s, children: s.children.filter((c) => c.id !== subId) } : s));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // ── DnD ────────────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    dragItemRef.current = item;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropHighlight(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropHighlight(null);
    }
  };

  const handleDropOnSection = (e: React.DragEvent, targetSi: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropHighlight(null);
    const src = dragItemRef.current;
    if (!src) return;
    const ns = sections.map((s) => ({ ...s, children: [...s.children] }));
    if (src.type === "section") {
      if (src.si === targetSi) return;
      const [moved] = ns.splice(src.si, 1);
      ns.splice(targetSi > src.si ? targetSi - 1 : targetSi, 0, moved);
    } else {
      const [movedSub] = ns[src.si].children.splice(src.ssi, 1);
      ns[targetSi].children.push(movedSub);
    }
    onSections(ns);
    dragItemRef.current = null;
  };

  const handleDropOnSub = (e: React.DragEvent, targetSi: number, targetSsi: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropHighlight(null);
    const src = dragItemRef.current;
    if (!src || src.type === "section") return;
    if (src.si === targetSi && src.ssi === targetSsi) return;
    const ns = sections.map((s) => ({ ...s, children: [...s.children] }));
    const [movedSub] = ns[src.si].children.splice(src.ssi, 1);
    const adj = src.si === targetSi && src.ssi < targetSsi ? targetSsi - 1 : targetSsi;
    ns[targetSi].children.splice(adj, 0, movedSub);
    onSections(ns);
    dragItemRef.current = null;
  };

  const hasContent = sections.some((s) => s.generated || s.children.some((c) => c.generated));

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-outline-variant/20 bg-indigo-50/60 shrink-0">
        <Layers size={14} className="text-indigo-600 shrink-0" />
        <span className="text-xs font-bold text-indigo-700 flex-1">Структура курса</span>
        {hasContent && (
          <button onClick={onExport} title="Экспорт в .md"
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors">
            <Download size={11} /> .md
          </button>
        )}
      </div>

      {/* Analyse + Add */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-outline-variant/20 shrink-0">
        <button onClick={onAnalyse} disabled={loading || !canAnalyse}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? <><Loader2 size={11} className="animate-spin" /> Анализирую…</> : <><Wand2 size={11} /> Анализировать</>}
        </button>
        <button onClick={addSection} title="Добавить раздел"
          className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-outline-variant/40 bg-white text-on-surface-variant hover:text-indigo-600 transition-colors">
          <Plus size={13} />
        </button>
      </div>

      {error && (
        <div className="mx-2.5 mt-2 flex items-start gap-1.5 rounded-xl bg-red-50 border border-red-200 px-2.5 py-2 text-[11px] text-red-700 shrink-0">
          <AlertCircle size={11} className="mt-px shrink-0" /> {error}
        </div>
      )}

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {sections.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <BookOpen size={22} className="text-outline-variant/40" />
            <p className="text-[11px] text-on-surface-variant px-3">
              {canAnalyse ? "Нажми «Анализировать» чтобы извлечь структуру из источника" : "Выбери источник, затем нажми «Анализировать»"}
            </p>
          </div>
        )}

        {sections.map((section, si) => {
          const isExpanded = expandedIds.has(section.id);
          const isHighlighted = dropHighlight === section.id;
          const isGenerating = processingId === section.id;
          const isEditing = editingId === section.id;

          return (
            <div key={section.id}
              className={["rounded-xl border transition-colors", isHighlighted ? "border-indigo-300 bg-indigo-50/50" : "border-outline-variant/20 bg-white"].join(" ")}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnSection(e, si)}
            >
              {/* Section row */}
              <div className="flex items-center gap-1 px-1.5 py-1.5">
                <span draggable onDragStart={(e) => handleDragStart(e, { type: "section", si })}
                  className="cursor-grab text-on-surface-variant/30 hover:text-on-surface-variant transition-colors shrink-0">
                  <GripVertical size={13} />
                </span>

                {isEditing ? (
                  <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 rounded-lg border border-indigo-400 px-1.5 py-0.5 text-xs font-semibold text-primary focus:outline-none min-w-0" />
                ) : (
                  <button onDoubleClick={() => startEdit(section.id, section.title)}
                    onClick={() => section.children.length > 0 && toggleExpand(section.id)}
                    className="flex-1 text-left text-xs font-semibold text-primary min-w-0 truncate">
                    {section.title}
                  </button>
                )}

                <div className="flex items-center gap-0.5 shrink-0">
                  {section.children.length > 0 && (
                    <button onClick={() => toggleExpand(section.id)} className="p-0.5 text-on-surface-variant/50 hover:text-primary transition-colors">
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                  <button onClick={() => onGenerateContent(section.id, section.title)} disabled={!!processingId}
                    title="Сгенерировать текст"
                    className={["p-0.5 transition-colors", isGenerating ? "text-indigo-500" : "text-on-surface-variant/50 hover:text-indigo-600 disabled:opacity-40"].join(" ")}>
                    {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  </button>
                  <button onClick={() => setImprovingPanelId(improvingPanelId === section.id ? null : section.id)}
                    title="Улучшить раздел"
                    className="p-0.5 text-on-surface-variant/50 hover:text-amber-600 transition-colors">
                    <Wand2 size={11} />
                  </button>
                  <button onClick={() => addSubsection(section.id)} title="Добавить подраздел"
                    className="p-0.5 text-on-surface-variant/50 hover:text-indigo-600 transition-colors">
                    <Plus size={11} />
                  </button>
                  <button onClick={() => deleteSection(section.id)} title="Удалить"
                    className="p-0.5 text-on-surface-variant/50 hover:text-red-500 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Generated preview */}
              {section.generated && (
                <div className="mx-2 mb-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1.5">
                  <p className="text-[10px] text-emerald-700 font-medium mb-0.5">Сгенерировано</p>
                  <p className="text-[10px] text-emerald-600 line-clamp-2">{section.generated.slice(0, 120)}…</p>
                </div>
              )}

              {/* Improve panel */}
              {improvingPanelId === section.id && (
                <div className="mx-2 mb-2 rounded-lg border border-amber-200 bg-amber-50/60 px-2 py-2 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Улучшить раздел</p>
                  <select value={improveGoal} onChange={(e) => setImproveGoal(e.target.value as ImproveGoal)}
                    className="w-full rounded-lg border border-outline-variant/40 bg-white px-2 py-1 text-[11px] text-primary focus:border-indigo-400 focus:outline-none">
                    {IMPROVE_GOAL_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <button
                    onClick={() => { onImproveContent(section.id, section.generated || section.title, improveGoal); setImprovingPanelId(null); }}
                    disabled={!!processingId}
                    className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50">
                    <Sparkles size={10} /> Улучшить
                  </button>
                </div>
              )}

              {/* Subsections */}
              {isExpanded && section.children.length > 0 && (
                <div className="ml-3 mb-1.5 space-y-0.5 border-l-2 border-indigo-100 pl-2 mr-1.5">
                  {section.children.map((sub, ssi) => {
                    const isSubHighlighted = dropHighlight === sub.id;
                    const isSubEditing = editingId === sub.id;
                    const isSubGenerating = processingId === sub.id;
                    return (
                      <div key={sub.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { type: "sub", si, ssi })}
                        onDragOver={(e) => handleDragOver(e, sub.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnSub(e, si, ssi)}
                        className={["flex items-center gap-1 rounded-lg px-1.5 py-1 transition-colors", isSubHighlighted ? "bg-indigo-50" : "hover:bg-surface-container-low"].join(" ")}
                      >
                        <span className="cursor-grab text-on-surface-variant/25 hover:text-on-surface-variant transition-colors shrink-0">
                          <GripVertical size={11} />
                        </span>
                        {isSubEditing ? (
                          <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                            className="flex-1 rounded border border-indigo-400 px-1.5 py-0.5 text-[11px] text-primary focus:outline-none min-w-0" />
                        ) : (
                          <span onDoubleClick={() => startEdit(sub.id, sub.title)}
                            className="flex-1 text-[11px] text-on-surface truncate min-w-0 cursor-text">
                            {sub.title}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => onGenerateContent(sub.id, sub.title, section.title)} disabled={!!processingId}
                            title="Сгенерировать" className={["p-0.5 transition-colors", isSubGenerating ? "text-indigo-500" : "text-on-surface-variant/40 hover:text-indigo-600 disabled:opacity-40"].join(" ")}>
                            {isSubGenerating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          </button>
                          <button onClick={() => deleteSubsection(section.id, sub.id)} title="Удалить"
                            className="p-0.5 text-on-surface-variant/40 hover:text-red-500 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-outline-variant/20 bg-surface-container-low shrink-0">
        <p className="text-[10px] text-on-surface-variant/50">Двойной клик — переименовать · Тащи за ≡ для сортировки</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AiWorkspace() {
  const { user } = useAuth();

  // Source state
  const [sourceMode, setSourceMode] = useState<SourceMode>("topic");
  const [topicSelected, setTopicSelected] = useState<string>(BUILT_IN_TOPICS[0]);
  const [textDraft, setTextDraft] = useState("");
  const [docs, setDocs] = useState<PersonalDoc[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });

  const [activeSource, setActiveSource] = useState<ActiveSource>({ type: "topic", name: BUILT_IN_TOPICS[0] });

  // AI role + auto-mentor + visualization mode
  const [aiRole, setAiRole] = useState<AiRole>("mentor");
  const [autoMentor, setAutoMentor] = useState(false);
  const [forcedRole, setForcedRole] = useState("");
  const [vizMode, setVizMode] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showFormula, setShowFormula] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Document reader (PDF/text viewer with "Спросить об этом" popup)
  const [readingDoc, setReadingDoc] = useState<PersonalDoc | null>(null);

  // Pro trial modal — shown once per browser on first /workspace visit
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialActivating, setTrialActivating] = useState(false);
  const [trialActivated, setTrialActivated] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    const SEEN_KEY = "mindflow_workspace_trial_modal_seen_v1";
    if (window.localStorage.getItem(SEEN_KEY) === "1") return;
    let cancelled = false;
    buildApiHeaders()
      .then((h) => fetch(`${getApiBaseUrl()}/api/billing/status`, { headers: h }))
      .then(async (r) => (r.ok ? ((await r.json()) as { trialEndsAt?: string | null; plan?: string }) : null))
      .then((status) => {
        if (cancelled) return;
        if (status?.trialEndsAt || status?.plan === "pro") {
          window.localStorage.setItem(SEEN_KEY, "1");
          return;
        }
        setTrialModalOpen(true);
      })
      .catch(() => {
        if (!cancelled) setTrialModalOpen(true);
      });
    return () => { cancelled = true; };
  }, [user]);

  const closeTrialModal = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mindflow_workspace_trial_modal_seen_v1", "1");
    }
    setTrialModalOpen(false);
  }, []);

  const activateTrial = useCallback(async () => {
    setTrialActivating(true);
    setTrialError(null);
    try {
      const headers = await buildApiHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/billing/start-trial`, { method: "POST", headers });
      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || `HTTP ${res.status}`);
      }
      setTrialActivated(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mindflow_workspace_trial_modal_seen_v1", "1");
      }
    } catch (err) {
      setTrialError(err instanceof Error ? err.message : "Не удалось активировать пробный месяц");
    } finally {
      setTrialActivating(false);
    }
  }, []);

  // Smart suggestions
  const [smartSuggestions, setSmartSuggestions] = useState<string[] | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionsCache = useRef<Map<string, string[]>>(new Map());

  // Methodist: course structure
  const [courseStructure, setCourseStructure] = useState<CourseSection[]>([]);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionTopic = useMemo(() => sourceForSessionTopic(activeSource), [activeSource]);

  const { saveMessage, closeSession, loadAllSessions, loadLastSession, loadSession, getSessionId } =
    useMentorSession(user, sessionTopic, "theory");

  // Reset session on source change
  const prevSessionTopic = useRef(sessionTopic);
  useEffect(() => {
    if (prevSessionTopic.current !== sessionTopic) {
      closeSession();
      setMessages([]);
      setActiveSessionId(null);
      prevSessionTopic.current = sessionTopic;
    }
  }, [sessionTopic, closeSession]);

  const refreshSessions = useCallback(async () => {
    if (!user) { setSessionsLoading(false); return; }
    const list = await loadAllSessions();
    setSessions(list);
    setSessionsLoading(false);
  }, [user, loadAllSessions]);

  useEffect(() => {
    if (!user) { setHistoryLoading(false); setSessionsLoading(false); return; }
    loadLastSession().then(({ messages: saved }) => {
      if (saved.length > 0) {
        setMessages(saved.map((m) => ({
          id: m.id, role: m.role, content: m.content,
          citations: (m.rag_sources as ApiCitation[]) ?? [],
          relatedTopics: [], aiRole: m.ai_role ?? undefined, createdAt: m.created_at,
        })));
        setActiveSessionId(getSessionId());
      }
      setHistoryLoading(false);
    });
    refreshSessions();
  }, [user, loadLastSession, refreshSessions, getSessionId]);

  // Скроллим вниз только когда добавилось ровно одно новое сообщение
  // (юзер отправил вопрос или ассистент закончил ответ).
  // На начальной загрузке истории и переключении сессий — не скроллим,
  // иначе при большой истории нас выкидывает в самый низ.
  const prevMessagesLenRef = useRef(messages.length);
  useEffect(() => {
    const prev = prevMessagesLenRef.current;
    prevMessagesLenRef.current = messages.length;
    if (messages.length !== prev + 1) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Smart suggestions: fire background LLM call when active source changes
  useEffect(() => {
    if (aiRole === "examiner") return; // examiner manages its own flow
    const cacheKey = sourceForSessionTopic(activeSource);
    if (suggestionsCache.current.has(cacheKey)) {
      setSmartSuggestions(suggestionsCache.current.get(cacheKey)!);
      return;
    }
    if (activeSource.type === "none") { setSmartSuggestions(null); return; }

    setSuggestionsLoading(true);
    setSmartSuggestions(null);
    const topic = cacheKey;

    buildApiHeaders().then((headers) =>
      fetch(`${getApiBaseUrl()}/api/llm/respond`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          current_topic: topic,
          retrieved_theory: activeSource.type === "text" ? activeSource.content.slice(0, 3000) : "",
          recent_topics: "",
          experience: "студент",
          level: "средний",
          interests: "математика и ML",
          mastered_concepts: "",
          weak_concepts: "",
          knowledge_graph_summary: "",
          current_page: "workspace",
          force_role: "LECTURER",
          user_input: `Предложи ровно 4 коротких конкретных вопроса, которые студент может задать по теме "${topic}", чтобы начать изучение. Ответь строго JSON-массивом строк без пояснений. Пример: ["Вопрос 1", "Вопрос 2", "Вопрос 3", "Вопрос 4"]`,
        }),
      })
    )
      .then((r) => r.json() as Promise<{ answer?: string }>)
      .then(({ answer }) => {
        if (!answer) return;
        // Try to extract a JSON array from the response
        const jsonMatch = answer.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return;
        const parsed = JSON.parse(jsonMatch[0]) as unknown;
        if (!Array.isArray(parsed)) return;
        const suggestions = (parsed as unknown[])
          .filter((x): x is string => typeof x === "string")
          .slice(0, 4);
        if (suggestions.length === 0) return;
        suggestionsCache.current.set(cacheKey, suggestions);
        setSmartSuggestions(suggestions);
      })
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSource, aiRole]);

  useEffect(() => {
    if (sourceMode === "files" && user && !docsLoaded) {
      buildApiHeaders().then((h) => fetch(`${getApiBaseUrl()}/api/personal/documents`, { headers: h }))
        .then((r) => r.json() as Promise<{ documents: PersonalDoc[] }>)
        .then((d) => { setDocs(d.documents ?? []); setDocsLoaded(true); })
        .catch(() => {});
    }
  }, [sourceMode, user, docsLoaded]);

  // Fire BKT update when a quiz inside the chat is answered. We only have a
  // reliable concept name when the active source is a built-in topic — in the
  // text/files modes there is no global concept to point at.
  const onQuizAnswered = async (attempt: { correct: boolean; timeMs: number }) => {
    if (!user) return;
    if (activeSource.type !== "topic") return;
    try {
      const headers = await buildApiHeaders();
      await fetch(`${getApiBaseUrl()}/api/user/mastery`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          conceptName: activeSource.name,
          courseId:    "math-for-data-science",
          correct:     attempt.correct,
          source:      "quiz",
          timeMs:      attempt.timeMs,
          hintCount:   0,
        }),
      });
    } catch {
      /* best-effort: mastery write must never block the chat UX */
    }
  };

  const personalization = useMemo(() => {
    if (typeof window === "undefined") return { experience: "не указан", level: "не указан", interests: "не указаны" };
    const isReg = localStorage.getItem("mindflow-user-registered") === "1";
    if (!isReg) return { experience: "гость", level: "базовый", interests: "математика" };
    const profile = parseJson<{ background?: string; interests?: string[] }>(localStorage.getItem("mindflow-user-profile"), {});
    const levels = parseJson<Record<string, { level?: string }>>(localStorage.getItem("mindflow-course-levels"), {});
    return {
      experience: profile.background || "не указан",
      level: levels["math-for-data-science"]?.level || "не определён",
      interests: profile.interests?.join(", ") || "не указаны",
    };
  }, []);

  const buildContext = (): Omit<LearningContext, "user_input"> => {
    const baseTopic = activeSource.type === "topic" ? activeSource.name
      : activeSource.type === "file" ? activeSource.doc.source_title
      : activeSource.type === "text" ? "Пользовательский текст"
      : "Общий запрос";
    const theory = activeSource.type === "text" ? activeSource.content : "";
    return {
      current_topic: baseTopic,
      retrieved_theory: theory,
      recent_topics: "",
      experience: personalization.experience,
      level: personalization.level,
      interests: personalization.interests,
      mastered_concepts: "",
      weak_concepts: "",
      knowledge_graph_summary: activeSource.type === "file" ? `Пользователь работает с личным файлом «${activeSource.doc.source_title}». Отвечай ТОЛЬКО по этому файлу, не используй общие учебники из библиотеки MindFlow.` : "Нет персональных данных",
      current_page: `workspace-${activeSource.type}`,
      ...(activeSource.type === "file"
        ? { personal_rag: true, personal_source_id: activeSource.doc.source_id }
        : {}),
    };
  };

  // ── Source actions ─────────────────────────────────────────────────────────
  const handleApplyTopic = () => setActiveSource({ type: "topic", name: topicSelected });
  const handleSaveText = () => {
    if (!textDraft.trim()) return;
    setActiveSource({ type: "text", content: textDraft, preview: textDraft.slice(0, 80) });
  };
  const handleSelectFile = (id: string) => {
    const doc = docs.find((d) => d.source_id === id);
    if (doc) setActiveSource({ type: "file", doc });
  };
  const activeFileId = activeSource.type === "file" ? activeSource.doc.source_id : null;
  const textIsActive = activeSource.type === "text" && activeSource.content === textDraft;

  // ── Sessions ───────────────────────────────────────────────────────────────
  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setHistoryLoading(true);
    const { messages: loaded } = await loadSession(sessionId);
    setMessages(loaded.map((m) => ({
      id: m.id, role: m.role, content: m.content,
      citations: (m.rag_sources as ApiCitation[]) ?? [],
      relatedTopics: [], aiRole: m.ai_role ?? undefined, createdAt: m.created_at,
    })));
    setActiveSessionId(sessionId);
    setHistoryLoading(false);
  };

  const handleNewChat = async () => {
    await closeSession();
    setMessages([]);
    setActiveSessionId(null);
    setTimeout(() => refreshSessions(), 400);
  };

  // ── File upload / delete ───────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    setUploadState({ status: "uploading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
      const authHeaders = await buildAuthOnlyHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/personal/upload`, { method: "POST", headers: authHeaders, body: formData });
      if (!res.ok) { const err = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(err.error ?? `HTTP ${res.status}`); }
      const data = (await res.json()) as { source_id: string; source_title: string; chunks_inserted: number };
      const newDoc: PersonalDoc = { source_id: data.source_id, source_title: data.source_title, chunk_count: data.chunks_inserted };
      setDocs((prev) => [newDoc, ...prev.filter((d) => d.source_id !== newDoc.source_id)]);
      setUploadState({ status: "done", name: data.source_title });
      setTimeout(() => setUploadState({ status: "idle" }), 4000);
    } catch (err) {
      setUploadState({ status: "error", message: err instanceof Error ? err.message : "Ошибка загрузки" });
    }
  }, []);

  const handleDeleteDoc = useCallback(async (sourceId: string) => {
    const headers = await buildApiHeaders();
    await fetch(`${getApiBaseUrl()}/api/personal/documents/${encodeURIComponent(sourceId)}`, { method: "DELETE", headers });
    setDocs((prev) => prev.filter((d) => d.source_id !== sourceId));
    if (activeSource.type === "file" && activeSource.doc.source_id === sourceId) {
      setActiveSource({ type: "none" });
    }
  }, [activeSource]);

  // ── Course structure (Methodist) ───────────────────────────────────────────
  const handleAnalyseStructure = useCallback(async () => {
    setStructureLoading(true);
    setStructureError("");
    try {
      let content = "";
      let topicHintVal = "";
      if (activeSource.type === "text") {
        content = activeSource.content.slice(0, 30000);
      } else if (activeSource.type === "topic") {
        content = `Тема: ${activeSource.name}. Предложи оптимальную структуру учебного курса с разделами и подразделами.`;
        topicHintVal = activeSource.name;
      } else if (activeSource.type === "file") {
        content = `Тема: ${activeSource.doc.source_title}. Предложи структуру курса по этой теме.`;
        topicHintVal = activeSource.doc.source_title;
      } else {
        content = "Предложи структуру вводного курса по математике и ML для Data Science.";
      }
      const headers = await buildApiHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/author/structure`, {
        method: "POST", headers,
        body: JSON.stringify({ content, topic_hint: topicHintVal || undefined }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { response: string };
      setCourseStructure(parseSectionsTree(data.response));
    } catch (err) {
      setStructureError(err instanceof Error ? err.message : "Ошибка анализа структуры");
    } finally {
      setStructureLoading(false);
    }
  }, [activeSource]);

  const handleGenerateSectionContent = useCallback(async (id: string, title: string, parentTitle?: string) => {
    setProcessingId(id);
    try {
      const topicHintVal = activeSource.type === "topic" ? activeSource.name
        : activeSource.type === "file" ? activeSource.doc.source_title
        : parentTitle || title;
      const headers = await buildApiHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/author/generate-theory`, {
        method: "POST", headers,
        body: JSON.stringify({
          section_title: title,
          topic_hint: topicHintVal,
          section_summary: parentTitle ? `Подраздел раздела «${parentTitle}»` : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { response: string };
      setCourseStructure((prev) => prev.map((s) => {
        if (s.id === id) return { ...s, generated: data.response };
        return { ...s, children: s.children.map((c) => c.id === id ? { ...c, generated: data.response } : c) };
      }));
    } catch { /* silent — user can retry */ }
    finally { setProcessingId(null); }
  }, [activeSource]);

  const handleImproveSection = useCallback(async (id: string, text: string, goal: ImproveGoal) => {
    setProcessingId(id);
    try {
      const headers = await buildApiHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/author/improve`, {
        method: "POST", headers,
        body: JSON.stringify({ section_text: text, improve_goal: goal }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { response: string };
      setCourseStructure((prev) => prev.map((s) => {
        if (s.id === id) return { ...s, generated: data.response };
        return { ...s, children: s.children.map((c) => c.id === id ? { ...c, generated: data.response } : c) };
      }));
    } catch { /* silent */ }
    finally { setProcessingId(null); }
  }, []);

  const handleExportStructure = useCallback(() => {
    const topicHintVal = activeSource.type === "topic" ? activeSource.name
      : activeSource.type === "file" ? activeSource.doc.source_title
      : "Курс";
    downloadMarkdown(topicHintVal, sectionsToMarkdown(courseStructure, topicHintVal));
  }, [activeSource, courseStructure]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (userInput: string) => {
    if (status === "loading" || !userInput.trim()) return;

    const recentHistory = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    const userMsg: ChatMessage = { role: "user", content: userInput, citations: [], relatedTopics: [] };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("loading");
    saveMessage({ role: "user", content: userInput }).catch(() => {});

    try {
      let assistantContent: string;
      let assistantCitations: ApiCitation[] = [];
      let assistantRelatedTopics: RelatedTopic[] = [];
      let assistantRole: string | undefined;

      if (aiRole === "methodist") {
        const headers = await buildApiHeaders();
        const res = await fetch(`${getApiBaseUrl()}/api/author/chat`, {
          method: "POST", headers,
          body: JSON.stringify({
            author_request: userInput,
            author_content: activeSource.type === "text" ? activeSource.content : undefined,
            topic_hint:
              activeSource.type === "topic"
                ? activeSource.name
                : activeSource.type === "file"
                  ? activeSource.doc.source_title
                  : undefined,
            personal_source_id:
              activeSource.type === "file" ? activeSource.doc.source_id : undefined,
            history: recentHistory,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { response: string };
        assistantContent = data.response;
        assistantRole = "METHODIST";
      } else {
        let effectiveInput = userInput;
        let effectiveForcedRole = forcedRole;

        if (aiRole === "examiner") {
          effectiveInput = `${EXAMINER_INSTRUCTION}\n\n[Запрос пользователя]: ${userInput}`;
          effectiveForcedRole = "LECTURER";
        } else if (autoMentor) {
          effectiveInput = `[Системная инструкция: Включён режим «Авто-Ментор». Веди строго сократовский диалог: задавай наводящие вопросы по одному, не раскрывай ответ напрямую, подталкивай ученика к самостоятельному выводу. После каждого ответа ученика — следующий вопрос или похвала.]\n\n[Сообщение ученика]: ${userInput}`;
        }
        // Append visualization hint once per session (first user message)
        if (vizMode && aiRole !== "examiner" && messages.filter((m) => m.role === "user").length === 0) {
          effectiveInput = `${VISUALIZATION_INSTRUCTION}\n\n${effectiveInput}`;
        }

        const payload: LearningContext & { force_role?: string } = {
          ...buildContext(),
          user_input: effectiveInput,
          conversation_history: recentHistory,
          ...(effectiveForcedRole ? { force_role: effectiveForcedRole } : {}),
        };
        const headers = await buildApiHeaders();
        const res = await fetch(`${getApiBaseUrl()}/api/llm/respond`, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!res.ok) { const raw = await res.text(); throw new Error(raw || `HTTP ${res.status}`); }
        const data = (await res.json()) as { answer?: string; role?: string; rag?: { citations?: ApiCitation[]; relatedTopics?: RelatedTopic[] } };
        assistantContent = data.answer ?? "Пустой ответ.";
        assistantCitations = data.rag?.citations ?? [];
        assistantRelatedTopics = data.rag?.relatedTopics ?? [];
        assistantRole = aiRole === "examiner" ? "EXAMINER" : data.role;
      }

      const assistantMsg: ChatMessage = {
        role: "assistant", content: assistantContent,
        citations: assistantCitations, relatedTopics: assistantRelatedTopics, aiRole: assistantRole,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStatus("idle");
      saveMessage({ role: "assistant", content: assistantContent, aiRole: assistantRole, ragSources: assistantCitations }).catch(() => {});
      setTimeout(() => refreshSessions(), 600);
    } catch (err) {
      const details = err instanceof Error ? err.message : "Неизвестная ошибка";
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Не удалось получить ответ. Причина: ${details}`,
        citations: [], relatedTopics: [],
      }]);
      setStatus("error");
    }
  };

  const handleSend = () => { const q = question.trim(); if (!q) return; setQuestion(""); sendMessage(q); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleExaminerAction = (mode: "term" | "fill" | "error") => {
    const labels = { term: "Угадай термин", fill: "Логическая цепочка", error: "Найди ошибку" };
    sendMessage(`Запусти режим «${labels[mode]}»`);
  };

  const quickPrompts = useMemo(() => {
    if (aiRole === "methodist") return ["Составь план курса по этой теме", "Предложи интерактивные задания", "Что улучшить в материале?", "Создай глоссарий"];
    if (aiRole === "examiner") return [];
    // Use smart AI-generated suggestions if ready
    if (smartSuggestions) return smartSuggestions;
    // Fallback while loading or for specific topics
    if (activeSource.type === "topic") {
      const map: Record<string, string[]> = {
        "Собственные значения": ["Объясни геометрический смысл", "Дай задачу на нахождение", "Что такое собственный вектор?"],
        "Операции с матрицами": ["Объясни умножение матриц", "Дай задачу на перемножение", "Что такое обратная матрица?"],
        "Ранг и базис": ["Что такое ранг матрицы?", "Объясни базис пространства", "Как найти ранг через ступенчатый вид?"],
      };
      return map[activeSource.name] ?? ["Объясни основные понятия", "Дай задачу", "Покажи пример", "Что самое важное?"];
    }
    if (activeSource.type === "text") return ["Кратко объясни суть", "Задай мне вопрос по тексту", "Что здесь самое сложное?", "Выдели ключевые идеи"];
    if (activeSource.type === "file") return ["Кратко перескажи содержание", "Задай мне вопрос", "Что самое важное?", "Объясни сложное место"];
    return ["Объясни базис", "Что такое собственное значение?", "Расскажи про SVD"];
  }, [aiRole, activeSource, smartSuggestions]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">AI Workspace</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-primary">Мастерская знаний</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Выбери источник, выбери роль AI — Ментор, Методист или Экзаменатор.</p>
      </header>

      <div className="flex rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden" style={{ minHeight: "640px" }}>
        {user && (
          <SessionsSidebar
            sessions={sessions} activeSessionId={activeSessionId} loading={sessionsLoading}
            onSelectSession={handleSelectSession} onNewChat={handleNewChat}
            collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        )}

        <div className="flex flex-1 flex-col min-w-0">
          <SourcePanel
            sourceMode={sourceMode} onSourceMode={setSourceMode}
            topicSelected={topicSelected} onTopicSelected={setTopicSelected} onApplyTopic={handleApplyTopic}
            textDraft={textDraft} onTextDraft={setTextDraft} onSaveText={handleSaveText} textIsActive={textIsActive}
            docs={docs} activeFileId={activeFileId} onSelectFile={handleSelectFile} onViewFile={setReadingDoc}
            uploadState={uploadState} onUpload={handleUpload} onDelete={handleDeleteDoc}
            isLoggedIn={!!user}
          />

          <RoleToggle
            role={aiRole}
            onRole={(r) => { setAiRole(r); if (r !== "mentor") setAutoMentor(false); }}
            autoMentor={autoMentor}
            onAutoMentor={setAutoMentor}
          />

          {aiRole === "mentor" && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/20 bg-surface-container-low/50">
              <span className="text-[11px] text-on-surface-variant/60">Принудительная роль:</span>
              <select value={forcedRole} onChange={(e) => setForcedRole(e.target.value)}
                className="rounded-lg border border-outline-variant/40 bg-white px-2 py-1 text-xs text-primary focus:border-secondary focus:outline-none">
                <option value="">Авто</option>
                <option value="LECTURER">Лектор</option>
                <option value="MIRROR">Зеркало</option>
                <option value="SANDBOX">Практика</option>
                <option value="CHALLENGER">Критик</option>
              </select>
              {autoMentor && <span className="text-[11px] text-secondary font-medium ml-2">AI ведёт диалог и задаёт вопросы</span>}
            </div>
          )}

          <IndicatorStrip role={aiRole} source={activeSource} />

          {aiRole === "examiner" && (
            <ExaminerActions onAction={handleExaminerAction} disabled={status === "loading"} />
          )}

          {/* Main content: chat + optional structure panel */}
          <div className={`flex flex-1 min-h-0 ${aiRole === "methodist" ? "flex-row" : "flex-col"}`}>

            {/* Chat column */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              <div className="flex items-center gap-2 border-b border-outline-variant/20 px-4 py-2 shrink-0">
                <MessageSquare size={15} className="text-secondary" />
                <span className="text-sm font-semibold text-primary">Диалог</span>
                {messages.length > 0 && (
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">{messages.length}</span>
                )}
                {autoMentor && aiRole === "mentor" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
                    Авто-Ментор
                  </span>
                )}
                {vizMode && aiRole !== "examiner" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                    <Code2 size={9} /> Визуализация
                  </span>
                )}
                {!user && (
                  <button onClick={handleNewChat} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-outline-variant/40 bg-white px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
                    <Plus size={12} /> Новый чат
                  </button>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ minHeight: "240px", maxHeight: "calc(100vh - 520px)" }}>
                {historyLoading ? (
                  <div className="flex h-full items-center justify-center"><p className="text-sm text-on-surface-variant">Загрузка диалога...</p></div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-8">
                    <MessageSquare size={36} className="text-outline-variant/40" />
                    <p className="text-sm font-medium text-on-surface-variant">
                      {aiRole === "methodist" ? "Начни диалог с методистом" : aiRole === "examiner" ? "Выбери формат проверки сверху" : "Начни диалог с ментором"}
                    </p>
                    {suggestionsLoading && aiRole !== "examiner" && (
                      <div className="flex flex-wrap justify-center gap-2 max-w-md">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-7 w-36 animate-pulse rounded-xl bg-surface-container" />
                        ))}
                      </div>
                    )}
                  {!suggestionsLoading && quickPrompts.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 max-w-md">
                        {quickPrompts.map((p) => (
                          <button key={p} onClick={() => setQuestion(p)}
                            className={["rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                              aiRole === "methodist" ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                : "border-secondary/30 bg-secondary/5 text-secondary hover:bg-secondary/10"].join(" ")}>
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <MessageBubble
                        key={msg.id ?? idx}
                        msg={msg}
                        onQuizNext={() => sendMessage("Дальше")}
                        onQuizAnswered={onQuizAnswered}
                      />
                    ))}
                    {status === "loading" && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary text-xs font-bold">AI</div>
                        <div className="rounded-2xl rounded-tl-sm border border-outline-variant/20 bg-white px-4 py-3">
                          <span className="inline-flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary" />
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="border-t border-outline-variant/20 p-4 shrink-0">
                {showFormula && (
                  <div className="mb-2">
                    <FormulaInput onInsert={(tex) => { setQuestion((p) => p + tex); setShowFormula(false); textareaRef.current?.focus(); }} onClose={() => setShowFormula(false)} />
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea ref={textareaRef} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown}
                    rows={2}
                    placeholder={aiRole === "methodist" ? "Запрос методисту…" : aiRole === "examiner" ? "Ответь на вопрос или скажи «Дальше»…" : "Задай вопрос…"}
                    className="flex-1 resize-none rounded-xl border border-outline-variant/40 bg-white px-4 py-2.5 text-sm text-primary placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none" />
                  <div className="flex flex-col gap-1.5">
                    {aiRole === "mentor" && (
                      <button onClick={() => setShowFormula((v) => !v)} title="Вставить формулу"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-secondary/30 bg-white text-secondary hover:bg-secondary/5 transition-colors">
                        <Sigma size={15} />
                      </button>
                    )}
                    {aiRole !== "examiner" && (
                      <button
                        onClick={() => setVizMode((v) => !v)}
                        title={vizMode ? "Выключить визуализацию" : "Включить визуализацию (AI рисует графики и диаграммы)"}
                        className={["inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                          vizMode ? "border-violet-400 bg-violet-100 text-violet-700 hover:bg-violet-200" : "border-outline-variant/30 bg-white text-on-surface-variant hover:bg-surface-container"].join(" ")}
                      >
                        <Code2 size={15} />
                      </button>
                    )}
                    <button onClick={handleSend} disabled={status === "loading" || !question.trim()}
                      className={["inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                        aiRole === "methodist" ? "bg-indigo-600" : aiRole === "examiner" ? "bg-rose-600" : "bg-secondary"].join(" ")}
                      title="Отправить">
                      <Send size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-on-surface-variant/60">
                  {user ? "История сохраняется автоматически." : "Войди, чтобы история сохранялась."}
                </p>
              </div>
            </div>

            {/* Course Structure Panel — Methodist only */}
            {aiRole === "methodist" && (
              <CourseStructurePanel
                sections={courseStructure}
                onSections={setCourseStructure}
                loading={structureLoading}
                error={structureError}
                processingId={processingId}
                onAnalyse={handleAnalyseStructure}
                onGenerateContent={handleGenerateSectionContent}
                onImproveContent={handleImproveSection}
                onExport={handleExportStructure}
                canAnalyse={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Document Reader Modal */}
      {readingDoc && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setReadingDoc(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ height: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <DocReader
              sourceId={readingDoc.source_id}
              sourceTitle={readingDoc.source_title}
              onClose={() => setReadingDoc(null)}
              onAsk={(text) => {
                setQuestion(`Объясни, пожалуйста, этот фрагмент: «${text}»`);
                // Make sure the file is the active source so AI has context
                if (activeSource.type !== "file" || activeSource.doc.source_id !== readingDoc.source_id) {
                  setActiveSource({ type: "file", doc: readingDoc });
                }
                setReadingDoc(null);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
            />
          </div>
        </div>
      )}

      {trialModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={trialActivated ? closeTrialModal : undefined}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!trialActivated ? (
              <>
                <span className="inline-block rounded-md bg-amber-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
                  AI Workspace · Pro
                </span>
                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
                  Первый месяц — бесплатно
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  AI Workspace — единственная платная зона MindFlow. Здесь можно общаться
                  с AI-ментором по своим PDF, переключаться между 5 ролями и получать
                  ответы с цитатами из источников.
                </p>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-amber-900">MindFlow Pro</span>
                    <span className="font-mono text-lg font-extrabold text-amber-900">349 ₽/мес</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    После пробного месяца. Можно отменить в любой момент.
                  </p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>Безлимитные сообщения с AI-ментором</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>Загрузка своих PDF — ментор отвечает по твоему материалу</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>Все 5 ролей: Лектор, Проверяющий, Практик, Рефлексия, Авто</span>
                  </li>
                </ul>
                {trialError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {trialError}
                  </p>
                )}
                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={activateTrial}
                    disabled={trialActivating}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {trialActivating ? "Активирую..." : "Активировать пробный месяц"}
                  </button>
                  <button
                    onClick={closeTrialModal}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Позже
                  </button>
                </div>
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Карту привязывать не нужно. Платная подписка появится по отдельной кнопке.
                </p>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-slate-900">Активировано</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Пробный месяц Pro подключён. Все возможности AI Workspace открыты на 30 дней.
                </p>
                <button
                  onClick={closeTrialModal}
                  className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  Начать
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
