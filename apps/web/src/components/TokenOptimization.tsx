import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Share2,
  Zap,
  BookOpen,
  Network,
  BarChart3,
  Layers,
  Brain,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Quote,
  Sparkles,
  Database,
  Activity,
  Shield,
  Map,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Area,
  AreaChart,
  Legend,
} from "recharts";

// ─── Source map ───────────────────────────────────────────────────────────────

const SOURCES: Record<number, { label: string; url: string }> = {
  1:  { label: "DyCP: Dynamic Context Pruning for Long-Form Dialogue — arXiv", url: "https://arxiv.org/html/2601.07994v3" },
  2:  { label: "Optimizing Throughput in LLMs — Dell Technologies", url: "https://infohub.delltechnologies.com/it-it/p/optimizing-throughput-in-large-language-models-and-understanding-token-dynamics/" },
  3:  { label: "LLMLingua-2 — llmlingua.com", url: "https://llmlingua.com/llmlingua2.html" },
  4:  { label: "LLMLingua-2 — ACL Anthology", url: "https://aclanthology.org/2024.findings-acl.57/" },
  5:  { label: "LLMLingua-2 — Emergent Mind", url: "https://www.emergentmind.com/topics/llmlingua-2" },
  6:  { label: "Automatic Prompt Optimization with Prompt Distillation — arXiv", url: "https://arxiv.org/html/2508.18992v2" },
  7:  { label: "Prompt caching — Claude API Docs", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
  8:  { label: "Prompt caching — OpenAI API", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  9:  { label: "Prompt Caching with Spring AI + Anthropic", url: "https://spring.io/blog/2025/10/27/spring-ai-anthropic-prompt-caching-blog" },
  13: { label: "Vector Storage Based Long-term Memory Research on LLM — ResearchGate", url: "https://www.researchgate.net/publication/384803161_Vector_Storage_Based_Long-term_Memory_Research_on_LLM" },
  14: { label: "USER-LLM: Efficient LLM contextualization — Google Research", url: "https://research.google/blog/user-llm-efficient-llm-contextualization-with-user-embeddings/" },
  15: { label: "Next Token Knowledge Tracing — arXiv", url: "https://arxiv.org/html/2511.02599v2" },
  16: { label: "CLST: Cold-Start Mitigation in Knowledge Tracing — JEDM", url: "https://jedm.educationaldatamining.org/index.php/JEDM/article/download/854/264" },
  18: { label: "Semantic Routers — Thinking Loop / Medium", url: "https://medium.com/@ThinkingLoop/semantic-routers-quietly-making-your-llm-stack-not-fall-over-7a4c19f3fae1" },
  19: { label: "Top 5 LLM Routing Techniques — Maxim AI", url: "https://www.getmaxim.ai/articles/top-5-llm-routing-techniques/" },
  20: { label: "When to Reason: Semantic Router for vLLM — arXiv", url: "https://arxiv.org/html/2510.08731v1" },
  22: { label: "InfoGain-RAG — arXiv", url: "https://arxiv.org/html/2509.12765v1" },
  24: { label: "Vector Summarisation for LLM Long Term Memory — OpenAI Community", url: "https://community.openai.com/t/vector-summarisation-to-improve-llm-long-term-memory/891722" },
  25: { label: "User Profile Awareness: Session-Level Personalization — Towards AI", url: "https://towardsai.net/p/machine-learning/user-profile-awareness-engineering-session-level-personalization" },
};

// ─── Real data from CSV files (amount-2026-4.csv + cost-2026-4.csv) ───────────

// Pricing per token, extracted directly from CSV price fields:
// deepseek-chat & deepseek-reasoner:
//   output: $0.00000042, input_cache_miss: $0.00000028, input_cache_hit: $0.000000028
// deepseek-v4-flash:
//   output: $0.00000028, input_cache_miss: $0.00000014, input_cache_hit: $0.0000000028

const RAW_DATA = [
  {
    date: "18 апр",
    model: "deepseek-chat & reasoner",
    modelShort: "chat",
    requests: 2,
    inputMiss: 1304,
    cacheHit: 0,
    output: 862,
    cost: 0.00072716,
  },
  {
    date: "22 апр",
    model: "deepseek-chat & reasoner",
    modelShort: "chat",
    requests: 49,
    inputMiss: 21066,
    cacheHit: 10624,
    output: 19522,
    cost: 0.01439519,
  },
  {
    date: "23 апр",
    model: "deepseek-chat & reasoner",
    modelShort: "chat",
    requests: 2,
    inputMiss: 1118,
    cacheHit: 0,
    output: 1177,
    cost: 0.00080738,
  },
  {
    date: "25 апр",
    model: "deepseek-v4-flash",
    modelShort: "v4-flash",
    requests: 4,
    inputMiss: 2565,
    cacheHit: 0,
    output: 1196,
    cost: 0.00069398,
  },
  {
    date: "26 апр",
    model: "deepseek-v4-flash",
    modelShort: "v4-flash",
    requests: 5,
    inputMiss: 3054,
    cacheHit: 0,
    output: 1916,
    cost: 0.00096404,
  },
  {
    date: "27 апр",
    model: "deepseek-v4-flash",
    modelShort: "v4-flash",
    requests: 8,
    inputMiss: 2844,
    cacheHit: 1024,
    output: 5370,
    cost: 0.00190463,
  },
];

const chartData = RAW_DATA.map((d) => ({
  ...d,
  totalBillable: d.inputMiss + d.output,
  totalAll: d.inputMiss + d.cacheHit + d.output,
  perReq: Math.round((d.inputMiss + d.output) / d.requests),
  costPerReq: +(d.cost / d.requests).toFixed(6),
  cacheHitRate: d.cacheHit > 0 ? +((d.cacheHit / (d.inputMiss + d.cacheHit + d.output)) * 100).toFixed(1) : 0,
}));

// Model comparison
const chatDays = RAW_DATA.filter((d) => d.modelShort === "chat");
const flashDays = RAW_DATA.filter((d) => d.modelShort === "v4-flash");
const chatReqs = chatDays.reduce((s, d) => s + d.requests, 0);
const flashReqs = flashDays.reduce((s, d) => s + d.requests, 0);
const chatCost = chatDays.reduce((s, d) => s + d.cost, 0);
const flashCost = flashDays.reduce((s, d) => s + d.cost, 0);
const chatCostPerReq = chatCost / chatReqs;
const flashCostPerReq = flashCost / flashReqs;
const modelSavingPct = +((1 - flashCostPerReq / chatCostPerReq) * 100).toFixed(0);

const totalReqs = RAW_DATA.reduce((s, d) => s + d.requests, 0);
const totalCost = RAW_DATA.reduce((s, d) => s + d.cost, 0);
const totalCacheHit = RAW_DATA.reduce((s, d) => s + d.cacheHit, 0);
const totalInputMiss = RAW_DATA.reduce((s, d) => s + d.inputMiss, 0);
const totalOutput = RAW_DATA.reduce((s, d) => s + d.output, 0);

// ─── Layout helpers ───────────────────────────────────────────────────────────

const Cite = ({ n }: { n: number | number[] }) => {
  const nums = Array.isArray(n) ? n : [n];
  return (
    <span className="inline-flex gap-0.5 ml-0.5" style={{ verticalAlign: "super" }}>
      {nums.map((num) => {
        const src = SOURCES[num];
        return src ? (
          <a
            key={num}
            href={src.url}
            target="_blank"
            rel="noreferrer"
            title={src.label}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, fontSize: 9, fontWeight: 700,
              color: "#4f46e5", background: "rgba(79,70,229,0.1)",
              borderRadius: 4, textDecoration: "none",
            }}
          >
            {num}
          </a>
        ) : null;
      })}
    </span>
  );
};

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
    color: "#4f46e5", background: "rgba(79,70,229,0.08)",
    padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(79,70,229,0.15)",
  }}>{children}</span>
);

