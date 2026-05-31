-- Migration 009: math_topic_progress table
-- Tracks per-user progress on each topic page (theory / practice / independent).
-- Used by Dashboard.tsx, ProgressDashboard.tsx, MathSections.tsx, useMathTopicProgress.ts.

CREATE TABLE IF NOT EXISTS public.math_topic_progress (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section             TEXT        NOT NULL,
  topic               TEXT        NOT NULL,
  page_type           TEXT        CHECK (page_type IN ('theory', 'practice', 'independent')),
  completed           BOOLEAN     NOT NULL DEFAULT false,
  score               NUMERIC,
  time_spent_seconds  INT         NOT NULL DEFAULT 0,
  visited_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic, page_type)
);

-- Index for fast per-user queries ordered by recency
CREATE INDEX IF NOT EXISTS idx_math_topic_progress_user_recent
  ON public.math_topic_progress (user_id, last_visited_at DESC);

-- RLS
ALTER TABLE public.math_topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.math_topic_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress"
  ON public.math_topic_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON public.math_topic_progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
