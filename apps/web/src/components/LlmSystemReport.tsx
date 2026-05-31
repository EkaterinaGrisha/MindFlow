import { motion } from "motion/react";
import {
  ArrowLeft, Download, Share2, Sparkles, Bot, Database, Route,
  BrainCircuit, ShieldCheck, Send, Zap, Network, BookOpen,
  CheckCircle2, AlertTriangle, ArrowRight, Server, Code2,
  Layers, Activity, GitBranch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReactNode = React.ReactNode;

// ─── Layout helpers (same visual system as MarketAnalysis) ────────────────────

const Tag = ({ children }: { children: ReactNode }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
    color: "#4f46e5", background: "rgba(79,70,229,0.08)",
    padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(79,70,229,0.15)",
  }}>{children}</span>
);

const SectionDivider = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "56px 0 32px" }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: "rgba(79,70,229,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={18} color="#4f46e5" />
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f0f1a", margin: 0, flex: 1 }}>{label}</h2>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #e0e7ff, transparent)" }} />
  </div>
);

const Card = ({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6", padding: 24, ...style,
  }}>{children}</div>
);

const KpiCard = ({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: ReactNode; accent?: boolean;
}) => (
  <div style={{
    background: accent ? "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)" : "#fff",
    borderRadius: 16, border: accent ? "none" : "1px solid #e8eaf6",
    padding: "24px 20px", position: "relative", overflow: "hidden",
  }}>
    {accent && <div style={{ position: "absolute", right: -24, top: -24, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />}
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px", color: accent ? "rgba(255,255,255,0.6)" : "#4f46e5" }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: accent ? "#fff" : "#0f0f1a", lineHeight: 1 }}>{value}</p>
    {sub && <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,0.65)" : "#6b7280", marginTop: 4 }}>{sub}</div>}
  </div>
);

const InsightBox = ({ color = "#4f46e5", title, children }: { color?: string; title: string; children: ReactNode }) => (
  <div style={{
    background: `${color}08`, border: `1px solid ${color}20`,
    borderRadius: 12, padding: "14px 16px", marginTop: 16,
  }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color, textTransform: "uppercase", margin: "0 0 6px" }}>💡 {title}</p>
    <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.6 }}>{children}</p>
  </div>
);

// ─── Code block — светлый фон как в MarketAnalysis ────────────────────────────
const CodeBlock = ({ label, children }: { label?: string; children: ReactNode }) => (
  <div style={{ margin: "14px 0" }}>
    {label && <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4f46e5", margin: "0 0 6px" }}>{label}</p>}
    <div style={{
      background: "#f5f3ff", borderRadius: 12, border: "1px solid #ddd6fe",
      padding: "14px 18px", fontFamily: "monospace", fontSize: 12,
      lineHeight: 1.65, color: "#1e1b4b", whiteSpace: "pre-wrap", overflowX: "auto",
    }}>{children}</div>
  </div>
);

// ─── JSON block — тёплый серый ─────────────────────────────────────────────────
const JsonBlock = ({ label, children }: { label?: string; children: ReactNode }) => (
  <div style={{ margin: "14px 0" }}>
    {label && <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#059669", margin: "0 0 6px" }}>{label}</p>}
    <div style={{
      background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0",
      padding: "14px 18px", fontFamily: "monospace", fontSize: 12,
      lineHeight: 1.65, color: "#064e3b", whiteSpace: "pre-wrap", overflowX: "auto",
    }}>{children}</div>
  </div>
);

// ─── HTTP-запрос block ────────────────────────────────────────────────────────
const HttpBlock = ({ label, children }: { label?: string; children: ReactNode }) => (
  <div style={{ margin: "14px 0" }}>
    {label && <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#d97706", margin: "0 0 6px" }}>{label}</p>}
    <div style={{
      background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a",
      padding: "14px 18px", fontFamily: "monospace", fontSize: 12,
      lineHeight: 1.65, color: "#78350f", whiteSpace: "pre-wrap", overflowX: "auto",
    }}>{children}</div>
  </div>
);

// ─── Step Badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ n }: { n: number }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: "50%",
    background: "linear-gradient(135deg, #4f46e5, #6d28d9)",
    color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0,
  }}>{n}</span>
);

// ─── Provider Badge ───────────────────────────────────────────────────────────
const ProviderBadge = ({ name, color, note }: { name: string; color: string; note: string }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
    background: `${color}10`, borderRadius: 10, border: `1px solid ${color}25`,
  }}>
    <Server size={14} color={color} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f0f1a", margin: 0 }}>{name}</p>
      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{note}</p>
    </div>
  </div>
);

