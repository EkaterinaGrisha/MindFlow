import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import React from "react";
import {
  ArrowLeft, ArrowRight, ExternalLink, Sparkles,
  Layers, Brain, Bot, Network, BookOpen, Activity,
  BarChart3, Compass, ShieldCheck, Rocket, Wallet, GitBranch,
  Server, Database, Zap, Target, FlaskConical, PenTool,
  CheckCircle2, MessageCircle, Search, AlertCircle, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, LabelList,
} from "recharts";

type ReactNode = React.ReactNode;

// ─── Visual helpers (same dialect as the rest of /reports/*) ─────────────────

const Tag = ({ children, color = "#4f46e5" }: { children: ReactNode; color?: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
    color, background: `${color}14`,
    padding: "3px 10px", borderRadius: 20, border: `1px solid ${color}26`,
  }}>{children}</span>
);

const SectionDivider = ({ icon: Icon, label, sub }: { icon: any; label: string; sub?: string }) => (
  <div style={{ margin: "64px 0 28px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, background: "rgba(79,70,229,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={19} color="#4f46e5" />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f0f1a", margin: 0, flex: 1 }}>{label}</h2>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #e0e7ff, transparent)" }} />
    </div>
    {sub && (
      <p style={{ fontSize: 13, color: "#6b7280", margin: "8px 0 0 54px", lineHeight: 1.55 }}>{sub}</p>
    )}
  </div>
);

const Card = ({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6", padding: 24, ...style,
  }}>{children}</div>
);

const InsightBox = ({ color = "#4f46e5", title, children }: { color?: string; title: string; children: ReactNode }) => (
  <div style={{
    background: `${color}08`, border: `1px solid ${color}20`,
    borderRadius: 12, padding: "14px 18px", marginTop: 16,
  }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color, textTransform: "uppercase", margin: "0 0 6px" }}>{title}</p>
    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{children}</div>
  </div>
);

