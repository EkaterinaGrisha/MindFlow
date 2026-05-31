-- Migration 018: extend update_bkt_mastery to log into bkt_attempts +
-- accept source/time_ms/hint_count.
--
-- This replaces the previous 3-arg and 4-arg overloads in production with a
-- single canonical 7-arg version (extra args have defaults so the existing
-- 3- and 4-arg call patterns keep working).
--
-- Source of params: public.bkt_concept_params (existing table with columns
--   p_initial / p_learn / p_slip / p_guess — NOT a fresh kg_concept_bkt_params).
-- Aggregated state: public.kg_mastery (columns: p_mastery, attempts,
--   last_correct, updated_at — there is no last_seen column on this project).
-- Journal: public.bkt_attempts (created in migration 017).

-- Drop the two existing overloads so PostgREST resolves the new one
-- unambiguously when called with named-arg JSON bodies.
DROP FUNCTION IF EXISTS public.update_bkt_mastery(UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_bkt_mastery(UUID, TEXT, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION public.update_bkt_mastery(
  p_user_id      UUID,
  p_concept      TEXT,
  correct_answer BOOLEAN,
  p_item_id      TEXT    DEFAULT NULL,
  p_source       TEXT    DEFAULT 'quiz',
  p_time_ms      INT     DEFAULT NULL,
  p_hint_count   INT     DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Per-concept BKT params (defaults match the previous 4-arg function).
  v_p_learn    FLOAT := 0.3;
  v_p_slip     FLOAT := 0.1;
  v_p_guess    FLOAT := 0.25;
  v_p_initial  FLOAT := 0.3;

  -- IRT item params (defaults = neutral).
  v_irt_a      FLOAT := 1.0;
  v_irt_b      FLOAT := 0.0;
  v_irt_c      FLOAT := 0.25;

  v_p_before   FLOAT;
  v_p_after    FLOAT;
  v_attempt_n  INT;
  v_theta      FLOAT;
  v_p_irt      FLOAT;
  v_irt_w      FLOAT;
BEGIN
  -- 1. Load calibrated BKT params if present.
  SELECT COALESCE(bp.p_learn, 0.3),
         COALESCE(bp.p_slip,  0.1),
         COALESCE(bp.p_guess, 0.25),
         COALESCE(bp.p_initial, 0.3)
    INTO v_p_learn, v_p_slip, v_p_guess, v_p_initial
    FROM public.bkt_concept_params bp
   WHERE bp.concept_id = p_concept
   LIMIT 1;
  -- Variables keep their defaults if no row was found.

  -- 2. Load IRT item params if provided.
  IF p_item_id IS NOT NULL THEN
    SELECT a, b, c INTO v_irt_a, v_irt_b, v_irt_c
      FROM public.kg_item_params
     WHERE item_id = p_item_id;
  END IF;

  -- 3. Current mastery (defaults to per-concept prior on cold start).
  SELECT p_mastery INTO v_p_before
    FROM public.kg_mastery
   WHERE user_id = p_user_id AND concept_id = p_concept;
  IF NOT FOUND THEN
    v_p_before := v_p_initial;
  END IF;

  -- 4. Bayesian observation update.
  IF correct_answer THEN
    v_p_after := (v_p_before * (1.0 - v_p_slip))
               / (v_p_before * (1.0 - v_p_slip) + (1.0 - v_p_before) * v_p_guess);
  ELSE
    v_p_after := (v_p_before * v_p_slip)
               / (v_p_before * v_p_slip + (1.0 - v_p_before) * (1.0 - v_p_guess));
  END IF;

  -- 5. IRT-weighted learning transition (same formula as the previous 4-arg version).
  v_theta := (v_p_after - 0.5) * 6.0;
  v_p_irt := v_irt_c + (1.0 - v_irt_c) / (1.0 + EXP(-v_irt_a * (v_theta - v_irt_b)));
  v_irt_w := CASE WHEN correct_answer THEN v_p_irt ELSE (1.0 - v_p_irt) END;

  v_p_after := GREATEST(0.0, LEAST(1.0,
                v_p_after + (1.0 - v_p_after) * v_p_learn * (0.5 + v_irt_w)));

  -- 6. Upsert aggregated mastery.
  INSERT INTO public.kg_mastery (user_id, concept_id, p_mastery, attempts, last_correct, updated_at)
  VALUES (p_user_id, p_concept, v_p_after, 1, correct_answer, NOW())
  ON CONFLICT (user_id, concept_id) DO UPDATE
    SET p_mastery    = v_p_after,
        attempts     = public.kg_mastery.attempts + 1,
        last_correct = correct_answer,
        updated_at   = NOW()
  RETURNING attempts INTO v_attempt_n;

  -- 7. Append to the raw attempt journal for offline ML.
  INSERT INTO public.bkt_attempts (
    user_id, concept_id, attempt_idx, correct,
    time_ms, hint_count, item_id, source,
    p_mastery_before, p_mastery_after
  ) VALUES (
    p_user_id, p_concept, COALESCE(v_attempt_n, 1), correct_answer,
    p_time_ms, COALESCE(p_hint_count, 0), p_item_id, COALESCE(p_source, 'quiz'),
    v_p_before, v_p_after
  );
END;
$$;
