import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FileText, TrendingUp, ArrowRight, BarChart3, Clock, Tag, Brain, Zap, Users, AlertTriangle, Bot, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";

// ─── Live analytics types ──────────────────────────────────────────────────────

interface CohortFunnel {
  registered:        number;
  completed_diagnostic: number;
  active_learners:   number;
  mastered_3_concepts: number;
}

interface AtRiskUser {
  user_id:           string;
  days_inactive:     number;
  total_interactions: number;
  avg_mastery_score: number;
  churn_risk:        "high" | "medium" | "low";
}

// ─── Cohort Funnel widget ──────────────────────────────────────────────────────

function CohortFunnelWidget() {
  const { user } = useAuth();
  const [funnel,   setFunnel]   = useState<CohortFunnel | null>(null);
  const [atRisk,   setAtRisk]   = useState<AtRiskUser[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      supabase.from("cohort_funnel").select("*").single(),
      supabase
        .from("at_risk_users")
        .select("user_id, days_inactive, total_interactions, avg_mastery_score, churn_risk")
        .in("churn_risk", ["high", "medium"])
        .order("days_inactive", { ascending: false })
        .limit(5),
    ]).then(([funnelRes, riskRes]) => {
      if (funnelRes.data) setFunnel(funnelRes.data as CohortFunnel);
      setAtRisk((riskRes.data ?? []) as AtRiskUser[]);
      setLoading(false);
    });
  }, [user?.id]);

  if (!user || loading) return null;
  if (!funnel) return null;

  const steps = [
    { label: "Зарегистрировались",    value: funnel.registered,            pct: 100 },
    { label: "Прошли диагностику",    value: funnel.completed_diagnostic,  pct: funnel.registered ? Math.round(funnel.completed_diagnostic / funnel.registered * 100) : 0 },
    { label: "Активные (≥5 диалогов)", value: funnel.active_learners,      pct: funnel.registered ? Math.round(funnel.active_learners / funnel.registered * 100) : 0 },
    { label: "Освоили 3+ концепта",   value: funnel.mastered_3_concepts,   pct: funnel.registered ? Math.round(funnel.mastered_3_concepts / funnel.registered * 100) : 0 },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <h2 className="text-xl font-extrabold text-primary mb-6 flex items-center gap-2">
        <Users size={20} className="text-secondary" />
        Когортный анализ (Live)
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Воронка конверсии
          </p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-primary font-medium">{step.label}</span>
                  <span className="text-sm font-bold text-secondary">{step.value}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${step.pct}%`,
                      background: i === 0 ? "#7c3aed" : i === 1 ? "#a78bfa" : i === 2 ? "#10b981" : "#f59e0b",
                    }}
                  />
                </div>
                <div className="text-[10px] text-on-surface-variant mt-0.5">{step.pct}% от регистрации</div>
              </div>
            ))}
          </div>
        </div>

        {/* At-risk users */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-1">
            <AlertTriangle size={11} />
            Риск оттока
          </p>
          {atRisk.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Нет пользователей в зоне риска</p>
          ) : (
            <ul className="space-y-2">
              {atRisk.map((u) => (
                <li key={u.user_id} className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${u.churn_risk === "high" ? "bg-red-500" : "bg-amber-400"}`}
                  />
                  <span className="text-xs text-on-surface-variant font-mono flex-1 truncate">
                    {u.user_id.slice(0, 8)}…
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {u.days_inactive}д без входа
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    u.churn_risk === "high"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {u.churn_risk === "high" ? "Высокий" : "Средний"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  );
}

