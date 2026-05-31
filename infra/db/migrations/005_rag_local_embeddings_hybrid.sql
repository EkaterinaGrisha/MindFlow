-- Migration 005: Local embeddings (multilingual-e5-small, 384 dim)
--                + hybrid retrieval (pgvector + Postgres FTS, RRF fusion)
--                + topic_tags filter.
--
-- Switches rag_chunks.embedding from VECTOR(1536) to VECTOR(384) to match the
-- new local Transformers.js embedder (Xenova/multilingual-e5-small). Adds a
-- generated tsvector for Russian full-text search and an array of topic tags
-- so retrieval can be scoped to the active math topic.
--
-- View-safe: if rag_chunks currently exists as a view (legacy state from
-- earlier migrations), it is dropped and recreated as a proper table.
--
-- Manual steps after running this migration:
--   1. Re-ingest the corpus: `tsx infra/ingest/ingest.ts`. Embedding columns
--      are dropped, so any existing rows lose their vectors.
--   2. Confirm the HNSW index exists: `\d+ rag_chunks` in psql.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 0) If rag_chunks is a view, drop it (CASCADE drops dependent objects).
--    Then ensure a proper table exists with the new schema.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'rag_chunks'
  ) THEN
    DROP VIEW public.rag_chunks CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    TEXT NOT NULL,
  source_title TEXT NOT NULL,
  chunk_text   TEXT NOT NULL,
  embedding    VECTOR(384),
  page_hint    TEXT,
  chunk_index  INT,
  topic_tags   TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1) Migrate existing tables: drop old indexes, change embedding dim if needed,
--    add topic_tags / tsv / unique constraint idempotently.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS public.idx_rag_chunks_embedding_ivfflat;
DROP INDEX IF EXISTS public.idx_rag_chunks_embedding_hnsw;

-- Drop and re-add embedding column only if its current dim is not 384.
-- pg_attribute.atttypmod for vector stores the dimension directly.
DO $$
DECLARE
  current_dim INT;
BEGIN
  SELECT atttypmod
    INTO current_dim
    FROM pg_attribute
   WHERE attrelid  = 'public.rag_chunks'::regclass
     AND attname   = 'embedding'
     AND NOT attisdropped;

  IF current_dim IS NULL THEN
    ALTER TABLE public.rag_chunks ADD COLUMN embedding VECTOR(384);
  ELSIF current_dim <> 384 THEN
    ALTER TABLE public.rag_chunks DROP COLUMN embedding;
    ALTER TABLE public.rag_chunks ADD COLUMN embedding VECTOR(384);
  END IF;
END
$$;

ALTER TABLE public.rag_chunks
  ADD COLUMN IF NOT EXISTS topic_tags TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.rag_chunks
  ADD COLUMN IF NOT EXISTS tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('russian', chunk_text)) STORED;

ALTER TABLE public.rag_chunks
  DROP CONSTRAINT IF EXISTS rag_chunks_source_chunk_unique;
ALTER TABLE public.rag_chunks
  ADD CONSTRAINT rag_chunks_source_chunk_unique UNIQUE (source_id, chunk_index);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2) RLS + read policy (idempotent — no-op if already configured).
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'rag_chunks'
      AND policyname = 'Authenticated users read RAG chunks'
  ) THEN
    CREATE POLICY "Authenticated users read RAG chunks"
      ON public.rag_chunks FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3) Indexes.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw
  ON public.rag_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv
  ON public.rag_chunks USING GIN (tsv);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_topic_tags
  ON public.rag_chunks USING GIN (topic_tags);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4) Recreate match_chunks / match_chunks_with_embeddings with VECTOR(384)
