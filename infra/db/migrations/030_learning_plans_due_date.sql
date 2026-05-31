-- Migration 030: due_date for learning plans.
--
-- Adds an optional target date to public.learning_plans so the UI can show
-- "N days to goal" and compute pace ("~2 topics/day to hit the deadline").
-- Nullable: existing plans keep working as open-ended without modification.

ALTER TABLE public.learning_plans
  ADD COLUMN IF NOT EXISTS due_date DATE;

COMMENT ON COLUMN public.learning_plans.due_date IS
  'Optional target completion date set by the user. NULL means open-ended plan.';