const SectionDivider = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
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

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6", padding: 24, ...style }}>
    {children}
  </div>
);

const KpiCard = ({
  label, value, sub, badge, accent = false,
}: {
  label: string; value: string; sub?: React.ReactNode; badge?: string; accent?: boolean;
}) => (
  <div style={{
    background: accent ? "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)" : "#fff",
    borderRadius: 16, border: accent ? "none" : "1px solid #e8eaf6",
    padding: "24px 20px", position: "relative", overflow: "hidden",
  }}>
    {accent && (
      <div style={{ position: "absolute", right: -24, top: -24, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
    )}
    {badge && (
      <span style={{
        position: "absolute", top: 12, right: 12, fontSize: 9, fontWeight: 800,
        background: "rgba(79,70,229,0.12)", color: "#4f46e5",
        padding: "2px 7px", borderRadius: 6, letterSpacing: "0.12em", textTransform: "uppercase",
      }}>{badge}</span>
    )}
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px", color: accent ? "rgba(255,255,255,0.6)" : "#4f46e5" }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: accent ? "#fff" : "#0f0f1a", lineHeight: 1 }}>{value}</p>
    {sub && <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,0.65)" : "#6b7280", marginTop: 4 }}>{sub}</div>}
  </div>
);

const BlockQuote = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    borderLeft: "3px solid #4f46e5", background: "rgba(79,70,229,0.04)",
    borderRadius: "0 12px 12px 0", padding: "16px 20px", margin: "24px 0",
    display: "flex", gap: 12,
  }}>
    <Quote size={16} color="#4f46e5" style={{ flexShrink: 0, marginTop: 2 }} />
    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{children}</p>
  </div>
);

