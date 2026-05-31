-- Migration 015: Add source context to personal_kg_nodes
-- Stores which course topic triggered the concept extraction,
-- so the frontend can link "Вспомнить диалог" to the right page.

ALTER TABLE public.personal_kg_nodes
  ADD COLUMN IF NOT EXISTS source_topic TEXT;

-- Backfill: try to match existing nodes to a course topic via global_concept_id.
-- (No-op if there's nothing to backfill — safe to run multiple times.)
COMMENT ON COLUMN public.personal_kg_nodes.source_topic
  IS 'The course topic name where this concept was first extracted (null = free chat).';
