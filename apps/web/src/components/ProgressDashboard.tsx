import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { MATH_COURSE_ID, MATH_SECTIONS } from '../lib/courseTopics';

type MasteryStatus = 'mastered' | 'in_progress' | 'weak_spot' | 'unknown';

interface ConceptProgress {
  concept_id: string;
  name: string;
  domain: string;
  p_mastery: number;
  status: MasteryStatus;
  attempts: number;
}

interface ProgressDashboardProps {
  courseId?: string;
}


const STATUS_DOT: Record<MasteryStatus, string> = {
  mastered: '#059669',
  in_progress: '#4b41e1',
  weak_spot: '#ef4444',
  unknown: '#94a3b8',
};

const STATUS_BAR: Record<MasteryStatus, string> = {
  mastered: 'bg-emerald-500',
  in_progress: 'bg-secondary',
  weak_spot: 'bg-red-400',
  unknown: 'bg-slate-200',
};

function BigDonut({
  pct,
  size = 140,
  strokeWidth = 14,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-surface-container)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--color-secondary)" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-primary leading-none">{pct}%</span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mt-1">В среднем</span>
      </div>
    </div>
  );
}

const baseConcepts = (): ConceptProgress[] =>
  MATH_SECTIONS.flatMap((section) =>
    section.topics.map((topic) => ({
      concept_id: topic.conceptId,
      name: topic.name,
      domain: section.domain,
      p_mastery: 0,
      status: 'unknown' as MasteryStatus,
      attempts: 0,
    })),
  );

