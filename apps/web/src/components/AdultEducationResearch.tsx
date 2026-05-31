import { motion } from "motion/react";
import {
  ArrowLeft,
  Download,
  Share2,
  Brain,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  Network,
  BookOpen,
  Quote,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";

// ─── Sources ──────────────────────────────────────────────────────────────────

const SOURCES: Record<number, { label: string; url: string }> = {
  1: { label: "OECD Digital Education Outlook 2026", url: "https://www.oecd.org/en/publications/oecd-digital-education-outlook-2026_062a7394-en.html" },
  3: { label: "OECD: When Technology Does Not Equal Transformation — WorldDidac", url: "https://worlddidac.org/news/oecd-digital-education-outlook-2026-when-technology-does-not-equal-transformation/" },
  4: { label: "Summary of OECD Digital Education Outlook 2026 — CIDDL", url: "https://ciddl.org/summary-of-oecd-digital-education-outlook-2026/" },
  6: { label: "AI-Powered Personalized Education Platform Market Research — MarketIntelo", url: "https://marketintelo.com/report/ai-powered-personalized-education-platform-market" },
  7: { label: "LLM Chatbots in High School Programming — arXiv:2511.18985", url: "https://arxiv.org/abs/2511.18985" },
  8: { label: "A new kind of cognitive tool: Generative AI — Western University", url: "https://uwo.scholaris.ca/bitstreams/15b7bb29-0a99-4d1f-bc8f-63945003bb11/download" },
  9: { label: "Can AI be friends? An innovative approach — Tandfonline", url: "https://www.tandfonline.com/doi/full/10.1080/17501229.2025.2551124" },
  10: { label: "The Revolution Has Arrived: LLMs in Education — arXiv:2507.02180", url: "https://arxiv.org/html/2507.02180v1" },
  11: { label: "Using Generative AI to Enhance Personalised Learning — Open Research Online", url: "https://oro.open.ac.uk/103711/1/Accepted%20Manuscript.pdf" },
  12: { label: "Using AI to enhance thinking skills — Reddit / ChatGPTPro", url: "https://www.reddit.com/r/ChatGPTPro/comments/1lo1v2j/using_ai_to_enhance_thinking_skills/" },
  13: { label: "Breaking Barriers or Building Dependency? Team-LLM Debate — arXiv:2501.09165", url: "https://arxiv.org/html/2501.09165v2" },
  14: { label: "Technology for Second Language Learning Conference — Iowa State", url: "https://apling.engl.iastate.edu/conferences/technology-for-second-language-learning-conference/tsll-2023/abstracts/" },
  15: { label: "Synthetic Socratic Debates: Examining Persona — ACL Anthology EMNLP 2025", url: "https://aclanthology.org/2025.emnlp-main.831.pdf" },
  16: { label: "Smarter Onboarding: How AI Is Customizing the New Hire Experience — TechClass", url: "https://www.techclass.com/resources/learning-and-development-articles/smarter-onboarding-how-ai-is-customizing-new-hire-experience" },
  17: { label: "AI in Customer Education: A Smarter Way to Train and Retain — WorkRamp", url: "https://www.workramp.com/blog/ai-in-customer-education-a-smarter-way-to-train-and-retain-customers" },
  18: { label: "Smarter Learning: Scaling Personalization With AI — Training Industry", url: "https://trainingindustry.com/articles/artificial-intelligence/smarter-learning-personalization-at-scale-with-ai-driven-knowledge-graphs/" },
  19: { label: "Teaching Innovation Award Winners — LearnSci", url: "https://www.learnsci.com/community/tia-winners" },
  20: { label: "React-to-Me: A Conversational Interface for Reactome — bioRxiv", url: "https://www.biorxiv.org/content/10.64898/2025.12.12.693752v1.full-text" },
  21: { label: "A Generalizable Agentic AI Pipeline for Chatbots — MDPI", url: "https://www.mdpi.com/2079-3197/13/12/297" },
  22: { label: "DeepTRACE: Auditing Deep Research AI Systems", url: "https://r.jordan.im/download/language-models/venkit2025.pdf" },
  23: { label: "Hallucinations in LLMs for Education: Challenges and Mitigation — IJTLE", url: "https://ijtle.com/public/img/uploads/file/pdf/2IJTLE-1020510-Hallucinations.pdf" },
  24: { label: "LLM or Human? Perceptions of Trust and Information Quality — arXiv:2601.15556", url: "https://arxiv.org/html/2601.15556v1" },
  25: { label: "LLM or Human? Perceptions of Trust — arXiv PDF", url: "https://arxiv.org/pdf/2601.15556" },
  26: { label: "Long-context failure research — Hugging Face Daily Papers", url: "https://huggingface.co/papers?q=long-context%20failure" },
  27: { label: "ACE: AI-Assisted Construction of Educational Knowledge Graphs — JEDM", url: "https://jedm.educationaldatamining.org/index.php/JEDM/article/view/737" },
  28: { label: "Personalized Learning Path Recommendation Based on Knowledge Graphs — MDPI", url: "https://www.mdpi.com/2079-9292/15/1/238" },
  29: { label: "Analysis and Design of Mastery Learning Criteria — FI MUNI", url: "https://www.fi.muni.cz/~xpelanek/publications/nrhm-mastery.pdf" },
  30: { label: "LAK24 Proceedings — Society for Learning Analytics Research (SoLAR)", url: "https://www.solaresearch.org/events/lak/lak24/table-of-contents/" },
  31: { label: "ACE: AI-Assisted Construction of EKGs with Prerequisite Relations — JEDM", url: "https://jedm.educationaldatamining.org/index.php/JEDM/article/download/737/218" },
  32: { label: "Andragogy in the Age of AI: Transformative Pathways — EPALE EU", url: "https://epale.ec.europa.eu/en/resource-centre/content/andragogy-age-ai-transformative-pathways-adult" },
  33: { label: "Andragogy as a Theoretical Framework for AI Integration — ResearchGate", url: "https://www.researchgate.net/publication/389811706_Andragogy_as_a_Theoretical_Framework_for_AI_Integration_in_Higher_Education" },
  34: { label: "Andragogy: 7 Principles Using Cognitive Science and AI — Didask", url: "https://www.didask.com/en/post/andragogie-7-principes-sciences-cognitives-et-ia" },
  35: { label: "Digital andragogy: need to know and role of experience — Redalyc", url: "https://www.redalyc.org/journal/3314/331477742032/html/" },
  36: { label: "Technology-Assisted Language Learning Adaptive Systems — ResearchGate", url: "https://www.researchgate.net/publication/373815460_Technology-assisted_Language_Learning_Adaptive_Systems_A_comprehensive_review" },
  37: { label: "Saffron Interactive — Corporate Learning Research", url: "https://saffroninteractive.com/feed/" },
};

// ─── Chart data ───────────────────────────────────────────────────────────────

const masteryLoopData = [
  { step: "Диагностика", value: 85 },
  { step: "Оценка мастерства", value: 78 },
  { step: "Выбор роли ИИ", value: 91 },
  { step: "Микро-сценарий", value: 88 },
  { step: "Переоценка", value: 94 },
];

const retentionData = [
  { label: "Без персонализации", value: 54 },
  { label: "Со стандартным курсом", value: 67 },
  { label: "С диагностикой + трек", value: 86 },
];

const ragData = [
  { name: "Базовая LLM", accuracy: 66.7, f1: 76.4 },
  { name: "LLM + RAG", accuracy: 62.8, f1: 67.3 },
  { name: "MEGA-RAG", accuracy: 79.1, f1: 79.0 },
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
              color: "#1d4ed8", background: "rgba(29,78,216,0.1)",
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

// ─── Layout helpers ───────────────────────────────────────────────────────────

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
    color: "#1d4ed8", background: "rgba(29,78,216,0.08)",
    padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(29,78,216,0.15)",
  }}>{children}</span>
);

