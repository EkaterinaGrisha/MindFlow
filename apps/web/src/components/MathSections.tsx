import { motion } from 'motion/react';
import { ArrowLeft, BookMarked, CheckCircle2, ChevronDown, ChevronRight, Circle, LayoutDashboard, Sigma, Lock, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { supabase } from '../lib/supabase';
import { MATH_COURSE_ID, MATH_SECTIONS } from '../lib/courseTopics';

// Topic gate IDs from courseDiagnostics → section title mapping
const GATE_TO_SECTION: Record<string, string> = {
  'math-linear-algebra':  'Линейная алгебра',
  'math-calculus-opt':    'Математический анализ',
  'math-probability':     'Теория вероятностей',
  'math-statistics':      'Математическая статистика',
  'math-numerical':       'Численные методы',
};

interface SectionGates {
  blocked: Set<string>;
  recommended: Set<string>;
}

type ProgressMap = Record<string, { theory: boolean; practice: boolean; independent: boolean }>;

function TopicProgressIcon({ progress }: { progress?: { theory: boolean; practice: boolean; independent: boolean } }) {
  if (!progress) return <Circle className="w-3.5 h-3.5 text-outline-variant/50" />;
  const done = [progress.theory, progress.practice, progress.independent].filter(Boolean).length;
  if (done === 3) return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (done > 0) return <div className="w-3.5 h-3.5 rounded-full border-2 border-secondary bg-secondary/20" />;
  return <Circle className="w-3.5 h-3.5 text-outline-variant/50" />;
}

export default function MathSections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [sectionGates, setSectionGates] = useState<SectionGates>({ blocked: new Set(), recommended: new Set() });

  useEffect(() => {
    const raw = localStorage.getItem(`mindflow-topic-gates:${MATH_COURSE_ID}`);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { blockedIds: string[]; recommendedIds: string[] };
      const blocked = new Set(data.blockedIds.map((id) => GATE_TO_SECTION[id]).filter(Boolean));
      const recommended = new Set(data.recommendedIds.map((id) => GATE_TO_SECTION[id]).filter(Boolean));
      setSectionGates({ blocked, recommended });
    } catch { /* ignore malformed data */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('math_topic_progress')
      .select('topic, page_type, completed')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: ProgressMap = {};
        for (const row of data) {
          if (!map[row.topic]) map[row.topic] = { theory: false, practice: false, independent: false };
          if (row.completed) map[row.topic][row.page_type as 'theory' | 'practice' | 'independent'] = true;
        }
        setProgressMap(map);
      });
  }, [user]);

  const getSectionProgress = (topics: { name: string }[]) => {
    const completed = topics.filter((t) => {
      const p = progressMap[t.name];
      return p?.theory && p?.practice && p?.independent;
    }).length;
    return { completed, total: topics.length };
  };

  const getTopicHref = (_sectionTitle: string, topicName: string) => {
    return `/subjects/mathematics/topics/${encodeURIComponent(topicName)}`;
  };

  return (
    <div className="min-h-screen bg-surface px-6 py-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-8">

        {/* ── Navigation row ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            К выбору курсов
          </button>

          {/* ── Dashboard button ── */}
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md shadow-secondary/20"
          >
            <LayoutDashboard className="h-4 w-4" />
            Перейти в дашборд
          </button>
        </div>

        {/* Header */}
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sigma className="h-4 w-4" />
            Математика для анализа данных
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Разделы курса</h1>
          <p className="text-on-surface-variant max-w-2xl">
            Нажмите на раздел, чтобы развернуть темы. Каждая тема — три вкладки: теория, разбор задач, самостоятельная работа.
          </p>
          {!user && (
            <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-2 inline-flex gap-2">
              💡 <Link to="/login" className="text-secondary font-semibold hover:underline">Войдите</Link>, чтобы отслеживать прогресс и получать персонализированные объяснения.
            </p>
          )}
        </header>

        {/* Sections grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {MATH_SECTIONS.map((section, index) => {
            const isActive = activeSection === section.title;
            const { completed, total } = getSectionProgress(section.topics);
            const pct = Math.round((completed / total) * 100);
            const isBlocked     = sectionGates.blocked.has(section.title);
            const isRecommended = sectionGates.recommended.has(section.title);

            return (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => setActiveSection(isActive ? null : section.title)}
                className={`cursor-pointer rounded-2xl border bg-surface-container-lowest p-5 transition-all duration-200 ${
                  isBlocked
                    ? 'border-amber-200 bg-amber-50/40'
                    : isActive
                      ? 'border-outline-variant/20 md:col-span-2 shadow-md ring-1 ring-secondary/20'
                      : 'border-outline-variant/20 hover:shadow-sm hover:border-secondary/30'
                }`}
              >
                {/* Section header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                        Раздел {index + 1}
                      </span>
                      {completed > 0 && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          {completed}/{total} тем
                        </span>
                      )}
                      {isBlocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Нужна база
                        </span>
                      )}
                      {isRecommended && !isBlocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" /> Рекомендуем
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-primary">{section.title}</h2>
                    <p className="text-sm text-on-surface-variant mt-0.5 leading-snug">{section.description}</p>
                  </div>
                  <div className="shrink-0 text-on-surface-variant">
                    {isBlocked
                      ? <Lock className="w-5 h-5 text-amber-500" />
                      : isActive ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                    }
                  </div>
                </div>

                {/* Progress bar */}
                {user && (
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-3">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {/* Topics list */}
                {isActive && (
                  <div className="mt-4 rounded-xl border border-secondary/15 bg-secondary/5 p-3">
                    <ul className="grid gap-1.5 md:grid-cols-2">
                      {section.topics.map((topic) => {
                        const p = progressMap[topic.name];
                        const allDone = p?.theory && p?.practice && p?.independent;
                        return (
                          <li key={topic.conceptId}>
                            <Link
                              to={getTopicHref(section.title, topic.name)}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-white group ${
                                allDone ? 'border border-green-200' : 'border border-transparent'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TopicProgressIcon progress={p} />
                              <span className="text-primary group-hover:text-secondary transition-colors font-medium">
                                {topic.name}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-outline-variant/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </motion.article>
            );
          })}

          {/* Literature card */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: MATH_SECTIONS.length * 0.06 }}
            className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5"
          >
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-secondary mb-1">
              Дополнительно
            </div>
            <h2 className="text-lg font-bold text-primary mb-1">Использованная литература</h2>
            <p className="text-sm text-on-surface-variant mb-4 leading-snug">
              Учебники и источники, на которые опирается курс.
            </p>
            <Link
              to="/subjects/mathematics/literature"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              <BookMarked className="h-4 w-4" />
              Открыть литературу
            </Link>
          </motion.article>
        </div>

        {/* Overall progress (for logged-in users) */}
        {user && (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5">
            <p className="text-sm font-semibold text-primary mb-3">Общий прогресс по курсу</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MATH_SECTIONS.map((section) => {
                const { completed, total } = getSectionProgress(section.topics);
                return (
                  <div key={section.title} className="flex flex-col gap-1">
                    <p className="text-xs text-on-surface-variant truncate">{section.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-secondary to-purple-500 rounded-full transition-all"
                          style={{ width: `${(completed / total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-on-surface-variant">
                        {completed}/{total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
