/**
 * graphRagBoundary.ts
 *
 * Graph-augmented RAG: after vector search finds relevant chunks,
 * this module looks up neighboring concepts in kg_edges and adds their
 * descriptions as extra context for the LLM.
 *
 * Flow:
 *   retrievedChunks.topic_tags → search_concepts_by_topic_slug → concept_ids
 *   → get_concept_neighbors → GraphRagContext (prerequisites + next steps)
 *   → injected into LearningContext.graph_context
 *
 * The frontend receives `related_topics` in the API response and renders
 * clickable "read more" links pointing to /subjects/mathematics/topics/<name>.
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import type { RagChunk } from "./ragBoundary";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RelatedTopic {
  concept_id: string;
  name: string;
  description: string | null;
  topic_slug: string | null;
  /** URL-encoded human topic name for /subjects/mathematics/topics/:name */
  route_name: string | null;
  direction: "prerequisite" | "next_step";
  /**
   * Confidence/weight of this connection in [0.1, 1.0].
   * Computed from how many retrieved chunks reference the same neighbor:
   * the more source concepts converge on a neighbor, the stronger the signal.
   */
  weight: number;
}

export interface GraphRagContext {
  /** Short prose injected into LearningContext.graph_context for the LLM */
  contextString: string;
  /** Structured list returned to the frontend for rendering links */
  relatedTopics: RelatedTopic[];
}

// ─── Internal types matching Supabase RPC responses ───────────────────────────

interface ConceptRow {
  concept_id: string;
  name: string;
  domain: string;
  description: string | null;
  topic_slug: string | null;
}

interface NeighborRow {
  source_concept_id: string;
  neighbor_concept_id: string;
  neighbor_name: string;
  neighbor_domain: string;
  neighbor_description: string | null;
  neighbor_topic_slug: string | null;
  relation_type: string;
  direction: "prerequisite" | "next_step";
}

// ─── Topic slug → human display name (matches TOPIC_FOLDER_LABEL in ingest.ts) ─

const SLUG_TO_DISPLAY_NAME: Record<string, string> = {
  "matrix-operations":    "Операции с матрицами",
  "rank-basis":           "Ранг и базис",
  "eigenvalues":          "Собственные значения",
  "svd":                  "Сингулярное разложение (SVD)",
  "derivative-gradient":  "Производная и градиент",
  "limits-continuity":    "Пределы и непрерывность",
  "random-variables":     "Случайные величины",
  "bayes":                "Формула Байеса",
  "hypothesis-testing":   "Проверка гипотез",
};

function getRouteName(topicSlug: string | null): string | null {
  if (!topicSlug) return null;
  return SLUG_TO_DISPLAY_NAME[topicSlug] ?? null;
}

// ─── Main: buildGraphRagContext ────────────────────────────────────────────────

export async function buildGraphRagContext(
  chunks: RagChunk[],
  supabase: SupabaseClient,
): Promise<GraphRagContext> {
  const empty: GraphRagContext = { contextString: "", relatedTopics: [] };

  if (chunks.length === 0) return empty;

  // 1. Collect unique topic_tags from retrieved chunks
  const topicSlugs = Array.from(
    new Set(chunks.flatMap((c) => c.topic_tags ?? [])),
  ).filter(Boolean);

  if (topicSlugs.length === 0) return empty;

  // 2. Map topic slugs → concept_ids via DB lookup
  const { data: conceptRows, error: conceptErr } = await supabase.rpc(
    "search_concepts_by_topic_slug",
    { p_topic_slugs: topicSlugs },
  );

  if (conceptErr || !conceptRows || (conceptRows as ConceptRow[]).length === 0) {
    if (conceptErr) {
      console.warn("[graph-rag] search_concepts_by_topic_slug failed:", conceptErr.message);
    }
    return empty;
  }

  const matchedConcepts = conceptRows as ConceptRow[];
  const conceptIds = matchedConcepts.map((c) => c.concept_id);

  // 3. Fetch 1-hop neighbors from kg_edges
  const { data: neighborRows, error: neighborErr } = await supabase.rpc(
    "get_concept_neighbors",
    { p_concept_ids: conceptIds },
  );

  if (neighborErr || !neighborRows || (neighborRows as NeighborRow[]).length === 0) {
    if (neighborErr) {
      console.warn("[graph-rag] get_concept_neighbors failed:", neighborErr.message);
    }
    return empty;
  }

  const neighbors = neighborRows as NeighborRow[];

  // 4. Count occurrences and deduplicate neighbors.
  // Frequency = how many source concepts (from retrieved chunks) point to the
  // same neighbor — proxy for "edge confidence" when kg_edges has no weight.
  const neighborFrequency = new Map<string, number>();
  for (const n of neighbors) {
    const key = `${n.neighbor_concept_id}:${n.direction}`;
    neighborFrequency.set(key, (neighborFrequency.get(key) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const uniqueNeighbors: NeighborRow[] = [];
  for (const n of neighbors) {
    const key = `${n.neighbor_concept_id}:${n.direction}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNeighbors.push(n);
    }
  }

  const maxFreq = Math.max(...neighborFrequency.values(), 1);

  // 5. Build RelatedTopic list with weight, sorted by weight DESC.
  const relatedTopics: RelatedTopic[] = uniqueNeighbors
    .map((n) => {
      const key = `${n.neighbor_concept_id}:${n.direction}`;
      const freq = neighborFrequency.get(key) ?? 1;
      // Normalise to [0.1, 1.0] so a single hit still has visible weight.
      const weight = Math.round((0.1 + (freq / maxFreq) * 0.9) * 1000) / 1000;
      return {
        concept_id:  n.neighbor_concept_id,
        name:        n.neighbor_name,
        description: n.neighbor_description ?? null,
        topic_slug:  n.neighbor_topic_slug ?? null,
        route_name:  getRouteName(n.neighbor_topic_slug),
        direction:   n.direction,
        weight,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  // 6. Build context string for LLM injection
  const prerequisites = relatedTopics.filter((t) => t.direction === "prerequisite");
  const nextSteps     = relatedTopics.filter((t) => t.direction === "next_step");

  const parts: string[] = [];

  if (prerequisites.length > 0) {
    const list = prerequisites
      .map((t) => `«${t.name}»${t.description ? ` — ${t.description.slice(0, 80)}` : ""}`)
      .join("; ");
    parts.push(`Необходимые базовые концепции (рекомендуй изучить если не знакомы): ${list}.`);
  }

  if (nextSteps.length > 0) {
    const list = nextSteps
      .map((t) => `«${t.name}»${t.description ? ` — ${t.description.slice(0, 80)}` : ""}`)
      .join("; ");
    parts.push(`Следующие темы, которые открываются после этой: ${list}.`);
  }

  const contextString = parts.length > 0
    ? `ГРАФ ЗНАНИЙ — связанные концепции:\n${parts.join("\n")}`
    : "";

  return { contextString, relatedTopics };
}