const SectionDivider = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "56px 0 28px" }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: "rgba(29,78,216,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={18} color="#1d4ed8" />
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0a0a1a", margin: 0, flex: 1 }}>{label}</h2>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #dbeafe, transparent)" }} />
  </div>
);

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 15, fontWeight: 800, color: "#0a0a1a", margin: "24px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 3, height: 16, background: "#1d4ed8", borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
    {children}
  </p>
);

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f5",
    padding: 24, ...style,
  }}>{children}</div>
);

const KpiCard = ({
  label, value, sub, accent = false
}: {
  label: string; value: string; sub?: React.ReactNode; accent?: boolean;
}) => (
  <div style={{
    background: accent ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" : "#fff",
    borderRadius: 16,
    border: accent ? "none" : "1px solid #e2e8f5",
    padding: "24px 20px",
    position: "relative",
    overflow: "hidden",
  }}>
    {accent && (
      <div style={{ position: "absolute", right: -24, top: -24, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
    )}
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px", color: accent ? "rgba(255,255,255,0.6)" : "#1d4ed8" }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: accent ? "#fff" : "#0a0a1a", lineHeight: 1 }}>{value}</p>
    {sub && <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,0.65)" : "#6b7280", marginTop: 4 }}>{sub}</div>}
  </div>
);

const BlockQuote = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    borderLeft: "3px solid #1d4ed8", background: "rgba(29,78,216,0.04)",
    borderRadius: "0 12px 12px 0", padding: "16px 20px", margin: "24px 0",
    display: "flex", gap: 12,
  }}>
    <Quote size={16} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{children}</p>
  </div>
);

