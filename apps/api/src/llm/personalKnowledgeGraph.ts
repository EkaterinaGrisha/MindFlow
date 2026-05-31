import { readFileSync } from "node:fs";
import { resolveFromRepoRoot } from "../paths";
import type { LlmClient } from "../llmEndpoint";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedConcept {
  label: string;
  domain: string;
}

interface ExtractedRelation {
  from: string;
  to: string;
  type: string;
}

interface ExtractionResult {
  concepts: ExtractedConcept[];
  relations: ExtractedRelation[];
}

// ─── Prompt loader ────────────────────────────────────────────────────────────

function loadExtractorPrompt(): string {
  return readFileSync(resolveFromRepoRoot("prompts", "kg_extractor.md"), "utf-8");
}

// ─── JSON parsing (robust — strip code fences if LLM wraps output) ────────────

function parseExtraction(raw: string): ExtractionResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/,          "");

  try {
    const parsed = JSON.parse(cleaned) as Partial<ExtractionResult>;
    const concepts  = Array.isArray(parsed.concepts)  ? parsed.concepts  : [];
    const relations = Array.isArray(parsed.relations) ? parsed.relations : [];
    return {
      concepts:  concepts.filter( (c) => c && typeof c.label  === "string" && c.label.trim()),
      relations: relations.filter((r) => r && typeof r.from   === "string" && typeof r.to === "string"),
    };
  } catch {
    return { concepts: [], relations: [] };
  }
}

// ─── LLM extraction ───────────────────────────────────────────────────────────

export async function extractConceptsFromDialog(
  userInput: string,
  answer:    string,
  llmClient: LlmClient,
): Promise<ExtractionResult> {
  const systemPrompt = loadExtractorPrompt();
  const userPrompt   = `user: ${userInput.slice(0, 400)}\nassistant: ${answer.slice(0, 800)}`;
  const raw          = await llmClient.generateText({ systemPrompt, userPrompt });
  return parseExtraction(raw);
}

// ─── DB upsert ────────────────────────────────────────────────────────────────

export async function savePersonalKG(
  userId:      string,
  result:      ExtractionResult,
  supabase:    SupabaseClient,
  sourceTopic?: string,
): Promise<void> {
  if (result.concepts.length === 0) return;

  const now = new Date().toISOString();

  // Fetch existing global concepts to link personal nodes to global KG
  const labelList = result.concepts.map((c) => c.label.toLowerCase());
  const { data: globalMatches } = await supabase
    .from("kg_concepts")
    .select("concept_id, name")
    .in("name", labelList);

  const globalMap = new Map<string, string>(
    (globalMatches ?? []).map((g: { concept_id: string; name: string }) => [
      g.name.toLowerCase(),
      g.concept_id,
    ]),
  );

  // Upsert nodes — increment mention_count, update mastery_score and last_seen_at
  for (const concept of result.concepts) {
    const label            = concept.label.toLowerCase().trim();
    const domain           = concept.domain ?? "other";
    const globalConceptId  = globalMap.get(label) ?? null;

    // Try to increment if exists, insert if not
    const { data: existing } = await supabase
      .from("personal_kg_nodes")
      .select("id, mention_count")
      .eq("user_id", userId)
      .eq("label",   label)
      .maybeSingle();

    if (existing) {
      const newCount   = (existing.mention_count as number) + 1;
      const newMastery = Math.min(0.9, newCount * 0.1);
      await supabase
        .from("personal_kg_nodes")
        .update({ mention_count: newCount, mastery_score: newMastery, last_seen_at: now })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("personal_kg_nodes")
        .insert({
          user_id:           userId,
          label,
          domain,
          mention_count:     1,
          mastery_score:     0.1,
          global_concept_id: globalConceptId,
          source_topic:      sourceTopic ?? null,
          first_seen_at:     now,
          last_seen_at:      now,
        });
    }
  }

  // Upsert edges — increment strength on conflict
  for (const rel of result.relations) {
    const fromLabel = rel.from.toLowerCase().trim();
    const toLabel   = rel.to.toLowerCase().trim();
    if (fromLabel === toLabel) continue;

    const { data: existingEdge } = await supabase
      .from("personal_kg_edges")
      .select("id, strength")
      .eq("user_id",    userId)
      .eq("from_label", fromLabel)
      .eq("to_label",   toLabel)
      .eq("relation",   rel.type ?? "relates_to")
      .maybeSingle();

    if (existingEdge) {
      await supabase
        .from("personal_kg_edges")
        .update({ strength: (existingEdge.strength as number) + 1, last_seen_at: now })
        .eq("id", existingEdge.id);
    } else {
      await supabase
        .from("personal_kg_edges")
        .insert({
          user_id:      userId,
          from_label:   fromLabel,
          to_label:     toLabel,
          relation:     rel.type ?? "relates_to",
          strength:     1,
          first_seen_at: now,
          last_seen_at:  now,
        });
    }
  }
}

// ─── Fire-and-forget wrapper ──────────────────────────────────────────────────

export function extractAndSaveConceptsAsync(
  userId:      string,
  userInput:   string,
  answer:      string,
  llmClient:   LlmClient,
  supabase:    SupabaseClient,
  sourceTopic?: string,
): void {
  (async () => {
    const result = await extractConceptsFromDialog(userInput, answer, llmClient);
    await savePersonalKG(userId, result, supabase, sourceTopic);
  })().catch((err) =>
    console.warn("[personal-kg] extraction failed:", err instanceof Error ? err.message : err),
  );
}
