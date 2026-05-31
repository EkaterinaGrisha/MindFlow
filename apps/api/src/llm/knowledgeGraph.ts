import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";
import { embedQuery } from "./ragBoundary";
import { buildStudentProfile } from "./studentProfile";
import type { LearningContext } from "@mindflow/shared/llmTypes";

// ─── Supabase client (service role) ──────────────────────────────────────────

const kgSupabase: SupabaseClient | null =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : null;

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasteryStatus = "mastered" | "in_progress" | "weak_spot";

export interface ConceptMastery {
  concept:   string;
  domain:    string;
  p_mastery: number;
  status:    MasteryStatus;
}

export interface KnowledgeGraphContext {
  mastered_concepts:       string;
  weak_concepts:           string;
  knowledge_graph_summary: string;
  raw: ConceptMastery[];
}

// ─── Шаг 10: buildKnowledgeGraphContext ──────────────────────────────────────

export async function buildKnowledgeGraphContext(
  userId:   string | null,
  courseId: string = "math-for-data-science",
): Promise<KnowledgeGraphContext> {
  const fallback: KnowledgeGraphContext = {
    mastered_concepts:       "нет данных",
    weak_concepts:           "нет данных",
    knowledge_graph_summary: "Данные о знаниях недоступны — используй стандартный сценарий.",
    raw: [],
  };

  if (!userId || !kgSupabase) return fallback;

  try {
    // Source 1: BKT-derived mastery from kg_mastery_summary (sparse — needs
    // bkt_attempts to be populated by quiz/sandbox flows). High signal when
    // present but currently mostly empty.
    const { data, error } = await kgSupabase
      .from("kg_mastery_summary")
      .select("concept, domain, p_mastery, status")
      .eq("user_id", userId)
      .eq("course_id", courseId);

    let bktMastered: string[] = [];
    let bktInProgress: string[] = [];
    let bktWeak: string[] = [];
    let bktRows: ConceptMastery[] = [];
    if (!error && data && data.length > 0) {
      bktRows = data as ConceptMastery[];
      bktMastered   = bktRows.filter((r) => r.status === "mastered").map((r) => r.concept);
      bktInProgress = bktRows.filter((r) => r.status === "in_progress").map((r) => r.concept);
      bktWeak       = bktRows.filter((r) => r.status === "weak_spot").map((r) => r.concept);
    }

    // Source 2: PKG-derived profile from buildStudentProfile (aggregates
    // personal_kg_nodes + math_topic_progress + mentor_messages + plans).
    // Measured to improve mentor answer quality by +64 win-rate points —
    // see reports/pkg-lecturer-benchmark.md (PKG 82% vs baseline 18%).
    const profile = await buildStudentProfile(userId, kgSupabase);

    // Merge: BKT signal wins when present; PKG fills the gaps. Dedup by name.
    const masteredSet = new Set(bktMastered);
    for (const c of profile.strong) masteredSet.add(c.name);
    const weakSet = new Set(bktWeak);
    for (const c of profile.weak) weakSet.add(c.name);
    // A concept can't be both strong AND weak — if BKT says weak, drop it from strong.
    for (const w of weakSet) masteredSet.delete(w);

    const mastered = Array.from(masteredSet);
    const weak     = Array.from(weakSet);

    if (mastered.length === 0 && weak.length === 0 && bktInProgress.length === 0 && !profile.goal) {
      return fallback;
    }

    const summaryParts = [
      mastered.length         ? `Освоено: ${mastered.slice(0, 8).join(", ")}`              : null,
      bktInProgress.length    ? `В процессе: ${bktInProgress.join(", ")}`                  : null,
      weak.length             ? `Слабые места: ${weak.slice(0, 6).join(", ")}`             : null,
      profile.goal            ? `Цель студента: ${profile.goal}`                           : null,
      profile.recent.length   ? `Недавно спрашивал: ${profile.recent.slice(0, 2).join("; ")}` : null,
    ].filter(Boolean);

    return {
      mastered_concepts:       mastered.length ? mastered.slice(0, 8).join(", ") : "пока нет",
      weak_concepts:           weak.length     ? weak.slice(0, 6).join(", ")     : "пока нет",
      knowledge_graph_summary: summaryParts.length ? summaryParts.join(". ") : "Нет данных о прогрессе.",
      raw: bktRows,
    };
  } catch (err) {
    console.warn("[KG] buildKnowledgeGraphContext error:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

// ─── Шаг 11: updateMastery (BKT) ─────────────────────────────────────────────

export type BktAttemptSource =
  | "quiz"
  | "sandbox"
  | "mentor_check"
  | "challenger"
  | "other";

export interface UpdateMasteryOptions {
  itemId?:    string;
  source?:    BktAttemptSource;
  timeMs?:    number;
  hintCount?: number;
}

/**
 * Вызывается после AI-проверки/квиза:
 *   await updateMastery(userId, "Ранг и базис", "math-for-data-science", true, {
 *     itemId: "math-5", source: "sandbox", timeMs: 42_000, hintCount: 1,
 *   });
 *
 * source/timeMs/hintCount попадают в bkt_attempts (журнал) и используются
 * офлайн-калибровкой BKT.
 */
export async function updateMastery(
  userId:      string,
  conceptName: string,
  courseId:    string,
  correct:     boolean,
  optsOrItemId?: UpdateMasteryOptions | string,
): Promise<void> {
  if (!kgSupabase) return;

  const opts: UpdateMasteryOptions =
    typeof optsOrItemId === "string"
      ? { itemId: optsOrItemId }
      : optsOrItemId ?? {};

  try {
    const { data: concept, error: lookupErr } = await kgSupabase
      .from("kg_concepts")
      .select("concept_id")
      .eq("name", conceptName)
      .eq("course_id", courseId)
      .single();

    if (lookupErr || !concept) {
      console.warn(`[KG] концепт не найден: "${conceptName}" в курсе "${courseId}"`);
      return;
    }

    const { error } = await kgSupabase.rpc("update_bkt_mastery", {
      p_user_id:      userId,
      p_concept:      concept.concept_id as string,
      correct_answer: correct,
      p_item_id:      opts.itemId ?? null,
      p_source:       opts.source ?? "quiz",
      p_time_ms:      typeof opts.timeMs === "number" ? Math.round(opts.timeMs) : null,
      p_hint_count:   opts.hintCount ?? 0,
    });

    if (error) console.warn(`[KG] update_bkt_mastery error: ${error.message}`);
  } catch (err) {
    console.warn("[KG] updateMastery error:", err instanceof Error ? err.message : err);
  }
}

// ─── Шаг 12: getTopicGates ────────────────────────────────────────────────────

export async function getTopicGates(
  userId:   string,
  courseId: string = "math-for-data-science",
): Promise<{ blocked: string[]; recommended: string[] }> {
  const empty = { blocked: [] as string[], recommended: [] as string[] };
  if (!kgSupabase) return empty;

  try {
    const { data: edges, error: edgeErr } = await kgSupabase
      .from("kg_edges")
      .select(`
        from_concept:kg_concepts!kg_edges_from_concept_fkey(name),
        to_concept:kg_concepts!kg_edges_to_concept_fkey(name),
        relation_type
      `)
      .eq("relation_type", "prerequisite");

    if (edgeErr || !edges) return empty;

    const { data: mastery } = await kgSupabase
      .from("kg_mastery_summary")
      .select("concept, status")
      .eq("user_id", userId)
      .eq("course_id", courseId);

    const statusMap = new Map<string, MasteryStatus>(
      (mastery ?? []).map((m) => [m.concept as string, m.status as MasteryStatus]),
    );

    const prerequisites = new Map<string, string[]>();
    for (const edge of edges) {
      const from = (edge.from_concept as unknown as { name: string }).name;
      const to   = (edge.to_concept   as unknown as { name: string }).name;
      if (!prerequisites.has(to)) prerequisites.set(to, []);
      prerequisites.get(to)!.push(from);
    }

    const blocked: string[]     = [];
    const recommended: string[] = [];

    for (const [topic, prereqs] of prerequisites) {
      const hasWeak = prereqs.some((p) => {
        const s = statusMap.get(p);
        return !s || s === "weak_spot";
      });
      if (hasWeak) {
        blocked.push(topic);
      } else if (!prereqs.every((p) => statusMap.get(p) === "mastered")) {
        recommended.push(topic);
      }
    }

    return { blocked, recommended };
  } catch (err) {
    console.warn("[KG] getTopicGates error:", err instanceof Error ? err.message : err);
    return empty;
  }
}

// ─── Шаг 13: enrichContextWithKG ─────────────────────────────────────────────

/**
 * Обогащает LearningContext данными из Knowledge Graph.
 * Используется в llmEndpoint.ts ПЕРЕД вызовом оркестратора.
 *
 * ИНТЕГРАЦИЯ в apps/api/src/llmEndpoint.ts:
 *
 * 1. Добавить импорт:
 *    import { enrichContextWithKG } from "./llm/knowledgeGraph";
 *
 * 2. Найти блок "Build LearningContext" (~строка 220) и изменить на:
 *
 *    const userId = req.user?.id ?? null;
 *    const baseContext: LearningContext = {
 *      ...body,
 *      retrieved_theory: buildRetrievedTheory(retrievedChunks),
 *      experience: body.experience ?? "не указан",
 *      level: body.level ?? "не указан",
 *      interests: body.interests ?? "не указаны",
 *    };
 *    const context: LearningContext = {
 *      ...baseContext,
 *      ...(await enrichContextWithKG(userId, baseContext) as Partial<LearningContext>),
 *    };
 *
 * 3. В return res.json({...}) убедиться что userId: userId ?? null
 */
export async function enrichContextWithKG(
  userId:  string | null,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!userId) return context;

  const courseId = detectCourseId(context);
  const kg = await buildKnowledgeGraphContext(userId, courseId);

  if (kg.raw.length === 0) return context;

  return {
    ...context,
    mastered_concepts:       kg.mastered_concepts,
    weak_concepts:           kg.weak_concepts,
    knowledge_graph_summary: kg.knowledge_graph_summary,
  };
}

// ─── Шаг 14: logLearningActivity ─────────────────────────────────────────────

export interface LearningActivityInput {
  userId:       string;
  pageContext:  string;
  userQuery:    string;
  aiResponse:   string;
  selectedRole: string;
  /** Суммарный usage всех LLM-вызовов запроса (orchestrator + main). */
  usage?: {
    provider: string;
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
    costRub: number | null;
  } | null;
}

export async function logLearningActivity(input: LearningActivityInput): Promise<void> {
  if (!kgSupabase) return;

  const embeddingResult = await embedQuery(input.userQuery).catch(() => null);
  if (!embeddingResult) return; // Cloudflare недоступен — пропускаем запись

  try {
    const { error } = await kgSupabase.from("learning_activities").insert({
      user_id:       input.userId,
      page_context:  input.pageContext.slice(0, 255),
      user_query:    input.userQuery,
      ai_response:   input.aiResponse,
      selected_role: input.selectedRole,
      embedding:     embeddingResult.embedding,
      llm_provider:  input.usage?.provider ?? null,
      llm_model:     input.usage?.model ?? null,
      input_tokens:  input.usage?.inputTokens ?? null,
      output_tokens: input.usage?.outputTokens ?? null,
      cost_rub:      input.usage?.costRub ?? null,
    });
    if (error) console.warn("[KG] logLearningActivity error:", error.message);
  } catch (err) {
    console.warn("[KG] logLearningActivity error:", err instanceof Error ? err.message : err);
  }
}

// ─── Вспомогательная: определение courseId по контексту ──────────────────────

function detectCourseId(context: Record<string, unknown>): string {
  const text = `${String(context.current_topic ?? "")} ${String(context.current_page ?? "")}`.toLowerCase();

  const mathKeywords   = ["матриц", "алгебр", "производн", "градиент", "вероятност", "статистик", "гипотез", "байес", "базис", "ранг", "собственн"];
  const mlKeywords     = ["регрессия", "классификация", "нейросет", "обучение", "overfitting", "бустинг"];
  const algoKeywords   = ["алгоритм", "граф", "сортировк", "хеш", "bfs", "dfs", "стек", "динамическ"];

  if (mathKeywords.some((k) => text.includes(k))) return "math-for-data-science";
  if (mlKeywords.some((k) => text.includes(k)))   return "machine-learning";
  if (algoKeywords.some((k) => text.includes(k))) return "algorithms";

  return "math-for-data-science";
}
