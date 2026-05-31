import { motion } from "motion/react";
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  Globe,
  BarChart3,
  Zap,
  Gavel,
  History,
  Shield,
  Network,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Quote,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

// ─── Source map ────────────────────────────────────────────────────────────────

const SOURCES: Record<number, { label: string; url: string }> = {
  1: { label: "Grand View Research: AI In Education Market Size & Share 2030", url: "https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-ai-education-market-report" },
  2: { label: "Tutorbase: EdTech & AI in Education Statistics 2026", url: "https://tutorbase.com/statistics/edtech-ai" },
  3: { label: "MarketsandMarkets: AI in Education Market Report 2024–2030", url: "https://www.marketsandmarkets.com/Market-Reports/ai-in-education-market-200371366.html" },
  4: { label: "Holon IQ: 2025 Global Education Outlook", url: "https://www.holoniq.com/notes/2025-global-education-outlook" },
  5: { label: "Grand View Research: AI In K-12 Education Market 2033", url: "https://www.grandviewresearch.com/industry-analysis/ai-k-12-education-market-report" },
  6: { label: "Jeffrey Wendel Scholarship: Top 5 AI-Powered Tutors for Personalized Learning", url: "https://jeffreywendelscholarship.com/top-5-ai-powered-tutors-for-personalized-learning/" },
  7: { label: "Market.us: AI in Edtech Market — CAGR of 38.1%", url: "https://market.us/report/ai-in-edtech-market/" },
  8: { label: "TAdviser: Онлайн-образование (рынок России)", url: "https://www.tadviser.ru/index.php/%D0%A1%D1%82%D0%B0%D1%82%D1%8C%D1%8F:%D0%9E%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD-%D0%BE%D0%B1%D1%80%D0%B0%D0%B7%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5_%28%D1%80%D1%8B%D0%BD%D0%BE%D0%BA_%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B8%29" },
  9: { label: "TAdviser: Online Education (Russian Market) — EN", url: "https://tadviser.com/index.php/Article:Online_Education_(Russian_Market)" },
  10: { label: "Smart Ranking / ICT Moscow: Топ-100 российских EdTech компаний, Q2 2024", url: "https://ict.moscow/news/smart-ranking-top-100-krupneishikh-rossiiskikh-edtech-kompanii-za-ii-kvartal-2024-goda-zarabotali-32-mlrd-rub/" },
  11: { label: "IMARC Group: Russia E-Learning Market Size, Growth & Analysis 2033", url: "https://www.imarcgroup.com/russia-e-learning-market" },
  12: { label: "IMARC Group: Russia EdTech Market Size, Share, Forecast 2025–2033", url: "https://www.imarcgroup.com/russia-edtech-market" },
  13: { label: "Evelyn Learning: Data Privacy Paradox — AI Personalization vs. FERPA and GDPR", url: "https://www.evelynlearning.com/blog/the-data-privacy-paradox-how-educational-publishers-are-balancing-ai-personalization-with-ferpa-and-gdpr-compliance" },
  14: { label: "Khan Academy Blog: Personalized AI Learning with Khanmigo Interests", url: "https://blog.khanacademy.org/new-khanmigo-interests/" },
  15: { label: "K2view: RAG Hallucination — What is it and how to avoid it", url: "https://www.k2view.com/blog/rag-hallucination/" },
  16: { label: "Preprints.org: Multi-Agent AI Systems for Biological and Clinical Data Analysis", url: "https://www.preprints.org/manuscript/202512.2602/v1/download" },
  17: { label: "TechRxiv: Multi-Agent Systems in Education — Trustworthiness Perspective", url: "https://www.techrxiv.org/doi/pdf/10.36227/techrxiv.176704820.01980102" },
  18: { label: "arXiv: PA-LLM-RAG Policy-Aware Edge LLM-RAG Framework", url: "https://arxiv.org/html/2604.09493" },
  19: { label: "arXiv:2603.08425 — IronEngine Multi-Agent Orchestration", url: "https://arxiv.org/html/2603.08425v1" },
  20: { label: "Khanmigo for Learners — Always-available AI Tutor", url: "https://www.khanmigo.ai/learners" },
  21: { label: "Alibaba Cloud: Production-Grade Cloud LLM Inference", url: "https://www.alibabacloud.com/blog/building-a-production-grade-cloud-native-large-model-inference-platform-with-sglang-rbg-%2B-mooncake_602933" },
  22: { label: "PMC NIH: Reducing Hallucinations in Generative AI Chatbots for Cancer Information", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12425422/" },
  23: { label: "PMC NIH: MEGA-RAG — Multi-evidence guided answer refinement for LLM hallucinations", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12540348/" },
  24: { label: "MDPI: Multi-Agent RAG Framework for Entity Resolution", url: "https://www.mdpi.com/2073-431X/14/12/525" },
  25: { label: "arXiv: Mitigating Hallucination in LLMs — Survey", url: "https://arxiv.org/html/2510.24476v1" },
  26: { label: "DPO Consulting: GDPR & AI — Compliance, Challenges & Best Practices", url: "https://www.dpo-consulting.com/blog/gdpr-and-ai-best-practices" },
  27: { label: "Exabeam: The Intersection of GDPR and AI", url: "https://www.exabeam.com/explainers/gdpr-compliance/the-intersection-of-gdpr-and-ai-and-6-compliance-best-practices/" },
  28: { label: "КонсультантПлюс: Кодекс этики в сфере искусственного интеллекта", url: "https://www.consultant.ru/document/cons_doc_LAW_470682/" },
  29: { label: "ВШЭ Центр ИИ: Этика и доверенный ИИ", url: "https://cs.hse.ru/aicenter/ethics3" },
  30: { label: "Astria Learning: Online Learning Challenges in 2025", url: "https://astrialearning.com/blogs/blog/how-to-overcome-a-common-online-learning-challenge/" },
  31: { label: "WJARR: AI-Powered Personalised Learning — Promise and Pitfalls", url: "https://wjarr.com/sites/default/files/fulltext_pdf/WJARR-2025-2425.pdf" },
  32: { label: "Discovery Education: The Pros and Cons of AI in Education", url: "https://www.discoveryeducation.com/blog/educational-leadership/ai-in-education/" },
  33: { label: "eLearning Industry: AI In Education — Personalized Learning Platforms in 2025", url: "https://elearningindustry.com/ai-in-education-personalized-learning-platforms" },
  34: { label: "Deloitte: AI Trends 2025 — Adoption Barriers", url: "https://www.deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/blogs/pulse-check-series-latest-ai-developments/ai-adoption-challenges-ai-trends.html" },
};

// ─── Chart Data ────────────────────────────────────────────────────────────────

const globalMarketData = [
  { year: "2024", value: 5.88 },
  { year: "2025", value: 7.72 },
  { year: "2026", value: 10.14 },
  { year: "2027", value: 13.31 },
  { year: "2028", value: 17.48 },
  { year: "2029", value: 22.95 },
  { year: "2030", value: 32.27 },
];

const russiaMarketData = [
  { year: "2022", value: 87.8, growth: 17.4 },
  { year: "2023", value: 119.3, growth: 32.0 },
  { year: "2024", value: 149, growth: 21.0 },
  { year: "2025П", value: 154, growth: 12.0 },
];

const segmentData = [
  { name: "Machine Learning", share: 64.7, color: "#4f46e5" },
  { name: "Cloud Deploy", share: 60.1, color: "#7c3aed" },
  { name: "Higher Ed", share: 44.3, color: "#a855f7" },
  { name: "Software", share: 70.3, color: "#6366f1" },
];

const ragData = [
  { name: "Базовая LLM", accuracy: 66.7, f1: 76.4 },
  { name: "LLM + RAG", accuracy: 62.8, f1: 67.3 },
  { name: "MEGA-RAG", accuracy: 79.13, f1: 79.0 },
];

const russiaPlayersData = [
  { name: "Skyeng", revenue: 3.2 },
  { name: "Skillbox", revenue: 2.45 },
  { name: "Синергия", revenue: 2.4 },
];

const segmentPieData = [
  { name: "ДПО", value: 34, color: "#4f46e5" },
  { name: "Детское образование", value: 34, color: "#6366f1" },
  { name: "Высшее", value: 18, color: "#818cf8" },
  { name: "Прочее", value: 14, color: "#c7d2fe" },
];

// ─── Citation ─────────────────────────────────────────────────────────────────

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
              borderRadius: 4, textDecoration: "none", transition: "all .15s",
            }}
          >
            {num}
          </a>
        ) : null;
      })}
    </span>
  );
};

