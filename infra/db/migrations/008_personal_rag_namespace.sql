-- 008: Personal RAG namespace for Pro users
-- NULL owner_user_id = global (shared) corpus
-- Non-NULL = private to that user (uploaded their own textbook)

ALTER TABLE public.rag_chunks
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_rag_chunks_owner_user_id
  ON public.rag_chunks (owner_user_id)
  WHERE owner_user_id IS NOT NULL;

-- Update RLS: authenticated users can read global chunks + their own private chunks
-- Service role retains full access for ingest
DO $$
BEGIN
  -- Drop old read policy if it existed without owner awareness
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks' AND policyname = 'Authenticated users can read rag_chunks'
  ) THEN
    DROP POLICY "Authenticated users can read rag_chunks" ON public.rag_chunks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks' AND policyname = 'Users can read global and own rag_chunks'
  ) THEN
    CREATE POLICY "Users can read global and own rag_chunks"
      ON public.rag_chunks FOR SELECT
      USING (
        owner_user_id IS NULL
        OR owner_user_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks' AND policyname = 'Users can insert own rag_chunks'
  ) THEN
    CREATE POLICY "Users can insert own rag_chunks"
      ON public.rag_chunks FOR INSERT
      WITH CHECK (owner_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rag_chunks' AND policyname = 'Users can delete own rag_chunks'
  ) THEN
    CREATE POLICY "Users can delete own rag_chunks"
      ON public.rag_chunks FOR DELETE
      USING (owner_user_id = auth.uid());
  END IF;
END
$$;
