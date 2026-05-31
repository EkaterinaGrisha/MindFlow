-- Migration 001: Fix Supabase security advisor errors and warnings.
--
-- Fixes:
--   ERRORS   — Security Definer View (6 views)
--   WARNINGS — Function Search Path Mutable (8 functions)
--   WARNINGS — RLS Policy Always True (registration_submissions)
--
-- Manual steps required after running this script:
--   1. Extension in Public (vector): already installed; moving it requires
--      recreating all VECTOR columns — skip unless required by compliance.
--   2. Leaked Password Protection: enable in Supabase Dashboard →
--      Authentication → Settings → Leaked Password Protection.

-- ═══════════════════════════════════════════════════════════════════════════════
-- ERRORS: Security Definer Views
-- Fix: add security_invoker so the view runs with the caller's permissions.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Handle case where rag_chunks exists as a view instead of a table.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'rag_chunks'
  ) THEN
    DROP VIEW public.rag_chunks CASCADE;
  END IF;
END
$$;

-- Recreate rag_chunks as a proper table if it was dropped above.
CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    TEXT NOT NULL,
  source_title TEXT NOT NULL,
  chunk_text   TEXT NOT NULL,
  embedding    VECTOR(1536),
  page_hint    TEXT,
  chunk_index  INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rag_chunks'
      AND policyname = 'Authenticated users read RAG chunks'
  ) THEN
    CREATE POLICY "Authenticated users read RAG chunks"
      ON public.rag_chunks FOR SELECT TO authenticated USING (true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw
  ON public.rag_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Fix: kg_mastery_summary
CREATE OR REPLACE VIEW public.kg_mastery_summary
WITH (security_invoker = true)
AS
SELECT
  km.user_id,
  kc.concept_id,
  kc.name        AS concept,
  kc.domain,
  kc.course_id,
  km.p_mastery,
  km.attempts,
  km.last_seen,
  CASE
    WHEN km.p_mastery >= 0.75                                              THEN 'mastered'
    WHEN km.p_mastery >= 0.45                                              THEN 'in_progress'
    WHEN km.p_mastery < 0.6 AND km.last_seen < NOW() - INTERVAL '14 days' THEN 'fading'
    ELSE 'weak_spot'
  END AS status
FROM public.kg_mastery km
JOIN public.kg_concepts kc ON kc.concept_id = km.concept_id;

-- Fix: user_engagement_features
CREATE OR REPLACE VIEW public.user_engagement_features
WITH (security_invoker = true)
AS
SELECT
  u.user_id,
  COUNT(DISTINCT DATE(la."timestamp"))                    AS active_days,
  COUNT(la.id)                                           AS total_interactions,
  MAX(la."timestamp")                                    AS last_active_at,
  COALESCE(
    EXTRACT(EPOCH FROM (NOW() - MAX(la."timestamp"))) / 86400,
    999
  )::INT                                                 AS days_inactive,
  COALESCE(AVG(csl.mastery_score), 0)                   AS avg_mastery_score,
  COUNT(DISTINCT csl.course_id)                         AS courses_started,
  COALESCE(MAX(km_agg.avg_p), 0)                        AS avg_kg_mastery
FROM public.user_profiles u
LEFT JOIN public.learning_activities la ON la.user_id = u.user_id
LEFT JOIN public.course_skill_levels csl ON csl.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, AVG(p_mastery) AS avg_p
  FROM public.kg_mastery
  GROUP BY user_id
) km_agg ON km_agg.user_id = u.user_id
GROUP BY u.user_id;

-- Fix: at_risk_users
CREATE OR REPLACE VIEW public.at_risk_users
WITH (security_invoker = true)
AS
SELECT
  user_id,
  active_days,
  total_interactions,
  days_inactive,
  avg_mastery_score,
  CASE
    WHEN days_inactive >= 10                                      THEN 'high'
    WHEN days_inactive >= 5 AND total_interactions < 10           THEN 'medium'
    WHEN days_inactive >= 3 AND avg_mastery_score < 30            THEN 'medium'
    ELSE 'low'
  END AS churn_risk
FROM public.user_engagement_features
WHERE days_inactive >= 3;

-- Fix: cohort_funnel
CREATE OR REPLACE VIEW public.cohort_funnel
WITH (security_invoker = true)
AS
SELECT
  COUNT(DISTINCT u.user_id)                                              AS registered,
  COUNT(DISTINCT csl.user_id)                                           AS completed_diagnostic,
  COUNT(DISTINCT CASE WHEN la_agg.interactions >= 5 THEN u.user_id END) AS active_learners,
  COUNT(DISTINCT CASE WHEN km_agg.mastered_count >= 3 THEN u.user_id END) AS mastered_3_concepts
FROM public.user_profiles u
LEFT JOIN public.course_skill_levels csl ON csl.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS interactions
  FROM public.learning_activities
  GROUP BY user_id
) la_agg ON la_agg.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) FILTER (WHERE p_mastery >= 0.75) AS mastered_count
  FROM public.kg_mastery
  GROUP BY user_id
) km_agg ON km_agg.user_id = u.user_id;

