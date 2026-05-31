-- Migration 023: unify bkt_concept_params namespace with kg_concepts canonical IDs.
--
-- Problem: bkt_concept_params held legacy concept_ids (linear-algebra-*,
-- calculus-*, optimization-*, probability-*, statistics-*) that never matched
-- kg_concepts canonical IDs (math-la-*, math-calc-*, math-prob-*, math-stat-*).
-- update_bkt_mastery RPC therefore always fell back to its hard-coded defaults
-- (p_initial=0.3, p_learn=0.3, p_slip=0.1, p_guess=0.25), producing unrealistic
-- mastery trajectories.
--
-- Fix:
--   1) Drop legacy rows wholesale (no clean 1:1 mapping; several duplicates).
--   2) Seed canonical params for every math-* concept that exists in kg_concepts.
--   3) Add a FK so this drift cannot recur silently.
--
-- Default params (0.25/0.15/0.10/0.20) are the conservative profile previously
-- used for the legacy `linear-algebra-rank` / `linear-algebra-basis` rows —
-- a sensible educational baseline until per-concept EM-calibration runs offline.

BEGIN;

DELETE FROM public.bkt_concept_params;

INSERT INTO public.bkt_concept_params (concept_id, p_initial, p_learn, p_slip, p_guess)
SELECT concept_id, 0.25, 0.15, 0.10, 0.20
  FROM public.kg_concepts
 WHERE concept_id LIKE 'math-%';

ALTER TABLE public.bkt_concept_params
  ADD CONSTRAINT bkt_concept_params_concept_id_fkey
  FOREIGN KEY (concept_id) REFERENCES public.kg_concepts(concept_id)
  ON DELETE CASCADE;

COMMIT;