--    and an optional topic_filter parameter.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.match_chunks(VECTOR, FLOAT, INT);
DROP FUNCTION IF EXISTS public.match_chunks(VECTOR, FLOAT, INT, TEXT[]);
DROP FUNCTION IF EXISTS public.match_chunks_with_embeddings(VECTOR, FLOAT, INT);
DROP FUNCTION IF EXISTS public.match_chunks_with_embeddings(VECTOR, FLOAT, INT, TEXT[]);

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding      VECTOR(384),
  similarity_threshold FLOAT,
  match_count          INT,
  topic_filter         TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  topic_tags   TEXT[],
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
    rc.topic_tags,
    1 - (rc.embedding <=> query_embedding) AS score
  FROM public.rag_chunks rc
  WHERE rc.embedding IS NOT NULL
    AND 1 - (rc.embedding <=> query_embedding) >= similarity_threshold
    AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_chunks_with_embeddings(
  query_embedding      VECTOR(384),
  similarity_threshold FLOAT,
  match_count          INT,
  topic_filter         TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  topic_tags   TEXT[],
  score        FLOAT,
  embedding    VECTOR(384)
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
    rc.topic_tags,
    1 - (rc.embedding <=> query_embedding) AS score,
    rc.embedding
  FROM public.rag_chunks rc
  WHERE rc.embedding IS NOT NULL
    AND 1 - (rc.embedding <=> query_embedding) >= similarity_threshold
    AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5) Hybrid search via Reciprocal Rank Fusion (dense + BM25-ish FTS).
--    rrf_k follows the canonical RRF default of 60.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.hybrid_search_chunks(VECTOR, TEXT, INT, TEXT[], INT);

CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding VECTOR(384),
  query_text      TEXT,
  match_count     INT,
  topic_filter    TEXT[] DEFAULT NULL,
  rrf_k           INT DEFAULT 60
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  topic_tags   TEXT[],
  dense_score  FLOAT,
  lex_score    FLOAT,
  rrf_score    FLOAT,
  embedding    VECTOR(384)
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  pool_size INT := GREATEST(match_count * 4, 16);
  ts_query  tsquery := plainto_tsquery('russian', COALESCE(query_text, ''));
BEGIN
  RETURN QUERY
  WITH dense AS (
    SELECT
      rc.id,
      1 - (rc.embedding <=> query_embedding) AS score,
      ROW_NUMBER() OVER (ORDER BY rc.embedding <=> query_embedding) AS rnk
    FROM public.rag_chunks rc
    WHERE rc.embedding IS NOT NULL
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
    ORDER BY rc.embedding <=> query_embedding
    LIMIT pool_size
  ),
  lex AS (
    SELECT
      rc.id,
      ts_rank_cd(rc.tsv, ts_query) AS score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(rc.tsv, ts_query) DESC) AS rnk
    FROM public.rag_chunks rc
    WHERE ts_query <> ''::tsquery
      AND rc.tsv @@ ts_query
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
    ORDER BY ts_rank_cd(rc.tsv, ts_query) DESC
    LIMIT pool_size
  ),
  fused AS (
    SELECT
      COALESCE(d.id, l.id) AS id,
      COALESCE(d.score, 0)::float AS dense_score,
      COALESCE(l.score, 0)::float AS lex_score,
      (CASE WHEN d.rnk IS NULL THEN 0 ELSE 1.0 / (rrf_k + d.rnk) END
       + CASE WHEN l.rnk IS NULL THEN 0 ELSE 1.0 / (rrf_k + l.rnk) END
      )::float AS rrf_score
    FROM dense d
    FULL OUTER JOIN lex l ON d.id = l.id
  )
  SELECT
    rc.id::text     AS chunk_id,
    rc.source_id,
    rc.source_title,
    rc.chunk_text,
    rc.page_hint,
    rc.topic_tags,
    f.dense_score,
    f.lex_score,
    f.rrf_score,
    rc.embedding
  FROM fused f
  JOIN public.rag_chunks rc ON rc.id = f.id
  ORDER BY f.rrf_score DESC
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6) Grants — RLS still gates SELECT on the table; functions are SECURITY
--    INVOKER by default so they respect RLS for the calling role.
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.match_chunks(VECTOR, FLOAT, INT, TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_chunks_with_embeddings(VECTOR, FLOAT, INT, TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hybrid_search_chunks(VECTOR, TEXT, INT, TEXT[], INT) TO authenticated, service_role;