-- New: rag_quality_dashboard
CREATE OR REPLACE VIEW public.rag_quality_dashboard
WITH (security_invoker = true)
AS
SELECT
  DATE_TRUNC('day', rm.created_at)::DATE              AS day,
  COUNT(*)                                             AS total_requests,
  ROUND(AVG(rm.precision_at_k)::NUMERIC, 4)           AS avg_precision_at_k,
  ROUND(MIN(rm.precision_at_k)::NUMERIC, 4)           AS min_precision_at_k,
  ROUND(MAX(rm.precision_at_k)::NUMERIC, 4)           AS max_precision_at_k,
  ROUND(
    (AVG(rm.used_chunks::FLOAT / NULLIF(rm.top_k, 0)))::NUMERIC, 4
  )                                                    AS avg_chunk_utilization,
  ROUND(AVG(rm.top_k)::NUMERIC, 1)                    AS avg_top_k
FROM public.rag_metrics rm
GROUP BY DATE_TRUNC('day', rm.created_at)
ORDER BY day DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- WARNINGS: Function Search Path Mutable
-- Fix: SET search_path = '' and fully qualify all object references.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding      VECTOR(1536),
  similarity_threshold FLOAT,
  match_count          INT
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  score        FLOAT
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id::text AS chunk_id,
    rc.source_id,
    rc.source_title,
    rc.chunk_text,
    rc.page_hint,
    1 - (rc.embedding <=> query_embedding) AS score
  FROM public.rag_chunks rc
  WHERE 1 - (rc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_chunks_with_embeddings(
  query_embedding      VECTOR(1536),
  similarity_threshold FLOAT,
  match_count          INT
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  score        FLOAT,
  embedding    VECTOR(1536)
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id::text AS chunk_id,
    rc.source_id,
    rc.source_title,
    rc.chunk_text,
    rc.page_hint,
    1 - (rc.embedding <=> query_embedding) AS score,
    rc.embedding
  FROM public.rag_chunks rc
  WHERE 1 - (rc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_bkt_mastery(
  p_user_id      UUID,
  p_concept      TEXT,
  correct_answer BOOLEAN,
  p_item_id      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_p_mastery   FLOAT;
  v_p_posterior FLOAT;
  v_p_new       FLOAT;
  v_p_transit   FLOAT;
  v_theta       FLOAT;
  v_p_irt       FLOAT;
  v_irt_a       FLOAT := 1.0;
  v_irt_b       FLOAT := 0.0;
  v_irt_c       FLOAT := 0.25;
  p_transit_base CONSTANT FLOAT := 0.30;
  p_guess        CONSTANT FLOAT := 0.25;
  p_slip         CONSTANT FLOAT := 0.10;
BEGIN
  SELECT p_mastery INTO v_p_mastery
  FROM public.kg_mastery
  WHERE user_id = p_user_id AND concept_id = p_concept;

  IF NOT FOUND THEN
    v_p_mastery := 0.2;
  END IF;

  IF p_item_id IS NOT NULL THEN
    SELECT a, b, c INTO v_irt_a, v_irt_b, v_irt_c
    FROM public.kg_item_params
    WHERE item_id = p_item_id;
  END IF;

  v_theta  := (v_p_mastery - 0.5) * 6.0;
  v_p_irt  := v_irt_c + (1.0 - v_irt_c) / (1.0 + EXP(-v_irt_a * (v_theta - v_irt_b)));

  IF correct_answer THEN
    v_p_transit := p_transit_base * GREATEST(0.5, LEAST(2.0, 1.0 + (1.0 - v_p_irt)));
  ELSE
    v_p_transit := p_transit_base * GREATEST(0.1, LEAST(1.0, v_p_irt));
  END IF;

  IF correct_answer THEN
    v_p_posterior := (v_p_mastery * (1.0 - p_slip))
                   / (v_p_mastery * (1.0 - p_slip) + (1.0 - v_p_mastery) * p_guess);
  ELSE
    v_p_posterior := (v_p_mastery * p_slip)
                   / (v_p_mastery * p_slip + (1.0 - v_p_mastery) * (1.0 - p_guess));
  END IF;

  v_p_new := v_p_posterior + (1.0 - v_p_posterior) * v_p_transit;
  v_p_new := GREATEST(0.0, LEAST(1.0, v_p_new));

  INSERT INTO public.kg_mastery (user_id, concept_id, p_mastery, attempts, last_seen)
  VALUES (p_user_id, p_concept, v_p_new, 1, NOW())
  ON CONFLICT (user_id, concept_id) DO UPDATE
    SET p_mastery = v_p_new,
        attempts  = public.kg_mastery.attempts + 1,
        last_seen     = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_review(
  p_user_id    UUID,
  p_concept_id TEXT,
  p_quality    INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reps         INT;
  v_ease         FLOAT;
  v_interval     INT;
  v_new_interval INT;
  v_new_ease     FLOAT;
BEGIN
  SELECT repetitions, ease_factor, interval_days
    INTO v_reps, v_ease, v_interval
  FROM public.kg_reviews
  WHERE user_id = p_user_id AND concept_id = p_concept_id;

  IF NOT FOUND THEN
    v_reps     := 0;
    v_ease     := 2.5;
    v_interval := 1;
  END IF;

  IF p_quality >= 3 THEN
    CASE v_reps
      WHEN 0 THEN v_new_interval := 1;
      WHEN 1 THEN v_new_interval := 6;
      ELSE        v_new_interval := ROUND(v_interval * v_ease);
    END CASE;
    v_reps := v_reps + 1;
  ELSE
    v_new_interval := 1;
    v_reps         := 0;
  END IF;

  v_new_ease := GREATEST(
    1.3,
    v_ease + 0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02)
  );

  INSERT INTO public.kg_reviews
    (user_id, concept_id, next_review_at, interval_days, ease_factor, repetitions, last_quality, updated_at)
  VALUES
    (p_user_id, p_concept_id,
     NOW() + (v_new_interval || ' days')::INTERVAL,
     v_new_interval, v_new_ease, v_reps, p_quality, NOW())
  ON CONFLICT (user_id, concept_id) DO UPDATE
    SET next_review_at = NOW() + (v_new_interval || ' days')::INTERVAL,
        interval_days  = v_new_interval,
        ease_factor    = v_new_ease,
        repetitions    = v_reps,
        last_quality   = p_quality,
        updated_at     = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_due_reviews(p_user_id UUID)
RETURNS TABLE (
  concept_id     TEXT,
  concept_name   TEXT,
  domain         TEXT,
  course_id      TEXT,
  next_review_at TIMESTAMPTZ,
  interval_days  INT,
  ease_factor    FLOAT,
  p_mastery      FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    kc.concept_id,
    kc.name        AS concept_name,
    kc.domain,
    kc.course_id,
    kr.next_review_at,
    kr.interval_days,
    kr.ease_factor,
    COALESCE(km.p_mastery, 0.2) AS p_mastery
  FROM public.kg_reviews kr
  JOIN public.kg_concepts kc ON kc.concept_id = kr.concept_id
  LEFT JOIN public.kg_mastery km
    ON km.user_id = kr.user_id AND km.concept_id = kr.concept_id
  WHERE kr.user_id = p_user_id
    AND kr.next_review_at <= NOW()
  ORDER BY kr.next_review_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.apply_skill_decay()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.kg_mastery
  SET p_mastery = GREATEST(p_mastery * 0.92, 0.1),
      last_seen = last_seen
  WHERE last_seen < NOW() - INTERVAL '14 days'
    AND p_mastery > 0.1;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_schedule_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_quality INT;
BEGIN
  IF NEW.p_mastery >= 0.75 THEN
    v_quality := 5;
  ELSIF NEW.p_mastery >= 0.60 THEN
    v_quality := 4;
  ELSIF NEW.p_mastery >= 0.45 THEN
    v_quality := 3;
  ELSIF NEW.p_mastery >= 0.30 THEN
    v_quality := 2;
  ELSE
    v_quality := 1;
  END IF;

  PERFORM public.schedule_review(NEW.user_id, NEW.concept_id, v_quality);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rag_chunks_insert_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.chunk_index IS NULL THEN
    SELECT COALESCE(MAX(chunk_index), -1) + 1
      INTO NEW.chunk_index
      FROM public.rag_chunks
     WHERE source_id = NEW.source_id;
  END IF;
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rag_chunks_insert ON public.rag_chunks;
CREATE TRIGGER trg_rag_chunks_insert
BEFORE INSERT ON public.rag_chunks
FOR EACH ROW
EXECUTE FUNCTION public.rag_chunks_insert_fn();

-- Mentor sessions table (required by increment_session_message_count).
CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  topic         TEXT,
  page_type     VARCHAR(100),
  message_count INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_user_started
  ON public.mentor_sessions (user_id, started_at DESC);

ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_sessions'
      AND policyname = 'Users manage own mentor sessions'
  ) THEN
    CREATE POLICY "Users manage own mentor sessions"
      ON public.mentor_sessions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT NOT NULL,
  ai_role       VARCHAR(50),
  used_fallback BOOLEAN NOT NULL DEFAULT FALSE,
  rag_sources   JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_session
  ON public.mentor_messages (session_id, created_at ASC);

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_messages'
      AND policyname = 'Users manage own mentor messages'
  ) THEN
    CREATE POLICY "Users manage own mentor messages"
      ON public.mentor_messages FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.increment_session_message_count(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.mentor_sessions
     SET message_count = message_count + 1
   WHERE id = p_session_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- WARNINGS: RLS Policy Always True
-- Fix: replace WITH CHECK (true) with an email format guard.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Anon can create registration submissions" ON public.registration_submissions;
CREATE POLICY "Anon can create registration submissions"
  ON public.registration_submissions
  FOR INSERT
  TO anon
  WITH CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS for rag_metrics (was missing).
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.rag_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rag_metrics'
      AND policyname = 'Authenticated users read RAG metrics'
  ) THEN
    CREATE POLICY "Authenticated users read RAG metrics"
      ON public.rag_metrics FOR SELECT TO authenticated USING (true);
  END IF;
END
$$;
