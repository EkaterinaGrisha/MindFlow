-- Migration 017: BKT attempt journal + learning plans.
--
-- 1) public.bkt_attempts
--    Append-only per-attempt log. We already have public.bkt_concept_params
--    storing per-concept BKT parameters (P_initial / P_learn / P_slip / P_guess)
--    and public.kg_mastery storing aggregated p_mastery — but no raw sequence
--    of attempts. Without this journal we cannot re-fit BKT offline (Colab/EM)
--    or build sequence-based dashboards. Schema mirrors the public ASSISTments
--    research format (user, concept, correct, time, hints, item, source).
--
-- 2) public.learning_plans + public.learning_plan_items
--    User-scoped study plans referenced by the "Add to plan" button on the
--    /graph DetailPanel and rendered on the /plan page.
--
-- Both tables are protected by RLS so a user only sees their own rows.
-- bkt_attempts is intentionally INSERT-only-via-RPC: SELECT policy for own
-- rows, no INSERT/UPDATE/DELETE policies (only the SECURITY DEFINER RPC
-- update_bkt_mastery writes here, see migration 018).

-- ─── 1) bkt_attempts ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bkt_attempts (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id   TEXT        NOT NULL REFERENCES public.kg_concepts(concept_id) ON DELETE CASCADE,
  attempt_idx  INT         NOT NULL,
  correct      BOOLEAN     NOT NULL,
  time_ms      INT,
  hint_count   INT         NOT NULL DEFAULT 0,
  item_id      TEXT,
  source       TEXT        NOT NULL DEFAULT 'quiz'
               CHECK (source IN ('quiz', 'sandbox', 'mentor_check', 'challenger', 'other')),
  p_mastery_before NUMERIC(5,4),
  p_mastery_after  NUMERIC(5,4),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bkt_attempts_user_concept_time
  ON public.bkt_attempts (user_id, concept_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bkt_attempts_concept_time
  ON public.bkt_attempts (concept_id, created_at DESC);

ALTER TABLE public.bkt_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bkt_attempts'
      AND policyname = 'bkt_attempts_own'
  ) THEN
    CREATE POLICY "bkt_attempts_own"
      ON public.bkt_attempts FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 2) learning_plans + learning_plan_items ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.learning_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT 'Мой план',
  goal        TEXT,
  is_archived BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_plans_user
  ON public.learning_plans (user_id)
  WHERE is_archived = FALSE;

ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'learning_plans'
      AND policyname = 'learning_plans_own'
  ) THEN
    CREATE POLICY "learning_plans_own"
      ON public.learning_plans FOR ALL TO authenticated
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.learning_plan_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID        NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  position    INT         NOT NULL DEFAULT 0,
  topic_slug  TEXT,
  concept_id  TEXT        REFERENCES public.kg_concepts(concept_id) ON DELETE SET NULL,
  note        TEXT,
  is_done     BOOLEAN     NOT NULL DEFAULT FALSE,
  done_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_item_target_one
    CHECK ((topic_slug IS NOT NULL) OR (concept_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_learning_plan_items_plan
  ON public.learning_plan_items (plan_id, position);

ALTER TABLE public.learning_plan_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'learning_plan_items'
      AND policyname = 'learning_plan_items_own'
  ) THEN
    CREATE POLICY "learning_plan_items_own"
      ON public.learning_plan_items FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.learning_plans p
          WHERE p.id = learning_plan_items.plan_id
            AND p.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.learning_plans p
          WHERE p.id = learning_plan_items.plan_id
            AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.touch_learning_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.learning_plans
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_learning_plan_items_touch ON public.learning_plan_items;
CREATE TRIGGER trg_learning_plan_items_touch
  AFTER INSERT OR UPDATE OR DELETE ON public.learning_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_learning_plan();