const InsightBox = ({ color = "#1d4ed8", title, children }: { color?: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color, textTransform: "uppercase", margin: "0 0 6px" }}>💡 {title}</p>
    <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.6 }}>{children}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f5", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", margin: "0 0 4px" }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 800, color: p.color || "#1d4ed8", margin: 0 }}>
            {p.name}: {p.value}{p.unit || ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function AdultEducationResearch() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#0a0a1a", background: "#f7f9ff", minHeight: "100vh" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(247,249,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f5",
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <Download size={14} /> PDF
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, #1d4ed8, #2563eb)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <Share2 size={14} /> Поделиться
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px" }}>

        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Tag><Sparkles size={10} /> Обзор исследований · 2024–2026</Tag>
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>ОБНОВЛЕНО АПРЕЛЬ 2026</span>
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 900, color: "#0a0a1a", lineHeight: 1.06, letterSpacing: "-0.02em", margin: "0 0 20px", maxWidth: 780 }}>
            ИИ в образовании взрослых:{" "}
            <span style={{ color: "#1d4ed8" }}>что говорит наука</span>
          </h1>
          <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.7, maxWidth: 680, margin: "0 0 24px" }}>
            Анализ актуальных исследований 2024–2026 годов о том, как искусственный интеллект меняет подходы к обучению взрослых людей — и где кроются главные риски.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: -6 }}>
              <img src="https://picsum.photos/seed/researcher1/80/80" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff" }} referrerPolicy="no-referrer" alt="" />
              <img src="https://picsum.photos/seed/researcher2/80/80" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", marginLeft: -8 }} referrerPolicy="no-referrer" alt="" />
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>MindFlow Research · Апрель 2026</span>
          </div>
        </motion.section>

        {/* KPI Row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
          <KpiCard label="Краткосрочная продуктивность" value="+48%" sub={<>При доступе к ИИ без ограничений <Cite n={3} /></>} />
          <KpiCard label="Результаты на экзамене" value="−17%" sub={<>Когда доступ к ИИ закрывают <Cite n={3} /></>} accent />
          <KpiCard label="Удержание с персонализацией" value="86%" sub={<>При поддержке на старте обучения <Cite n={17} /></>} />
          <KpiCard label="Сокращение времени обучения" value="32–40%" sub={<>Через входную диагностику <Cite n={6} /></>} />
        </motion.div>

        {/* Executive summary */}
        <Card style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 12px" }}>Резюме</p>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8, margin: "0 0 12px" }}>
            Исследования 2024–2026 годов фиксируют ключевое противоречие: ИИ повышает продуктивность в моменте, но при неправильной интеграции в учебный процесс — ослабляет самостоятельные навыки мышления.<Cite n={4} /> Взрослые обучающиеся особенно чувствительны к этому эффекту, поскольку их мотивация строится на практическом применении знаний.
          </p>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.8, margin: 0 }}>
            Системы с входной диагностикой, гибкими ролями ИИ-ассистента, верифицированными источниками и графами знаний показывают стабильно лучшие результаты по удержанию, скорости освоения и доверию со стороны обучающихся.
          </p>
        </Card>

        {/* ══════ SECTION 1: Проблема ══════ */}
        <SectionDivider icon={Globe} label="Главное противоречие: технология против результата" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          Доклад ОЭСР 2026 года фиксирует: использование ИИ без специального педагогического руководства даёт краткосрочный рост производительности до +48%, однако в условиях экзамена, когда доступ к ИИ закрыт, показатели падают на 17%.<Cite n={3} /> Это означает, что технология замещает когнитивные усилия, а не укрепляет их.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#dc2626", margin: "0 0 8px" }}>Модель замещения — проблема</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#991b1b", margin: "0 0 10px" }}>ИИ выполняет задачу вместо человека</p>
            <p style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.65 }}>
              Краткосрочный рост KPI, долгосрочная атрофия навыков. Человек теряет способность действовать без ИИ.<Cite n={4} />
            </p>
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1d4ed8", margin: "0 0 8px" }}>Модель партнёрства — цель</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#1e3a8a", margin: "0 0 10px" }}>ИИ берёт рутину, человек — суждение</p>
            <p style={{ fontSize: 13, color: "#1e3a8a", lineHeight: 1.65 }}>
              Преподаватели и обучающиеся сохраняют ответственность за финальные решения и глубокую рефлексию.<Cite n={4} />
            </p>
          </div>
        </div>

        <BlockQuote>
          Задача образовательных систем — не облегчить процесс обучения, а сделать его более осмысленным. ИИ должен направлять мышление, а не заменять его.<Cite n={8} />
        </BlockQuote>

        {/* ══════ SECTION 2: Стратегии взаимодействия ══════ */}
        <SectionDivider icon={Brain} label="Как взрослые взаимодействуют с ИИ: два сценария" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Исследование Кумара и соавторов (2025) выделяет два типа поведения при работе с ИИ-ассистентом. От того, какой тип преобладает, зависит образовательный результат.<Cite n={7} />
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <Card style={{ borderTop: "3px solid #dc2626" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={16} color="#dc2626" />
              <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: 0 }}>Исполнительный запрос</p>
            </div>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: "0 0 10px" }}>
              Человек просит ИИ дать готовый ответ, чтобы минимизировать усилия.<Cite n={7} /> Результат — поверхностное вовлечение и иллюзия компетентности.
            </p>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#dc2626" }}>Неадаптивная стратегия</span>
          </Card>
          <Card style={{ borderTop: "3px solid #1d4ed8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <CheckCircle2 size={16} color="#1d4ed8" />
              <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: 0 }}>Инструментальный запрос</p>
            </div>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: "0 0 10px" }}>
              Человек получает минимальную подсказку для преодоления конкретного затруднения.<Cite n={7} /> Самостоятельное мышление остаётся активным.
            </p>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1d4ed8" }}>Адаптивная стратегия</span>
          </Card>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "18px 20px", marginBottom: 40, display: "flex", gap: 14 }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: "#92400e" }}>Парадокс Kumar</p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "#a16207" }}>
              Даже при снижении числа исполнительных запросов успеваемость может не расти, если есть глубокие пробелы в базовых знаниях.<Cite n={7} /> Это подтверждает необходимость входной диагностики перед стартом обучения.
            </p>
          </div>
        </div>

        {/* ══════ SECTION 3: Роли ИИ ══════ */}
        <SectionDivider icon={Network} label="Роли ИИ-ассистента: от лектора до оппонента" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Статичный ИИ-ассистент, работающий в одном режиме, уступает системам с динамическим переключением ролей. Исследования 2024–2025 годов подтверждают: выбор роли влияет на глубину усвоения материала.<Cite n={9} />
        </p>

        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Network size={16} color="#1d4ed8" />
            <p style={{ fontWeight: 800, color: "#0a0a1a", margin: 0, fontSize: 14 }}>Четыре роли ИИ для взрослых обучающихся</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { title: "Лектор", desc: "Структурированная подача новых концептов с учётом уровня и опыта обучающегося.", ctx: "Онбординг, новые темы", refs: [9] },
              { title: "Сократ (Зеркало)", desc: "Задаёт вопросы, которые выявляют пробелы в логике. Не даёт готовых ответов.", ctx: "Закрепление, критический анализ", refs: [8, 12] },
              { title: "Тренажёр (Sandbox)", desc: "Практические кейсы с обратной связью по процессу — не по финальному результату.", ctx: "Применение знаний, проекты", refs: [11] },
              { title: "Оппонент", desc: "Ищет контраргументы, требует обоснований. Развивает гибкость мышления.", ctx: "Дебаты, профессиональные решения", refs: [13, 15], accent: true },
            ].map((box) => (
              <div key={box.title} style={{
                padding: "16px",
                borderRadius: 12,
                background: (box as any).accent ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : "#f7f9ff",
                border: (box as any).accent ? "none" : "1px solid #e2e8f5",
              }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: (box as any).accent ? "rgba(255,255,255,0.65)" : "#1d4ed8", margin: "0 0 4px" }}>{box.title}</p>
                <p style={{ fontSize: 11, color: (box as any).accent ? "rgba(255,255,255,0.85)" : "#374151", lineHeight: 1.55, margin: "0 0 6px" }}>{box.desc}</p>
                <p style={{ fontSize: 10, color: (box as any).accent ? "rgba(255,255,255,0.5)" : "#9ca3af", margin: 0 }}>Когда применять: {box.ctx}</p>
              </div>
            ))}
          </div>
          <InsightBox title="Ключевой вывод" color="#1d4ed8">
            Для закрепления знаний наиболее эффективен режим «Сократ»: он вынуждает обучающегося объяснять концепт собственными словами, что соответствует принципам андрагогики.<Cite n={9} />
          </InsightBox>
        </Card>

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 16 }}>
          Внутренний цикл адаптивной системы выглядит следующим образом: входная диагностика → оценка уровня мастерства (p_mastery) → выбор подходящей роли ИИ → целевой микро-сценарий → переоценка мастерства. Каждый виток цикла уточняет траекторию обучения.
        </p>

        <Card style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 20px" }}>Эффективность каждого шага адаптивного цикла</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={masteryLoopData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
              <XAxis dataKey="step" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Эффективность" unit="%" radius={[6, 6, 0, 0]}>
                {masteryLoopData.map((_, i) => (
                  <Cell key={i} fill={["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* ══════ SECTION 4: Диагностика и удержание ══════ */}
        <SectionDivider icon={TrendingUp} label="Входная диагностика и удержание в обучении" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Взрослые обучающиеся мотивированы конкретной пользой и скоростью её получения. ИИ-диагностика в начале обучения позволяет убрать лишнее и сфокусироваться на актуальных пробелах — это напрямую влияет на то, продолжит ли человек обучение.<Cite n={16} />
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { icon: TrendingUp, metric: "32–40%", label: "сокращение времени", desc: "За счёт исключения уже знакомых концептов.", ref: 6 },
            { icon: CheckCircle2, metric: "+40%", label: "вовлечённость", desc: "При персонализации сложности и темпа обучения.", ref: 18 },
            { icon: Zap, metric: "86%", label: "удержание", desc: "Обучающихся продолжают курс при поддержке на старте.", ref: 17 },
          ].map((item) => (
            <Card key={item.label} style={{ borderTop: "3px solid #1d4ed8" }}>
              <item.icon size={18} color="#1d4ed8" style={{ marginBottom: 12 }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#1d4ed8", lineHeight: 1 }}>{item.metric}</span>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{item.label}</span>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>
                {item.desc} <Cite n={item.ref} />
              </p>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <Card>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 20px" }}>Удержание в зависимости от подхода</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={retentionData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={160} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Удержание" unit="%" radius={[0, 6, 6, 0]}>
                  {retentionData.map((_, i) => (
                    <Cell key={i} fill={["#dbeafe", "#93c5fd", "#1d4ed8"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>Кейс — Университет Суррея</p>
            <p style={{ fontSize: 40, fontWeight: 900, color: "#0a0a1a", margin: "0 0 8px", lineHeight: 1 }}>90%</p>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>
              студентов успешно освоили сложные дисциплины после внедрения системы раннего вмешательства с двумя компонентами: предварительной подготовкой и самооценкой.<Cite n={19} />
            </p>
            <InsightBox title="Вывод" color="#1d4ed8">
              Диагностика — не формальность. Это ключевой момент, определяющий траекторию и удержание.<Cite n={6} />
            </InsightBox>
          </Card>
        </div>

        {/* ══════ SECTION 5: RAG и доверие ══════ */}
        <SectionDivider icon={BookOpen} label="Достоверность ответов: RAG и проблема галлюцинаций" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Одна из главных проблем ИИ в образовании — склонность к «галлюцинациям»: уверенные, но ложные ответы. Технология RAG ограничивает область знаний модели проверенными источниками и значительно снижает этот риск.<Cite n={23} />
        </p>

        <Card style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 20px" }}>Сравнение точности методов (MEGA-RAG, N=12 000 вопросов) <Cite n={23} /></p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              {ragData.map((row) => (
                <div key={row.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{row.name}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: row.name === "MEGA-RAG" ? "#1d4ed8" : "#0a0a1a" }}>{row.accuracy}%</span>
                  </div>
                  <div style={{ background: "#f0f4ff", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.accuracy / 85) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      style={{ height: "100%", borderRadius: 6, background: row.name === "MEGA-RAG" ? "#1d4ed8" : "#bfdbfe" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>F1: {row.f1}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <InsightBox title="Ключевой вывод" color="#1d4ed8">
                MEGA-RAG с верификацией превосходит стандартный RAG на 16,3 п.п. по точности. Стандартный RAG без верификации уступает даже базовой LLM по F1 — ненужный контекст создаёт помехи.<Cite n={23} />
              </InsightBox>
              <div style={{ marginTop: 16, background: "#f7f9ff", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Три условия надёжного RAG:</p>
                {[
                  { t: "Привязка к источнику", d: "Каждое утверждение — со ссылкой на конкретную страницу" },
                  { t: "Отказ от домыслов", d: "Система признаёт незнание, если данных нет в базе" },
                  { t: "Иерархический поиск", d: "Защита от «неудачи длинного контекста»" },
                ].map(item => (
                  <div key={item.t} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <CheckCircle2 size={13} color="#1d4ed8" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#374151", margin: 0 }}><strong>{item.t}:</strong> {item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "18px 20px", marginBottom: 40, display: "flex", gap: 14 }}>
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: "#92400e" }}>Ограничение: неудача длинного контекста</p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "#a16207" }}>
              Даже продвинутые RAG-системы могут не найти нужную информацию в середине большого документа.<Cite n={26} /> Для образовательных задач необходимы специальные архитектуры с иерархическим поиском.
            </p>
          </div>
        </div>

        {/* ══════ SECTION 6: Графы знаний ══════ */}
        <SectionDivider icon={Network} label="Графы знаний: персонализация на уровне мастерства" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Персонализация на уровне интересов («вам может понравиться»), — недостаточна для серьёзного обучения. Знаниевые графы (Educational Knowledge Graphs, EKG) переводят систему на уровень доказуемого мастерства: каждый концепт имеет статус и связи с другими концептами.<Cite n={28} />
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 16px" }}>Байесовская модель отслеживания знаний (BKT) <Cite n={29} /></p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { p: "P(initial)", d: "Вероятность того, что навык освоен ещё до начала обучения" },
                { p: "P(learning)", d: "Вероятность перехода к мастерству после одного шага практики" },
                { p: "P(slip)", d: "Вероятность ошибки при наличии мастерства" },
                { p: "P(guess)", d: "Вероятность верного ответа без мастерства" },
              ].map((item) => (
                <div key={item.p} style={{ background: "#eff6ff", borderRadius: 10, padding: "12px", border: "1px solid #bfdbfe" }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#1d4ed8", margin: "0 0 4px", fontFamily: "monospace" }}>{item.p}</p>
                  <p style={{ fontSize: 11, color: "#4b5563", margin: 0, lineHeight: 1.5 }}>{item.d}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "12px 0 0", lineHeight: 1.5 }}>
              Современные версии (2024) учитывают скорость ответа, что точнее определяет реальный уровень мастерства.<Cite n={30} />
            </p>
          </Card>
          <Card>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 16px" }}>Что даёт знаниевый граф</p>
            {[
              { t: "Прозрачная траектория", d: "Обучающийся видит, почему ему рекомендован именно этот шаг, а не другой.", ref: 31 },
              { t: "Экономия времени", d: "Система точно находит, чего не хватает — и не тратит время на то, что уже известно.", ref: 28 },
              { t: "Автоматическое устранение пробелов", d: "Если статус концепта-пререквизита падает, система перестраивает путь.", ref: 18 },
            ].map((item) => (
              <div key={item.t} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <CheckCircle2 size={15} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "#4b5563", margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: "#0a0a1a" }}>{item.t}:</strong> {item.d} <Cite n={item.ref} />
                </p>
              </div>
            ))}
            <InsightBox title="Результат" color="#1d4ed8">
              Студенты, следующие по пути через иерархию пререквизитов, достигают лучших результатов, чем при линейной подаче материала.<Cite n={31} />
            </InsightBox>
          </Card>
        </div>

        {/* ══════ SECTION 7: Андрагогика ══════ */}
        <SectionDivider icon={Users} label="Принципы обучения взрослых и роль ИИ" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Взрослые учатся иначе, чем дети. Педагог Малкольм Ноулз сформулировал принципы андрагогики, которые в эпоху ИИ получают новое технологическое воплощение.<Cite n={32} />
        </p>

        <Card style={{ marginBottom: 32, overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "16px 24px", background: "#f7f9ff", borderBottom: "1px solid #e2e8f5" }}>
            <p style={{ fontWeight: 800, color: "#0a0a1a", margin: 0, fontSize: 14 }}>
              Принципы Ноулза и их реализация через ИИ <Cite n={[32, 33, 34]} />
            </p>
          </div>
          {[
            { p: "Потребность знать «зачем»", i: 'ИИ объясняет смысл: «Этот концепт нужен для вашей цели — X». Не «тема № 3», а конкретная польза.', refs: [32] },
            { p: "Самоуправляемость", i: "Дашборды прогресса, выбор темпа, диагностические ворота — человек сам управляет своим путём.", refs: [34] },
            { p: "Опора на опыт", i: "Граф знаний хранит профессиональный контекст и строит аналогии на его основе.", refs: [18, 33] },
            { p: "Готовность к обучению", i: "Диагностика выявляет актуальные пробелы и убирает лишние модули.", refs: [6] },
            { p: "Ориентация на задачу", i: "ИИ сразу погружает в реальный кейс: концепт применяется на практике.", refs: [11] },
            { p: "Внутренняя мотивация", i: "Визуализация прогресса и обратная связь без внешних оценок — фокус на субъективной значимости.", refs: [35] },
          ].map((row, i) => (
            <div key={row.p} style={{
              padding: "14px 24px",
              display: "flex", gap: 24,
              background: i % 2 === 0 ? "#fff" : "#fafbff",
              borderBottom: "1px solid #f0f4ff",
            }}>
              <div style={{ width: 180, flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", margin: 0 }}>{row.p}</p>
              </div>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, flex: 1, margin: 0 }}>
                {row.i} <Cite n={row.refs} />
              </p>
            </div>
          ))}
        </Card>

        <BlockQuote>
          Взрослый мозг лучше запоминает то, с чем он активно работал. Оптимальное состояние для обучения — не расслабленность, а умеренный интеллектуальный вызов с ощущением прогресса.<Cite n={34} />
        </BlockQuote>

        {/* ══════ SECTION 8: Риски ══════ */}
        <SectionDivider icon={AlertTriangle} label="Риски: когда ИИ вредит обучению" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 20 }}>
          Отчёт ОЭСР и академические исследования 2025 года предупреждают: чрезмерное делегирование мыслительных задач ИИ формирует «когнитивный оффлоадинг» — привычку не думать самостоятельно.<Cite n={4} />
        </p>

        <div style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", borderRadius: 20, padding: 32, marginBottom: 32, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, bottom: -20, opacity: 0.08 }}><Sparkles size={160} color="#fff" /></div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>Три способа противодействия оффлоадингу</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, position: "relative", zIndex: 1 }}>
            {[
              { n: "01", t: "Отложенное внедрение", d: "ИИ как основной инструмент — только после формирования базовых навыков.", ref: 8 },
              { n: "02", t: "ИИ задаёт вопросы", d: "Переход от генератора ответов к генератору вопросов, стимулирующих самостоятельное мышление.", ref: 8 },
              { n: "03", t: "Оценка процесса", d: "Акцент не на финальном результате, а на качестве мышления при взаимодействии с ИИ.", ref: 4 },
            ].map((item) => (
              <div key={item.n}>
                <p style={{ fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.25)", margin: "0 0 8px", lineHeight: 1 }}>{item.n}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{item.t}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                  {item.d} <Cite n={item.ref} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════ SECTION 9: Выводы ══════ */}
        <SectionDivider icon={CheckCircle2} label="Ключевые выводы и рекомендации" />

        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
          На основе анализа современных исследований сформулированы принципы проектирования образовательных систем для взрослых с использованием ИИ.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          {[
            { n: 1, t: "Гибкая смена ролей ИИ", d: "Система должна автоматически выбирать режим ответа — лектор, зеркало, тренажёр или оппонент — в зависимости от текущего уровня мастерства.", refs: [9] },
            { n: 2, t: "Диагностика в начале", d: "Входная диагностика сокращает время обучения на 32–40% и повышает удержание до 86% в первые 30 дней.", refs: [6] },
            { n: 3, t: "Верифицированные источники", d: "RAG-системы с привязкой к авторитетным данным — обязательное требование для профессионального обучения. Снижают галлюцинации и повышают доверие.", refs: [20] },
            { n: 4, t: "Управление знаниями через граф", d: "EKG + BKT-модели дают точную персонализацию: система фокусируется на слабых зонах и не тратит время на освоенное.", refs: [18] },
            { n: 5, t: "ИИ должен знать, когда отступить", d: "Цель не в упрощении задачи, а в том, чтобы сделать мышление более глубоким. Система не должна заменять когнитивные усилия.", refs: [37] },
          ].map((rec) => (
            <div key={rec.n} style={{ display: "flex", gap: 16, background: "#fff", border: "1px solid #e2e8f5", borderRadius: 14, padding: 20 }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#1d4ed8", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                {rec.n}
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 4px" }}>{rec.t}</p>
                <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, margin: 0 }}>
                  {rec.d} <Cite n={rec.refs} />
                </p>
              </div>
            </div>
          ))}
        </div>

        <BlockQuote>
          В эпоху технологической трансформации успех образовательных программ для взрослых определяется не мощностью ИИ-моделей, а качеством их интеграции в педагогический дизайн, учитывающий психологию взрослого человека.<Cite n={4} />
        </BlockQuote>

        {/* Sources */}
        <SectionDivider icon={FileText} label="Список источников" />

        <Card style={{ marginBottom: 56 }}>
          {Object.entries(SOURCES).map(([num, src]) => (
            <div key={num} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f4ff" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#1d4ed8", width: 20, flexShrink: 0, marginTop: 2, fontFamily: "monospace" }}>{num}.</span>
              <a href={src.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", flex: 1, lineHeight: 1.55, display: "flex", alignItems: "center", gap: 6 }}>
                {src.label}
              </a>
              <ExternalLink size={10} color="#c7d2fe" style={{ flexShrink: 0, marginTop: 3 }} />
            </div>
          ))}
        </Card>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e2e8f5", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#0a0a1a", margin: "0 0 4px" }}>MindFlow · Research Intelligence</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>© 2026 MindFlow Digital. Аналитический отдел.</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms of Use", "Contact Analyst"].map((link) => (
              <a key={link} href="#" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none", fontWeight: 500 }}>{link}</a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
