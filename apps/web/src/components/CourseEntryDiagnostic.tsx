import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleOff,
  Lock,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  CAT_MAX_ITEMS,
  CourseDiagnostic,
  DiagnosticQuestion,
  Difficulty,
  diagnosticsByCourseId,
  initThetaWeights,
  rubricByCourseId,
  selectNextItem,
  updateThetaEAP,
} from "@mindflow/shared/courseDiagnostics";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { MarkdownRenderer } from "./MarkdownRenderer";

const MASTERY_STORAGE_PREFIX = "mindflow-diagnostic-complete:";
const KNOWLEDGE_GRAPH_STORAGE_KEY = "mindflow-knowledge-graph";
const COURSE_LEVELS_STORAGE_KEY = "mindflow-course-levels";
const REGISTERED_USER_STORAGE_KEY = "mindflow-user-registered";
const TOPIC_GATES_STORAGE_PREFIX = "mindflow-topic-gates:";

type LevelBand = "Junior (L1)" | "Middle (L2)" | "Senior (L3)";

type KnowledgeNode = {
  courseId: string;
  conceptId: string;
  status: "mastered" | "in_progress" | "weak_spot" | "unknown";
  confidence: number;
  updatedAt: string;
};

type DiagnosticResult = {
  masteryScore: number;
  level: LevelBand;
  theta: number;
  knowledgeGraph: KnowledgeNode[];
  recommendedTopics: string[];
  blockedTopics: string[];
  correctAnswers: number;
  domainScores: Array<{ domainId: string; score: number }>;
};

type Response = { question: DiagnosticQuestion; isCorrect: boolean };

function getDiagnosticStorageKey(courseId: string) {
  return `${MASTERY_STORAGE_PREFIX}${courseId}`;
}

function getDifficultyWeight(difficulty: Difficulty): number {
  if (difficulty === "advanced") return 2;
  if (difficulty === "intermediate") return 1.5;
  return 1;
}

// Map CAT ability estimate θ ∈ [-3, +3] (boundaries of EAP quadrature grid)
// to a 0–100 mastery score by linear rescale, clamped at the boundaries.
function getMasteryFromTheta(theta: number): number {
  const raw = Math.round(((theta + 3) / 6) * 100);
  return Math.max(0, Math.min(100, raw));
}

// Level bands chosen at the midpoints between adjacent item difficulties
// (b_basic = -1, b_intermediate = 0, b_advanced = +1).
function getLevelByTheta(theta: number): LevelBand {
  if (theta >= 0.5) return "Senior (L3)";
  if (theta >= -0.5) return "Middle (L2)";
  return "Junior (L1)";
}

function buildResult(
  diagnostic: CourseDiagnostic,
  responses: Response[],
  finalTheta: number,
): DiagnosticResult {
  const conceptTotals = new Map<string, { total: number; earned: number }>();
  const rubric = rubricByCourseId[diagnostic.courseId];
  const domainTotals = new Map<string, { total: number; earned: number }>();
  let correctAnswers = 0;

  for (const { question, isCorrect } of responses) {
    if (isCorrect) correctAnswers += 1;

    const weight = getDifficultyWeight(question.difficulty);

    const current = conceptTotals.get(question.conceptId) ?? { total: 0, earned: 0 };
    conceptTotals.set(question.conceptId, {
      total: current.total + weight,
      earned: current.earned + (isCorrect ? weight : 0),
    });

    const domainId = rubric?.conceptToDomain[question.conceptId];
    if (domainId) {
      const domainCurrent = domainTotals.get(domainId) ?? { total: 0, earned: 0 };
      domainTotals.set(domainId, {
        total: domainCurrent.total + weight,
        earned: domainCurrent.earned + (isCorrect ? weight : 0),
      });
    }
  }

  const masteryScore = getMasteryFromTheta(finalTheta);
  const level = getLevelByTheta(finalTheta);
  const now = new Date().toISOString();

  const knowledgeGraph: KnowledgeNode[] = Array.from(conceptTotals.entries()).map(([conceptId, metrics]) => {
    const confidence = Number((metrics.earned / metrics.total).toFixed(2));

    let status: KnowledgeNode["status"] = "unknown";
    if (confidence >= 0.75) {
      status = "mastered";
    } else if (confidence >= 0.45) {
      status = "in_progress";
    } else {
      status = "weak_spot";
    }

    return {
      courseId: diagnostic.courseId,
      conceptId,
      status,
      confidence,
      updatedAt: now,
    };
  });

  const statusByConcept = Object.fromEntries(
    knowledgeGraph.map((node) => [node.conceptId, node.status]),
  ) as Record<string, KnowledgeNode["status"]>;

  const blockedTopics = diagnostic.topicGates
    .filter((topic) =>
      topic.prerequisites.some((conceptId) => {
        const status = statusByConcept[conceptId] ?? "unknown";
        return status === "weak_spot" || status === "unknown";
      }),
    )
    .map((topic) => topic.id);

  const recommendedTopics = diagnostic.topicGates
    .filter((topic) => !blockedTopics.includes(topic.id))
    .sort((left, right) => {
      const leftMastered = left.prerequisites.filter((conceptId) => statusByConcept[conceptId] === "mastered").length;
      const rightMastered = right.prerequisites.filter((conceptId) => statusByConcept[conceptId] === "mastered").length;
      return rightMastered - leftMastered;
    })
    .map((topic) => topic.id)
    .slice(0, 3);

  const domainScores = Array.from(domainTotals.entries()).map(([domainId, metrics]) => ({
    domainId,
    score: Math.round((metrics.earned / metrics.total) * 100),
  }));

  return {
    masteryScore,
    level,
    theta: finalTheta,
    knowledgeGraph,
    recommendedTopics,
    blockedTopics,
    correctAnswers,
    domainScores,
  };
}

