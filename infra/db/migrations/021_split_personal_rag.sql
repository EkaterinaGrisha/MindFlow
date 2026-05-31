-- 021: Split personal RAG chunks into a separate table.
--
-- До этой миграции личные документы пользователей жили в той же таблице
-- `rag_chunks` с `owner_user_id IS NOT NULL`. RPC `hybrid_search_chunks`
-- и `match_chunks` фильтр по `owner_user_id` не делали — значит, любой
-- запрос к /api/llm/respond мог вытащить чужой/собственный приватный
-- документ в контекст. Это и приватность, и контаминация общего корпуса.
--
-- Решение: физически разнести таблицы. Глобальный корпус остаётся в
-- `rag_chunks` без колонки owner_user_id. Личные документы переезжают в
-- новую таблицу `rag_chunks_personal` с RLS «только свои».

-- ─── 1. Снять RLS-политики на rag_chunks, ссылающиеся на owner_user_id ──────
DROP POLICY IF EXISTS "Users can read global and own rag_chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Users can insert own rag_chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Users can delete own rag_chunks" ON public.rag_chunks;

-- ─── 2. Создать таблицу личных чанков ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rag_chunks_personal (
  id            BIGSERIAL PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  source_id     TEXT NOT NULL,
  source_title  TEXT NOT NULL,
  chunk_index   INT  NOT NULL,
  chunk_text    TEXT NOT NULL,
  embedding     VECTOR(384),
  page_hint     TEXT,
  topic_tags    TEXT[] DEFAULT '{}',
  source_url    TEXT,
  language      TEXT DEFAULT 'ru',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_personal_owner
  ON public.rag_chunks_personal (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_personal_embedding
  ON public.rag_chunks_personal USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.rag_chunks_personal ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks_personal'
      AND policyname = 'Users read own personal chunks'
  ) THEN
    CREATE POLICY "Users read own personal chunks"
      ON public.rag_chunks_personal FOR SELECT
      USING (owner_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks_personal'
      AND policyname = 'Users insert own personal chunks'
  ) THEN
    CREATE POLICY "Users insert own personal chunks"
      ON public.rag_chunks_personal FOR INSERT
      WITH CHECK (owner_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks_personal'
      AND policyname = 'Users delete own personal chunks'
  ) THEN
    CREATE POLICY "Users delete own personal chunks"
      ON public.rag_chunks_personal FOR DELETE
      USING (owner_user_id = auth.uid());
  END IF;
END
$$;

-- ─── 3. Перенести существующие личные чанки из rag_chunks ───────────────────
INSERT INTO public.rag_chunks_personal
  (owner_user_id, source_id, source_title, chunk_index, chunk_text,
   embedding, page_hint, topic_tags, source_url, language)
SELECT
  owner_user_id, source_id, source_title, chunk_index, chunk_text,
  embedding, page_hint, topic_tags, source_url, COALESCE(language, 'ru')
FROM public.rag_chunks
WHERE owner_user_id IS NOT NULL
ON CONFLICT (source_id, chunk_index) DO NOTHING;

-- ─── 4. Удалить личные данные из общего корпуса ─────────────────────────────
DELETE FROM public.rag_chunks WHERE owner_user_id IS NOT NULL;

-- ─── 5. Убрать колонку owner_user_id из rag_chunks ──────────────────────────
DROP INDEX IF EXISTS public.idx_rag_chunks_owner_user_id;
ALTER TABLE public.rag_chunks DROP COLUMN IF EXISTS owner_user_id;
