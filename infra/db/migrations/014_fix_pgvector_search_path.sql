-- Migration 014: Fix pgvector operator resolution for Supabase
--
-- Problem: all three RPC functions (match_chunks, match_chunks_with_embeddings,
-- hybrid_search_chunks) were created with `SET search_path = ''`.
-- On Supabase, the pgvector extension lives in the `extensions` schema.
-- With an empty search_path the `<=>` operator can't be resolved at call
-- time → "operator does not exist: public.vector <=> public.vector".
--
-- Fix: recreate the functions with `SET search_path = public, extensions`
-- so both the table schema (public) and the extension schema (extensions)
-- are visible during execution.

-- ─── Ensure pgvector is available ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── match_chunks ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.match_chunks(VECTOR, FLOAT, INT);
DROP FUNCTION IF EXISTS public.match_chunks(VECTOR, FLOAT, INT, TEXT[]);

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
SET search_path = public, extensions
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

-- ─── match_chunks_with_embeddings ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.match_chunks_with_embeddings(VECTOR, FLOAT, INT);
DROP FUNCTION IF EXISTS public.match_chunks_with_embeddings(VECTOR, FLOAT, INT, TEXT[]);

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
SET search_path = public, extensions
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

-- ─── hybrid_search_chunks ─────────────────────────────────────────────────────

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
SET search_path = public, extensions
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

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.match_chunks(VECTOR, FLOAT, INT, TEXT[])
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_chunks_with_embeddings(VECTOR, FLOAT, INT, TEXT[])
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hybrid_search_chunks(VECTOR, TEXT, INT, TEXT[], INT)
  TO authenticated, service_role;

-- ─── Also fix personal_kg functions if they use vector ops ────────────────────
-- (they don't currently, but guard for future use)
