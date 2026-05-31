-- 012: Product analytics events + user feedback
-- Two tables:
--   events: server-tracked product events (chat_message_sent, payment_started, etc.)
--   feedback: NPS + free-text feedback from users
--
-- Both have RLS so users can only insert/read their own rows.
-- Service role bypasses RLS for admin aggregations and CSV export.

-- ─── events ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  VARCHAR(80) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  latency_ms  INT,
  page_url    TEXT,
  session_id  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_created
  ON public.events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_created
  ON public.events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created
  ON public.events (created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events'
      AND policyname = 'Users insert own events'
  ) THEN
    CREATE POLICY "Users insert own events"
      ON public.events FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events'
      AND policyname = 'Users read own events'
  ) THEN
    CREATE POLICY "Users read own events"
      ON public.events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events'
      AND policyname = 'Service role manages events'
  ) THEN
    CREATE POLICY "Service role manages events"
      ON public.events FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END
$$;

-- ─── feedback ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feedback (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nps          SMALLINT CHECK (nps IS NULL OR (nps >= 0 AND nps <= 10)),
  category     VARCHAR(40),
  message      TEXT NOT NULL,
  contact_ok   BOOLEAN NOT NULL DEFAULT FALSE,
  contact_info TEXT,
  page_url     TEXT,
  user_agent   TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created
  ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user
  ON public.feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_nps
  ON public.feedback (nps);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback'
      AND policyname = 'Anyone can submit feedback'
  ) THEN
    CREATE POLICY "Anyone can submit feedback"
      ON public.feedback FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback'
      AND policyname = 'Users read own feedback'
  ) THEN
    CREATE POLICY "Users read own feedback"
      ON public.feedback FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback'
      AND policyname = 'Service role manages feedback'
  ) THEN
    CREATE POLICY "Service role manages feedback"
      ON public.feedback FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END
$$;
