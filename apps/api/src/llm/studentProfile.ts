/**
 * studentProfile.ts
 *
 * PKG aggregator: builds a compact "what the student knows / struggles with /
 * recently learned" profile by joining everything we already collect about
 * the user. This is the read-side of the Personal Knowledge Graph that the
 * write-side (personalKnowledgeGraph.ts + BKT + math_topic_progress) has
 * been populating but nobody was reading from.
 *
 * Sources combined:
 *   - personal_kg_nodes  — concepts extracted from mentor dialogs (mention_count, mastery_score)
 *   - kg_mastery_summary — BKT-style mastery per (user, concept) — currently sparse (0 attempts)
 *   - math_topic_progress — page-by-page completion + scores on topic pages
 *   - mentor_messages    — last N user-side messages (intent signal)
 *   - learning_plans     — declared learning goals (free-text)
 *
 * Output is a typed object plus a `formatForPrompt(profile)` helper that
 * renders a 5-10 line block to inject into LECTURER / ORCHESTRATOR prompts.
 *
 * Cold start (new user with no data) is handled — we return an empty profile,
 * and the formatter outputs a short "профиль ещё не собран" hint, so the
 * mentor still gets a clean prompt instead of empty/undefined fields.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileConcept {
  /** Human-readable name. Source: personal_kg_nodes.label OR kg_mastery_summary.concept */
  name: string;
  /** Domain (e.g. "Линейная алгебра"). May be missing in personal_kg_nodes. */
  domain: string | null;
  /** Where the evidence came from — useful for debugging the profile */
  source: "personal_dialog" | "bkt_mastery" | "topic_progress";
  /** Numeric strength — meaning varies by source; only used for sorting */
  strength: number;
}

export interface StudentProfile {
  /** Concepts the student has demonstrated mastery on */
  strong: ProfileConcept[];
  /** Concepts where the student has visible struggle */
  weak: ProfileConcept[];
  /** Topics touched in the last 7 days (chat or page visit) */
  recent: string[];
  /** Declared learning goal, free text */
  goal: string | null;
  /** True if the user has any data at all */
  isEmpty: boolean;
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

const RECENT_DAYS = 7;
const STRONG_LIMIT = 8;
const WEAK_LIMIT = 8;
const RECENT_LIMIT = 6;

export async function buildStudentProfile(
  userId: string,
  supabase: SupabaseClient,
): Promise<StudentProfile> {
  // Fetch all 4 sources in parallel — they're independent.
  const sinceRecent = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [pkgRes, masteryRes, topicProgRes, msgRes, planRes] = await Promise.all([
    supabase
      .from("personal_kg_nodes")
      .select("label, domain, mention_count, mastery_score, last_seen_at")
      .eq("user_id", userId),
    supabase
      .from("kg_mastery_summary")
      .select("concept, domain, p_mastery, attempts")
      .eq("user_id", userId),
    supabase
      .from("math_topic_progress")
      .select("topic, completed, score, last_visited_at")
      .eq("user_id", userId),
    supabase
      .from("mentor_messages")
      .select("content, created_at")
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", sinceRecent)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("learning_plans")
      .select("goal, title, updated_at, is_archived")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const strongMap = new Map<string, ProfileConcept>();
  const weakMap = new Map<string, ProfileConcept>();

  // 1. personal_kg_nodes — mention-count based mastery (rough)
  for (const r of (pkgRes.data ?? [])) {
    const row = r as { label: string; domain: string | null; mention_count: number; mastery_score: number };
    const name = row.label.trim();
    if (!name) continue;
    // Mention-count score is a noisy signal. We trust it only at the extremes:
    if (row.mastery_score >= 0.5 && row.mention_count >= 3) {
      strongMap.set(name, { name, domain: row.domain, source: "personal_dialog", strength: Number(row.mastery_score) });
    } else if (row.mention_count >= 2 && row.mastery_score < 0.3) {
      // Multiple mentions but low mastery score → student keeps coming back without progress
      weakMap.set(name, { name, domain: row.domain, source: "personal_dialog", strength: Number(row.mastery_score) });
    }
  }

  // 2. kg_mastery_summary — BKT-based mastery (high signal, but sparse for now)
  for (const r of (masteryRes.data ?? [])) {
    const row = r as { concept: string; domain: string | null; p_mastery: number; attempts: number };
    if (!row.concept || row.attempts < 1) continue;
    const name = row.concept;
    if (row.p_mastery >= 0.7) {
      strongMap.set(name, { name, domain: row.domain, source: "bkt_mastery", strength: row.p_mastery });
    } else if (row.p_mastery < 0.4 && row.attempts >= 2) {
      weakMap.set(name, { name, domain: row.domain, source: "bkt_mastery", strength: row.p_mastery });
    }
  }

  // 3. math_topic_progress — completed pages mean the topic is at least familiar
  for (const r of (topicProgRes.data ?? [])) {
    const row = r as { topic: string; completed: boolean; score: number | null };
    if (!row.topic) continue;
    const name = row.topic;
    // High score on completed page = strong; low score on incomplete = weak
    if (row.completed && (row.score === null || row.score >= 80) && !strongMap.has(name)) {
      strongMap.set(name, { name, domain: null, source: "topic_progress", strength: (row.score ?? 100) / 100 });
    } else if (row.score !== null && row.score < 50 && !weakMap.has(name)) {
      weakMap.set(name, { name, domain: null, source: "topic_progress", strength: row.score / 100 });
    }
  }

  const strong = Array.from(strongMap.values())
    .sort((a, b) => b.strength - a.strength)
    .slice(0, STRONG_LIMIT);

  const weak = Array.from(weakMap.values())
    .sort((a, b) => a.strength - b.strength)
    .slice(0, WEAK_LIMIT);

  // 4. recent topics — extract from last user messages (short summary, not full text)
  const recentRaw: string[] = ((msgRes.data ?? []) as { content: string }[])
    .map((m) => m.content.trim().slice(0, 80))
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const recent: string[] = [];
  for (const r of recentRaw) {
    const k = r.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      recent.push(r);
      if (recent.length >= RECENT_LIMIT) break;
    }
  }

  // 5. goal — free-text declared learning goal
  const goalRow = (planRes.data?.[0] ?? null) as { goal?: string | null; title?: string | null } | null;
  const goal = goalRow ? (goalRow.goal?.trim() || goalRow.title?.trim() || null) : null;

  const isEmpty = strong.length === 0 && weak.length === 0 && recent.length === 0 && !goal;

  return { strong, weak, recent, goal, isEmpty };
}

/**
 * Picks weak concepts that intersect a given domain (string match on domain
 * field). Used to focus generation on the student's actual gaps inside a
 * chosen subject.
 */
export function pickWeakInDomain(p: StudentProfile, domainKeyword: string): ProfileConcept[] {
  const kw = domainKeyword.toLowerCase();
  return p.weak.filter((c) => {
    if (!c.domain) return false;
    return c.domain.toLowerCase().includes(kw);
  });
}