const LEVEL_MAP: Record<LevelBand, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  "Junior (L1)":  "Beginner",
  "Middle (L2)":  "Intermediate",
  "Senior (L3)":  "Advanced",
};

async function persistResultToSupabase(
  userId: string,
  courseId: string,
  result: DiagnosticResult,
): Promise<void> {
  const { error: levelErr } = await supabase
    .from('course_skill_levels')
    .upsert({
      user_id:      userId,
      course_id:    courseId,
      level:        LEVEL_MAP[result.level],
      mastery_score: result.masteryScore,
      domain_scores: result.domainScores,
      assessed_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,course_id' });

  if (levelErr) console.warn('[diagnostic] course_skill_levels:', levelErr.message);

  const rows = result.knowledgeGraph.map((node) => ({
    user_id:    userId,
    concept_id: node.conceptId,
    p_mastery:  node.confidence,
    attempts:   1,
    updated_at: node.updatedAt,
  }));

  if (rows.length > 0) {
    const { error: masteryErr } = await supabase
      .from('kg_mastery')
      .upsert(rows, { onConflict: 'user_id,concept_id', ignoreDuplicates: true });
    if (masteryErr) console.warn('[diagnostic] kg_mastery:', masteryErr.message);
  }
}

function saveCourseLevel(courseId: string, result: DiagnosticResult) {
  const existing = localStorage.getItem(COURSE_LEVELS_STORAGE_KEY);
  const parsed = existing ? JSON.parse(existing) : {};
  parsed[courseId] = {
    level: result.level,
    masteryScore: result.masteryScore,
    domainScores: result.domainScores,
    assessedAt: new Date().toISOString(),
  };
  localStorage.setItem(COURSE_LEVELS_STORAGE_KEY, JSON.stringify(parsed));
}

function saveTopicGates(
  courseId: string,
  result: DiagnosticResult,
  topicById: Record<string, { id: string; title: string; description: string; prerequisites: string[] }>,
) {
  const gatesData = {
    courseId,
    blockedIds: result.blockedTopics,
    recommendedIds: result.recommendedTopics,
    titles: Object.fromEntries(Object.entries(topicById).map(([id, t]) => [id, t.title])),
    assessedAt: new Date().toISOString(),
  };
  localStorage.setItem(`${TOPIC_GATES_STORAGE_PREFIX}${courseId}`, JSON.stringify(gatesData));
}

function saveKnowledgeGraph(nodes: KnowledgeNode[]) {
  const existing = localStorage.getItem(KNOWLEDGE_GRAPH_STORAGE_KEY);
  const parsed: KnowledgeNode[] = existing ? JSON.parse(existing) : [];

  const byKey = new Map<string, KnowledgeNode>();
  for (const node of parsed) {
    byKey.set(`${node.courseId}:${node.conceptId}`, node);
  }
  for (const node of nodes) {
    byKey.set(`${node.courseId}:${node.conceptId}`, node);
  }

  localStorage.setItem(KNOWLEDGE_GRAPH_STORAGE_KEY, JSON.stringify(Array.from(byKey.values())));
}

export default function CourseEntryDiagnostic() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();

  // CAT state
  const [askedItems, setAskedItems] = useState<DiagnosticQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [theta, setTheta] = useState<number>(0);
  const [weights, setWeights] = useState<number[]>(() => initThetaWeights());
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  // null = checking, true = show diagnostic, false = redirect
  const [shouldShowDiagnostic, setShouldShowDiagnostic] = useState<boolean | null>(null);

  const diagnostic = useMemo(
    () => (courseId ? diagnosticsByCourseId[courseId] : null),
    [courseId],
  );

  const maxItems = useMemo(
    () => (diagnostic ? Math.min(CAT_MAX_ITEMS, diagnostic.questions.length) : 0),
    [diagnostic],
  );

  useEffect(() => {
   if (!courseId || !diagnostic || authLoading) return;

    async function checkGate() {
      const isRegistered = user !== null || localStorage.getItem(REGISTERED_USER_STORAGE_KEY) === "1";
      const alreadyCompleted = localStorage.getItem(getDiagnosticStorageKey(courseId!)) === "1";

      if (!isRegistered || alreadyCompleted) {
        navigate(diagnostic!.destination, { replace: true });
        return;
      }

      if (user) {
        const { data } = await supabase
          .from('course_skill_levels')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId!)
          .maybeSingle();
        if (data) {
          localStorage.setItem(getDiagnosticStorageKey(courseId!), "1");
          navigate(diagnostic!.destination, { replace: true });
          return;
        }
      }


      setShouldShowDiagnostic(true);
    }

    void checkGate();
  }, [courseId, diagnostic, navigate, user, authLoading]);

  // Bootstrap CAT: pick the first item once the diagnostic is visible.
  useEffect(() => {
    if (shouldShowDiagnostic !== true || !diagnostic) return;
    if (askedItems.length > 0) return;
    const first = selectNextItem(0, [], diagnostic.questions);
    if (first) setAskedItems([first]);
  }, [shouldShowDiagnostic, diagnostic, askedItems.length]);

  if (!courseId || !diagnostic) {
    return <Navigate to="/" replace />;
  }

  if (shouldShowDiagnostic === null) {
    return null;
  }

  const currentQuestion = askedItems[askedItems.length - 1] ?? null;
  const selectedOption = currentQuestion ? (answers[currentQuestion.id] ?? null) : null;

  // Скроллим к началу карточки при смене вопроса, чтобы кнопки выбора и
  // «Следующий вопрос» всегда были на одном видимом месте. Без этого
  // переход к новому вопросу оставляет пользователя где попало по скроллу
  // и кажется, что кнопки «прыгают» / не реагируют.
  const questionCardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!currentQuestion) return;
    questionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentQuestion?.id]);
  const answeredCount = askedItems.length;
  const isLastSlot = answeredCount >= maxItems;

  const topicById = Object.fromEntries(
    diagnostic.topicGates.map((topic) => [topic.id, topic]),
  );

  const onSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionIndex }));
  };

  const finishDiagnosticWith = (responses: Response[], finalTheta: number) => {
    const computedResult = buildResult(diagnostic, responses, finalTheta);
    localStorage.setItem(getDiagnosticStorageKey(courseId), "1");
    saveKnowledgeGraph(computedResult.knowledgeGraph);
    saveCourseLevel(courseId, computedResult);
    saveTopicGates(courseId, computedResult, topicById);
    setResult(computedResult);

    if (user) {
      void persistResultToSupabase(user.id, courseId, computedResult);
    }
  };

  // Commit the answer to the current item, update θ via EAP, then either
  // pick the next item (selectNextItem maximises Fisher information at θ)
  // or finish the session.
  const advance = () => {
    if (!currentQuestion) return;
    const selectedIdx = answers[currentQuestion.id];
    if (selectedIdx === null || selectedIdx === undefined) return;

    const isCorrect = selectedIdx === currentQuestion.correctIndex;
    const { theta: newTheta, weights: newWeights } = updateThetaEAP(weights, currentQuestion, isCorrect);

    setTheta(newTheta);
    setWeights(newWeights);

    const responsesSoFar: Response[] = askedItems.map((q, i) => {
      if (i < askedItems.length - 1) {
        return { question: q, isCorrect: answers[q.id] === q.correctIndex };
      }
      return { question: q, isCorrect };
    });

    if (askedItems.length >= maxItems) {
      finishDiagnosticWith(responsesSoFar, newTheta);
      return;
    }

    const next = selectNextItem(
      newTheta,
      askedItems.map((q) => q.id),
      diagnostic.questions,
    );
    if (!next) {
      finishDiagnosticWith(responsesSoFar, newTheta);
      return;
    }
    setAskedItems([...askedItems, next]);
  };

  const proceedToCourse = () => {
    navigate(diagnostic.destination, { replace: true });
  };
  const rubric = rubricByCourseId[diagnostic.courseId];

  return (
    <div className="min-h-screen bg-surface px-6 py-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          К выбору курсов
        </button>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Assessment Engine · Адаптивное тестирование (CAT · IRT 3PL)
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">{diagnostic.courseTitle}</h1>
          <p className="max-w-3xl text-on-surface-variant">
            Адаптивный тест до {maxItems} вопросов: следующий вопрос подбирается по максимуму
            информации Фишера при текущей оценке способности θ, оценка обновляется
            методом EAP. По окончании — Mastery Score, уровень и персональные рекомендации.
          </p>
        </header>

        <section
          ref={questionCardRef}
          className="scroll-mt-6 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm md:p-10"
        >
          {!result && currentQuestion ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
                  Вопрос {answeredCount} из ≤ {maxItems}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant">
                  <Timer className="h-4 w-4" /> ~{diagnostic.estimatedMinutes} минут
                </span>
              </div>

              <div className="mb-3 text-2xl font-bold text-primary">
                <MarkdownRenderer content={currentQuestion.prompt} />
              </div>
              {currentQuestion.context && (
                <div className="mb-8 max-w-3xl text-sm text-on-surface-variant">
                  <MarkdownRenderer content={currentQuestion.context} />
                </div>
              )}

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => onSelectOption(index)}
                    className={`w-full rounded-xl border-2 p-5 text-left transition-all ${
                      selectedOption === index
                        ? "border-secondary bg-surface-container shadow-[0_8px_20px_rgba(26,31,54,0.05)]"
                        : "border-transparent bg-surface-container-low hover:border-secondary/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            selectedOption === index
                              ? "bg-secondary text-white"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-sm font-medium text-primary">
                          <MarkdownRenderer content={option} compact />
                        </span>
                      </div>
                      {selectedOption === index && <CheckCircle2 className="h-5 w-5 text-secondary" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
                {!isLastSlot ? (
                  <button
                    onClick={advance}
                    disabled={selectedOption === null}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Следующий вопрос
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={advance}
                    disabled={selectedOption === null}
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Завершить тест
                    <Trophy className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          ) : result ? (
            <div className="space-y-8">
              <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Результат диагностики</p>
                <div className="mt-3 flex flex-wrap items-end gap-6">
                  <div>
                    <p className="text-4xl font-extrabold text-primary">{result.masteryScore}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Mastery Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{result.level}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Начальный уровень</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{result.correctAnswers}/{askedItems.length}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Верных ответов</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">θ = {result.theta.toFixed(2)}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Оценка способности (EAP)</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> Рекомендованные темы
                  </h3>
                  <ul className="space-y-3 text-sm text-primary">
                    {result.recommendedTopics.length > 0 ? (
                      result.recommendedTopics.map((topicId) => {
                        const topic = topicById[topicId];
                        return (
                          <li key={topicId} className="rounded-lg border border-emerald-200/70 bg-white p-3">
                            <p className="font-semibold">{topic.title}</p>
                            <p className="text-on-surface-variant">{topic.description}</p>
                          </li>
                        );
                      })
                    ) : (
                      <li className="rounded-lg border border-emerald-200/70 bg-white p-3">Сейчас нет открытых рекомендаций.</li>
                    )}
                  </ul>
                </article>

                <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-700">
                    <Lock className="h-5 w-5" /> Заблокированные темы
                  </h3>
                  <ul className="space-y-3 text-sm text-primary">
                    {result.blockedTopics.length > 0 ? (
                      result.blockedTopics.map((topicId) => {
                        const topic = topicById[topicId];
                        return (
                          <li key={topicId} className="rounded-lg border border-amber-200/70 bg-white p-3">
                            <p className="font-semibold">{topic.title}</p>
                            <p className="text-on-surface-variant">{topic.description}</p>
                          </li>
                        );
                      })
                    ) : (
                      <li className="rounded-lg border border-amber-200/70 bg-white p-3">Отлично! Все темы уже доступны.</li>
                    )}
                  </ul>
                </article>
              </div>

              {rubric && (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-5">
                  <p className="mb-3 text-sm font-semibold text-primary">Матрица оценки по областям курса</p>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {rubric.domains.map((domain) => {
                      const domainResult = result.domainScores.find((entry) => entry.domainId === domain.domainId);
                      return (
                        <li key={domain.domainId} className="rounded-lg border border-outline-variant/20 bg-white p-3 text-sm">
                          <p className="font-semibold text-primary">{domain.title}</p>
                          <p className="text-on-surface-variant">Score: {domainResult?.score ?? 0}%</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-5">
                <p className="mb-2 text-sm font-semibold text-primary">Knowledge Graph обновлен</p>
                <p className="text-sm text-on-surface-variant">
                  Концепты по курсу сохранены со статусами mastered / in_progress / weak_spot и confidence в local
                  knowledge_graph для дальнейшей персонализации.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={proceedToCourse}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Перейти к курсу
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Готовим первый вопрос…</p>
          )}
        </section>

        {!result && (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant">
            <p className="inline-flex items-center gap-2">
              <CircleOff className="h-4 w-4" />
              Входной тест доступен зарегистрированному пользователю только при первом входе в курс. После завершения результат фиксируется.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