// ─── Layout helpers ────────────────────────────────────────────────────────────

const Tag = ({ children }: { children: React.ReactNode }) => (
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

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "#fff", borderRadius: 16, border: "1px solid #e8eaf6",
    padding: 24, ...style,
  }}>{children}</div>
);

const KpiCard = ({
  label, value, sub, badge, accent = false
}: {
  label: string; value: string; sub?: React.ReactNode; badge?: string; accent?: boolean;
}) => (
  <div style={{
    background: accent ? "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)" : "#fff",
    borderRadius: 16,
    border: accent ? "none" : "1px solid #e8eaf6",
    padding: "24px 20px",
    position: "relative",
    overflow: "hidden",
  }}>
    {accent && (
      <div style={{
        position: "absolute", right: -24, top: -24, width: 96, height: 96,
        borderRadius: "50%", background: "rgba(255,255,255,0.07)",
      }} />
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8eaf6", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 800, color: p.color || "#4f46e5", margin: 0 }}>
            {p.name}: {p.value}{p.unit || ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function MarketAnalysis() {
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
            <Tag><Sparkles size={10} /> Аналитика рынка · 2024–2030</Tag>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ОБНОВЛЕНО АПРЕЛЬ 2026</span>
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "#0f0f1a", lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 760 }}>
            Анализ рынка{" "}
            <span style={{ color: "#4f46e5" }}>2024–2030:</span>{" "}
            EdTech и ИИ в образовании
          </h1>
        </motion.section>

        {/* KPI Row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          <KpiCard label="Рынок ИИ в EdTech (2024)" value="$5.88B" sub={<>Grand View Research <Cite n={1} /></>} />
          <KpiCard label="Прогноз к 2030 году" value="$32.27B" sub={<>CAGR 31,2% · рост ×5,5 <Cite n={1} /></>} accent badge="×5.5" />
          <KpiCard label="Рынок РФ (2024)" value="149B ₽" sub={<>Объём онлайн-образования <Cite n={8} /></>} />
          <KpiCard label="Венчурные инвестиции" value="$2.4B" sub={<>Capital deployed в AI EdTech <Cite n={2} /></>} />
        </motion.div>

        {/* Executive Summary + Pulse */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 48 }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 12px" }}>Резюме</p>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: "0 0 12px" }}>
              Современная образовательная платформа рассматривается как динамическая среда, управляемая
              сложными архитектурными решениями на базе LLM и RAG-систем.
            </p>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, margin: 0 }}>
              Несмотря на общее охлаждение венчурного рынка — инвестиции в EdTech в 2024 году составили
              около $2,4 млрд (самый низкий уровень за десятилетие) — фокус инвесторов сместился на
              качественные технологические инновации в области генеративного ИИ.<Cite n={2} />
            </p>
          </Card>
        </div>

        {/* ══════ SECTION 1: Глобальный рынок ══════ */}
        <SectionDivider icon={Globe} label="Глобальный рынок ИИ в образовании" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28 }}>
          По состоянию на 2024 год объём глобального сегмента ИИ в образовании оценивается в $5,88 млрд.<Cite n={1} />
          Ожидается, что к 2030 году этот показатель достигнет $32,27 млрд при CAGR 31,2%.<Cite n={1} /> Такая
          динамика обусловлена спросом на персонализацию обучения и необходимостью автоматизации
          административных процессов.
        </p>

        {/* Market Forecast Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 32 }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Прогноз капитализации рынка</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#0f0f1a", margin: "0 0 20px" }}>
              $32.27B <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>к 2030</span>
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={globalMarketData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Объём рынка" unit="B$" stroke="#4f46e5" strokeWidth={2.5} fill="url(#marketGrad)" dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
            <InsightBox title="Ключевой вывод" color="#4f46e5">
              Ожидаемый рост рынка ИИ в образовании в 5,5× за 6 лет — это один из самых высоких CAGR среди EdTech-сегментов,
              что опережает базовые SaaS-бенчмарки на 12,4%. <Cite n={1} />
            </InsightBox>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>Projected CAGR</p>
              <p style={{ fontSize: 40, fontWeight: 900, color: "#0f0f1a", margin: "0 0 4px", lineHeight: 1 }}>31.2%</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                Среднегодовой темп роста. Опережает ядро SaaS-сегмента на 12,4%. <Cite n={1} />
              </p>
            </Card>
            <Card style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>Venture Funding</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: "#0f0f1a", margin: "0 0 4px", lineHeight: 1 }}>$2.4B</p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                Общий капитал в AI-first EdTech стартапы за 2024 год. <Cite n={2} />
              </p>
            </Card>
          </div>
        </div>

        {/* Segments Chart */}
        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Ключевые рыночные сегменты</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#0f0f1a", margin: "0 0 24px" }}>Доля в структуре выручки по технологическим сегментам</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              {segmentData.map((seg) => (
                <div key={seg.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{seg.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a" }}>{seg.share}%</span>
                  </div>
                  <div style={{ background: "#f0f0f8", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.share}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      style={{ height: "100%", borderRadius: 6, background: `linear-gradient(to right, ${seg.color}, ${seg.color}99)` }}
                    />
                  </div>
                </div>
              ))}
              <InsightBox title="Структурный вывод" color="#4f46e5">
                Программные решения (LMS + ITS) контролируют 70,3% выручки — цифровая доставка
                контента доминирует над аппаратным сегментом. <Cite n={1} />
              </InsightBox>
            </div>
          </div>

        </Card>

        {/* Geography */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <BarChart3 size={16} color="#4f46e5" />
              <p style={{ fontWeight: 800, color: "#0f0f1a", margin: 0, fontSize: 14 }}>Северная Америка</p>
            </div>
            <p style={{ fontSize: 38, fontWeight: 900, color: "#0f0f1a", margin: "0 0 4px", lineHeight: 1 }}>38–39%</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px" }}>Доля мирового рынка (2024) <Cite n={1} /></p>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
              США лидируют за счёт развитой цифровой инфраструктуры и присутствия ключевых игроков:
              Google, Microsoft, Pearson, AWS.<Cite n={1} /> Государственные инвестиции направлены на
              внедрение адаптивного тестирования и аналитики производительности.<Cite n={5} />
            </p>
          </Card>
          <Card style={{ borderLeft: "3px solid #4f46e5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <TrendingUp size={16} color="#4f46e5" />
              <p style={{ fontWeight: 800, color: "#0f0f1a", margin: 0, fontSize: 14 }}>Азиатско-Тихоокеанский регион</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <p style={{ fontSize: 38, fontWeight: 900, color: "#4f46e5", margin: 0, lineHeight: 1 }}>Fastest</p>
              <ArrowUpRight size={24} color="#4f46e5" />
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 12px" }}>Самый быстрорастущий рынок <Cite n={1} /></p>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
              Китай и Индия — массовый переход на цифровые платформы. Индийский EdTech в Q3 2024 показал
              всплеск инвестиций до $224 млн, во многом благодаря PhysicsWallah и аналогам.<Cite n={7} />
            </p>
          </Card>
        </div>

        {/* ══════ SECTION 2: Российский рынок ══════ */}
        <SectionDivider icon={BarChart3} label="Российский рынок EdTech: состояние и тренды" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28 }}>
          Российский рынок онлайн-образования в 2024 году достиг 145–149 млрд рублей.<Cite n={8} /> Темпы
          роста замедляются: с 32–34,6% в 2023 году до 19–21% в 2024-м.<Cite n={8} /> Аналитики прогнозируют
          дальнейшую стабилизацию на уровне 12% к 2025 году, когда общий объём достигнет 154 млрд руб.<Cite n={9} />
          Стагнацию объясняют высокой стоимостью заёмных средств, усложняющей получение рассрочек, и сдвигом
          спроса рынка труда в пользу рабочих специальностей.<Cite n={9} />
        </p>

        {/* Russia Market Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 32 }}>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>Russian Market Focus</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Динамика рынка онлайн-образования РФ</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={russiaMarketData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="ruGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}₽`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Объём" unit=" млрд ₽" radius={[6, 6, 0, 0]} fill="url(#ruGrad)" />
              </BarChart>
            </ResponsiveContainer>
            <InsightBox title="Стабилизация роста">
              В Q3 2024 зафиксирована стабилизация рынка. Смещение спроса в пользу LMS/LXP-платформ
              для корпоративного сектора становится вторичным драйвером роста. <Cite n={9} />
            </InsightBox>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>Market Volume</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: "#0f0f1a", margin: "0 0 4px", lineHeight: 1 }}>149B <span style={{ fontSize: 18 }}>₽</span></p>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Общий объём онлайн-образования, 2024 <Cite n={8} /></p>
            </Card>
            <Card style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Структура выручки (Q2 2024)</p>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={segmentPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="38%"
                    cy="52%"
                    outerRadius={52}
                    innerRadius={30}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {segmentPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconSize={9}
                    iconType="circle"
                    formatter={(value: string) => {
                      const seg = segmentPieData.find((s) => s.name === value);
                      return `${value} — ${seg?.value ?? 0}%`;
                    }}
                    wrapperStyle={{ fontSize: 10, color: "#6b7280", right: 0 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 10, color: "#9ca3af", margin: "4px 0 0", textAlign: "center" }}>
                Источник: Smart Ranking <Cite n={10} />
              </p>
            </Card>
          </div>
        </div>

        {/* Russian Players */}
        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>
            Крупнейшие игроки российского EdTech (Q2 2024) <Cite n={10} />
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              {russiaPlayersData.map((player, i) => (
                <div key={player.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", width: 16 }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f0f1a", margin: "0 0 4px" }}>{player.name}</p>
                    <div style={{ background: "#f0f0f8", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${(player.revenue / 3.2) * 100}%`, height: "100%", background: "#4f46e5", borderRadius: 4 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5" }}>{player.revenue} млрд ₽</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={russiaPlayersData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Выручка" unit=" млрд ₽" radius={[6, 6, 0, 0]}>
                  {russiaPlayersData.map((_, i) => <Cell key={i} fill={["#4f46e5", "#6366f1", "#818cf8"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 32 }}>
          Государственная поддержка реализуется через нацпроекты «Образование» и «Цифровая экономика»,
          стимулирующие внедрение адаптивных платформ в государственные школы и вузы.<Cite n={11} />
          В сентябре 2024 года запущена единая государственная платформа для онлайн-обучения ИТ-специалистов
          и школьников.<Cite n={11} />
        </p>

        <Card style={{ marginBottom: 24, background: "linear-gradient(135deg, #eef2ff, #faf5ff)", border: "1px solid #ddd6fe" }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "#5b21b6", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Переход к контуру 2
          </p>
          <p style={{ fontSize: 13, color: "#4b5563", margin: 0, lineHeight: 1.7 }}>
            Ниже — отдельный прикладной блок «ИИ в образовании». Он не дублирует рыночные метрики выше:
            здесь фокус на архитектуре решений, качестве моделей, рисках и операционном внедрении.
          </p>
        </Card>

        {/* ══════ SECTION 3: Адаптивная диагностика ══════ */}
        <SectionDivider icon={BookOpen} label="Технологическая концепция: Адаптивная диагностика" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Адаптивная диагностика — механизм непрерывного оценивания знаний, который корректирует траекторию
          обучения в зависимости от текущих результатов. В отличие от традиционных тестов, адаптивная система
          использует статистические модели и нейронные сети для выбора следующего вопроса на основе предыдущих
          ответов. Компании, внедрившие глубокую персонализацию, отмечают рост вовлечённости студентов на 40%
          и улучшение показателей завершения курсов на 35%.<Cite n={13} />
        </p>

        <BlockQuote>
          Khan Academy в рамках ИИ-тьютора Khanmigo реализовала функцию «Interests»: система анализирует
          историю чатов и адаптирует примеры в задачах под хобби ученика, делая обучение эмоционально вовлекающим.<Cite n={14} />
        </BlockQuote>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            {
              icon: TrendingUp,
              title: "Анализ паттернов ошибок",
              metric: "+40%",
              metricLabel: "вовлечённость",
              desc: "Использование ML для классификации типов ошибок: случайных, системных, концептуальных.",
              ref: 13,
            },
            {
              icon: CheckCircle2,
              title: "Динамическое распределение нагрузки",
              metric: "+35%",
              metricLabel: "завершение курсов",
              desc: "При быстром прохождении система автоматически повышает сложность, минимизируя повтор известных тем.",
              ref: 13,
            },
            {
              icon: Zap,
              title: "Предиктивная аналитика churn",
              metric: "Раннее",
              metricLabel: "вмешательство",
              desc: "Оценка вероятности отсева на основе снижения активности для своевременного действия тьютора.",
              ref: 13,
            },
          ].map((item) => (
            <Card key={item.title} style={{ borderTop: "3px solid #4f46e5" }}>
              <item.icon size={18} color="#4f46e5" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 8px" }}>{item.title}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#4f46e5", lineHeight: 1 }}>{item.metric}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{item.metricLabel}</span>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
                {item.desc} <Cite n={item.ref} />
              </p>
            </Card>
          ))}
        </div>

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 40 }}>
          В России разработана Сбером и ВШЭ метрика «Persistence» для оценки качества
          эмбеддингов ИИ-моделей без размеченных данных — она может быть использована для более точного
          сопоставления контента и уровня знаний учащегося.<Cite n={10} />
        </p>

        {/* ══════ SECTION 4: Ролевая оркестрация ══════ */}
        <SectionDivider icon={Network} label="Ролевая оркестрация LLM" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Для создания эффективного ИИ-тьютора недостаточно одной универсальной модели. Современный
          подход подразумевает использование многоагентных систем (Multi-Agent Systems), где каждая LLM
          выполняет свою специфическую роль. Исследовательские проекты IronEngine и
          PA-LLM-RAG выделяют несколько ключевых когнитивных ролей:<Cite n={[18, 19]} />
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          {/* Role ecosystem */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Network size={16} color="#4f46e5" />
              <p style={{ fontWeight: 800, color: "#0f0f1a", margin: 0, fontSize: 14 }}>Экосистема ролей агентов</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { title: "Planner", desc: "Анализирует запрос и строит план решения, разбивая на подэтапы.", accent: false },
                { title: "Executor", desc: "Генерирует основной контент или выполняет код.", accent: false },
                { title: "Reviewer / Judge", desc: "Оценивает результат на педагогические стандарты и отсутствие галлюцинаций.", accent: false },
                { title: "Tool Agent", desc: "Работает с внешними инструментами: калькуляторы, базы данных, API.", accent: true },
              ].map((box) => (
                <div key={box.title} style={{
                  padding: "14px 14px",
                  borderRadius: 12,
                  background: box.accent ? "linear-gradient(135deg, #4f46e5, #6d28d9)" : "#f8f9ff",
                  border: box.accent ? "none" : "1px solid #e8eaf6",
                }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: box.accent ? "rgba(255,255,255,0.65)" : "#4f46e5", margin: "0 0 6px" }}>{box.title}</p>
                  <p style={{ fontSize: 11, color: box.accent ? "rgba(255,255,255,0.85)" : "#6b7280", lineHeight: 1.55, margin: 0 }}>{box.desc}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, margin: "12px 0 0" }}>
              Источники: <Cite n={[16, 17, 18, 19]} />
            </p>
          </Card>

          {/* RAG accuracy summary */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Zap size={16} color="#4f46e5" />
              <p style={{ fontWeight: 800, color: "#0f0f1a", margin: 0, fontSize: 14 }}>Результаты MEGA-RAG без дублирования графика</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {ragData.map((entry) => (
                <div key={entry.name} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: entry.name === "MEGA-RAG" ? "#f5f3ff" : "#f8f9ff" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 700 }}>{entry.name}</p>
                  <p style={{ margin: "6px 0 2px", fontSize: 24, fontWeight: 900, color: entry.name === "MEGA-RAG" ? "#4f46e5" : "#0f0f1a" }}>{entry.accuracy}%</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>F1: {entry.f1}%</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6, margin: "14px 0 0" }}>
              Полный сравнительный график вынесен ниже в секцию «Сравнение методов», чтобы не повторять один и тот же визуал дважды. <Cite n={23} />
            </p>
          </Card>
        </div>

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 40 }}>
          Такое разделение труда позволяет реализовать «сократический метод»: система не даёт готовый ответ,
          а направляет ученика через наводящие вопросы.<Cite n={6} /> Например, Khanmigo спроектирован так,
          чтобы никогда не давать прямых ответов, выступая в роли коуча.<Cite n={20} /> Оркестрация множества
          моделей требует значительных вычислительных мощностей. Архитектура RoleBasedGroup (RBG) управляет
          эластичностью в облаке, масштабируя отдельные роли при пиковом трафике.<Cite n={21} /> Средняя
          загрузка GPU в статических системах часто не превышает 30%, что делает динамическое масштабирование
          критически важным.<Cite n={21} />
        </p>

        {/* ══════ SECTION 5: RAG ══════ */}
        <SectionDivider icon={Zap} label="RAG-корпус и борьба с галлюцинациями" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Одна из фундаментальных проблем LLM в образовании — склонность к «галлюцинациям». Технология RAG позволяет ограничить область «знаний» модели
          конкретными, верифицированными учебными источниками.<Cite n={15} /> RAG-системы чаще склонны
          «признавать своё незнание», если информации нет в базе, тогда как обычные LLM пытаются генерировать
          ответ в любом случае.<Cite n={22} />
        </p>

        {/* RAG comparison */}
        <Card style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>
            Сравнение методов (MEGA-RAG исследование) <Cite n={23} />
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              {ragData.map((row) => (
                <div key={row.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{row.name}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: row.name === "MEGA-RAG" ? "#4f46e5" : "#0f0f1a" }}>{row.accuracy}%</span>
                  </div>
                  <div style={{ background: "#f0f0f8", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.accuracy / 85) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      style={{ height: "100%", borderRadius: 6, background: row.name === "MEGA-RAG" ? "#4f46e5" : "#c7d2fe" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>F1: {row.f1}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <InsightBox title="Ключевой вывод" color="#4f46e5">
                MEGA-RAG с механизмом верификации превосходит стандартный RAG на 16,3 п.п. по accuracy.
                Стандартный RAG уступает даже базовой LLM по F1 — без верификации контекст создаёт помехи.<Cite n={23} />
              </InsightBox>
              <div style={{ marginTop: 16, background: "#f8f9ff", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Тестовая база:</p>
                <p style={{ fontSize: 13, fontWeight: 900, color: "#0f0f1a", margin: "0 0 2px" }}>12 000 вопросов</p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Медицинский и юридический EdTech</p>
              </div>
            </div>
          </div>
        </Card>

        {/* RAG Pipeline */}
        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 20px" }}>Проектирование корпуса данных <Cite n={24} /></p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative" }}>
            {[
              { step: "01", title: "Preprocessing & Chunking", desc: "Разбиение учебников и лекций на логические фрагменты с метаданными.", ref: 24 },
              { step: "02", title: "Vector Store", desc: "Векторные БД (Qdrant, FAISS) для хранения эмбеддингов.", ref: 24 },
              { step: "03", title: "Semantic Retrieval", desc: "Поиск релевантных фрагментов по смыслу, а не ключевым словам.", ref: 25 },
              { step: "04", title: "Post-retrieval Refinement", desc: "Ранжирование и фильтрация противоречивой информации.", ref: 23 },
            ].map((item, i) => (
              <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                <div style={{ flex: 1, padding: "0 16px", borderRight: i < 3 ? "1px dashed #e0e7ff" : "none" }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: "#e0e7ff", lineHeight: 1, margin: "0 0 10px" }}>{item.step}</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#0f0f1a", margin: "0 0 6px" }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.55, margin: 0 }}>
                    {item.desc} <Cite n={item.ref} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════ SECTION 6: GDPR / ФЗ-152 ══════ */}
        <SectionDivider icon={Shield} label="Регуляторная среда: GDPR и ФЗ-152" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Сбор массивов данных об успеваемости, поведении и интересах студентов создаёт серьёзные риски
          для конфиденциальности. Образовательные платформы обязаны соблюдать GDPR (ЕС), FERPA (США)
          и ФЗ-152 (Россия).<Cite n={13} /> В России разработка систем ИИ должна соответствовать
          «Кодексу этики в сфере ИИ», который ставит интересы человека и защиту его прав выше интересов
          конкуренции и технологического прогресса.<Cite n={28} />
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { icon: Shield, title: "Минимизация данных", desc: "Только данные, необходимые для персонализации. Без избыточного сбора информации.", ref: 26 },
            { icon: Shield, title: "Ограничение цели", desc: "Данные для обучения не могут использоваться для маркетингового профилирования без отдельного согласия.", ref: 27 },
            { icon: Shield, title: "Право на объяснение", desc: "Учащийся вправе знать критерии решений ИИ при выставлении оценки или рекомендации курса.", ref: [26, 27] as number[] },
          ].map((item) => (
            <Card key={item.title}>
              <item.icon size={16} color="#4f46e5" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 800, color: "#0f0f1a", margin: "0 0 8px" }}>{item.title}</p>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
                {item.desc} <Cite n={item.ref} />
              </p>
            </Card>
          ))}
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "18px 20px", marginBottom: 40, display: "flex", gap: 14 }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: "#92400e" }}>Критический фактор доверия</p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "#a16207" }}>
              Даже сильный рост accuracy не гарантирует педагогический эффект: продукт должен объяснять, почему выдана рекомендация, и позволять преподавателю вмешиваться в траекторию обучения. <Cite n={[26, 27]} />
            </p>
          </div>
        </div>

        {/* ══════ SECTION 7: Барьеры ══════ */}
        <SectionDivider icon={Gavel} label="Барьеры внедрения и рыночные вызовы" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          {[
            {
              icon: Gavel,
              title: "Скептицизм преподавателей",
              desc: "По данным ОЭСР, менее половины учителей в мире чувствуют себя уверенно при использовании сложных цифровых инструментов. Существует опасение, что ИИ заменит человеческое наставничество.",
              priority: "Высокий",
              priorityColor: "#dc2626",
              bg: "#fef2f2",
              border: "#fecaca",
              ref: [30, 31] as number[],
            },
            {
              icon: BarChart3,
              title: "Цифровой разрыв",
              desc: "Неравенство в доступе к высокоскоростному интернету и современным устройствам может усугубить образовательное неравенство, особенно в сельских регионах России.",
              priority: "Стратегический",
              priorityColor: "#d97706",
              bg: "#fffbeb",
              border: "#fde68a",
              ref: [11, 12] as number[],
            },
            {
              icon: History,
              title: "Legacy-интеграция",
              desc: "Многие образовательные организации используют устаревшие LMS-системы, которые сложно синхронизировать с современными агентными ИИ-платформами.",
              priority: "Средний",
              priorityColor: "#6b7280",
              bg: "#f9fafb",
              border: "#e5e7eb",
              ref: 34,
            },
            {
              icon: AlertTriangle,
              title: "Риск чрезмерной зависимости",
              desc: "Чрезмерное использование ИИ-тьюторов может подавлять развитие навыков самостоятельного решения проблем и критического мышления, если система даёт слишком много подсказок.",
              priority: "Средний",
              priorityColor: "#6b7280",
              bg: "#f9fafb",
              border: "#e5e7eb",
              ref: 32,
            },
          ].map((card) => (
            <div key={card.title} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <card.icon size={16} color={card.priorityColor} />
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: 0 }}>{card.title}</p>
              </div>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: "0 0 14px" }}>
                {card.desc} <Cite n={card.ref} />
              </p>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: card.priorityColor }}>
                Приоритет: {card.priority}
              </span>
            </div>
          ))}
        </div>


        {/* Sources */}
        <SectionDivider icon={BookOpen} label="Список источников" />

        <Card style={{ marginBottom: 56 }}>
          {Object.entries(SOURCES).map(([num, src]) => (
            <div key={num} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f0f8" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#4f46e5", width: 20, flexShrink: 0, marginTop: 2, fontFamily: "monospace" }}>{num}.</span>
              <a href={src.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", flex: 1, lineHeight: 1.55, display: "flex", alignItems: "center", gap: 6 }}>
                {src.label}
              </a>
              <ExternalLink size={10} color="#c7d2fe" style={{ flexShrink: 0, marginTop: 3 }} />
            </div>
          ))}
        </Card>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e8eaf6", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0f0f1a", margin: "0 0 4px" }}>MindFlow · EdTech Intelligence</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>© 2026 MindFlow Digital. Профессиональный анализ рынка.</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Term of Intelligence", "Contact Analyst"].map((link) => (
              <a key={link} href="#" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none", fontWeight: 500 }}>{link}</a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