const reports = [
  {
    id: "mvp-report",
    title: "Отчёт по MVP MindFlow",
    subtitle: "Что внутри MVP, как работают «мозги» сайта, как формируется прогресс — и оцифрованные метрики",
    category: "Дипломный MVP",
    date: "Май 2026",
    readTime: "8 мин",
    tags: ["MVP", "BKT", "RAG", "Метрики", "Защита"],
    featured: true,
    icon: Sparkles,
    path: "/reports/mvp",
    stats: [
      { label: "Тем",          value: "13" },
      { label: "MRR retrieval", value: "0.683" },
      { label: "LLM сравнили",  value: "4" },
    ],
  },
  {
    id: "market-analysis",
    title: "Анализ рынка персонализированных ИИ-платформ",
    subtitle: "Адаптивная диагностика, ролевая оркестрация и RAG-архитектуры в EdTech",
    category: "Анализ рынка",
    date: "Апрель 2026",
    readTime: "15 мин",
    tags: ["EdTech", "ИИ", "RAG"],
    featured: true,
    icon: TrendingUp,
    path: "/reports/market-analysis",
    stats: [
      { label: "CAGR рынка", value: "31.2%" },
      { label: "Рынок к 2030", value: "$32B" },
      { label: "РФ (2024)", value: "149B ₽" },
    ],
  },
  {
    id: "llm-system-report",
    title: "Система запросов к LLM в MindFlow — полный разбор",
    subtitle: "Фактический pipeline: LearningContext, RAG, quick router, orchestrator, fallback и BKT",
    category: "Архитектура",
    date: "Апрель 2026",
    readTime: "14 мин",
    tags: ["LLM", "RAG", "Routing", "BKT", "DeepSeek"],
    featured: true,
    icon: Bot,
    path: "/reports/llm-system-report",
    stats: [
      { label: "Маршруты ролей", value: "4" },
      { label: "LLM-вызовы", value: "1–2" },
      { label: "Fallback", value: "3 провайдера" },
    ],
  },
  {
    id: "adult-education-research",
    title: "ИИ в образовании взрослых: анализ исследований",
    subtitle: "Когнитивные модели, архитектура доверия и адаптивная персонализация",
    category: "Исследования",
    date: "Апрель 2026",
    readTime: "12 мин",
    tags: ["Андрагогика", "BKT", "RAG", "Когниция"],
    featured: true,
    icon: Brain,
    path: "/reports/adult-education-research",
    stats: [
      { label: "Продуктивность", value: "+48%" },
      { label: "Удержание", value: "86%" },
      { label: "Time-to-mastery", value: "−40%" },
    ],
  },
  {
    id: "token-optimization",
    title: "Архитектуры и стратегии минимизации токенов в LLM-платформах",
    subtitle: "Сжатие промптов, кэширование, динамическое управление контекстом и векторные профили",
    category: "Технологии",
    date: "Апрель 2026",
    readTime: "10 мин",
    tags: ["LLM", "Токены", "LLMLingua-2", "RAG", "Кэширование"],
    featured: true,
    icon: Zap,
    path: "/reports/token-optimization",
    stats: [
      { label: "Экономия кэша", value: "−90%" },
      { label: "Сжатие LLMLingua", value: "5×" },
      { label: "Маршрутизация", value: "−48%" },
    ],
  },
];

const comingSoon = [
  {
    title: "Карта AI-рынка LMS 2026",
    category: "Анализ рынка",
    icon: BarChart3,
  },
  {
    title: "Retention-механики в адаптивном обучении",
    category: "Продукт",
    icon: Users,
  },
  {
    title: "Сравнение RAG-фреймворков для EdTech",
    category: "Технологии",
    icon: FileText,
  },
];

export default function Reports() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <header>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-3 block">
          Аналитика
        </span>
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-primary mb-4">Отчёты</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Стратегические исследования рынка образовательных технологий, конкурентный анализ
          и технологические тренды для принятия взвешенных решений.
        </p>
      </header>

      {/* Featured reports */}
      <section>
        <h2 className="text-xl font-extrabold text-primary mb-6">Актуальные отчёты</h2>
        <div className="space-y-6">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(report.path)}
              className="group cursor-pointer bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Top stripe */}
              <div className="h-1 bg-gradient-to-r from-secondary to-purple-500" />

              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Left: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        {report.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                        <Clock size={11} />
                        {report.readTime}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                        <Tag size={11} />
                        {report.date}
                      </span>
                    </div>

                    <h3 className="text-xl lg:text-2xl font-extrabold text-primary mb-2 leading-tight group-hover:text-secondary transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                      {report.subtitle}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {report.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold text-on-surface-variant border border-outline-variant/40 px-2.5 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button className="inline-flex items-center gap-2 text-sm font-bold text-secondary group-hover:gap-3 transition-all">
                      Читать отчёт
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  {/* Right: stats */}
                  <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-44 shrink-0">
                    {report.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-surface-container-low rounded-xl p-4 text-center lg:text-left"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                          {stat.label}
                        </p>
                        <p className="text-xl font-extrabold text-primary">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live cohort analytics */}
      <CohortFunnelWidget />

      {/* Coming soon */}
      <section>
        <h2 className="text-xl font-extrabold text-primary mb-6">Готовятся к публикации</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comingSoon.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/40 px-2 py-0.5 rounded-full">
                Скоро
              </div>
              <item.icon className="text-on-surface-variant mb-4 opacity-40" size={20} />
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                {item.category}
              </p>
              <h3 className="font-bold text-primary text-sm leading-snug opacity-60">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
