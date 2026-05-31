/**
 * learningPlansEndpoint.ts
 *
 * REST CRUD for user-owned learning plans:
 *
 *   GET    /api/learning-plans                          — list plans
 *   POST   /api/learning-plans                          — create plan
 *   PATCH  /api/learning-plans/:planId                  — rename / archive
 *   DELETE /api/learning-plans/:planId                  — delete plan
 *   POST   /api/learning-plans/:planId/items            — append item (topic_slug or concept_id)
 *   PATCH  /api/learning-plans/:planId/items/:itemId    — toggle done / reorder
 *   DELETE /api/learning-plans/:planId/items/:itemId    — remove item
 *
 * The router uses the service-role key, so every query filters by the authed
 * user id explicitly (RLS is bypassed by the service role).
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { requireAuth } from "./middleware/requireAuth";
import { requireSubscription } from "./middleware/requireSubscription";
import type { LlmClient } from "./llmEndpoint";
import { MATH_CONCEPTS, MATH_CONCEPT_IDS } from "./llm/mathConcepts";

const supabaseAdmin =
  config.auth.supabaseUrl && config.auth.supabaseServiceRoleKey
    ? createClient(config.auth.supabaseUrl, config.auth.supabaseServiceRoleKey)
    : undefined;

const MAX_TITLE_LEN = 120;
const MAX_GOAL_LEN  = 1000;
const MAX_NOTE_LEN  = 500;
const MAX_PLAN_ITEMS = 20;
const PLAN_SELECT_COLS = "id, title, goal, is_archived, due_date, created_at, updated_at";

function normalizeDueDate(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  if (typeof raw !== "string") return undefined;
  // Accept ISO date (YYYY-MM-DD) or ISO datetime, store as YYYY-MM-DD.
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

async function assertPlanOwned(planId: string, userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from("learning_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

export function createLearningPlansRouter(llmClient?: LlmClient): Router {
  const router = Router();

  // Все /api/learning-plans/* — за Pro/trial.
  router.use(requireAuth, requireSubscription);

  // ── GET list ────────────────────────────────────────────────────────────────
  router.get("/api/learning-plans", async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Learning plans service not configured" });
        return;
      }
      const userId = req.user!.id;

      const { data: plans, error } = await supabaseAdmin
        .from("learning_plans")
        .select(PLAN_SELECT_COLS)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.warn("[learning-plans] list failed:", error.message);
        res.status(500).json({ error: "Failed to load plans" });
        return;
      }

      const planIds = (plans ?? []).map((p) => p.id);
      let itemsByPlan: Record<string, unknown[]> = {};

      if (planIds.length > 0) {
        const { data: items, error: itemsErr } = await supabaseAdmin
          .from("learning_plan_items")
          .select("id, plan_id, position, topic_slug, concept_id, note, is_done, done_at, created_at")
          .in("plan_id", planIds)
          .order("position", { ascending: true });
        if (itemsErr) {
          console.warn("[learning-plans] items load failed:", itemsErr.message);
        } else {
          itemsByPlan = (items ?? []).reduce((acc, it) => {
            const key = it.plan_id as string;
            (acc[key] ??= []).push(it);
            return acc;
          }, {} as Record<string, unknown[]>);
        }
      }

      res.json({
        plans: (plans ?? []).map((p) => ({
          ...p,
          items: itemsByPlan[p.id as string] ?? [],
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  // ── POST create plan ────────────────────────────────────────────────────────
  router.post("/api/learning-plans", async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Learning plans service not configured" });
        return;
      }
      const userId = req.user!.id;
      const { title, goal, dueDate, conceptIds } = req.body as {
        title?: string; goal?: string; dueDate?: string | null; conceptIds?: string[];
      };

      const cleanTitle = (title ?? "Мой план").trim().slice(0, MAX_TITLE_LEN);
      const cleanGoal  = goal ? goal.trim().slice(0, MAX_GOAL_LEN) : null;
      const cleanDue   = normalizeDueDate(dueDate);

      const insertRow: Record<string, unknown> = { user_id: userId, title: cleanTitle, goal: cleanGoal };
      if (cleanDue !== undefined) insertRow.due_date = cleanDue;

      const { data, error } = await supabaseAdmin
        .from("learning_plans")
        .insert(insertRow)
        .select(PLAN_SELECT_COLS)
        .single();

      if (error) {
        console.warn("[learning-plans] create failed:", error.message);
        res.status(500).json({ error: "Failed to create plan" });
        return;
      }

      let createdItems: unknown[] = [];
      if (Array.isArray(conceptIds) && conceptIds.length > 0) {
        const valid = conceptIds
          .filter((id): id is string => typeof id === "string" && MATH_CONCEPT_IDS.has(id))
          .slice(0, MAX_PLAN_ITEMS);
        if (valid.length > 0) {
          const itemsRows = valid.map((conceptId, idx) => ({
            plan_id: data.id, position: idx, concept_id: conceptId, topic_slug: null, note: null,
          }));
          const { data: itemRows, error: itemsErr } = await supabaseAdmin
            .from("learning_plan_items")
            .insert(itemsRows)
            .select("id, plan_id, position, topic_slug, concept_id, note, is_done, done_at, created_at");
          if (itemsErr) {
            console.warn("[learning-plans] bulk items failed:", itemsErr.message);
          } else {
            createdItems = itemRows ?? [];
          }
        }
      }

      res.json({ plan: { ...data, items: createdItems } });
    } catch (error) {
      next(error);
    }
  });

  // ── PATCH rename / archive ──────────────────────────────────────────────────
  router.patch("/api/learning-plans/:planId", async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Learning plans service not configured" });
        return;
      }
      const userId = req.user!.id;
      const planId = req.params.planId;
      const { title, goal, isArchived, dueDate } = req.body as {
        title?: string; goal?: string; isArchived?: boolean; dueDate?: string | null;
      };

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof title === "string")    patch.title       = title.trim().slice(0, MAX_TITLE_LEN);
      if (typeof goal === "string")     patch.goal        = goal.trim().slice(0, MAX_GOAL_LEN);
      if (typeof isArchived === "boolean") patch.is_archived = isArchived;
      const cleanDue = normalizeDueDate(dueDate);
      if (cleanDue !== undefined) patch.due_date = cleanDue;

      const { data, error } = await supabaseAdmin
        .from("learning_plans")
        .update(patch)
        .eq("id", planId)
        .eq("user_id", userId)
        .select(PLAN_SELECT_COLS)
        .maybeSingle();

      if (error) {
        console.warn("[learning-plans] update failed:", error.message);
        res.status(500).json({ error: "Failed to update plan" });
        return;
      }
      if (!data) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }
      res.json({ plan: data });
    } catch (error) {
      next(error);
    }
  });

  // ── DELETE plan ─────────────────────────────────────────────────────────────
  router.delete("/api/learning-plans/:planId", async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Learning plans service not configured" });
        return;
      }
      const userId = req.user!.id;
      const planId = req.params.planId;

      const { error } = await supabaseAdmin
        .from("learning_plans")
        .delete()
        .eq("id", planId)
        .eq("user_id", userId);

      if (error) {
        console.warn("[learning-plans] delete failed:", error.message);
        res.status(500).json({ error: "Failed to delete plan" });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  // ── POST add item ───────────────────────────────────────────────────────────
  router.post("/api/learning-plans/:planId/items", async (req, res, next) => {
    try {
      if (!supabaseAdmin) {
        res.status(500).json({ error: "Learning plans service not configured" });
        return;
      }
      const userId = req.user!.id;
      const planId = req.params.planId;

      if (!(await assertPlanOwned(planId, userId))) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }

      const { topicSlug, conceptId, note } = req.body as {
        topicSlug?: string; conceptId?: string; note?: string;
      };
      if (!topicSlug && !conceptId) {
        res.status(400).json({ error: "topicSlug or conceptId is required" });
        return;
      }

      const { count } = await supabaseAdmin
        .from("learning_plan_items")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", planId);

      const { data, error } = await supabaseAdmin
        .from("learning_plan_items")
        .insert({
          plan_id:    planId,
          position:   count ?? 0,
          topic_slug: topicSlug ?? null,
          concept_id: conceptId ?? null,
          note:       note ? note.trim().slice(0, MAX_NOTE_LEN) : null,
        })
        .select("id, plan_id, position, topic_slug, concept_id, note, is_done, done_at, created_at")
        .single();

      if (error) {
        console.warn("[learning-plans] add item failed:", error.message);
        res.status(500).json({ error: "Failed to add item" });
        return;
      }
      res.json({ item: data });
    } catch (error) {
      next(error);
    }
  });

  // ── PATCH item (toggle done / reorder) ──────────────────────────────────────
  router.patch(
    "/api/learning-plans/:planId/items/:itemId",
    async (req, res, next) => {
      try {
        if (!supabaseAdmin) {
          res.status(500).json({ error: "Learning plans service not configured" });
          return;
        }
        const userId = req.user!.id;
        const { planId, itemId } = req.params;
        if (!(await assertPlanOwned(planId, userId))) {
          res.status(404).json({ error: "Plan not found" });
          return;
        }

        const { isDone, position, note } = req.body as {
          isDone?: boolean; position?: number; note?: string;
        };
        const patch: Record<string, unknown> = {};
        if (typeof isDone === "boolean") {
          patch.is_done = isDone;
          patch.done_at = isDone ? new Date().toISOString() : null;
        }
        if (typeof position === "number" && Number.isFinite(position)) {
          patch.position = Math.max(0, Math.round(position));
        }
        if (typeof note === "string") patch.note = note.trim().slice(0, MAX_NOTE_LEN);

        const { data, error } = await supabaseAdmin
          .from("learning_plan_items")
          .update(patch)
          .eq("id", itemId)
          .eq("plan_id", planId)
          .select("id, plan_id, position, topic_slug, concept_id, note, is_done, done_at, created_at")
          .maybeSingle();

        if (error) {
          console.warn("[learning-plans] update item failed:", error.message);
          res.status(500).json({ error: "Failed to update item" });
          return;
        }
        if (!data) {
          res.status(404).json({ error: "Item not found" });
          return;
        }
        res.json({ item: data });
      } catch (error) {
        next(error);
      }
    },
  );

  // ── DELETE item ─────────────────────────────────────────────────────────────
  router.delete(
    "/api/learning-plans/:planId/items/:itemId",
    async (req, res, next) => {
      try {
        if (!supabaseAdmin) {
          res.status(500).json({ error: "Learning plans service not configured" });
          return;
        }
        const userId = req.user!.id;
        const { planId, itemId } = req.params;
        if (!(await assertPlanOwned(planId, userId))) {
          res.status(404).json({ error: "Plan not found" });
          return;
        }

        const { error } = await supabaseAdmin
          .from("learning_plan_items")
          .delete()
          .eq("id", itemId)
          .eq("plan_id", planId);

        if (error) {
          console.warn("[learning-plans] delete item failed:", error.message);
          res.status(500).json({ error: "Failed to delete item" });
          return;
        }
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    },
  );

  // ── POST generate plan from free-form goal (LLM) ────────────────────────────
  // Returns a draft (not persisted): { conceptIds, suggestedTitle }.
  // The client filters out already-mastered concepts and saves via POST /api/learning-plans.
  router.post("/api/learning-plans/generate", async (req, res, next) => {
    try {
      if (!llmClient) {
        res.status(503).json({ error: "LLM not configured" });
        return;
      }
      const { goalText } = req.body as { goalText?: string };
      const goal = (goalText ?? "").trim().slice(0, MAX_GOAL_LEN);
      if (goal.length < 5) {
        res.status(400).json({ error: "goalText is required (min 5 chars)" });
        return;
      }

      const conceptCatalog = MATH_CONCEPTS
        .map((c) => `- ${c.conceptId} | ${c.name} (${c.section})`)
        .join("\n");

      const systemPrompt = [
        "Ты — методист, который составляет учебный план по математике для Data Science.",
        "На вход даётся цель студента. На выходе — упорядоченный список concept_id из каталога.",
        "Правила:",
        "1. Используй ТОЛЬКО concept_id из каталога, в точности как в списке.",
        "2. Порядок — от prerequisites к продвинутым темам (низкие зависимости → высокие).",
        "3. Не больше 8 пунктов. Не дублируй темы.",
        "4. Включай только релевантные цели темы.",
        "5. Ответ — строго JSON-объект формата:",
        '   {"title": "Короткое название плана (до 60 символов)", "conceptIds": ["id1", "id2", ...]}',
        "Никакого текста вне JSON.",
      ].join("\n");

      const userPrompt = [
        "Цель студента:",
        goal,
        "",
        "Каталог concept_id:",
        conceptCatalog,
      ].join("\n");

      let raw: string;
      try {
        raw = await llmClient.generateText({ systemPrompt, userPrompt });
      } catch (e) {
        console.warn("[learning-plans] generate LLM failed:", e);
        res.status(502).json({ error: "LLM call failed" });
        return;
      }

      // Extract JSON object (LLM может обернуть в ```json … ```).
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        console.warn("[learning-plans] no JSON in LLM output:", raw.slice(0, 200));
        res.status(502).json({ error: "Invalid LLM output" });
        return;
      }
      let parsed: { title?: unknown; conceptIds?: unknown };
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        res.status(502).json({ error: "Invalid LLM output" });
        return;
      }

      const rawIds = Array.isArray(parsed.conceptIds) ? parsed.conceptIds : [];
      const conceptIds: string[] = [];
      const seen = new Set<string>();
      for (const id of rawIds) {
        if (typeof id !== "string") continue;
        if (!MATH_CONCEPT_IDS.has(id)) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        conceptIds.push(id);
        if (conceptIds.length >= MAX_PLAN_ITEMS) break;
      }

      const suggestedTitle = typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim().slice(0, MAX_TITLE_LEN)
        : goal.slice(0, 60);

      res.json({ suggestedTitle, conceptIds, goal });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
