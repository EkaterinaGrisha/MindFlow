-- 024: user_lectures — сгенерированные «красивые» лекции на основе
-- личных конспектов пользователя.
--
-- Источник данных: `rag_chunks_personal` (чанки загруженных пользователем
-- PDF/DOCX/MD/TXT). LLM на основе всех чанков документа собирает JSON-документ
-- блоков (LectureDocument). JSON хранится в `document JSONB` целиком —
-- фронт рендерит его универсальным компонентом LectureRenderer.
--
-- source_id — это TEXT (тот же ключ, что в rag_chunks_personal.source_id).
-- НЕ внешний ключ: если пользователь удалит исходный документ, лекции
-- сохраняются как самостоятельный артефакт.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_lectures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  source_id     TEXT NOT NULL,
  title         TEXT NOT NULL,
  document      JSONB NOT NULL,
  model         TEXT,
  tokens        INT,
  status        TEXT NOT NULL DEFAULT 'ready'
                CHECK (status IN ('pending', 'ready', 'failed')),
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_lectures_owner
  ON public.user_lectures (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_lectures_source
  ON public.user_lectures (owner_user_id, source_id);

ALTER TABLE public.user_lectures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_lectures'
      AND policyname = 'Users read own lectures'
  ) THEN
    CREATE POLICY "Users read own lectures"
      ON public.user_lectures FOR SELECT
      USING (owner_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_lectures'
      AND policyname = 'Users insert own lectures'
  ) THEN
    CREATE POLICY "Users insert own lectures"
      ON public.user_lectures FOR INSERT
      WITH CHECK (owner_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_lectures'
      AND policyname = 'Users delete own lectures'
  ) THEN
    CREATE POLICY "Users delete own lectures"
      ON public.user_lectures FOR DELETE
      USING (owner_user_id = auth.uid());
  END IF;
END
$$;

COMMIT;