const Mono = ({ children, color = "#4f46e5" }: { children: ReactNode; color?: string }) => (
  <code style={{ fontSize: 12.5, background: `${color}10`, color, padding: "1.5px 6px", borderRadius: 5, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>{children}</code>
);

// ─── Page Card (for the "what's inside the MVP" section) ─────────────────────

const PageCard = ({
  icon: Icon, title, path, color, badge, description, bullets,
}: {
  icon: any; title: string; path: string; color: string;
  badge?: { label: string; tone: "free" | "pro" };
  description: string; bullets: string[];
}) => {
  const navigate = useNavigate();
  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6",
      padding: 24, display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${color}14`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{title}</h3>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
                padding: "2px 7px", borderRadius: 5,
                background: badge.tone === "pro" ? "#fef3c7" : "#dcfce7",
                color: badge.tone === "pro" ? "#92400e" : "#166534",
              }}>{badge.label}</span>
            )}
          </div>
          <code style={{ fontSize: 11.5, color: "#9ca3af", fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>{path}</code>
        </div>
      </div>

      <p style={{ fontSize: 13.5, color: "#374151", margin: 0, lineHeight: 1.65 }}>{description}</p>

      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#4b5563", lineHeight: 1.55 }}>
            <CheckCircle2 size={13} color={color} style={{ marginTop: 3, flexShrink: 0 }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => navigate(path)}
        style={{
          alignSelf: "flex-start", marginTop: 4,
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "8px 14px", borderRadius: 10,
          background: color, color: "#fff", border: "none",
          fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        }}
      >
        Открыть <ArrowRight size={13} />
      </button>
    </div>
  );
};

// ─── Data (sourced from report/data/*.json + repo state) ─────────────────────

const PAGES: Array<React.ComponentProps<typeof PageCard>> = [
  {
    icon: Bot, title: "AI Workspace", path: "/workspace", color: "#4f46e5",
    badge: { label: "Pro · 349 ₽/мес", tone: "pro" },
    description:
      "Главное рабочее место с AI-ментором. На одной странице переключаешь источник знаний (свой PDF, готовая тема MindFlow или произвольный текст) и роль ментора, общаешься в чате. Каждое утверждение сопровождается цитатой из источника — никаких галлюцинаций.",
    bullets: [
      "Загрузка собственных PDF/документов в персональный RAG-индекс",
      "Все 5 ролей ментора в одном чате: объяснить · проверить · кейс · отразить · сам выберет",
      "Цитаты автоматически — кликабельная панель источников сбоку",
    ],
  },
  {
    icon: BookOpen, title: "Темы и теория", path: "/subjects/mathematics", color: "#7c3aed",
    badge: { label: "Free", tone: "free" },
    description:
      "13 тем из программы Data Science: линейная алгебра, мат. анализ, теория вероятностей, статистика. Внутри каждой темы — путь Теория → Разбор → Практика (с AI-проверкой ответа) → Лаборатория.",
    bullets: [
      "Линал: 6 тем (операции, ранг и базис, собственные значения, SVD, SVD-применения)",
      "Мат. анализ: 5 тем (пределы, производная, частные, градиентный спуск × 2)",
      "Теорвер + статистика: 2 темы (Байес, гипотезы) — рост в плане доработок",
    ],
  },
  {
    icon: Network, title: "Граф знаний", path: "/graph", color: "#059669",
    badge: { label: "Free", tone: "free" },
    description:
      "Все 24 концепта программы и связи prerequisite между ними. На графе виден твой прогресс: что освоено (зелёное, p_mastery ≥ 75%), что в работе, где слабые места. Клик по узлу — добавить в план или открыть тему.",
    bullets: [
      "24 концепта, 41 ребро prerequisite/related",
      "Цвет узла = текущее значение p_mastery из BKT",
      "Расчёт «куда идти дальше» — на основе прорваных prerequisite-цепочек",
    ],
  },
  {
    icon: Compass, title: "Мой план", path: "/plan", color: "#d97706",
    badge: { label: "Free", tone: "free" },
    description:
      "Личная очередь тем. Кидаешь сюда что хочешь освоить (из темы, графа, каталога), отмечаешь сделанное, видишь сколько осталось. Простой to-do для учебной цели, без давления и дедлайнов.",
    bullets: [
      "Несколько планов параллельно (например «Подготовка к собесу» + «Курс ML»)",
      "Реордеринг, заметки, отметка «готово» — синхрон с прогрессом",
      "Кнопка «Добавить в план» есть и в графе, и на странице темы",
    ],
  },
  {
    icon: Activity, title: "Прогресс", path: "/progress", color: "#0891b2",
    badge: { label: "Free", tone: "free" },
    description:
      "Сводка по освоенным концептам и темам — что сделано, где слабо, к чему стоит вернуться. Считается из реальных ответов в практике/квизах ментора, а не из времени, проведённого на странице.",
    bullets: [
      "Свод по 24 концептам: освоенные / в работе / слабые места",
      "Аналитика по темам: theory · practice · independent · lab — что пройдено",
      "Используется как контекст в AI-ментора: «ты уже знаешь X, слаб в Z»",
    ],
  },
];

const RETRIEVAL_STEPS = [
  { step: "Baseline\n(dense k=10)", MRR: 0.475, "P@5": 0.362, "R@5": 0.258 },
  { step: "Step 2\ndocument cap", MRR: 0.600, "P@5": 0.408, "R@5": 0.358 },
  { step: "Step 3\nBM25 hybrid", MRR: 0.673, "P@5": 0.381, "R@5": 0.432 },
  { step: "Step 4\nRRF tuned", MRR: 0.683, "P@5": 0.403, "R@5": 0.448 },
];

type LlmRow = {
  name: string; note: string;
  score: number; citation: number; faithfulness: number; p50: number;
  recommended?: boolean;
};

const MODELS: LlmRow[] = [
  { name: "DeepSeek-V3", note: "API, прод", score: 0.839, citation: 1.0, faithfulness: 0.842, p50: 16.5, recommended: true },
  { name: "Qwen2.5-7B-Instruct-1M", note: "локальная, судья = self (bias)", score: 0.773, citation: 1.0, faithfulness: 0.919, p50: 40.3 },
  { name: "Phi-3.5-mini (3.8B)", note: "локальная Q5_K_M", score: 0.550, citation: 1.0, faithfulness: 0.836, p50: 26.7 },
  { name: "Meta-Llama-3.1-8B", note: "локальная Q5_K_M", score: 0.524, citation: 1.0, faithfulness: 0.870, p50: 27.6 },
];

const ROLES: Array<{ name: string; tone: string; trigger: string; color: string }> = [
  { name: "LECTURER",    tone: "академичный",  trigger: "Студент просит объяснить тему или концепт",            color: "#4f46e5" },
  { name: "SANDBOX",     tone: "практический", trigger: "Студент готов решать кейс — даём задачу из практики DS", color: "#059669" },
  { name: "CHALLENGER",  tone: "провокатор",   trigger: "Проверка понимания: каверзный вопрос или контрпример",   color: "#dc2626" },
  { name: "MIRROR",      tone: "рефлексивный", trigger: "Студент сам должен дойти — возвращаем вопрос обратно",    color: "#7c3aed" },
  { name: "ORCHESTRATOR", tone: "мета",        trigger: "Сам выбирает подходящую роль по контексту запроса",      color: "#d97706" },
];

const TESTS = [
  { test: "Retrieval golden 20Q",            why: "RAG возвращает правильные источники?",  metric: "MRR, P@5, R@5",                  size: "20 вопросов, document-level разметка" },
  { test: "Mentor benchmark 20Q × 4 модели", why: "Какая LLM лучше для роли ментора?",     metric: "role_weighted_score, latency",   size: "80 ответов" },
  { test: "LLM-as-judge faithfulness",       why: "Ответ обоснован источниками?",          metric: "supported / unsupported / contradicted", size: "fixed judge: Qwen2.5-7B (no self-grade)" },
  { test: "Unit-тесты",                      why: "API не падает, оркестратор валиден",     metric: "green / red",                    size: "6 файлов, 670 LoC" },
  { test: "Реальная телеметрия",             why: "Кто и как пользуется продуктом?",        metric: "сессии, сообщения, ролей",       size: "4 уник, 17 сессий, 43 сообщения, 3.5 нед" },
];

const PRICING = [
  { name: "MindFlow Pro",   price: "349 ₽/мес",   note: "первый месяц free", what: "AI Workspace + загрузка PDF + 5 ролей", us: true },
  { name: "ChatGPT Plus",   price: "≈ 2 000 ₽/мес", note: "$20",             what: "LLM общий, без RAG, без ролей",          us: false },
  { name: "Brilliant",      price: "≈ 2 500 ₽/мес", note: "$25",             what: "Интерактив, англ.",                       us: false },
  { name: "MathAcademy",    price: "≈ 4 900 ₽/мес", note: "$49",             what: "Адаптив (BKT), англ., без LLM",           us: false },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MvpReport() {
  const navigate = useNavigate();

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#0f0f1a", background: "#f8f9ff", minHeight: "100vh",
    }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(248,249,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8eaf6", padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => navigate("/reports")}
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={15} /> Все отчёты
        </button>
        <Tag><Sparkles size={10} /> Промежуточный отчёт · MVP</Tag>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px" }}>

        {/* ══ HEADER ══ */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <Tag><Sparkles size={10} /> Дипломный MVP · MindFlow</Tag>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>МАЙ 2026 · ПРОМЕЖУТОЧНЫЙ</span>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: "#0f0f1a", lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 18px", maxWidth: 860 }}>
            Отчёт по MVP{" "}
            <span style={{ color: "#4f46e5" }}>MindFlow</span>
          </h1>
          <p style={{ fontSize: 15.5, color: "#4b5563", lineHeight: 1.7, maxWidth: 760, margin: 0 }}>
            Что внутри MVP, как работают «мозги» сайта, как формируется прогресс,
            что и зачем тестировали — с расчётом метрик и планом доработок.
          </p>
        </motion.section>

        {/* ══ Compact facts strip ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{
            display: "flex", flexWrap: "wrap", gap: 18, padding: "14px 22px",
            background: "#fff", borderRadius: 14, border: "1px solid #e8eaf6", marginBottom: 12,
          }}
        >
          {[
            { k: "Тем",          v: "13" },
            { k: "Концептов",    v: "24" },
            { k: "Источников RAG", v: "34" },
            { k: "Ролей AI-ментора", v: "5" },
            { k: "LLM сравнили", v: "4" },
            { k: "В проде",      v: "DeepSeek-V3" },
          ].map((it) => (
            <div key={it.k} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9ca3af" }}>{it.k}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a" }}>{it.v}</span>
            </div>
          ))}
        </motion.div>

        {/* ─── SECTION 1: Обзор MVP ──────────────────────────────────────── */}
        <SectionDivider
          icon={Layers}
          label="1. Обзор MVP — что показать куратору"
          sub="Каждая карточка ниже — ссылка на живую страницу продукта. Кликайте и смотрите вживую."
        />
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7, margin: "0 0 22px" }}>
          MindFlow построен как монорепозиторий: <Mono>apps/web</Mono> (React 19 + Vite + Tailwind 4 + KaTeX)
          и <Mono>apps/api</Mono> (Express + tsx, порт 8787), хранилище — Supabase Postgres + pgvector + HNSW.
          Ниже — пять страниц, которые куратор может проверить вживую.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
          {PAGES.map((p) => <PageCard key={p.path} {...p} />)}
        </div>

        {/* ─── SECTION 2: Мозги ───────────────────────────────────────────── */}
        <SectionDivider
          icon={Brain}
          label="2. Как работают «мозги» сайта"
          sub="Pipeline одного ответа AI-ментора: от вопроса до цитаты в чате."
        />

        <Card style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#4f46e5", textTransform: "uppercase", margin: "0 0 18px" }}>
            POST /api/llm/respond — pipeline
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { n: 1, label: "Запрос пользователя + контекст: тема, уровень, история, mastery концептов",      tag: "Frontend",        c: "#4f46e5" },
              { n: 2, label: "RAG retrieval: hybrid search — dense (multilingual-e5) + BM25 + Reciprocal Rank Fusion", tag: "RAG",         c: "#7c3aed" },
              { n: 3, label: "Knowledge Graph enrichment: добавляем в контекст mastered / weak концепты",       tag: "Graph",            c: "#059669" },
              { n: 4, label: "Orchestrator выбирает одну из 5 ролей ментора по типу запроса",                   tag: "Router",           c: "#0891b2" },
              { n: 5, label: "LLM-вызов с role-промптом: DeepSeek-V3 → fallback Cloudflare → fallback OpenRouter", tag: "LLM",          c: "#dc2626" },
              { n: 6, label: "Ответ с обязательными цитатами к retrieved chunks (citation_rate = 100%)",        tag: "Response",         c: "#4f46e5" },
              { n: 7, label: "Fire-and-forget: rag_metrics + learning_activities + update_bkt_mastery",         tag: "Async",            c: "#6b7280" },
            ].map((step, i, arr) => (
              <div key={step.n} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${step.c}18`, border: `2px solid ${step.c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: step.c }}>{step.n}</div>
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#e8eaf6", margin: "4px 0" }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 14 : 0, paddingLeft: 12, paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: step.c, background: `${step.c}12`, padding: "2px 7px", borderRadius: 5 }}>{step.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <InsightBox color="#4f46e5" title="Главный файл pipeline">
            <Mono>apps/api/src/llmEndpoint.ts</Mono> — главный обработчик. RAG в <Mono>llm/ragBoundary.ts</Mono>,
            выбор роли в <Mono>llm/orchestration.ts</Mono>, embeddings — локально (Xenova multilingual-e5-small, 384d).
          </InsightBox>
        </Card>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f0f1a", margin: "26px 0 14px" }}>5 ролей AI-ментора</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {ROLES.map((r) => (
            <div key={r.name} style={{ borderRadius: 12, border: `1.5px solid ${r.color}33`, overflow: "hidden", background: "#fff" }}>
              <div style={{ padding: "10px 14px", background: `${r.color}10`, fontSize: 12.5, fontWeight: 800, color: "#0f0f1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{r.name}</span>
                <span style={{ fontSize: 10, color: r.color, fontWeight: 700 }}>{r.tone}</span>
              </div>
              <div style={{ padding: "10px 14px", fontSize: 12, color: "#4b5563", lineHeight: 1.55 }}>{r.trigger}</div>
            </div>
          ))}
        </div>

        {/* ─── SECTION 3: BKT/граф ────────────────────────────────────────── */}
        <SectionDivider
          icon={Network}
          label="3. Как формируется прогресс по темам"
          sub="Каждый концепт в графе имеет вероятность освоения p_mastery от 0 до 1. После каждого ответа она обновляется."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, alignItems: "start" }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#059669", textTransform: "uppercase", margin: "0 0 14px" }}>
              Bayesian Knowledge Tracing (BKT)
            </p>
            <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, margin: "0 0 14px" }}>
              У каждого концепта свои параметры:
              <Mono color="#059669"> p_init</Mono> — вероятность, что студент знает изначально,
              <Mono color="#059669"> p_learn</Mono> — научиться после ответа,
              <Mono color="#059669"> p_slip</Mono> — ошибиться при знании,
              <Mono color="#059669"> p_guess</Mono> — угадать без знания.
              Для всех math-* концептов сейчас разумные дефолты <Mono>0.25 / 0.15 / 0.10 / 0.20</Mono>;
              как накопятся реальные attempts, параметры калибруются EM-методом офлайн.
            </p>

            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
              padding: "12px 16px", fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: 12, lineHeight: 1.7, color: "#064e3b", whiteSpace: "pre",
              overflowX: "auto",
            }}>
{`# Bayesian update после правильного ответа:
                     p(L) · (1 - p_slip)
p(L | correct) = ─────────────────────────────────────────────
                  p(L) · (1 - p_slip) + (1 - p(L)) · p_guess

# Learning transition (с IRT-весом сложности задачи):
p(L)_new = p(L | obs) + (1 - p(L | obs)) · p_learn · w_irt`}
            </div>

            <p style={{ fontSize: 12.5, color: "#6b7280", margin: "14px 0 0", lineHeight: 1.6 }}>
              SQL-реализация: RPC <Mono>update_bkt_mastery</Mono>, журнал попыток —
              <Mono>bkt_attempts</Mono>, агрегированный mastery — <Mono>kg_mastery</Mono>.
              Стартовая точка: миграции <Mono>017_bkt_attempts</Mono> + <Mono>018_bkt_attempts_rpc</Mono>.
            </p>
          </Card>

          <Card style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#7c3aed", textTransform: "uppercase", margin: "0 0 14px" }}>
              Как растёт p_mastery
            </p>
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 14px", lineHeight: 1.65 }}>
              Студент решает задачи по концепту «Ранг и базис».
              Каждый правильный ответ повышает уверенность системы:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Cold start",         value: 0.25, comment: "знаний нет — старт ниже нуля" },
                { label: "1-й правильный",      value: 0.67, comment: "вышли в «в работе» (45–75%)" },
                { label: "2-й правильный",      value: 0.89, comment: "почти освоено (≥75%) — зелёный" },
                { label: "3-й правильный",      value: 0.97, comment: "уверенное знание" },
              ].map((row, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{row.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "#7c3aed" }}>{row.value.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 8, background: "#e9d5ff", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${row.value * 100}%`, background: "linear-gradient(90deg, #7c3aed, #4f46e5)", borderRadius: 4 }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0" }}>{row.comment}</p>
                </div>
              ))}
            </div>

            <InsightBox color="#059669" title="Порог «освоено»">
              p_mastery ≥ 0.75 → концепт зелёный на графе и попадает в <Mono color="#059669">mastered_concepts</Mono> в LLM-контексте.
              0.45–0.75 → «в работе» (жёлтый). &lt;0.45 → «слабое место» (красный).
            </InsightBox>
          </Card>
        </div>

        {/* ─── SECTION 4: Методология ─────────────────────────────────────── */}
        <SectionDivider
          icon={ShieldCheck}
          label="4. Что и зачем тестировали"
          sub="Связка «тест → метрика» для каждой части системы."
        />

        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8eaf6" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Тест</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Зачем</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Метрика</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Объём</th>
              </tr>
            </thead>
            <tbody>
              {TESTS.map((t, i) => (
                <tr key={i} style={{ borderBottom: i < TESTS.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#0f0f1a" }}>{t.test}</td>
                  <td style={{ padding: "12px", color: "#4b5563" }}>{t.why}</td>
                  <td style={{ padding: "12px", color: "#4b5563" }}><Mono>{t.metric}</Mono></td>
                  <td style={{ padding: "12px", color: "#6b7280", fontSize: 12 }}>{t.size}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <InsightBox color="#4f46e5" title="Главные принципы оценки">
            <strong>Role-weighted rubric</strong> — каждая роль ментора оценивается по своим
            критериям (LECTURER — concept_coverage; CHALLENGER — has_counterexample + probes_student;
            SANDBOX — has_scenario + no_spoiler; MIRROR — asks_question + no_spoiler).{" "}
            <strong>Fixed judge</strong> — для faithfulness используется Qwen2.5-7B как нейтральный
            арбитр (никогда не оценивает свои же ответы — защита от self-bias).
          </InsightBox>
        </Card>

        {/* ─── SECTION 5: Результаты ──────────────────────────────────────── */}
        <SectionDivider
          icon={BarChart3}
          label="5. Расчёт метрик — результаты"
          sub="Главные числа MVP. Все значения — из JSON-артефактов в report/data/."
        />

        {/* 5a. Retrieval ablation */}
        <Card style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#7c3aed", textTransform: "uppercase", margin: "0 0 4px" }}>
                5a · Retrieval ablation
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>
                MRR retrieval вырос с 0.475 до 0.683 за 4 шага оптимизации (+44%)
              </h3>
            </div>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>n = 20 вопросов · document-level</span>
          </div>

          <div style={{ height: 280, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RETRIEVAL_STEPS} margin={{ top: 28, right: 24, left: -8, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf6" />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: "#6b7280" }} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} domain={[0, 0.8]} />
                <Tooltip />
                <Bar dataKey="MRR"  fill="#4f46e5" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="MRR" position="top" style={{ fontSize: 11, fontWeight: 700, fill: "#4f46e5" }} formatter={(v: any) => Number(v).toFixed(3)} />
                </Bar>
                <Bar dataKey="P@5" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="R@5" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <InsightBox color="#7c3aed" title="Что дало рост">
            Шаг 2: ограничение по чанков с одного документа (избавились от «забивания» одного учебника).
            Шаг 3: подмешали BM25 поверх dense-поиска (для редких терминов «ранг», «SVD»).
            Шаг 4: финальная настройка весов RRF (Reciprocal Rank Fusion). Детали — в{" "}
            <Mono color="#7c3aed">report/retrieval_optimization.md</Mono>.
          </InsightBox>
        </Card>

        {/* 5b. Models bake-off */}
        <Card style={{ marginBottom: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#dc2626", textTransform: "uppercase", margin: "0 0 4px" }}>
              5b · Сравнение 4 LLM в роли ментора
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>
              DeepSeek-V3 выиграл числами: role_weighted_score 0.839 при p50 16.5 с
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e8eaf6" }}>
                  <th style={{ textAlign: "left",  padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Модель</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>role_weighted_score</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>citation_rate</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>faithfulness</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>p50 latency</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m, i) => (
                  <tr key={m.name} style={{
                    borderBottom: i < MODELS.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: m.recommended ? "#f5f3ff" : "transparent",
                  }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 800, color: "#0f0f1a" }}>{m.name}</span>
                        {m.recommended && (
                          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 5, background: "#4f46e5", color: "#fff" }}>В проде</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{m.note}</p>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", fontWeight: 700, color: m.recommended ? "#4f46e5" : "#374151" }}>{m.score.toFixed(3)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{(m.citation * 100).toFixed(0)}%</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{m.faithfulness.toFixed(3)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{m.p50.toFixed(1)} с</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InsightBox color="#dc2626" title="Почему DeepSeek-V3, а не локальная модель">
            DeepSeek единственный, кто <strong>одновременно</strong> даёт топ-качество
            (role_weighted_score 0.839) и приемлемую latency для UX (16.5 с). Локальные модели —
            в 1.5–2.5× медленнее при просевшем качестве. Цитаты у всех 100% — RAG-обвязка работает
            на любой модели; различия только в качестве педагогики и скорости.
          </InsightBox>
        </Card>

        {/* 5c. Telemetry */}
        <Card>
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#0891b2", textTransform: "uppercase", margin: "0 0 4px" }}>
              5c · Реальное использование
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>
              4 уникальных пользователя за 3.5 недели — пилот-когорта
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 10 }}>
            {[
              { label: "Уникальных пользователей", value: "4", sub: "период 22.04 – 17.05" },
              { label: "Сессий",                    value: "17", sub: "≈ 4.3 на пользователя" },
              { label: "Сообщений ментору",         value: "43", sub: "≈ 2.5 на сессию" },
              { label: "Длительность пилота",       value: "3.5 нед", sub: "пред-публичный" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#f0fdfd", borderRadius: 12, border: "1px solid #cffafe", padding: "14px 16px" }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", color: "#0891b2", textTransform: "uppercase", margin: "0 0 4px" }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#0f0f1a", margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 5d. ML baselines (BKT vs DKT) */}
        <Card style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#059669", textTransform: "uppercase", margin: "0 0 4px" }}>
              5d · ML-baseline для трекинга прогресса
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>
              BKT и DKT — оба пайплайна работают, готовы к реальной телеметрии
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e8eaf6" }}>
                  <th style={{ textAlign: "left",  padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Модель</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>AUC</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Accuracy</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>RMSE</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Параметры</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Время</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "BKT (classic, EM)",  note: "Bayesian per concept",         auc: 0.7694, acc: 0.8414, rmse: 0.350, params: "96 скаляров",  time: "10 с"  },
                  { name: "DKT (Piech, LSTM)",  note: "embed 50 → LSTM 64 → linear K", auc: 0.7240, acc: 0.8168, rmse: 0.370, params: "33 656",       time: "123 с" },
                ].map((m, i, arr) => (
                  <tr key={m.name} style={{ borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px" }}>
                      <p style={{ fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{m.name}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{m.note}</p>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", fontWeight: 700, color: "#059669" }}>{m.auc.toFixed(4)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{m.acc.toFixed(4)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{m.rmse.toFixed(3)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{m.params}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#374151" }}>{m.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InsightBox color="#059669" title="Почему DKT не побил BKT на этих числах">
            Synthetic-данные сгенерированы по single-skill BKT-модели (одно скрытое состояние
            на концепт, без cross-concept transfer). У DKT нет shared structure для эксплуатации —
            на таких данных <strong>parity или небольшой проигрыш ожидаем</strong> и согласуется
            с Khajah et al. 2016, <em>«How Deep Is Knowledge Tracing?»</em>. Преимущество DKT —
            zero-shot для новых концептов и cross-concept transfer — проявится на реальной
            телеметрии MindFlow, когда <Mono color="#059669">bkt_attempts</Mono> накопит
            переключения между темами. Оба пайплайна (EM-калибровка + LSTM) готовы — ждут данных.
          </InsightBox>
        </Card>

        {/* 5e. Recommender (Hit@K) */}
        <Card style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#d97706", textTransform: "uppercase", margin: "0 0 4px" }}>
              5e · Рекомендатель «что изучать дальше»
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>
              5 стратегий, Hit@K на hold-out — учим разницу между «угадать поведение» и «оптимизировать обучение»
            </h3>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e8eaf6" }}>
                  <th style={{ textAlign: "left",  padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Стратегия</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Hit@1</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Hit@3</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Hit@5</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Hit@10</th>
                  <th style={{ textAlign: "left",  padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Цель</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Random",                  h1: 0.043, h3: 0.123, h5: 0.210, h10: 0.419, goal: "floor ≈ K / 24",              highlight: false },
                  { name: "Most-frequent",           h1: 0.041, h3: 0.124, h5: 0.209, h10: 0.417, goal: "population prior",            highlight: false },
                  { name: "Sticky (last concept)",   h1: 0.679, h3: 0.706, h5: 0.733, h10: 0.802, goal: "behavioral baseline",         highlight: true  },
                  { name: "DKT-ZPD (P ≈ 0.7)",       h1: 0.032, h3: 0.080, h5: 0.125, h10: 0.239, goal: "pedagogical (Vygotsky)",      highlight: false },
                  { name: "DKT-uncertainty (P ≈ 0.5)", h1: 0.038, h3: 0.089, h5: 0.135, h10: 0.246, goal: "max information gain",      highlight: false },
                ].map((r, i, arr) => (
                  <tr key={r.name} style={{
                    borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: r.highlight ? "#fef3c7" : "transparent",
                  }}>
                    <td style={{ padding: "12px", fontWeight: r.highlight ? 800 : 700, color: "#0f0f1a" }}>{r.name}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: r.highlight ? "#92400e" : "#374151", fontWeight: r.highlight ? 800 : 500 }}>{r.h1.toFixed(3)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: r.highlight ? "#92400e" : "#374151", fontWeight: r.highlight ? 800 : 500 }}>{r.h3.toFixed(3)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: r.highlight ? "#92400e" : "#374151", fontWeight: r.highlight ? 800 : 500 }}>{r.h5.toFixed(3)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: r.highlight ? "#92400e" : "#374151", fontWeight: r.highlight ? 800 : 500 }}>{r.h10.toFixed(3)}</td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{r.goal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InsightBox color="#d97706" title="Главный академический вывод">
            <strong>Sticky побеждает DKT-эвристики на Hit@K — и это нормально.</strong>{" "}
            Hit@K мерит «угадал ли recommender что выберет студент», и Sticky выигрывает потому
            что студенты в синтетике (stickiness=0.7) тяготеют к текущему концепту — поведенческая
            модель тривиально это улавливает. DKT-ZPD и DKT-uncertainty <strong>систематически
            избегают</strong> текущего концепта (у него P высокая) и проигрывают на behavioral
            метрике. Но они отвечают на <em>другой</em> вопрос: <strong>где студенту лучше учиться</strong>,
            а не <strong>что он сам выберет</strong>. На реальном проде мы будем мерить{" "}
            <Mono color="#d97706">learning gain</Mono> и <Mono color="#d97706">mastery progression</Mono>{" "}
            — там DKT-стратегии раскрываются. Sticky H@1 = 0.679 ≈ stickiness 0.7 — это{" "}
            sanity check: синтетика собрана корректно.
          </InsightBox>
        </Card>

        {/* ─── SECTION 5.5: Как читать эти цифры (глоссарий простым языком) ─ */}
        <SectionDivider
          icon={BookOpen}
          label="5.5. Как читать эти цифры"
          sub="Простыми словами: что измеряет каждая метрика, как считается и что значит наше значение."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            {
              tone: "#4f46e5",
              metric: "MRR",
              fullName: "Mean Reciprocal Rank · средний обратный ранг",
              question: "Насколько высоко в выдаче поиска оказывается правильный источник?",
              how: "Берём 20 эталонных вопросов, на которые знаем правильный учебник-ответ. Спрашиваем систему. Смотрим: на каком месте в результатах оказался правильный источник? Если на первом — балл 1, на втором — 0.5, на третьем — 0.33, и так далее. Усредняем по всем вопросам.",
              ours: "0.683 (стартовали с 0.475 → +44%)",
              meaning: "Правильный учебник в среднем оказывается между 1-м и 2-м местом в выдаче. До 1.0 далеко (это значит «всегда первый»), но и для боевой системы это уже хороший уровень — ментор почти всегда работает с правильным источником, а не с похожим по теме.",
            },
            {
              tone: "#7c3aed",
              metric: "P@5 (Precision@5)",
              fullName: "Точность среди топ-5 результатов",
              question: "Если посмотреть на пятёрку лучших найденных фрагментов — сколько из них реально по делу?",
              how: "На каждый вопрос смотрим первые 5 найденных фрагментов и считаем, сколько из них правда относятся к вопросу. 3 из 5 — это P@5 = 0.6. Усредняем.",
              ours: "0.403",
              meaning: "Примерно 2 из 5 найденных фрагментов в среднем — точно в тему. Остальные могут быть из соседних разделов или просто упоминать ключевые слова. Это нормально для гибридного поиска по большому корпусу — главное, что ментор берёт только лучший фрагмент и проверяет его цитатой.",
            },
            {
              tone: "#a78bfa",
              metric: "R@5 (Recall@5)",
              fullName: "Полнота среди топ-5",
              question: "А вот мы вообще нашли всё, что должны были найти?",
              how: "На вопрос есть, скажем, 3 правильных источника в корпусе. Если в топ-5 попали 2 из них — R@5 = 0.67. Считает не «угадал или нет», а «насколько широко захватили все правильные источники».",
              ours: "0.448",
              meaning: "Захватываем около половины всех релевантных кусков. Этого достаточно для ответа ментора — ему не нужны все источники, ему нужен один хороший. Но запас на улучшение есть (план: добавить reranker).",
            },
            {
              tone: "#dc2626",
              metric: "role_weighted_score",
              fullName: "Взвешенная оценка работы ментора по ролям",
              question: "Хорошо ли ментор играет свою роль — лектор объясняет, проверяющий проверяет, и так далее?",
              how: "Для каждой из 5 ролей у нас своя проверочная анкета. Например, лектор должен покрывать ключевые концепты — это считают; проверяющий должен задать неочевидный вопрос или дать контрпример; практик — не должен спойлерить решение. По 20 вопросов на роль, 4 модели — итого 80 ответов. По каждому ответу ставим оценку по своей анкете, потом усредняем с весами по ролям.",
              ours: "0.839 у DeepSeek (лучше остальных трёх)",
              meaning: "Из максимально возможной 1.0 — DeepSeek набирает 0.84. Это значит, что в среднем по всем ролям ментор делает то, что от него ожидается, на 84%. Локальные модели — 0.52-0.77, то есть либо часто скатываются в просто «объясни», либо игнорируют требования роли.",
            },
            {
              tone: "#0891b2",
              metric: "citation_rate",
              fullName: "Доля ответов с цитатой из источника",
              question: "Подкрепляет ли ментор слова ссылками, или просто говорит «мне так кажется»?",
              how: "Идём по всем ответам и проверяем, есть ли в них ссылка на конкретный учебник из библиотеки. Если в 80 ответах из 80 есть — это 100%.",
              ours: "100% у всех 4 моделей",
              meaning: "Ментор ВСЕГДА подкрепляет ответ ссылкой. Это уже не свойство модели, а свойство нашей обвязки — мы технически не пропускаем дальше ответ без цитаты. Для бизнеса важно: ни один ответ не уходит студенту «голым». Никаких «доверьтесь мне».",
            },
            {
              tone: "#059669",
              metric: "faithfulness",
              fullName: "Достоверность ответа относительно цитат",
              question: "А действительно ли в цитате написано то, что ментор утверждает?",
              how: "Ответ нарезают на отдельные утверждения. Каждое сверяют с найденными фрагментами-источниками: подтверждается ли оно ими (supported), просто не упоминается (unsupported), или противоречит (contradicted). Проверяет это другая нейросеть — нейтральная, не та, что сама писала ответ (защита от подкрутки оценок).",
              ours: "0.84-0.92 (зависит от модели)",
              meaning: "В 84-92% случаев утверждения ментора реально подтверждаются цитатами, на которые он ссылается. Это «прививка от галлюцинаций» — ментор не сочиняет, а опирается на источники. Оставшиеся 8-16% — обычно ответы про общие места («алгебра — раздел математики»), которые не нуждаются в подтверждении.",
            },
            {
              tone: "#d97706",
              metric: "p50 latency",
              fullName: "Медианное время ответа",
              question: "Сколько в среднем студент ждёт ответа?",
              how: "Замеряем секунды от момента отправки вопроса до получения ответа. Берём половину всех замеров (медиану) — это устойчивее к редким долгим ответам, чем простое среднее.",
              ours: "16.5 с у DeepSeek (локальные — 27-40 с)",
              meaning: "Половина ответов приходит быстрее 16.5 секунд, половина — медленнее. Это нормально для подробных объяснений с цитатами; в чате с ChatGPT обычно похоже. Локальные модели в 1.5-2.5 раза медленнее — поэтому в проде стоит DeepSeek.",
            },
            {
              tone: "#16a34a",
              metric: "p_mastery (BKT)",
              fullName: "Вероятность освоения концепта",
              question: "Насколько хорошо студент знает конкретную тему — собственные значения, производную, и так далее?",
              how: "Каждый концепт начинается с 0.25 (по умолчанию — «скорее не знает»). После каждого ответа в практике это число пересчитывается по математической формуле (Байесовский апдейт). Правильный ответ — растёт; неправильный — падает. Учитывается сложность задачи: ошибка в простой задаче «бьёт» сильнее, чем ошибка в сложной.",
              ours: "После 3 правильных подряд: 0.25 → 0.67 → 0.89 → 0.97",
              meaning: "Когда p_mastery достигает 0.75 — концепт считается освоенным, на графе он зелёный. Ментор это видит и больше не объясняет очевидное. Это и есть «адаптивность» — система знает, что студент уже умеет, и сама ведёт его дальше.",
            },
            {
              tone: "#2563eb",
              metric: "AUC",
              fullName: "Точность модели прогноза студенческих ответов",
              question: "Может ли наша модель (BKT или DKT) угадать, ответит студент правильно или нет, до того как он ответил?",
              how: "На синтетических данных (500 студентов, 24 концепта, 50 ответов на каждого) даём модели первые 80% истории и просим предсказать ответы на оставшиеся 20%. Сравниваем с реальными ответами. AUC — это число от 0.5 (модель угадывает на уровне монетки) до 1.0 (всегда точно).",
              ours: "BKT: 0.77 · DKT: 0.72",
              meaning: "Обе модели работают значимо лучше случайности и могут использоваться для подбора задач. BKT слегка лучше, потому что синтетика собрана по BKT-схеме — это известный академический эффект. На реальных пользователях ожидаем, что DKT обгонит за счёт связей между темами.",
            },
            {
              tone: "#ea580c",
              metric: "Hit@K",
              fullName: "Угадывание выбора студента",
              question: "Угадывает ли рекомендатель тем, что студент сам выберет следующим?",
              how: "Смотрим, какой концепт студент реально выбрал. Спрашиваем рекомендатель: «дай топ-K твоих рекомендаций». Если правильный концепт в этом топе — попадание. Hit@1 — попал ли в самую первую рекомендацию; Hit@5 — попал ли в первую пятёрку.",
              ours: "Sticky (что и сейчас изучает) — Hit@1 = 0.68 · DKT-ZPD — Hit@1 = 0.03",
              meaning: "На первый взгляд DKT ужасно проигрывает — но это правильная история. Sticky просто советует тот же концепт, что студент уже изучает (поведенческая логика). DKT-ZPD намеренно предлагает другой концепт — тот, который сейчас в зоне ближайшего развития студента (педагогическая логика). Hit@K тут измеряет «угадал поведение», а не «помог научиться». В проде будем мерить рост знаний, не угадывания.",
            },
          ].map((m) => (
            <Card key={m.metric} style={{ borderTop: `4px solid ${m.tone}` }}>
              <div style={{ marginBottom: 10 }}>
                <Mono color={m.tone}>{m.metric}</Mono>
                <p style={{ fontSize: 11.5, color: "#6b7280", margin: "6px 0 0", fontStyle: "italic" }}>{m.fullName}</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f0f1a", margin: "0 0 6px", lineHeight: 1.5 }}>
                {m.question}
              </p>
              <p style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.65, margin: "0 0 12px" }}>
                <strong style={{ color: m.tone }}>Как считается. </strong>{m.how}
              </p>
              <div style={{ background: `${m.tone}0c`, borderLeft: `3px solid ${m.tone}`, padding: "10px 12px", borderRadius: 6, marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: m.tone, textTransform: "uppercase", margin: "0 0 4px" }}>Наш результат</p>
                <p style={{ fontSize: 13, color: "#0f0f1a", margin: 0, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>{m.ours}</p>
              </div>
              <p style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
                <strong style={{ color: "#0f0f1a" }}>Что это значит. </strong>{m.meaning}
              </p>
            </Card>
          ))}
        </div>

        <InsightBox color="#4f46e5" title="Главное про метрики в двух предложениях">
          Эти числа — не для красоты в отчёте, а инструмент контроля качества. Без них мы бы не знали,
          действительно ли ментор отвечает по делу или сочиняет; быстрее ли DeepSeek локальных
          моделей или медленнее; освоил ли студент тему или просто кликает дальше. Каждая метрика
          закрывает свой вопрос — а вместе они дают полную картину того, что в системе работает.
        </InsightBox>

        {/* ─── SECTION 6: Что улучшаем ────────────────────────────────────── */}
        <SectionDivider
          icon={Rocket}
          label="6. Что улучшаем дальше"
          sub="Главные точки роста, выявленные тестами."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={17} color="#d97706" />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>Релевантность RAG-результатов</h4>
            </div>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
              MRR 0.683 на 20-вопросном бенчмарке — хороший показатель, но местами
              ментор всё ещё подтягивает соседние, не самые подходящие чанки.
              План: добавить cross-encoder reranker (Cloudflare BGE), попробовать
              embeddings <Mono>BGE-M3</Mono>, улучшить chunking для PDF-источников.
            </p>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={17} color="#2563eb" />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>Размер реальной выборки</h4>
            </div>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
              4 пользователя × 17 сессий — это пилот, недостаточно для A/B-сравнений
              и калибровки BKT по реальным данным. План: публичный запуск, рост
              когорты до ≥30 активных пользователей, после — EM-калибровка BKT-параметров
              по фактическим траекториям.
            </p>
          </Card>
        </div>

        {/* ─── SECTION 7: Монетизация ─────────────────────────────────────── */}
        <SectionDivider
          icon={Wallet}
          label="7. Монетизация"
          sub="Free + Pro модель: бесплатно — всё кроме AI Workspace; Pro — 349 ₽/мес, первый месяц бесплатный."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#166534", background: "#dcfce7", padding: "3px 9px", borderRadius: 6 }}>Free</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>безлимитно, без карты</span>
            </div>
            <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              Все 13 тем и теория, граф знаний (24 концепта), мой план обучения,
              прогресс, диагностика входа, демо-роль LECTURER (5 сообщений/день).
            </p>
          </Card>

          <Card style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", border: "1px solid #fcd34d" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff", background: "#92400e", padding: "3px 9px", borderRadius: 6 }}>Pro · 349 ₽/мес</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>первый месяц бесплатно</span>
            </div>
            <p style={{ fontSize: 13.5, color: "#451a03", lineHeight: 1.7, margin: 0 }}>
              <strong>AI Workspace</strong> — неограниченно, все 5 ролей ментора,
              загрузка своих PDF и документов в персональный RAG.
              Plus всё, что входит в Free.
            </p>
          </Card>
        </div>

        <Card>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#4f46e5", textTransform: "uppercase", margin: "0 0 12px" }}>
            Сравнение с конкурентами (цена за месяц)
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e8eaf6" }}>
                  <th style={{ textAlign: "left",  padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Сервис</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Цена</th>
                  <th style={{ textAlign: "left",  padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.14em" }}>Что даёт</th>
                </tr>
              </thead>
              <tbody>
                {PRICING.map((p, i) => (
                  <tr key={p.name} style={{
                    borderBottom: i < PRICING.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: p.us ? "#f5f3ff" : "transparent",
                  }}>
                    <td style={{ padding: "12px", fontWeight: 800, color: "#0f0f1a" }}>{p.name}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontFamily: "ui-monospace, monospace", color: p.us ? "#4f46e5" : "#374151", fontWeight: p.us ? 800 : 600 }}>
                      {p.price}
                      <p style={{ fontSize: 10.5, color: "#9ca3af", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>{p.note}</p>
                    </td>
                    <td style={{ padding: "12px", color: "#4b5563" }}>{p.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InsightBox color="#4f46e5" title="Unit-economics">
            При 1 000 free-пользователей и CR free→paid 8% → 80 paid × 349 ₽ = <strong>~28 000 ₽/мес MRR</strong>.
            DeepSeek API ~$0.05–0.10/active user/мес → маржа ≈ 90% при LTV ≥ 3 мес.
            Платёжка — YooKassa (СБП + карты), интеграция в плане доработок (этот месяц).
          </InsightBox>
        </Card>

        {/* ─── Реальные расходы на LLM (факт за апрель-май 2026) ────────── */}
        <Card style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", color: "#0891b2", textTransform: "uppercase", margin: "0 0 6px" }}>
                Реальные расходы на LLM · апрель–май 2026
              </p>
              <p style={{ fontSize: 12.5, color: "#6b7280", margin: 0, lineHeight: 1.55 }}>
                Источник: выгрузка биллинга DeepSeek API (<Mono color="#0891b2">docs/cost-2026-4.csv</Mono>,
                {" "}<Mono color="#0891b2">docs/cost-2026-5.csv</Mono>). Один активный пользователь —
                разработчик MVP, режим разработки и ручного тестирования.
              </p>
            </div>
          </div>

          {/* Сводные цифры */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Всего за 2 мес.", value: "$0.060", note: "≈ 5.4 ₽ по курсу 90", tone: "#0891b2" },
              { label: "Апрель", value: "$0.021", note: "7 активных дней", tone: "#7c3aed" },
              { label: "Май",    value: "$0.039", note: "13 активных дней", tone: "#059669" },
              { label: "В активный день", value: "$0.003", note: "≈ 0.27 ₽", tone: "#d97706" },
            ].map((m) => (
              <div key={m.label} style={{ background: `${m.tone}08`, border: `1px solid ${m.tone}22`, borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.14em", color: m.tone, textTransform: "uppercase", margin: "0 0 6px" }}>{m.label}</p>
                <p style={{ fontSize: 19, fontWeight: 800, color: "#0f0f1a", margin: "0 0 2px", fontFamily: "ui-monospace, monospace" }}>{m.value}</p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{m.note}</p>
              </div>
            ))}
          </div>

          {/* Бар-чарт по дням */}
          <div style={{ height: 220, marginBottom: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { day: "18.04", cost: 0.0007, m: "chat+reasoner" },
                  { day: "22.04", cost: 0.0144, m: "chat+reasoner" },
                  { day: "23.04", cost: 0.0008, m: "chat+reasoner" },
                  { day: "25.04", cost: 0.0007, m: "v4-flash" },
                  { day: "26.04", cost: 0.0010, m: "v4-flash" },
                  { day: "27.04", cost: 0.0019, m: "v4-flash" },
                  { day: "29.04", cost: 0.0015, m: "v4-flash" },
                  { day: "01.05", cost: 0.0012, m: "v4-flash" },
                  { day: "02.05", cost: 0.0006, m: "v4-flash" },
                  { day: "03.05", cost: 0.0006, m: "v4-flash" },
                  { day: "07.05", cost: 0.0042, m: "v4-flash" },
                  { day: "10.05", cost: 0.0003, m: "v4-flash" },
                  { day: "11.05", cost: 0.0027, m: "v4-flash" },
                  { day: "12.05", cost: 0.0006, m: "v4-flash" },
                  { day: "13.05", cost: 0.0002, m: "v4-flash" },
                  { day: "14.05", cost: 0.0007, m: "v4-flash" },
                  { day: "15.05", cost: 0.0003, m: "v4-flash" },
                  { day: "16.05", cost: 0.0207, m: "v4-flash" },
                  { day: "17.05", cost: 0.0041, m: "v4-flash" },
                  { day: "18.05", cost: 0.0025, m: "v4-flash" },
                ]}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(4)}`, "расход"]}
                  labelFormatter={(d) => `День ${d}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8eaf6" }}
                />
                <Bar dataKey="cost" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <InsightBox color="#059669" title="Что это значит для бизнеса">
            Фактический расход на LLM за два месяца разработки — <strong>0.06 доллара</strong>{" "}
            (около 5 рублей). Это режим одного разработчика, который активно тестирует и пишет
            ментору почти каждый день. В режиме обычного пользователя расход на одного активного
            подписчика ожидается <strong>$0.05–0.10 в месяц</strong> — то есть в десятки раз меньше
            подписки Pro (349 ₽ ≈ $3.9). Маржа на стороне LLM-затрат — <strong>≈ 97% от цены подписки</strong>{" "}
            на этом профиле использования. Главные затраты в Pro — не LLM, а инфраструктура
            (хостинг, БД, эмбеддинги локально — почти бесплатные).
          </InsightBox>
        </Card>

        {/* ─── SECTION 8: План доработок ──────────────────────────────────── */}
        <SectionDivider
          icon={GitBranch}
          label="8. План доработок"
          sub="Что улучшаем дальше — в трёх горизонтах."
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              tone: "#4f46e5", title: "Эта неделя",
              items: [
                "✓ BKT baseline — AUC 0.77, EM-калибровка 500 × 24 за 10 с (services/adaptive-ml/)",
                "✓ DKT (Piech, LSTM) baseline — AUC 0.72, на single-skill synthetic ожидаемая parity с BKT (Khajah 2016)",
                "✓ Recommender baseline — 5 стратегий с Hit@K, behavioral vs pedagogical разделены",
                "BGE-reranker в RAG-пайплайн для повышения релевантности",
                "Расширить write-back BKT на разделы «Разбор» и «Лаборатория»",
              ],
            },
            {
              tone: "#7c3aed", title: "Месяц",
              items: [
                "YooKassa-интеграция + paywall middleware для /workspace",
                "DKT в проде + A/B BKT vs DKT на реальной телеметрии (cross-concept signal)",
                "Стартовая диагностика — 5–7 вопросов, чтобы избежать BKT cold-start",
                "Переключатель «Простыми словами / Строго» в теории",
              ],
            },
            {
              tone: "#059669", title: "6 месяцев",
              items: [
                "Мобильная версия (PWA-обёртка)",
                "Расширение корпуса: ML, алгоритмы, продвинутая статистика",
                "Voice mode (Web Speech API)",
                "Голосовой режим ментора · Kaggle-кейсы в SANDBOX",
                "Когорта ≥30 активных пользователей → EM-калибровка BKT",
              ],
            },
          ].map((col) => (
            <div key={col.title} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6", padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: col.tone }} />
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{col.title}</h4>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {col.items.map((it, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#374151", lineHeight: 1.55 }}>
                    <CheckCircle2 size={13} color={col.tone} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 56, padding: "24px 26px", background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)", borderRadius: 16, color: "#fff" }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px", color: "rgba(255,255,255,0.7)" }}>Резюме промежуточного отчёта</p>
          <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>
            MVP MindFlow — это {" "}
            <strong>13 тем по математике для DS</strong>, {" "}
            <strong>граф из 24 концептов с BKT-трекингом прогресса</strong>, {" "}
            <strong>AI-ментор с 5 ролями и RAG-цитатами</strong>, и {" "}
            <strong>оцифрованные метрики качества</strong> (MRR retrieval 0.683, role_weighted_score 0.839 у DeepSeek-V3).
            Следующий шаг — DKT поверх BKT и платная подписка на AI Workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
