-- Migration 011: Personal Knowledge Graph
-- Stores concepts and relations extracted from each user's dialogues with the mentor.

-- ─── Nodes ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personal_kg_nodes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label           TEXT        NOT NULL,
  domain          TEXT        NOT NULL DEFAULT 'unknown',
  mention_count   INT         NOT NULL DEFAULT 1,
  mastery_score   NUMERIC(4,3) NOT NULL DEFAULT 0.1,
  -- null when no matching concept in global kg_concepts
  global_concept_id TEXT      REFERENCES public.kg_concepts(concept_id) ON DELETE SET NULL,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, label)
);

CREATE INDEX IF NOT EXISTS idx_personal_kg_nodes_user
  ON public.personal_kg_nodes (user_id);

ALTER TABLE public.personal_kg_nodes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_kg_nodes'
      AND policyname = 'personal_kg_nodes_own'
  ) THEN
    CREATE POLICY "personal_kg_nodes_own"
      ON public.personal_kg_nodes FOR ALL TO authenticated
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ─── Edges ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personal_kg_edges (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_label    TEXT        NOT NULL,
  to_label      TEXT        NOT NULL,
  relation      TEXT        NOT NULL DEFAULT 'relates_to',
  strength      INT         NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, from_label, to_label, relation)
);

CREATE INDEX IF NOT EXISTS idx_personal_kg_edges_user
  ON public.personal_kg_edges (user_id);

ALTER TABLE public.personal_kg_edges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'personal_kg_edges'
      AND policyname = 'personal_kg_edges_own'
  ) THEN
    CREATE POLICY "personal_kg_edges_own"
      ON public.personal_kg_edges FOR ALL TO authenticated
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