export default function ProgressDashboard({ courseId = MATH_COURSE_ID }: ProgressDashboardProps) {
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<ConceptProgress[]>(baseConcepts());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConcepts(baseConcepts());
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadProgress = async () => {
      setLoading(true);

      const [masteryRes, attemptsRes, topicProgressRes] = await Promise.all([
        supabase
          .from('kg_mastery_summary')
          .select('concept_id, p_mastery, status')
          .eq('user_id', user.id)
          .eq('course_id', courseId),
        supabase
          .from('kg_mastery')
          .select('concept_id, attempts')
          .eq('user_id', user.id),
        supabase
          .from('math_topic_progress')
          .select('topic, page_type, completed')
          .eq('user_id', user.id),
      ]);

      const masteryByConcept = new Map<string, { p_mastery: number; status: MasteryStatus }>();
      for (const row of masteryRes.data ?? []) {
        masteryByConcept.set(String(row.concept_id), {
          p_mastery: Number(row.p_mastery ?? 0),
          status: (row.status as MasteryStatus) ?? 'unknown',
        });
      }

      const attemptsMap = new Map<string, number>(
        (attemptsRes.data ?? []).map((r: { concept_id: string; attempts: number }) => [r.concept_id, r.attempts]),
      );

      const topicCompletion = new Map<string, { done: number; total: number }>();
      for (const row of topicProgressRes.data ?? []) {
        const key = String(row.topic);
        const cur = topicCompletion.get(key) ?? { done: 0, total: 0 };
        cur.total += 1;
        if (row.completed) cur.done += 1;
        topicCompletion.set(key, cur);
      }

      const processed: ConceptProgress[] = baseConcepts().map((c) => {
        const m = masteryByConcept.get(c.concept_id);
        if (m) {
          return { ...c, p_mastery: m.p_mastery, status: m.status, attempts: attemptsMap.get(c.concept_id) ?? 0 };
        }
        const completion = topicCompletion.get(c.name);
        if (!completion || completion.total === 0) {
          return { ...c, attempts: attemptsMap.get(c.concept_id) ?? 0 };
        }
        const ratio = completion.done / completion.total;
        const status: MasteryStatus = ratio >= 0.75 ? 'mastered' : ratio >= 0.35 ? 'in_progress' : 'weak_spot';
        return { ...c, p_mastery: ratio, status, attempts: attemptsMap.get(c.concept_id) ?? completion.done };
      });

      if (isMounted) {
        setConcepts(processed);
        setLoading(false);
      }
    };

    loadProgress().catch(() => {
      if (isMounted) {
        setConcepts(baseConcepts());
        setLoading(false);
      }
    });

    const channel = supabase
      .channel(`progress-v2-${user.id}-${courseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'math_topic_progress', filter: `user_id=eq.${user.id}` }, loadProgress)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kg_mastery_summary', filter: `user_id=eq.${user.id}` }, loadProgress)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kg_mastery', filter: `user_id=eq.${user.id}` }, loadProgress)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, courseId]);

  const stats = useMemo(() => {
    const total = concepts.length;
    const mastered = concepts.filter((c) => c.status === 'mastered').length;
    const inProgress = concepts.filter((c) => c.status === 'in_progress').length;
    const weak = concepts.filter((c) => c.status === 'weak_spot').length;
    const unknown = concepts.filter((c) => c.status === 'unknown').length;
    const avgMastery = total > 0
      ? Math.round((concepts.reduce((s, c) => s + c.p_mastery, 0) / total) * 100)
      : 0;
    return { total, mastered, inProgress, weak, unknown, avgMastery };
  }, [concepts]);

  const byDomain = useMemo(() =>
    concepts.reduce<Record<string, ConceptProgress[]>>((acc, c) => {
      (acc[c.domain] ??= []).push(c);
      return acc;
    }, {}),
    [concepts],
  );

  if (!user) {
    return (
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
        <Brain size={32} className="mx-auto mb-3 text-secondary" />
        <p className="text-sm font-semibold text-primary mb-1">Прогресс недоступен</p>
        <p className="text-xs text-on-surface-variant mb-4">Войдите, чтобы отслеживать прогресс</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Войти <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <header>
        <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant mb-1">
          Прогресс обучения
        </p>
        <h1 className="text-2xl font-extrabold text-primary leading-tight mb-1">
          Карта твоего мастерства
        </h1>
        <p className="text-sm text-on-surface-variant">
          ВКТ-оценка по {stats.total} темам курса · обновляется после каждой задачи
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6"
      >
        {loading ? (
          <div className="flex items-center gap-6">
            <div className="w-[140px] h-[140px] rounded-full bg-surface-container-low animate-pulse shrink-0" />
            <div className="flex-1 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-surface-container-low animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 flex-wrap">
            <BigDonut pct={stats.avgMastery} />
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
              {[
                { label: 'Освоено', value: stats.mastered, color: '#059669', bar: 'bg-emerald-500' },
                { label: 'В работе', value: stats.inProgress, color: '#4b41e1', bar: 'bg-secondary' },
                { label: 'Пробелы', value: stats.weak, color: '#ef4444', bar: 'bg-red-500' },
                { label: 'Не начато', value: stats.unknown, color: '#94a3b8', bar: 'bg-slate-300' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-3 flex flex-col gap-1.5 overflow-hidden relative">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{item.label}</span>
                  </div>
                  <span className="text-2xl font-extrabold text-primary">{item.value}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-container">
                    <div
                      className={`h-full ${item.bar} transition-all duration-700`}
                      style={{ width: `${stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
          key="list"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {(Object.entries(byDomain) as Array<[string, ConceptProgress[]]>).map(([domain, domainConcepts]) => {
            const domainMastered = domainConcepts.filter((c) => c.status === 'mastered').length;
            const domainPct = Math.round((domainMastered / domainConcepts.length) * 100);
            const section = MATH_SECTIONS.find((s) => s.domain === domain);

            return (
              <div
                key={domain}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-primary">{domain}</h3>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-sm font-extrabold text-secondary">{domainPct}%</span>
                    <span className="text-[10px] text-on-surface-variant">{domainMastered}/{domainConcepts.length}</span>
                  </div>
                </div>
                {section && (
                  <p className="text-[11px] text-on-surface-variant mb-3 leading-snug">{section.description}</p>
                )}
                <div className="h-1 rounded-full bg-surface-container overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${domainPct}%`, background: 'var(--color-secondary)' }}
                  />
                </div>
                <div className="space-y-1.5">
                  {domainConcepts.map((c) => (
                    <Link
                      key={c.concept_id}
                      to={`/subjects/mathematics/topics/${encodeURIComponent(c.name)}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container-low transition-colors group"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STATUS_DOT[c.status] }}
                      />
                      <span className="text-[12px] text-primary flex-1 group-hover:text-secondary transition-colors truncate">
                        {c.name}
                      </span>
                      <div className="w-16 h-1 rounded-full bg-surface-container overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${STATUS_BAR[c.status]} transition-all`}
                          style={{ width: `${Math.round(c.p_mastery * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant w-8 text-right shrink-0">
                        {Math.round(c.p_mastery * 100)}%
                      </span>
                      {c.attempts > 0 && (
                        <span className="text-[9px] text-on-surface-variant/60 font-mono shrink-0">
                          {c.attempts}×
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

      <div className="rounded-2xl bg-primary text-white p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">AI-ментор</p>
          <p className="font-bold text-lg leading-tight">Задай вопрос по слабым концептам</p>
          <p className="text-sm text-white/70 mt-1">AI подберёт объяснение под твой уровень</p>
        </div>
        <Link
          to="/mentor"
          className="flex items-center gap-2 bg-secondary text-white px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <Sparkles size={15} />
          Открыть
        </Link>
      </div>
    </div>
  );
}