// ─── Role Card ────────────────────────────────────────────────────────────────
const RoleCard = ({ role, emoji, trigger, prompt, tone, color }: {
  role: string; emoji: string; trigger: string; prompt: string; tone: string; color: string;
}) => (
  <div style={{ borderRadius: 14, border: `1.5px solid ${color}33`, overflow: "hidden" }}>
    <div style={{ padding: "12px 16px", background: `${color}10`, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{role}</p>
        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>тон: {tone}</p>
      </div>
    </div>
    <div style={{ padding: "12px 16px", background: "#fff" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>Когда выбирается</p>
      <p style={{ fontSize: 12, color: "#374151", margin: "0 0 10px", lineHeight: 1.55 }}>{trigger}</p>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>Файл промпта</p>
      <code style={{ fontSize: 11, color: color, background: `${color}12`, padding: "2px 7px", borderRadius: 5 }}>{prompt}</code>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LlmSystemReport() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#0f0f1a", background: "#f8f9ff", minHeight: "100vh" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(248,249,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8eaf6", padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={() => navigate("/reports")} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={15} /> Отчёты
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1px solid #e8eaf6", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <Download size={14} /> PDF
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #4f46e5, #6d28d9)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Share2 size={14} /> Поделиться
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px" }}>

        {/* ══ HERO ══ */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Tag><Sparkles size={10} /> Технический отчёт · MindFlow</Tag>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ОБНОВЛЕНО АПРЕЛЬ 2026</span>
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "#0f0f1a", lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 860 }}>
            Система запросов к LLM{" "}
            <span style={{ color: "#4f46e5" }}>в MindFlow</span>{" "}
            — полный разбор
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65, maxWidth: 720, margin: 0 }}>
            От действия пользователя в интерфейсе до ответа модели: маршрутизация ролей, RAG-поиск,
            цепочка провайдеров, граф знаний и обновление BKT — с реальными примерами запросов и ответов.
          </p>
        </motion.section>

        {/* ══ KPI ROW ══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          <KpiCard label="Ролей AI-ментора" value="4" sub="LECTURER · MIRROR · SANDBOX · CHALLENGER" accent />
          <KpiCard label="LLM-провайдеров" value="3" sub="DeepSeek → Cloudflare → OpenRouter" />
          <KpiCard label="Temperature" value="0.2" sub="Стабильность для учебного контента" />
          <KpiCard label="RAG-бюджет (LECTURER)" value="2400" sub="Символов контекста из учебников" />
        </motion.div>

        {/* ══ SECTION 1: Обзор ══ */}
        <SectionDivider icon={Bot} label="Что происходит, когда пользователь задаёт вопрос" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Представьте умного помощника-преподавателя. Студент задаёт вопрос, и прежде чем помощник
          ответит, происходит цепочка автоматических решений: выбор роли, поиск теории из учебников,
          обогащение персональным прогрессом и только потом — вызов языковой модели.
        </p>

        {/* Pipeline flow */}
        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Pipeline одного запроса</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { n: 1, label: "Пользователь пишет вопрос в AIMentorSidebar", tag: "Frontend" },
              { n: 2, label: "POST /api/llm/respond → сервер llmEndpoint.ts", tag: "HTTP" },
              { n: 3, label: "RAG: вопрос → embeddings → поиск по Supabase → куски учебников", tag: "RAG" },
              { n: 4, label: "KG: загрузка mastered/weak concepts из kg_mastery_summary", tag: "Knowledge Graph" },
              { n: 5, label: "Quick Router: regex-проверка (экономит ~1 LLM вызов для 40–50% запросов)", tag: "Router" },
              { n: 6, label: "Если Quick Router не сработал → Оркестратор LLM (1-й вызов)", tag: "LLM #1" },
              { n: 7, label: "Основной ответ с role-промптом (2-й вызов)", tag: "LLM #2" },
              { n: 8, label: "Fire-and-forget: rag_metrics + learning_activities + BKT обновление", tag: "Async" },
              { n: 9, label: "JSON-ответ → Frontend → CitationPanel", tag: "Response" },
            ].map((step, i) => {
              const tagColors: Record<string, string> = {
                Frontend: "#4f46e5", HTTP: "#d97706", RAG: "#7c3aed",
                "Knowledge Graph": "#059669", Router: "#0891b2",
                "LLM #1": "#e11d48", "LLM #2": "#dc2626",
                Async: "#6b7280", Response: "#4f46e5",
              };
              const c = tagColors[step.tag] ?? "#4f46e5";
              return (
                <div key={step.n} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${c}18`, border: `2px solid ${c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: c, flexShrink: 0 }}>{step.n}</div>
                    {i < 8 && <div style={{ width: 2, flex: 1, background: "#e8eaf6", margin: "4px 0" }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < 8 ? 14 : 0, paddingLeft: 12, paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: c, background: `${c}12`, padding: "2px 7px", borderRadius: 5 }}>{step.tag}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ══ SECTION 2: Шаг 1 — Фронтенд ══ */}
        <SectionDivider icon={Send} label="Шаг 1: пользователь нажимает «Спросить»" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          В компоненте <code style={{ fontSize: 13, background: "#f0f0ff", padding: "1px 5px", borderRadius: 4, color: "#4f46e5" }}>AIMentorSidebar</code> (файл{" "}
          <code style={{ fontSize: 13, background: "#f0f0ff", padding: "1px 5px", borderRadius: 4, color: "#4f46e5" }}>MathTopic.tsx</code>)
          собирается объект <code style={{ fontSize: 13, background: "#f0f0ff", padding: "1px 5px", borderRadius: 4, color: "#4f46e5" }}>LearningContext</code> со
          всеми данными о пользователе, уроке и его вопросе. Затем он уходит POST-запросом на сервер.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <Card>
            <CodeBlock label="LearningContext — объект контекста">
{`const ctx: LearningContext = {
  current_topic: "Собственные значения",
  retrieved_theory: "## Определение\\n...",
  recent_topics: "",
  experience: "аналитик, 3 года",
  level: "Middle (L2)",
  interests: "финансы, ML",
  mastered_concepts: "",
  weak_concepts: "",
  knowledge_graph_summary: "...",
  current_page: "теория — Собственные значения",
  user_input: "Объясни что такое собственный вектор",
};`}
            </CodeBlock>
          </Card>
          <Card>
            <HttpBlock label="HTTP-запрос к серверу">
{`POST http://localhost:8787/api/llm/respond
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{
  "current_topic": "Собственные значения",
  "level": "Middle (L2)",
  "experience": "аналитик, 3 года",
  "interests": "финансы, ML",
  "user_input": "Объясни что такое
                собственный вектор",
  ...все остальные поля ctx...
}`}
            </HttpBlock>
            <InsightBox title="Авторизация">
              Если пользователь залогинен, в заголовке летит JWT-токен Supabase.
              Сервер извлекает из него <code style={{ fontSize: 11 }}>userId</code> для персонализации через KG.
              Гости тоже могут использовать AI — просто без сохранения прогресса.
            </InsightBox>
          </Card>
        </div>

        {/* ══ SECTION 3: RAG ══ */}
        <SectionDivider icon={Database} label="Шаг 2: RAG — поиск теории из учебников" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          До того как думать о роли, сервер ищет релевантные куски текста из одобренных учебников.
          Вопрос пользователя превращается в числовой вектор из 384 чисел (embedding), и база данных
          находит абзацы с похожими числами — то есть похожим смыслом.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Как работают embeddings</p>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: "0 0 10px" }}>
              Каждый вопрос и каждый абзац учебника превращается в набор из 384 чисел. Похожие по смыслу
              тексты дают похожие наборы чисел — это и есть семантический поиск.
            </p>
            <CodeBlock label="Вектор вопроса (384 числа — первые 8)">
{`embedQuery("Объясни что такое собственный вектор")
→ [0.023, -0.156, 0.891, 0.034,
   -0.442, 0.178, 0.667, -0.089,
   ...ещё 376 чисел...]

Provider: local-e5-small (Xenova/multilingual-e5-small)
Размерность: 384
Время: ~80ms (локально, без сети)`}
            </CodeBlock>
          </Card>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Что возвращает Supabase</p>
            <JsonBlock label="Найденные куски учебника (RagChunk[])">
{`[
  {
    "chunk_id": "kos-la-001",
    "source_title": "Кострикин — Линейная алгебра",
    "text": "Ненулевой вектор v называется
             собственным для матрицы A,
             если существует число λ такое,
             что Av = λv...",
    "score": 0.87,
    "page_hint": "стр. 142",
    "topic_tags": ["eigenvalues", "linear-algebra"]
  },
  {
    "chunk_id": "kos-la-002",
    "source_title": "Кострикин — Линейная алгебра",
    "text": "Характеристическое уравнение
             det(A-λI)=0 позволяет найти...",
    "score": 0.81,
    "page_hint": "стр. 143"
  }
]`}
            </JsonBlock>
          </Card>
        </div>

        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 16px" }}>
            Детали RAG-пайплайна: hybrid search → MMR → reranker
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              { step: "01", title: "Hybrid Search", desc: "Плотный поиск по эмбеддингам + лексический BM25. RRF объединяет оба ранга.", color: "#4f46e5" },
              { step: "02", title: "MMR-отбор", desc: "Maximal Marginal Relevance: убирает повторяющиеся абзацы, оставляет разнообразные.", color: "#7c3aed" },
              { step: "03", title: "Reranker", desc: "Cloudflare bge-reranker-base переоценивает финальный порядок cross-encoder-ом.", color: "#059669" },
              { step: "04", title: "Token Budget", desc: "Для LECTURER: max 600 токенов. Лишнее обрезается с пометкой «[...сокращено]».", color: "#d97706" },
            ].map((item, i) => (
              <div key={item.step} style={{ padding: "0 16px", borderRight: i < 3 ? "1px dashed #e0e7ff" : "none" }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#e0e7ff", lineHeight: 1, margin: "0 0 8px" }}>{item.step}</p>
                <p style={{ fontSize: 12, fontWeight: 800, color: item.color, margin: "0 0 6px" }}>{item.title}</p>
                <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <InsightBox title="Graceful degradation">
            Если эмбеддинги не сработали (нет ни одного провайдера), RAG возвращает пустой результат.
            Система продолжает работу без контекста — LLM отвечает из общих знаний, но честно помечает это
            в поле <code style={{ fontSize: 11 }}>embeddingProvider: "none"</code>.
          </InsightBox>
        </Card>

        {/* ══ SECTION 4: Knowledge Graph ══ */}
        <SectionDivider icon={Network} label="Шаг 3: обогащение данными из Knowledge Graph" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Если пользователь залогинен, система подтягивает его персональный прогресс — какие концепты
          он освоил, где пробелы. Это идёт в контекст к модели, чтобы лектор не объяснял то, что
          студент уже знает, и делал акцент на слабых местах.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Запрос к Supabase</p>
            <CodeBlock label="buildKnowledgeGraphContext()">
{`SELECT concept, domain, p_mastery, status
FROM kg_mastery_summary
WHERE user_id = 'user-uuid-123'
  AND course_id = 'math-for-data-science'

-- Статусы:
-- mastered   = p_mastery >= 0.75 (≥75%)
-- in_progress = 0.45–0.75
-- weak_spot  = p_mastery < 0.45 (<45%)`}
            </CodeBlock>
          </Card>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Результат — добавляется в контекст</p>
            <JsonBlock label="KnowledgeGraphContext">
{`{
  "mastered_concepts":
    "Операции с матрицами, Ранг и базис",

  "weak_concepts":
    "Предел и непрерывность",

  "knowledge_graph_summary":
    "Освоено (≥75%): Операции с матрицами,
     Ранг и базис.
     В процессе (45–75%): Собственные значения.
     Слабые места (<45%): Предел и непрерывность."
}`}
            </JsonBlock>
          </Card>
        </div>

        {/* ══ SECTION 5: Quick Router ══ */}
        <SectionDivider icon={Route} label="Шаг 4: Quick Router — экономия одного LLM-вызова" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Прежде чем тратить деньги на вызов LLM для выбора роли, система проверяет простые
          текстовые паттерны. Это работает для 40–50% запросов и экономит ~1500–2000 токенов на
          каждом таком запросе — при тысячах запросов в день экономия существенная.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <Card>
            <CodeBlock label="quickRouter() — полный код">
{`function quickRouter(input: string) {
  const lower = input.toLowerCase().trim();

  // Короткий определительный вопрос
  if (lower.length < 60 &&
    /^(что такое|что такие|как называется|
       объясни что)/.test(lower)) {
    return "LECTURER"; // ← сработает для нашего примера!
  }

  // Признаки растерянности
  if (/не понима|путаюсь|
       сомнева|объясни ещё раз/.test(lower)) {
    return "MIRROR";
  }

  // Просьба дать задачу
  if (/^дай.*задач|^хочу.*попрактик|
       ^придума.*задан/.test(lower)) {
    return "SANDBOX";
  }

  // Не определили — идём к оркестратору
  return null;
}`}
            </CodeBlock>
          </Card>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Результат для нашего примера</p>
            <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#064e3b", margin: "0 0 4px" }}>Вопрос: «Объясни что такое собственный вектор»</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <CheckCircle2 size={16} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Совпадение с паттерном <code style={{ fontSize: 11 }}>^(объясни что)</code></span>
              </div>
              <p style={{ fontSize: 12, color: "#374151", margin: "8px 0 0" }}>Роль: <strong>LECTURER</strong> — без вызова LLM-оркестратора</p>
            </div>
            <div style={{ padding: "16px", background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>routedBy</p>
              <code style={{ fontSize: 13, color: "#78350f", fontWeight: 700 }}>"quick_router"</code>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>Это поле возвращается клиенту — удобно для отладки и аналитики.</p>
            </div>
          </Card>
        </div>

        {/* ══ SECTION 6: Оркестратор ══ */}
        <SectionDivider icon={BrainCircuit} label="Шаг 5: оркестратор — 1-й вызов LLM" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Когда быстрый роутер не сработал, система делает первый вызов LLM. Задача оркестратора
          одна: принять решение о роли и вернуть строгий JSON. Ничего лишнего — никакого объяснения,
          только классификация.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Системный промпт (файл orchestrator.md)</p>
            <div style={{
              background: "#f5f3ff", borderRadius: 12, border: "1px solid #ddd6fe",
              padding: "14px 18px", fontSize: 12, lineHeight: 1.65, color: "#1e1b4b",
            }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#4f46e5" }}>ROLE: route user_input → role.</p>
              <p style={{ margin: "0 0 8px" }}><strong>ROLES:</strong><br />
              - LECTURER: «что это / как / объясни / определение»<br />
              - SANDBOX: «как сделать / задачу / попробовать»<br />
              - MIRROR: «не понимаю / сомневаюсь / путаюсь»<br />
              - CHALLENGER: «проверь / уверен / докажи»</p>
              <p style={{ margin: "0 0 8px" }}><strong>OVERRIDES:</strong><br />
              - page=Практика + теор. вопрос → LECTURER<br />
              - знание ошибок в KG → MIRROR<br />
              - освоенный концепт → CHALLENGER</p>
              <p style={{ margin: 0, color: "#4f46e5", fontWeight: 700 }}>OUTPUT (JSON, без markdown):<br />
              {"{"}"selected_role":"...", "reasoning":"...", "priority_focus":"...", "suggested_tone":"..."{"}"}</p>
            </div>
          </Card>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Пользовательское сообщение для оркестратора</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 8px" }}>
              Контекст сжимается функцией <code style={{ fontSize: 11, background: "#f0f0ff", padding: "1px 4px", borderRadius: 3, color: "#4f46e5" }}>buildCompactOrchestratorContext()</code> — экономия ~300–500 токенов:
            </p>
            <CodeBlock label="Сжатый контекст → в user message">
{`КОНТЕКСТ:
current_topic: Собственные значения
current_page: теория — Собственные значения
level: Middle (L2)
experience: {"exp":"аналитик/3y","lvl":"L2",
             "int":"финансы,ML",
             "mastered":"матрицы,ранг",
             "weak":"пределы"}
knowledge_graph_summary: Освоено: матрицы,
  ранг. Слабые: пределы.
retrieved_theory: [topic: Собственные значения]

user_input: Объясни что такое собственный вектор`}
            </CodeBlock>
            <JsonBlock label="Ответ оркестратора (JSON)">
{`{
  "selected_role": "LECTURER",
  "reasoning": "Вопрос на определение концепта",
  "priority_focus": "Интуиция понятия + пример",
  "suggested_tone": "поддерживающий"
}`}
            </JsonBlock>
          </Card>
        </div>

        {/* ══ SECTION 7: Главный LLM вызов ══ */}
        <SectionDivider icon={Zap} label="Шаг 6: основной ответ — 2-й вызов LLM" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Это главный вызов — тот, который студент видит как ответ AI-ментора. Системный промпт
          загружается из файла роли (<code style={{ fontSize: 13, background: "#f0f0ff", padding: "1px 5px", borderRadius: 4, color: "#4f46e5" }}>lecturer.md</code>, и т.д.), а
          всё динамическое (RAG-контекст, профиль, вопрос) идёт в user message.
          Такое разделение позволяет кэшировать системный промпт между запросами.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Системный промпт (lecturer.md) — статичный, кэшируемый</p>
            <div style={{
              background: "#f5f3ff", borderRadius: 12, border: "1px solid #ddd6fe",
              padding: "14px 18px", fontSize: 12, lineHeight: 1.7, color: "#1e1b4b",
            }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#4f46e5" }}>ROLE: lecturer. Профессор-практик, точно, без воды.</p>
              <p style={{ margin: "0 0 6px" }}>GROUNDING: база — retrieved_theory. Не выдумывай источники.</p>
              <p style={{ margin: "0 0 6px" }}>FLOW:<br />
              1) мост recent_topics → current_topic (1–2 фразы)<br />
              2) ядро: 1 метафора из interests<br />
              3) развёртывание: 2–4 блока, ≤1 идеи на блок<br />
              4) синтез: практический выход</p>
              <p style={{ margin: "0 0 6px" }}>PERSONALIZATION:<br />
              - experience → глубина<br />
              - mastered_concepts → опора, не повтор<br />
              - weak_concepts → смена перспективы</p>
              <p style={{ margin: 0, color: "#4f46e5", fontWeight: 700 }}>OUTPUT: Контекстный мост → Объяснение → Резюме → Вопрос-кейс → [METADATA]</p>
            </div>
          </Card>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>User message (с RAG бюджетом для LECTURER — 2400 символов)</p>
            <CodeBlock label="buildContextMessage() + applyRagBudget()">
{`КОНТЕКСТ:
current_topic: Собственные значения
current_page: теория — Собственные значения
level: Middle (L2)
experience: аналитик, 3 года
interests: финансы, ML
mastered_concepts: Операции с матрицами,
                   Ранг и базис
weak_concepts: Предел и непрерывность
knowledge_graph_summary:
  Освоено (≥75%): матрицы, ранг.
  Слабые: пределы.
retrieved_theory:
[1] Кострикин — Линейная алгебра (стр. 142)
    (kos-la-001): Ненулевой вектор v
    называется собственным для матрицы A,
    если существует число λ такое, что Av = λv.
    Λ — собственное значение, v — собственный
    вектор. Находим из det(A - λI) = 0...
[2] Кострикин — Линейная алгебра (стр. 143)
    (kos-la-002): Характеристическое
    уравнение...

ЗАПРОС: Объясни что такое собственный вектор`}
            </CodeBlock>
          </Card>
        </div>

        <Card style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Итоговый запрос к DeepSeek API</p>
          <HttpBlock label="POST https://api.deepseek.com/v1/chat/completions">
{`{
  "model": "deepseek-chat",
  "temperature": 0.2,
  "messages": [
    {
      "role": "system",
      "content": "ROLE: lecturer. Профессор-практик, точно, без воды.\\n
                  MISSION: объяснить current_topic так, чтобы ученик понял и применил.\\n
                  GROUNDING:\\n- база — retrieved_theory\\n
                  ..."
    },
    {
      "role": "user",
      "content": "КОНТЕКСТ:\\ncurrent_topic: Собственные значения\\n
                  ...retrieved_theory...\\n\\n
                  ЗАПРОС: Объясни что такое собственный вектор"
    }
  ]
}`}
          </HttpBlock>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <InsightBox title="Почему temperature = 0.2?">
              Чем ниже температура, тем точнее и детерминированнее ответ. При 0 — всегда одинаковый ответ, при 1 — творческий хаос.
              Для учебного контента нужна точность, поэтому 0.2. Нельзя, чтобы LLM придумывал теоремы.
            </InsightBox>
            <InsightBox title="Почему два LLM-вызова?" color="#7c3aed">
              Первый (оркестратор) — маленький, дешёвый, только классифицирует.
              Второй — получает точный системный промпт под задачу. Как сначала спросить диспетчера
              «к кому идти», а потом говорить с нужным специалистом.
            </InsightBox>
          </div>
        </Card>

        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Ответ DeepSeek → извлекается текст</p>
          <JsonBlock label="data.choices[0].message.content — ответ модели">
{`{
  "choices": [{
    "message": {
      "content": "**Контекстный мост**\\n
Вы уже разобрались с операциями с матрицами и рангом — отличная база.
Собственные значения — это следующий уровень: мы спрашиваем,
существуют ли для матрицы «особые» направления.\\n\\n
**Ядро концепта**\\n
Представьте портфель в финансах: матрица A — это «рынок», вектор v — портфель.
Если Av = λv, значит после воздействия рынка портфель изменился в λ раз,
но не повернул в другую сторону. Это и есть собственный вектор — направление,
которое матрица лишь масштабирует.\\n\\n
**Математически:**\\n
Av = λv, где v ≠ 0 — собственный вектор, λ — собственное значение.
Находим λ из det(A − λI) = 0.\\n\\n
**Как применить:**\\n
В PCA собственные векторы ковариационной матрицы — это главные компоненты.\\n\\n
**Вопрос-кейс:** Для матрицы A = [[2,0],[0,3]] найдите собственные значения.
Посмотрите на диагональ — подсказка уже в ней.\\n\\n
[METADATA] {\\"key_terms\\":[\\"собственный вектор\\",\\"собственное значение\\",
\\"характеристическое уравнение\\"],\\"mode\\":\\"lecturer\\"}"
    }
  }]
}`}
          </JsonBlock>
        </Card>

        {/* ══ SECTION 8: Роли ══ */}
        <SectionDivider icon={Layers} label="Четыре роли AI-ментора" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Каждая роль — отдельный промпт-файл с принципиально другой стратегией взаимодействия.
          Это не просто «разные тона» — это разные педагогические методики.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <RoleCard
            role="LECTURER"
            emoji="👨‍🏫"
            trigger="«Что такое X», «Объясни», «Как работает» — определительные вопросы"
            prompt="lecturer.md"
            tone="поддерживающий"
            color="#4f46e5"
          />
          <RoleCard
            role="MIRROR"
            emoji="🪞"
            trigger="«Не понимаю», «Путаюсь», «Сомневаюсь» — Сократовские вопросы вместо ответов"
            prompt="mirror.md"
            tone="нейтральный"
            color="#7c3aed"
          />
          <RoleCard
            role="SANDBOX"
            emoji="🛠️"
            trigger="«Дай задачу», «Хочу попрактиковать», «Как сделать» — кейс + действие"
            prompt="sandbox.md"
            tone="прагматичный"
            color="#059669"
          />
          <RoleCard
            role="CHALLENGER"
            emoji="⚔️"
            trigger="«Проверь меня», «Уверен ли я», «Докажи» — поиск логических дыр"
            prompt="challenger.md"
            tone="требовательный"
            color="#dc2626"
          />
        </div>

        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 16px" }}>RAG budget — лимит теоретического контекста по ролям</p>
          <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: "0 0 16px" }}>
            Каждой роли нужно разное количество теории. LECTURER объясняет — ему нужно много.
            MIRROR задаёт вопросы — ему теория почти не нужна. Это экономит токены и деньги.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { role: "LECTURER", chars: 2400, tokens: "~600 tk", color: "#4f46e5", pct: 100 },
              { role: "SANDBOX", chars: 1200, tokens: "~300 tk", color: "#059669", pct: 50 },
              { role: "MIRROR", chars: 800, tokens: "~200 tk", color: "#7c3aed", pct: 33 },
              { role: "CHALLENGER", chars: 600, tokens: "~150 tk", color: "#dc2626", pct: 25 },
            ].map(item => (
              <div key={item.role} style={{ padding: "14px", borderRadius: 12, background: `${item.color}08`, border: `1px solid ${item.color}22` }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>{item.role}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#0f0f1a", margin: "0 0 2px", lineHeight: 1 }}>{item.chars.toLocaleString()}</p>
                <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 8px" }}>символов · {item.tokens}</p>
                <div style={{ background: "#e0e0f0", borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══ SECTION 9: Провайдеры ══ */}
        <SectionDivider icon={Server} label="Шаг 7: цепочка провайдеров — FallbackLlmClient" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          В системе три LLM-провайдера, подключённых в цепочку. Если первый упал — автоматически
          используется следующий. Это реализует класс <code style={{ fontSize: 13, background: "#f0f0ff", padding: "1px 5px", borderRadius: 4, color: "#4f46e5" }}>FallbackLlmClient</code>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <ProviderBadge name="DeepSeek" color="#4f46e5" note="Основной · deepseek-chat / deepseek-v4-flash" />
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ArrowRight size={16} color="#9ca3af" style={{ transform: "rotate(90deg)" }} />
              </div>
              <ProviderBadge name="Cloudflare Workers AI" color="#f59e0b" note="Запасной · @cf/meta/llama-3.1-8b-instruct" />
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ArrowRight size={16} color="#9ca3af" style={{ transform: "rotate(90deg)" }} />
              </div>
              <ProviderBadge name="OpenRouter" color="#059669" note="Последний резерв · deepseek/deepseek-chat-v3" />
            </div>
            <InsightBox title="Важно: DeepSeek убрал API эмбеддингов">
              Модель <code style={{ fontSize: 11 }}>deepseek-embed</code> была удалена.
              Для векторизации сначала пробуется локальная модель{" "}
              <code style={{ fontSize: 11 }}>Xenova/multilingual-e5-small</code> (без сети, 384-dim),
              затем OpenRouter, затем Cloudflare.
            </InsightBox>
          </Card>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Механизм fallback</p>
            <CodeBlock label="FallbackLlmClient.generateText()">
{`async generateText(input) {
  const errors: string[] = [];

  // Перебираем провайдеров по очереди
  for (const client of this.clients) {
    try {
      // Пробуем текущего — если ок, возвращаем
      return await client.generateText(input);
    } catch (error) {
      // Записываем ошибку, пробуем следующего
      errors.push(error.message);
    }
  }

  // Все провайдеры упали
  throw new Error(
    \`All LLM providers failed. \${errors.join(" | ")}\`
  );
}`}
            </CodeBlock>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              {[
                { label: "DeepSeek URL", value: "api.deepseek.com/v1/chat/completions" },
                { label: "Cloudflare URL", value: "api.cloudflare.com/.../{model}" },
                { label: "OpenRouter URL", value: "openrouter.ai/api/v1/chat/completions" },
                { label: "Все используют", value: "OpenAI-совместимый формат" },
              ].map(item => (
                <div key={item.label} style={{ padding: "8px 10px", background: "#f8f9ff", borderRadius: 8, border: "1px solid #e8eaf6" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>{item.label}</p>
                  <code style={{ fontSize: 10, color: "#4f46e5" }}>{item.value}</code>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ══ SECTION 10: Итоговый ответ ══ */}
        <SectionDivider icon={GitBranch} label="Шаг 8: итоговый ответ клиенту" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          После получения текста от LLM сервер параллельно запускает несколько фоновых задач
          (fire-and-forget) и возвращает клиенту структурированный JSON с ответом, ролью, цитатами и метаданными.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 12px" }}>Фоновые задачи (fire-and-forget)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: Activity, label: "rag_metrics", desc: "precision@k, latency, chunk_ids, routed_by, rag_budget_chars" },
                { icon: BookOpen, label: "learning_activities", desc: "userId, pageContext, userQuery, aiResponse, selectedRole + embedding" },
                { icon: CheckCircle2, label: "BKT обновление", desc: "updateMastery() — только если SANDBOX/CHALLENGER и correct != null" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#f8f9ff", borderRadius: 10, border: "1px solid #e8eaf6" }}>
                  <item.icon size={14} color="#4f46e5" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#0f0f1a", margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <InsightBox title="Определение correct для BKT">
              Если роль SANDBOX или CHALLENGER, система ищет в тексте ответа слова «неверн», «ошибк», «не правильн».
              Если нет — <code style={{ fontSize: 11 }}>correct = true</code> и grasp пользователя растёт в графе знаний.
            </InsightBox>
          </Card>
          <Card>
            <JsonBlock label="Итоговый JSON-ответ клиенту">
{`{
  "role": "LECTURER",
  "usedFallback": false,
  "routedBy": "quick_router",
  "orchestratorRaw": "{\"quick_route\":\"LECTURER\"}",
  "answer": "**Контекстный мост**\\nВы уже...",
  "correct": null,
  "userId": "user-uuid-123",
  "requestId": "req-uuid-456",
  "rag": {
    "sourcesUsed": [
      {
        "source_id": "kostrikin-la",
        "source_title": "Кострикин — Линейная алгебра",
        "chunk_id": "kos-la-001",
        "score": 0.87,
        "page_hint": "стр. 142"
      }
    ],
    "citations": [
      {
        "source_title": "Кострикин...",
        "page_hint": "стр. 142",
        "chunk_id": "kos-la-001",
        "score": 0.87
      }
    ],
    "approvedSources": [...],
    "meta": {
      "mmrUsed": true,
      "rerankerUsed": true,
      "latencyMs": 1240,
      "embeddingProvider": "local-e5-small"
    }
  }
}`}
            </JsonBlock>
          </Card>
        </div>

        {/* ══ SECTION 11: Архитектурные решения ══ */}
        <SectionDivider icon={ShieldCheck} label="Ключевые архитектурные решения" />

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {[
            {
              n: 1,
              title: "temperature = 0.2 — стабильность для учебного контента",
              desc: "Параметр случайности генерации. При 0.2 модель почти всегда выбирает наиболее вероятное следующее слово — точные и предсказуемые объяснения без «фантазий». Нельзя, чтобы LLM придумывал теоремы или менял формулы.",
              color: "#4f46e5",
            },
            {
              n: 2,
              title: "Два LLM-вызова: дешёвый роутер + дорогой ответ",
              desc: "Первый вызов (оркестратор) — маленький, только классифицирует роль. Второй — получает точный role-specific промпт. Quick Router экономит первый вызов ещё для 40–50% запросов, возвращая ноль LLM-вызовов для определения роли.",
              color: "#7c3aed",
            },
            {
              n: 3,
              title: "Статичный системный промпт → prefix cache hit",
              desc: "Системный промпт не содержит переменных (dynamic context → только в user message). Это делает его byte-identical между запросами — DeepSeek/OpenRouter кэшируют KV-state и не пересчитывают промпт заново, экономия до 90% на повторных запросах.",
              color: "#059669",
            },
            {
              n: 4,
              title: "Graceful degradation: RAG никогда не валит LLM",
              desc: "Любой сбой в RAG (нет embeddings, нет Supabase, упал RPC) приводит к пустому результату, а не к ошибке 502. LLM отвечает без контекста, но честно возвращает embeddingProvider: \"none\". Учебный процесс не прерывается.",
              color: "#d97706",
            },
            {
              n: 5,
              title: "Role-adaptive RAG budget: меньше — не всегда хуже",
              desc: "CHALLENGER получает всего 600 символов теории — оппоненту достаточно минимума. LECTURER получает 2400. Это не просто экономия: лишний контекст в MIRROR создал бы «помощь» вместо вопросов и ломал бы педагогическую цель роли.",
              color: "#0891b2",
            },
          ].map((item) => (
            <div key={item.n} style={{ display: "flex", gap: 16, background: "#fff", border: "1px solid #e8eaf6", borderRadius: 14, padding: "18px 20px" }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.n}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 4px" }}>{item.title}</p>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ SECTION 12: Предупреждения ══ */}
        <SectionDivider icon={AlertTriangle} label="Известные ограничения" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
          {[
            {
              title: "DeepSeek убрал API эмбеддингов",
              desc: "Модель deepseek-embed была удалена. Сервер корректно обходит это через цепочку: local → OpenRouter → Cloudflare. Но если все три недоступны — RAG не работает.",
              bg: "#fef2f2", border: "#fecaca", icon: AlertTriangle, color: "#dc2626",
            },
            {
              title: "correct-эвристика грубая",
              desc: "BKT обновляется по наличию слов «неверн/ошибк» в тексте. Модель может написать «это верно, не ошибка» — и BKT обновится неправильно. Нужна структурированная оценка.",
              bg: "#fffbeb", border: "#fde68a", icon: AlertTriangle, color: "#d97706",
            },
            {
              title: "Long-context failure в RAG",
              desc: "Информация в середине большого документа часто теряется (lost in the middle). MMR + reranker частично помогают, но 100% решения нет.",
              bg: "#f0f9ff", border: "#bae6fd", icon: AlertTriangle, color: "#0284c7",
            },
            {
              title: "Rate limiter — 60 запросов/минуту на IP",
              desc: "В-памяти Map-счётчик, не персистентный. При перезапуске сервера лимиты сбрасываются. Для production нужен Redis-счётчик.",
              bg: "#f0fdf4", border: "#bbf7d0", icon: AlertTriangle, color: "#059669",
            },
          ].map((card) => (
            <div key={card.title} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <card.icon size={16} color={card.color} />
                <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{card.title}</p>
              </div>
              <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ══ SUMMARY BANNER ══ */}
        <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", borderRadius: 20, padding: "32px 36px", marginBottom: 56, position: "relative", overflow: "hidden" }}>
          <BrainCircuit size={120} color="#4f46e5" opacity={0.2} style={{ position: "absolute", top: -20, right: -20 }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px", color: "#fff" }}>Итоговая схема</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 640, margin: "0 0 20px" }}>
            Один вопрос студента → 2 RAG-запроса (embeddings + reranker) → 1 запрос к KG →
            0–2 LLM-вызова → 3 fire-and-forget задачи → JSON-ответ с цитатами.
            Всё это занимает ~800–2000ms при первом запросе и ~400–800ms с кэшем промпта.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { icon: Zap, label: "Quick router → 0 LLM для роли" },
              { icon: Database, label: "RAG из учебников" },
              { icon: Network, label: "KG + BKT персонализация" },
              { icon: Server, label: "Fallback цепочка провайдеров" },
            ].map((b) => (
              <span key={b.label} style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", padding: "6px 12px", borderRadius: 8 }}>
                <b.icon size={14} /> {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e8eaf6", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 4px" }}>MindFlow · Engineering Intelligence</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>© 2026 MindFlow Digital. Технический отчёт по LLM-архитектуре.</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Апрель 2026", "llmEndpoint.ts", "ragBoundary.ts"].map((tag) => (
              <span key={tag} style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, background: "#f0f0f8", padding: "4px 10px", borderRadius: 6 }}>{tag}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
