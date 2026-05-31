import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCompletionBanner from "./ProfileCompletionBanner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { useSubscription } from "../lib/useSubscription";
import {
  MATH_COURSE_ID,
  MATH_SECTIONS,
  MATH_ALL_EDGES,
  MATH_TOPIC_BY_CONCEPT_ID,
  MATH_TOPIC_BY_NAME,
} from "../lib/courseTopics";

type ProgressRow = {
  topic: string;
  page_type: "theory" | "practice" | "independent";
  completed: boolean;
  visited_at?: string | null;
  last_visited_at?: string | null;
};

type MasteryStatus = "mastered" | "in_progress" | "weak_spot" | "unknown" | "fading";

type MasteryRow = {
  concept_id: string;
  p_mastery: number;
  status: MasteryStatus;
};

type SessionRow = {
  id: string;
  topic: string | null;
  page_type: string | null;
  message_count: number;
  started_at: string;
  ended_at: string | null;
};

const PAGE_TYPE_LABEL: Record<string, string> = {
  theory: "Теория",
  practice: "Практика",
  independent: "Самостоятельная",
};

const PAGE_TYPES: Array<"theory" | "practice" | "independent"> = ["theory", "practice", "independent"];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн назад`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function computeStreak(activeDays: Set<string>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    if (activeDays.has(key)) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

function SmallDonut({
  pct,
  size = 72,
  strokeWidth = 7,
  color = "var(--color-secondary)",
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-container)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-extrabold text-primary leading-none">{pct}%</span>
      </div>
    </div>
  );
}

function ActivityBars({ activeDays }: { activeDays: Set<string> }) {
  return (
    <div className="flex items-end gap-1.5 h-10">
      {Array.from({ length: 7 }).map((_, i) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - i));
        const key = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
        const active = activeDays.has(key);
        const dayLabel = new Intl.DateTimeFormat("ru-RU", { weekday: "narrow" }).format(day);
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: active ? "32px" : "12px",
                background: active ? "var(--color-secondary)" : "var(--color-surface-container)",
                opacity: active ? 1 : 0.6,
              }}
            />
            <span className="text-[9px] text-on-surface-variant">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, isTrialActive, daysLeftInTrial, hasAccess, loading: subLoading } = useSubscription();
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [masteryRows, setMasteryRows] = useState<MasteryRow[]>([]);
  const [lastSession, setLastSession] = useState<SessionRow | null>(null);
  const [lastSessionPreview, setLastSessionPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProgressRows([]);
      setMasteryRows([]);
      setLastSession(null);
      setLastSessionPreview(null);
      return;
    }
    let isMounted = true;

    const load = async () => {
      const [progressRes, masteryRes, sessionRes] = await Promise.all([
        supabase
          .from("math_topic_progress")
          .select("topic, page_type, completed, visited_at, last_visited_at")
          .eq("user_id", user.id),
        supabase
          .from("kg_mastery_summary")
          .select("concept_id, p_mastery, status")
          .eq("user_id", user.id)
          .eq("course_id", MATH_COURSE_ID),
        supabase
          .from("mentor_sessions")
          .select("id, topic, page_type, message_count, started_at, ended_at")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(1),
      ]);
      if (!isMounted) return;
      if (progressRes.data) setProgressRows(progressRes.data as ProgressRow[]);
      if (masteryRes.data) setMasteryRows(masteryRes.data as MasteryRow[]);
      if (sessionRes.data && sessionRes.data.length > 0) {
        const s = sessionRes.data[0] as SessionRow;
        setLastSession(s);
        const { data: firstMsg } = await supabase
          .from("mentor_messages")
          .select("content")
          .eq("session_id", s.id)
          .eq("role", "user")
          .order("created_at", { ascending: true })
          .limit(1);
        if (isMounted) {
          setLastSessionPreview(firstMsg?.[0]?.content?.slice(0, 140) ?? null);
        }
      } else {
        setLastSession(null);
        setLastSessionPreview(null);
      }
    };

    load();

    const channel = supabase
      .channel(`dashboard-v3-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "math_topic_progress", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "kg_mastery_summary", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "mentor_sessions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const userName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const fromMeta = (meta.full_name as string) || (meta.name as string) || (meta.first_name as string);
    if (fromMeta) return fromMeta.split(" ")[0];
    const email = user?.email ?? "";
    if (!email) return "";
    return email.split("@")[0];
  }, [user]);

  const resumeCard = useMemo(() => {
    if (progressRows.length === 0) return null;

    const byTopic = new Map<string, ProgressRow[]>();
    for (const row of progressRows) {
      const arr = byTopic.get(row.topic) ?? [];
      arr.push(row);
      byTopic.set(row.topic, arr);
    }

    let latestTopic = "";
    let latestTs = 0;
    for (const [topic, rows] of byTopic) {
      for (const row of rows) {
        const ts = new Date(row.last_visited_at ?? row.visited_at ?? 0).getTime();
        if (ts > latestTs) {
          latestTs = ts;
          latestTopic = topic;
        }
      }
    }
    if (!latestTopic) return null;

    const rows = byTopic.get(latestTopic) ?? [];
    const total = PAGE_TYPES.length;
    const completedCount = rows.filter((r) => r.completed).length;
    const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    const uncompletedPages = PAGE_TYPES.filter((pt) => !rows.find((r) => r.page_type === pt && r.completed));
    const currentPageType = uncompletedPages[0] ?? "theory";
    const timeRemaining = uncompletedPages.length * 15;

    const byName = MATH_TOPIC_BY_NAME[latestTopic];

    return {
      topic: latestTopic,
      conceptId: byName?.topic.conceptId ?? null,
      section: byName?.section ?? null,
      pct,
      completedCount,
      total,
      currentPageType,
      timeRemaining,
      lastVisitedIso: new Date(latestTs).toISOString(),
    };
  }, [progressRows]);

  const masteryByConcept = useMemo(() => {
    const m = new Map<string, MasteryRow>();
    for (const row of masteryRows) m.set(row.concept_id, row);
    return m;
  }, [masteryRows]);

  /** KG-рекомендации: следующие темы, у которых prereq освоен, а сама ещё нет. */
  const kgRecommendations = useMemo(() => {
    if (!resumeCard?.conceptId) return [];
    const fromId = resumeCard.conceptId;

    const candidates = MATH_ALL_EDGES.filter((e) => e.from === fromId).map((e) => ({
      conceptId: e.to,
      reason: e.reason,
      cross: e.cross,
    }));

    const seen = new Set<string>();
    const result: Array<{ name: string; sectionTitle: string; reason: string; cross: boolean; mastery: number }> = [];
    for (const c of candidates) {
      if (seen.has(c.conceptId)) continue;
      seen.add(c.conceptId);
      const entry = MATH_TOPIC_BY_CONCEPT_ID[c.conceptId];
      if (!entry) continue;
      const mast = masteryByConcept.get(c.conceptId);
      if (mast && mast.status === "mastered") continue;
      const reason =
        c.reason ??
        `Продолжение раздела «${entry.section.title}» — логический следующий шаг.`;
      result.push({
        name: entry.topic.name,
        sectionTitle: entry.section.title,
        reason,
        cross: c.cross,
        mastery: mast?.p_mastery ?? 0,
      });
      if (result.length >= 3) break;
    }
    return result;
  }, [resumeCard, masteryByConcept]);

  const masteryStats = useMemo(() => {
    if (masteryRows.length > 0) {
      const mastered = masteryRows.filter((r) => r.status === "mastered").length;
      const inProgress = masteryRows.filter((r) => r.status === "in_progress").length;
      const weakSpot = masteryRows.filter((r) => r.status === "weak_spot").length;
      const total = MATH_SECTIONS.reduce((s, sec) => s + sec.topics.length, 0);
      const avgPct = masteryRows.length > 0
        ? Math.round((masteryRows.reduce((s, r) => s + r.p_mastery, 0) / masteryRows.length) * 100)
        : 0;
      return { mastered, inProgress, weakSpot, avgPct, total };
    }

    const allTopics = MATH_SECTIONS.flatMap((s) => s.topics);
    const total = allTopics.length;
    const byTopic = new Map<string, ProgressRow[]>();
    for (const row of progressRows) {
      const arr = byTopic.get(row.topic) ?? [];
      arr.push(row);
      byTopic.set(row.topic, arr);
    }
    let mastered = 0;
    let inProgress = 0;
    let weakSpot = 0;
    for (const topic of allTopics) {
      const rows = byTopic.get(topic.name) ?? [];
      if (rows.length === 0) continue;
      const done = rows.filter((r) => r.completed).length;
      const ratio = done / PAGE_TYPES.length;
      if (ratio >= 0.75) mastered++;
      else if (ratio >= 0.35) inProgress++;
      else weakSpot++;
    }
    const avgPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { mastered, inProgress, weakSpot, avgPct, total };
  }, [masteryRows, progressRows]);

  /** Top-3 пробелы: weak_spot со статусом или 3 самые низкие p_mastery среди начатых. */
  const weakTopics = useMemo(() => {
    if (masteryRows.length === 0) return [];
    const rows = [...masteryRows]
      .filter((r) => r.status !== "mastered")
      .sort((a, b) => {
        const aw = a.status === "weak_spot" ? 0 : 1;
        const bw = b.status === "weak_spot" ? 0 : 1;
        if (aw !== bw) return aw - bw;
        return a.p_mastery - b.p_mastery;
      })
      .slice(0, 3);
    return rows
      .map((r) => {
        const entry = MATH_TOPIC_BY_CONCEPT_ID[r.concept_id];
        if (!entry) return null;
        return {
          name: entry.topic.name,
          sectionTitle: entry.section.title,
          mastery: Math.round(r.p_mastery * 100),
          status: r.status,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [masteryRows]);

  /** Прогресс по разделам. */
  const sectionProgress = useMemo(() => {
    return MATH_SECTIONS.map((section) => {
      const total = section.topics.length;
      let masteredCount = 0;
      let sumPct = 0;
      let seen = 0;
      for (const topic of section.topics) {
        const m = masteryByConcept.get(topic.conceptId);
        if (m) {
          seen++;
          sumPct += m.p_mastery;
          if (m.status === "mastered") masteredCount++;
        }
      }
      if (seen === 0) {
        const byTopic = new Map<string, ProgressRow[]>();
        for (const row of progressRows) {
          const arr = byTopic.get(row.topic) ?? [];
          arr.push(row);
          byTopic.set(row.topic, arr);
        }
        let completed = 0;
        for (const topic of section.topics) {
          const rows = byTopic.get(topic.name) ?? [];
          if (rows.filter((r) => r.completed).length >= 2) completed++;
        }
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { id: section.id, title: section.title, total, masteredCount: completed, pct };
      }
      const pct = Math.round((sumPct / total) * 100);
      return { id: section.id, title: section.title, total, masteredCount, pct };
    });
  }, [masteryByConcept, progressRows]);

  const activeDays = useMemo(
    () =>
      new Set(
        progressRows
          .map((r) => r.last_visited_at ?? r.visited_at)
          .filter((v): v is string => Boolean(v))
          .map(dayKey),
      ),
    [progressRows],
  );

  const streak = useMemo(() => computeStreak(activeDays), [activeDays]);

  const handleMentorOpen = (prefilledTopic?: string) => {
    if (prefilledTopic) {
      navigate(`/workspace?topic=${encodeURIComponent(prefilledTopic)}`);
    } else {
      navigate("/workspace");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <ProfileCompletionBanner />
      {/* ── Hero: greeting + subscription status ──────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">
            Дашборд
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight">
            Привет{userName ? `, ${userName}` : ""}
            {streak >= 2 && (
              <span className="ml-3 text-base font-bold text-orange-500">· {streak} дней подряд 🔥</span>
            )}
          </h1>
        </div>

        {!subLoading && (
          <div className="flex items-center gap-3 shrink-0">
            {isPro && !isTrialActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 px-3 py-1.5 text-xs font-semibold">
                ◆ Pro активен
              </span>
            )}
            {isTrialActive && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 text-secondary px-3 py-1.5 text-xs font-semibold">
                  Триал · {daysLeftInTrial ?? 0} {(daysLeftInTrial === 1) ? "день" : "дн"} осталось
                </span>
                <button
                  onClick={() => navigate("/pricing")}
                  className="text-xs font-semibold text-primary hover:text-secondary transition-colors"
                >
                  Оформить Pro →
                </button>
              </>
            )}
            {!isPro && !isTrialActive && (
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                ◆ Попробовать Pro · 7 дней free
              </button>
            )}
          </div>
        )}
      </motion.section>

      {/* ── Resume card + KG recommendations ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden"
      >
        {resumeCard ? (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: resume */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-outline-variant/10">
              <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">
                Продолжить с того места, где остановилась
              </p>
              <p className="text-xs text-on-surface-variant mb-4">
                Остановилась {timeAgo(resumeCard.lastVisitedIso)} · ~{resumeCard.timeRemaining} мин до конца
              </p>

              {resumeCard.section && (
                <span className="inline-block text-[10px] uppercase tracking-[0.2em] bg-secondary/10 text-secondary rounded-full px-2.5 py-0.5 mb-3">
                  {resumeCard.section.title}
                </span>
              )}

              <h2 className="text-2xl font-extrabold text-primary leading-tight mb-1">
                {resumeCard.topic}
              </h2>
              <p className="text-xs text-on-surface-variant mb-5">
                {PAGE_TYPE_LABEL[resumeCard.currentPageType]} · в процессе
              </p>

              <div className="mb-5">
                <div className="flex justify-between text-[11px] text-on-surface-variant mb-1.5">
                  <span>Прогресс темы</span>
                  <span className="font-semibold text-primary">{resumeCard.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${resumeCard.pct}%`, background: "var(--color-secondary)" }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/subjects/mathematics/topics/${encodeURIComponent(resumeCard.topic)}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  ▶ Продолжить
                </button>
                <button
                  onClick={() => navigate("/subjects/mathematics")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-secondary transition-colors px-2 py-2.5"
                >
                  Сменить тему →
                </button>
              </div>
            </div>

            {/* Right: KG next-steps */}
            <div className="p-6 md:p-8 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">
                  Дальше по графу знаний
                </p>
                <button
                  onClick={() => navigate("/knowledge-graph")}
                  className="text-[10px] uppercase tracking-wider text-secondary font-semibold hover:underline"
                >
                  Граф →
                </button>
              </div>

              {kgRecommendations.length > 0 ? (
                <div className="space-y-2">
                  {kgRecommendations.map((rec) => (
                    <button
                      key={rec.name}
                      onClick={() => navigate(`/subjects/mathematics/topics/${encodeURIComponent(rec.name)}`)}
                      className="w-full text-left rounded-xl border border-outline-variant/10 bg-surface-container-low hover:border-secondary/30 hover:bg-secondary/5 transition-all px-4 py-3 group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <span className="font-semibold text-primary text-sm leading-tight">
                          {rec.name}
                        </span>
                        {rec.cross && (
                          <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 shrink-0">
                            межраздел
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {rec.reason}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low px-4 py-3">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ты на переднем крае раздела — продолжи или открой граф знаний, чтобы выбрать следующий шаг.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-2">
              Добро пожаловать
            </p>
            <h2 className="text-2xl font-extrabold text-primary mb-3">Начни обучение</h2>
            <p className="text-sm text-on-surface-variant mb-6 max-w-lg">
              Выбери первую тему по математике для Data Science и начни осваивать материал.
            </p>
            <button
              onClick={() => navigate("/subjects/mathematics")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              ▶ Начать курс
            </button>
          </div>
        )}
      </motion.section>

      {/* ── AI Workspace card + Gaps list ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* AI Workspace */}
        <div className="rounded-2xl border border-outline-variant/20 bg-gradient-to-br from-surface-container-lowest to-secondary/5 p-6 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">
                AI-ментор
              </p>
              <h3 className="text-lg font-extrabold text-primary leading-tight">
                {lastSession ? "Продолжи разговор" : "Спроси AI-ментора"}
              </h3>
            </div>
            {hasAccess ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                {isPro && !isTrialActive ? "Pro" : "Trial"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                Pro
              </span>
            )}
          </div>

          {lastSession ? (
            <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/10 px-4 py-3 mb-4 flex-1">
              {lastSession.topic && (
                <p className="text-[11px] text-secondary font-semibold mb-1">
                  {lastSession.topic}
                  {lastSession.page_type && ` · ${PAGE_TYPE_LABEL[lastSession.page_type] ?? lastSession.page_type}`}
                </p>
              )}
              <p className="text-sm text-primary leading-snug line-clamp-3">
                {lastSessionPreview ?? "Открытый разговор без сообщений"}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-2">
                {timeAgo(lastSession.started_at)} · {lastSession.message_count} сообщ.
              </p>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1">
              Разбор задачи, объяснение шага, проверка решения. Ментор не решает за тебя — задаёт вопросы, чтобы ты поняла сама.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMentorOpen()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {lastSession ? "Продолжить" : "Спросить"} →
            </button>
            {!hasAccess && (
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
              >
                Начать триал
              </button>
            )}
          </div>
        </div>

        {/* Gaps */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">
                Слабые места
              </p>
              <h3 className="text-lg font-extrabold text-primary leading-tight">
                {weakTopics.length > 0 ? "Эти темы стоит подтянуть" : "Пробелов пока нет"}
              </h3>
            </div>
            {weakTopics.length > 0 && (
              <span className="text-xs text-red-600 font-semibold shrink-0">
                {weakTopics.length}
              </span>
            )}
          </div>

          {weakTopics.length > 0 ? (
            <div className="space-y-2 flex-1">
              {weakTopics.map((w) => (
                <div
                  key={w.name}
                  className="rounded-xl border border-outline-variant/10 bg-surface-container-low px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-primary text-sm leading-tight truncate">
                        {w.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                        {w.sectionTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-xs font-bold text-red-600">{w.mastery}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/subjects/mathematics/topics/${encodeURIComponent(w.name)}`)}
                      className="text-[11px] font-semibold text-primary hover:text-secondary transition-colors"
                    >
                      Повторить теорию →
                    </button>
                    {hasAccess && (
                      <button
                        onClick={() => handleMentorOpen(w.name)}
                        className="text-[11px] font-semibold text-secondary hover:underline"
                      >
                        Решить с ментором
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
              Слабые места появятся, как только ты начнёшь активно работать с темами и ментор соберёт данные о твоих ответах.
            </p>
          )}
        </div>
      </motion.section>

      {/* ── Stats: donut + activity + streak ──────────────────────────────── */}
      <motion.section
        data-tour="progress-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Donut + counters */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 flex items-center gap-4">
          <SmallDonut pct={masteryStats.avgPct} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1">
              Прогресс курса
            </p>
            <p className="text-xs text-on-surface-variant mb-2">
              {masteryStats.mastered} из {masteryStats.total} тем освоено
            </p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-on-surface-variant">Освоено</span>
                <span className="font-bold text-primary">{masteryStats.mastered}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <span className="text-on-surface-variant">В работе</span>
                <span className="font-bold text-primary">{masteryStats.inProgress}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 flex items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <span className="text-3xl">🔥</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1">
              Серия
            </p>
            <p className="text-3xl font-extrabold text-primary leading-none">{streak}</p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              {streak === 0 ? "Начни сегодня — и серия пойдёт" : streak === 1 ? "день · продолжай завтра" : "дней подряд"}
            </p>
          </div>
        </div>

        {/* Activity 7 days */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
            Активность · 7 дней
          </p>
          <ActivityBars activeDays={activeDays} />
          <p className="text-[10px] text-on-surface-variant">
            {activeDays.size} {activeDays.size === 1 ? "активный день" : "активных дней"} за неделю
          </p>
        </div>
      </motion.section>

      {/* ── Sections quick links ──────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant">
            Разделы курса
          </p>
          <button
            onClick={() => navigate("/subjects/mathematics")}
            className="text-[10px] uppercase tracking-wider text-secondary font-semibold hover:underline"
          >
            Все темы →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionProgress.map((sec) => (
            <button
              key={sec.id}
              onClick={() => navigate("/subjects/mathematics")}
              className="text-left rounded-2xl border border-outline-variant/20 bg-surface-container-lowest hover:border-secondary/30 hover:bg-secondary/5 transition-all p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-primary text-sm leading-tight">
                  {sec.title}
                </p>
                <span className="text-xs font-bold text-secondary shrink-0">
                  {sec.pct}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-surface-container overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${sec.pct}%`, background: "var(--color-secondary)" }}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant">
                {sec.masteredCount} из {sec.total} тем
              </p>
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