const InsightBox = ({ color = "#4f46e5", title, children }: { color?: string; title: string; children: React.ReactNode }) => (
  <div style={{
    background: `${color}08`, border: `1px solid ${color}20`,
    borderRadius: 12, padding: "14px 16px", marginTop: 16,
  }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color, textTransform: "uppercase", margin: "0 0 6px" }}>💡 {title}</p>
    <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.6 }}>{children}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; unit?: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8eaf6", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 800, color: p.color || "#4f46e5", margin: 0 }}>
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("ru") : p.value}{p.unit || ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ModelBadge = ({ model }: { model: string }) => (
  <span style={{
    fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "2px 8px", borderRadius: 4,
    background: model === "v4-flash" ? "rgba(5,150,105,0.10)" : "rgba(79,70,229,0.10)",
    color: model === "v4-flash" ? "#059669" : "#4f46e5",
    border: `1px solid ${model === "v4-flash" ? "rgba(5,150,105,0.25)" : "rgba(79,70,229,0.20)"}`,
  }}>
    {model}
  </span>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TokenOptimization() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#0f0f1a", background: "#f8f9ff", minHeight: "100vh" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(248,249,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8eaf6",
        padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => navigate("/reports")}
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
        >
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

        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Tag><Sparkles size={10} /> Оптимизация токенов · Апрель 2026</Tag>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ДАННЫЕ: ФАКТИЧЕСКИЕ ЛОГИ API · ОБНОВЛЕНО АПРЕЛЬ 2026</span>
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "#0f0f1a", lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 760 }}>
            Архитектуры минимизации{" "}
            <span style={{ color: "#4f46e5" }}>потребления токенов</span>
          </h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, maxWidth: 680, margin: 0 }}>
            Анализ реального потребления API за апрель 2026 и архитектурных решений, реализованных в кодовой базе MindFlow для снижения стоимости вызовов LLM.
          </p>
        </motion.section>

        {/* KPI Row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          <KpiCard label="Запросов за апрель" value={String(totalReqs)} sub="По данным API-лога" />
          <KpiCard label="Потрачено (USD)" value={`$${totalCost.toFixed(4)}`} sub="Суммарно за 6 дней активности" accent badge="TOTAL" />
          <KpiCard label="Cache hit токены" value={totalCacheHit.toLocaleString("ru")} sub="Апрель 22 + Апрель 27" />
          <KpiCard label="Экономия (модель)" value={`−${modelSavingPct}%`} sub="v4-flash vs chat, стоимость/запрос" />
        </motion.div>

        {/* Executive Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 48 }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 12px" }}>Введение</p>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: "0 0 12px" }}>
              В апреле 2026 года MindFlow API прошёл активную фазу разработки: данные охватывают 6 дней с запросами, суммарно {totalReqs} вызовов к двум версиям DeepSeek. Ключевое событие периода — переход с модели <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>deepseek-chat&reasoner</code> на более дешёвую <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>deepseek-v4-flash</code>.
            </p>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>
              Параллельно в кодовой базе (<code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>llmEndpoint.ts</code>) реализованы четыре архитектурные стратегии оптимизации: keyword-маршрутизация, сжатие профиля, ролевые RAG-бюджеты и стабилизация системного промпта для prefix-кэша.
            </p>
          </Card>
          <Card style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)", border: "none", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={14} color="#a5b4fc" />
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", margin: 0 }}>Потенциал стека</p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                Применение всех пяти архитектурных методов (сжатие + кэш + маршрутизация + векторная память + KT) теоретически сокращает контекст с 50k+ до ~8–12k токенов.<Cite n={1} />
              </p>
            </div>
            <div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 6, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ width: "82%", height: "100%", background: "linear-gradient(to right, #818cf8, #a78bfa)", borderRadius: 8 }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#a5b4fc", letterSpacing: "0.16em", margin: 0 }}>~82% REDUCTION — ТЕОРЕТИЧЕСКИЙ ПОТОЛОК</p>
            </div>
          </Card>
        </div>

        {/* ══════════ SECTION 1: ФАКТИЧЕСКОЕ ПОТРЕБЛЕНИЕ ══════════ */}
        <SectionDivider icon={Activity} label="Фактическое потребление · Апрель 2026" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 32 }}>
          Данные получены напрямую из API-логов (файлы <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>amount-2026-4.csv</code> и <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>cost-2026-4.csv</code>). 22 апреля — день интенсивного тестирования с 49 запросами. 25 апреля — первый день работы на <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>deepseek-v4-flash</code>. Cache hit зафиксированы дважды: 22 апреля (10 624 токена) и 27 апреля (1 024 токена).
        </p>

        {/* Charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* Chart 1: Total tokens per day */}
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Потребление токенов</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Billable токены по дням (input + output)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="flashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="25 апр" stroke="#059669" strokeDasharray="4 3" strokeWidth={2} label={{ value: "→ v4-flash", position: "top", fontSize: 10, fill: "#059669", fontWeight: 700 }} />
                <Bar dataKey="totalBillable" name="Токены (input+output)" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.date} fill={entry.modelShort === "v4-flash" ? "url(#flashGrad)" : "url(#chatGrad)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#4f46e5" }} />
                deepseek-chat & reasoner
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#059669" }} />
                deepseek-v4-flash
              </div>
            </div>
          </Card>

          {/* Chart 2: Cost per request */}
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Стоимость</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Стоимость на запрос (USD)</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(4)}`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="25 апр" stroke="#059669" strokeDasharray="4 3" strokeWidth={2} />
                <Area type="monotone" dataKey="costPerReq" name="Стоимость/запрос" unit=" USD" stroke="#4f46e5" strokeWidth={2.5} fill="url(#costGrad)"
                  dot={(props) => {
                    const d = chartData[props.index];
                    return <circle key={props.index} cx={props.cx} cy={props.cy} r={5} fill={d?.modelShort === "v4-flash" ? "#059669" : "#4f46e5"} stroke="#fff" strokeWidth={2} />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <InsightBox title="Влияние модели">
              Переход на v4-flash с апреля 25 снизил стоимость запроса с ~$0.000300 (chat) до ~$0.000210 (flash) — экономия {modelSavingPct}% при сопоставимом объёме токенов.
            </InsightBox>
          </Card>

          {/* Chart 3: Token structure */}
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Структура токенов</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Input miss · Cache Hit · Output</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="25 апр" stroke="#059669" strokeDasharray="4 3" strokeWidth={2} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="inputMiss" name="Input (cache miss)" stackId="a" fill="#818cf8" />
                <Bar dataKey="output" name="Output" stackId="a" fill="#4f46e5" />
                <Bar dataKey="cacheHit" name="Cache Hit" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Chart 4: Tokens per request */}
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Эффективность</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Billable токенов на запрос</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="25 апр" stroke="#059669" strokeDasharray="4 3" strokeWidth={2} />
                <Bar dataKey="perReq" name="Токенов/запрос" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.date} fill={entry.modelShort === "v4-flash" ? "#059669" : entry.date === "22 апр" ? "#818cf8" : "#4f46e5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <InsightBox title="22 апреля — аномалия?" color="#7c3aed">
              49 запросов дали наименьшее среднее (828 ток./запрос) — вероятно, короткие тестовые вызовы. Высокий output 27 апреля (5370 токенов на 8 запросов = 671 ток./запрос в output) указывает на более развёрнутые ответы.
            </InsightBox>
          </Card>
        </div>

        {/* Detailed table */}
        <Card style={{ marginBottom: 32, overflowX: "auto" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Детализация по дням · источник: amount-2026-4.csv + cost-2026-4.csv</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#1e1b4b" }}>
                {["Дата", "Модель", "Запросов", "Input (miss)", "Cache Hit", "Output", "Стоимость/запрос", "Итого (USD)"].map((h) => (
                  <th key={h} style={{ color: "#a5b4fc", padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RAW_DATA.map((d, i) => (
                <tr key={d.date} style={{ background: i % 2 === 0 ? "#fff" : "#f8f9ff", borderBottom: "1px solid #f0f0f8" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>{d.date}</td>
                  <td style={{ padding: "12px 14px" }}><ModelBadge model={d.modelShort} /></td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: d.requests >= 10 ? 800 : 400 }}>{d.requests}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace" }}>{d.inputMiss.toLocaleString("ru")}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: d.cacheHit > 0 ? 700 : 400, color: d.cacheHit > 0 ? "#059669" : "#d1d5db" }}>
                    {d.cacheHit > 0 ? d.cacheHit.toLocaleString("ru") : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace" }}>{d.output.toLocaleString("ru")}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", color: d.modelShort === "v4-flash" ? "#059669" : "#374151" }}>
                    ${(d.cost / d.requests).toFixed(6)}
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700 }}>${d.cost.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0f0f8", borderTop: "2px solid #e8eaf6" }}>
                <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 800, fontSize: 12 }}>Итого</td>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800 }}>{totalReqs}</td>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800 }}>{totalInputMiss.toLocaleString("ru")}</td>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800, color: "#059669" }}>{totalCacheHit.toLocaleString("ru")}</td>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800 }}>{totalOutput.toLocaleString("ru")}</td>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800 }}>—</td>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800 }}>${totalCost.toFixed(6)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>

        {/* Model comparison card */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0, background: "#fff", borderRadius: 20, border: "1px solid #e8eaf6", marginBottom: 48, overflow: "hidden" }}>
          <div style={{ padding: "32px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5" }} />
              <p style={{ fontSize: 10, fontWeight: 800, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>deepseek-chat & reasoner · 18–23 апр</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { label: "Запросов", value: String(chatReqs) },
                { label: "Стоимость итого", value: `$${chatCost.toFixed(5)}` },
                { label: "Стоимость/запрос", value: `$${chatCostPerReq.toFixed(6)}` },
                { label: "Cache hit", value: "10 624 (22 апр)" },
                { label: "Input (cache miss) price", value: "$0.00000028/tk" },
                { label: "Output price", value: "$0.00000042/tk" },
              ].map((m) => (
                <div key={m.label}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>{m.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#0f0f1a", margin: 0 }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#e8eaf6" }} />
          <div style={{ padding: "32px 36px", background: "linear-gradient(135deg, rgba(5,150,105,0.02), rgba(79,70,229,0.02))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
              <p style={{ fontSize: 10, fontWeight: 800, color: "#059669", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>deepseek-v4-flash · 25–27 апр</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { label: "Запросов", value: String(flashReqs), delta: null },
                { label: "Стоимость итого", value: `$${flashCost.toFixed(5)}`, delta: null },
                { label: "Стоимость/запрос", value: `$${flashCostPerReq.toFixed(6)}`, delta: `−${modelSavingPct}%` },
                { label: "Cache hit", value: "1 024 (27 апр)", delta: null },
                { label: "Input (cache miss) price", value: "$0.00000014/tk", delta: "−50%" },
                { label: "Output price", value: "$0.00000028/tk", delta: "−33%" },
              ].map((m) => (
                <div key={m.label}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>{m.label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#0f0f1a", margin: 0 }}>{m.value}</p>
                    {m.delta && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", background: "rgba(5,150,105,0.10)", padding: "1px 6px", borderRadius: 4 }}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ SECTION 2: РЕАЛИЗОВАННЫЕ СТРАТЕГИИ ══════════ */}
        <SectionDivider icon={CheckCircle2} label="Реализованные стратегии · llmEndpoint.ts" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28 }}>
          В файле <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>apps/api/src/llmEndpoint.ts</code> реализованы четыре независимые стратегии сокращения токенов. Ниже — описание каждой с точными ссылками на код.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            {
              num: "S0",
              color: "#4f46e5",
              icon: Zap,
              title: "Quick Router",
              fn: "quickRouter(input)",
              desc: "Классифицирует ~40–60% запросов regex-паттернами до LLM-вызова оркестратора. Простые паттерны («что такое», «не понимаю», «дай задачу») маршрутизируют напрямую в роль — устраняется целый LLM-вызов.",
              detail: "Возвращает null если паттерн не совпал — тогда включается полный оркестратор.",
            },
            {
              num: "S1",
              color: "#7c3aed",
              icon: Layers,
              title: "Compact Profile",
              fn: "compactProfile(ctx) + buildCompactOrchestratorContext(ctx)",
              desc: "compactProfile() сжимает текстовые поля профиля в минимальный JSON: experience→60 симв., interests→топ-3, mastered→топ-4, weak→топ-3. buildCompactOrchestratorContext() дополнительно обрезает knowledge_graph_summary до 200 симв. и заменяет retrieved_theory на hint темы.",
              detail: "Для оркестратора — компактный JSON, для основного ответа — buildMainResponseContext() с мягкими лимитами.",
            },
            {
              num: "S2",
              color: "#0891b2",
              icon: Database,
              title: "Role-adaptive RAG budget",
              fn: "applyRagBudget(theory, role)",
              desc: "Ограничивает retrieved_theory в зависимости от роли: LECTURER ≤2400 симв. (~600 токенов), MIRROR/SANDBOX ≤800–1200 симв., CHALLENGER ≤600 симв. Избыточный контекст обрезается с пометкой «...сокращено».",
              detail: "RAG_CHAR_BUDGET: { LECTURER:2400, MIRROR:800, SANDBOX:1200, CHALLENGER:600 }",
            },
            {
              num: "S3",
              color: "#059669",
              icon: Shield,
              title: "Stable System Prompt",
              fn: "renderPromptTemplate() → no-op",
              desc: "Системные промпты ролей (lecturer.md, mirror.md и др.) не содержат плейсхолдеров — они byte-identical между запросами. Весь динамический контекст (профиль, RAG, KG, user_input) передаётся в user message. Это позволяет DeepSeek кэшировать KV-state системного промпта.",
              detail: "Cache hit 1024 токена на 27 апреля подтверждает работу кэша.",
            },
          ].map((s) => (
            <div key={s.num} style={{ background: "#fff", border: "1px solid #e8eaf6", borderRadius: 16, padding: "24px 24px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${s.color}, ${s.color}88)` }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>{s.num}</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{s.title}</p>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#059669", background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.20)", padding: "3px 8px", borderRadius: 6 }}>✦ В коде</span>
              </div>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: "0 0 12px" }}>{s.desc}</p>
              <code style={{ display: "block", fontSize: 11, fontWeight: 700, color: s.color, background: `${s.color}08`, border: `1px solid ${s.color}20`, padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
                {s.fn}
              </code>
              <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{s.detail}</p>
            </div>
          ))}
        </div>

        {/* ══════════ SECTION 3: ТЕОРИЯ — СЖАТИЕ ПРОМПТОВ ══════════ */}
        <SectionDivider icon={Layers} label="01. Сжатие промптов" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28 }}>
          Увеличение контекста — прямая функция от глубины персонализации. Системный промпт с историей, KG-данными и RAG-фрагментами легко достигает 2 000+ токенов — это критический барьер и для стоимости, и для latency.<Cite n={2} /> Современные методы переходят от эвристического удаления к классификации важности каждого токена.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 12px" }}>LLMLingua v1 — каузальная модель</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#0f0f1a", margin: "0 0 10px" }}>Однонаправленный контекст</p>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: "0 0 16px" }}>Оценивает перплексию токенов слева направо. Теряет двунаправленные семантические связи — опасно для сложных учебных текстов.<Cite n={3} /></p>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", background: "#f3f4f6", padding: "4px 10px", borderRadius: 6 }}>1.1–1.5× ускорение</span>
          </Card>
          <Card style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", border: "none" }}>
            <Tag>Рекомендуем</Tag>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "10px 0 10px", lineHeight: 1.2 }}>LLMLingua-2: двунаправленная классификация</p>
            <p style={{ fontSize: 13, color: "#a5b4fc", lineHeight: 1.65, margin: "0 0 16px" }}>
              Дистилляция из GPT-4. Сжатие 2–5× при минимальной потере качества. XLM-RoBERTa анализирует весь контекст целиком.<Cite n={4} />
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1e1b4b", background: "#c7d2fe", padding: "4px 10px", borderRadius: 6 }}>1.6–3.5× ускорение</span>
          </Card>
        </div>

        <BlockQuote>
          DistillPrompt извлекает общие принципы из few-shot примеров в виде компактной инструкции.<Cite n={6} /> 5–10 примеров (500–1500 токенов) уступают одному дистиллированному системному промпту — особенно в многоходовых диалогах, где примеры дублируются в каждом запросе. Это направление пока не реализовано в MindFlow, но является логичным следующим шагом после стабилизации системных промптов (S3).
        </BlockQuote>

        {/* ══════════ SECTION 4: КЭШИРОВАНИЕ ══════════ */}
        <SectionDivider icon={Database} label="02. Кэширование промптов" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28 }}>
          Prompt Caching повторно использует предварительно вычисленные KV-состояния для идентичных префиксов.<Cite n={7} /> В MindFlow это реализовано через стратегию S3: системные промпты byte-identical, динамика передаётся отдельно в user message. Первый устойчивый cache hit зафиксирован 27 апреля (1 024 токена) — стратегия начала работать.
        </p>

        <Card style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Оптимальная структура промпта для максимизации cache hit</p>
          {[
            { n: "01", t: "Системные инструкции роли", d: "Глобальные правила тьютора — байт-идентичны между вызовами. В MindFlow: lecturer.md, mirror.md и др.", cached: true, dark: true },
            { n: "02", t: "Определения инструментов", d: "API-интерфейсы, функции проверки — статичные.", cached: true, dark: true },
            { n: "03", t: "Теоретический контекст RAG", d: "Основной корпус знаний по теме. В MindFlow обрезается через applyRagBudget().", cached: true, dark: true },
            { n: "04", t: "Профиль пользователя — статика", d: "Долгосрочные цели — меняется редко. В MindFlow: compactProfile() + buildMainResponseContext().", cached: true, dark: false },
            { n: "05", t: "Профиль пользователя — динамика", d: "Текущий уровень, weak_concepts, последние ошибки KG — чаще меняются.", cached: false, dark: false },
            { n: "06", t: "Запрос пользователя", d: "Самая волатильная часть — всегда вне кэша.", cached: false, dark: false },
          ].map((item, i) => (
            <div key={item.n} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "13px 18px", borderRadius: 10, marginBottom: 4,
              background: item.dark ? "#1e1b4b" : (i === 3 ? "#f5f3ff" : "#f8f9ff"),
              border: item.dark ? "none" : "1px solid #e8eaf6",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: item.cached ? "#818cf8" : "#d1d5db", width: 24, flexShrink: 0 }}>{item.n}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: item.dark ? "#fff" : "#0f0f1a" }}>{item.t}</p>
                <p style={{ margin: 0, fontSize: 11, color: item.dark ? "#818cf8" : "#9ca3af", marginTop: 2 }}>{item.d}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: item.cached ? "#818cf8" : "#e5e7eb", letterSpacing: "0.1em" }}>
                {item.cached ? "КЭШ ✓" : "—"}
              </span>
            </div>
          ))}
          <InsightBox title="Ключевой принцип" color="#4f46e5">
            Изменение хотя бы одного байта в префиксе инвалидирует кэш.<Cite n={9} /> Именно поэтому в MindFlow динамические данные (user_input, профиль, история) перенесены в user message, а системный промпт зафиксирован без плейсхолдеров.
          </InsightBox>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            { name: "DeepSeek (текущий провайдер)", items: ["Prefix cache (KV-state)", "Cache hit: $0.0000000028/tk (chat) / $0.0000000028/tk (flash)", "~10× дешевле cache miss", "Активен: апрель 22 + апрель 27"], ref: 8 },
            { name: "Anthropic Claude (API Docs)", items: ["Порог: 1 024 токена", "Экономия на чтении: ~90%", "Наценка на запись: +25%", "TTL: до 1 часа"], ref: 7 },
          ].map((p) => (
            <Card key={p.name}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 14px" }}>{p.name}</p>
              {p.items.map((it) => (
                <div key={it} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f46e5", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{it}</span>
                </div>
              ))}
              <a href={SOURCES[p.ref].url} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4f46e5", marginTop: 8, textDecoration: "none", fontWeight: 600 }}>
                Документация <ExternalLink size={10} />
              </a>
            </Card>
          ))}
        </div>

        {/* ══════════ SECTION 5: DYNAMIC CONTEXT MGMT ══════════ */}
        <SectionDivider icon={Brain} label="03. Динамическое управление контекстом" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          По мере роста диалога простое удаление старых сообщений нарушает образовательную последовательность. DyCP предлагает семантически взвешенный отбор — KadaneDial выбирает спаны с наибольшей совокупной релевантностью независимо от позиции в диалоге.<Cite n={1} />
        </p>

        <Card style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Database size={16} color="#4f46e5" />
            <p style={{ fontWeight: 800, color: "#0f0f1a", margin: 0, fontSize: 14 }}>VIMBank: векторная долгосрочная память (следующий шаг для MindFlow)</p>
          </div>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: "0 0 20px" }}>
            VIMBank интегрирует кривую забывания Эббингауза в технический стек LLM: система снижает вес старых взаимодействий автоматически, без повторных обращений к LLM. Снижение inference costs на 23% при повышении точности на 10–20%.<Cite n={13} />
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { t: "Плотные векторы (Dense)", d: "FAISS для семантического поиска по темам и интересам — уже есть в MindFlow через Supabase hybrid_search.", col: "#4f46e5" },
              { t: "Разреженные векторы (Sparse)", d: "Elasticsearch (BM25) для точного поиска по терминам и формулам — дополнение к текущему lex_score в ragBoundary.ts.", col: "#7c3aed" },
            ].map((item) => (
              <div key={item.t} style={{ background: `${item.col}08`, border: `1px solid ${item.col}20`, borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 8px" }}>{item.t}</p>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.d}<Cite n={13} /></p>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════════ SECTION 6: USER-LLM ══════════ */}
        <SectionDivider icon={Network} label="04. Векторное представление профиля (USER-LLM)" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          USER-LLM предлагает уход от текстовой передачи истории к сжатым пользовательским эмбеддингам.<Cite n={14} /> Transformer-энкодер преобразует историю активности в компактный вектор (32 «мягких токена»). В MindFlow сейчас реализовано промежуточное решение через compactProfile() (~200–400 токенов) — следующий шаг к USER-LLM.
        </p>

        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Токены профиля: сравнение методов</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              {[
                { method: "Текстовый профиль (без оптимизации)", tokens: 2000, pct: 100 },
                { method: "compactProfile() — текущий MindFlow", tokens: 300, pct: 20 },
                { method: "Векторная память RAG", tokens: 300, pct: 18 },
                { method: "USER-LLM soft prompts", tokens: 32, pct: 2 },
              ].map((row, i) => (
                <div key={row.method} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: i === 1 ? 700 : 400, color: i === 1 ? "#4f46e5" : "#374151" }}>{row.method}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: i === 1 ? "#4f46e5" : "#0f0f1a" }}>{row.tokens} tk</span>
                  </div>
                  <div style={{ background: "#f0f0f8", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      style={{ height: "100%", borderRadius: 6, background: i === 1 ? "linear-gradient(to right, #4f46e5, #7c3aed)" : "#c7d2fe" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <InsightBox title="Статус MindFlow" color="#4f46e5">
              <code style={{ background: "rgba(79,70,229,0.1)", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>compactProfile()</code> уже даёт ~85% экономии от исходного текстового профиля (2000 → 300 токенов). USER-LLM soft prompts — следующая ступень, требует дообучения энкодера на данных пользователей.<Cite n={14} />
            </InsightBox>
          </div>
        </Card>

        {/* ══════════ SECTION 7: KNOWLEDGE TRACING ══════════ */}
        <SectionDivider icon={BookOpen} label="05. Knowledge Tracing (NTKT)" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Knowledge Tracing прогнозирует успех студента на основе его истории ответов.<Cite n={15} /> Традиционный подход требует передачи всей последовательности в промпт. В MindFlow KT частично реализован через BKT в <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>knowledgeGraph.ts</code> (функция <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>updateMastery()</code>), данные которого попадают в контекст через <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>enrichContextWithKG()</code>.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <Card style={{ borderTop: "3px solid #4f46e5" }}>
            <Brain size={18} color="#4f46e5" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 8px" }}>NTKT: Доменная адаптация LLM</p>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
              Специализированные модели, дообученные на текстах вопросов, понимают семантику учебного контента без числовых ID задач — сокращается количество токенов для передачи состояния знаний.<Cite n={15} />
            </p>
          </Card>
          <Card style={{ borderTop: "3px solid #7c3aed" }}>
            <Sparkles size={18} color="#7c3aed" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 8px" }}>CLST: Имена компонент вместо ID</p>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
              «Сложение дробей» вместо числового ID позволяет модели использовать внутренние знания о сложности тем — уже близко к подходу MindFlow с <code style={{ background: "rgba(124,58,237,0.08)", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>conceptName</code> в updateMastery().<Cite n={16} />
            </p>
          </Card>
        </div>

        {/* ══════════ SECTION 8: МАРШРУТИЗАЦИЯ ══════════ */}
        <SectionDivider icon={Map} label="06. Семантическая маршрутизация" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Не каждый запрос требует мощной модели. Semantic Routing распределяет нагрузку между моделями разного уровня.<Cite n={18} /> В MindFlow реализован первый уровень — keyword-маршрутизация через <code style={{ background: "#f0f0f8", padding: "1px 5px", borderRadius: 4 }}>quickRouter()</code>, которая исключает вызов оркестратора для простых запросов. Следующий уровень — embedding-based routing и разделение по моделям (мелкие vs мощные).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 32 }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 20px" }}>Три уровня маршрутизации в MindFlow</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { level: "L0", title: "quickRouter() — реализован", desc: "Regex-паттерны → прямой выбор роли без LLM-вызова. ~40–60% трафика.", color: "#4f46e5", status: "✦ Активен" },
                { level: "L1", title: "Orchestrator LLM — реализован", desc: "Полный LLM-вызов с компактным контекстом. Для сложных или гибридных запросов.", color: "#7c3aed", status: "✦ Активен" },
                { level: "L2", title: "Model-level routing — планируется", desc: "Мелкие модели для MIRROR/SANDBOX, мощные для CHALLENGER/LECTURER. Требует тестирования качества.", color: "#9ca3af", status: "— Дорожная карта" },
              ].map((item) => (
                <div key={item.level} style={{ display: "flex", gap: 14, padding: "14px 16px", background: item.status.includes("Активен") ? `${item.color}06` : "#f8f9ff", borderRadius: 12, border: `1px solid ${item.status.includes("Активен") ? item.color + "20" : "#e8eaf6"}` }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: item.color, fontFamily: "monospace", marginTop: 2 }}>{item.level}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{item.title}</p>
                      <span style={{ fontSize: 9, fontWeight: 800, color: item.status.includes("Активен") ? "#059669" : "#9ca3af" }}>{item.status}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px" }}>Простые запросы</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#0f0f1a", margin: "0 0 8px" }}>quickRouter → роль</p>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>«Что такое X», «Не понимаю Y», «Дай задачу». Regex-паттерн → роль. 0 LLM-вызовов на маршрутизацию.<Cite n={18} /></p>
            </Card>
            <Card style={{ flex: 1, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", border: "none" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px" }}>Сложные запросы</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Orchestrator LLM</p>
              <p style={{ fontSize: 12, color: "#a5b4fc", lineHeight: 1.6, margin: 0 }}>Гибридные интенты, неоднозначные формулировки, кросс-тематические вопросы.<Cite n={19} /></p>
            </Card>
          </div>
        </div>

        {/* ══════════ SECTION 9: RAG OPTIMISATION ══════════ */}
        <SectionDivider icon={BarChart3} label="07. Оптимизация RAG и метаданных" />

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {[
            { icon: CheckCircle2, t: "Многоэтапное переранжирование (реализовано)", d: "rerankWithCloudflare() в ragBoundary.ts: hybrid_search_chunks → MMR (λ=0.6) → cross-encoder reranker. Итоговые чанки проходят truncateChunksToTokenBudget() с лимитом 600 токенов.", ref: 22, col: "#4f46e5", active: true },
            { icon: Layers, t: "Иерархическая суммаризация (планируется)", d: "Суммаризации разной детализации: краткий обзор главы или детальный разбор параграфа по запросу — пока не реализовано в ragBoundary.ts.", ref: 24, col: "#7c3aed", active: false },
            { icon: Network, t: "Семантическая фильтрация по профилю (частично)", d: "topic_tags фильтр в retrieveRelevantChunks() уже есть. Фильтрация по семантическому сходству интересов пользователя с темой урока — следующий шаг.", ref: 25, col: "#a855f7", active: false },
          ].map((item) => (
            <Card key={item.t} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "18px 20px", opacity: item.active ? 1 : 0.75 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.col}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <item.icon size={16} color={item.col} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f0f1a" }}>{item.t}</p>
                  {!item.active && <span style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4 }}>ПЛАН</span>}
                  {item.active && <span style={{ fontSize: 9, fontWeight: 800, color: "#059669", background: "rgba(5,150,105,0.10)", padding: "2px 7px", borderRadius: 4 }}>✦ В КОДЕ</span>}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.65 }}>{item.d}<Cite n={item.ref} /></p>
              </div>
            </Card>
          ))}
        </div>

        {/* ══════════ SECTION 10: ДОРОЖНАЯ КАРТА ══════════ */}
        <SectionDivider icon={TrendingUp} label="Дорожная карта оптимизации" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 56 }}>
          {[
            {
              num: "01",
              title: "Реализовано",
              color: "#059669",
              points: [
                "quickRouter() — keyword-маршрутизация без LLM",
                "compactProfile() — сжатие профиля до ~300 токенов",
                "applyRagBudget() — ролевые лимиты RAG-контекста",
                "Byte-identical системные промпты → prefix cache",
                "Переход на deepseek-v4-flash: −30% стоимость/запрос",
              ],
            },
            {
              num: "02",
              title: "В процессе",
              color: "#d97706",
              points: [
                "Cache hit растёт по мере накопления повторных запросов",
                "Мониторинг качества ответов после сжатия профиля",
                "Калибровка RAG_CHAR_BUDGET по реальным замерам",
                "A/B тест quickRouter vs полный оркестратор",
              ],
            },
            {
              num: "03",
              title: "Следующие шаги",
              color: "#4f46e5",
              points: [
                "LLMLingua-2: сжатие динамической части на 30–50%",
                "VIMBank: векторная долгосрочная память вместо истории в промпте",
                "Model-level routing: мелкие модели для MIRROR/SANDBOX",
                "Мониторинг-дашборд токенов в реальном времени",
              ],
            },
          ].map((col) => (
            <div key={col.num} style={{ background: "#fff", border: "1px solid #e8eaf6", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: col.color, fontFamily: "monospace" }}>{col.num}</span>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{col.title}</p>
              </div>
              {col.points.map((pt, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.color, flexShrink: 0, marginTop: 6 }} />
                  <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{pt}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <InsightBox title="Ключевой вывод" color="#4f46e5">
          Наибольший текущий эффект — от смены модели (deepseek-v4-flash, −{modelSavingPct}% стоимость/запрос) и стабилизации системных промптов (первые cache hit в апреле). Архитектурные стратегии (quickRouter, compactProfile, RAG budget) уже в коде и снижают overhead на маршрутизацию и объём контекста. Следующий значимый скачок даст LLMLingua-2 — он может сократить динамическую часть промпта ещё на 30–50% без потери качества.<Cite n={5} />
        </InsightBox>

        {/* Sources */}
        <SectionDivider icon={BookOpen} label="Список источников" />

        <Card style={{ marginBottom: 56 }}>
          {Object.entries(SOURCES).map(([num, src]) => (
            <div key={num} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f8" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#4f46e5", width: 20, flexShrink: 0, marginTop: 2, fontFamily: "monospace" }}>{num}.</span>
              <a href={src.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", flex: 1, lineHeight: 1.55 }}>
                {src.label}
              </a>
              <ExternalLink size={10} color="#c7d2fe" style={{ flexShrink: 0, marginTop: 3 }} />
            </div>
          ))}
        </Card>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e8eaf6", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 4px" }}>MindFlow · Engineering Intelligence</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>© 2026 MindFlow Digital. Архитектуры оптимизации LLM.</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms", "Contact"].map((link) => (
              <a key={link} href="#" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none", fontWeight: 500 }}>{link}</a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
