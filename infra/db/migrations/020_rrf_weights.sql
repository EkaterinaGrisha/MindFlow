-- 020_rrf_weights.sql
--
-- Adds per-branch weights to Reciprocal Rank Fusion. Until now dense and
-- lex contributions were summed with implicit weight = 1.0 each. With
-- BM25 working at full strength (migration 019), it occasionally drags
-- precision down by surfacing chunks that overlap one stop-ish word.
-- Tunable weights let us trade precision vs recall via a grid search
-- on the golden dataset.
--
-- Defaults preserve current behavior (1.0 / 1.0). Callers (TS code,
-- evaluation scripts) can override per request.

DROP FUNCTION IF EXISTS public.hybrid_search_chunks(VECTOR, TEXT, INT, TEXT[], INT);
DROP FUNCTION IF EXISTS public.hybrid_search_chunks(VECTOR, TEXT, INT, TEXT[], INT, FLOAT, FLOAT);

CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding VECTOR(384),
  query_text      TEXT,
  match_count     INT,
  topic_filter    TEXT[] DEFAULT NULL,
  rrf_k           INT DEFAULT 60,
  dense_weight    FLOAT DEFAULT 1.0,
  lex_weight      FLOAT DEFAULT 1.0
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
  pool_size  INT := GREATEST(match_count * 4, 16);
  and_query  tsquery := plainto_tsquery('russian', COALESCE(query_text, ''));
  ts_query   tsquery := COALESCE(NULLIF(replace(and_query::text, '&', '|'), ''), '')::tsquery;
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
      (CASE WHEN d.rnk IS NULL THEN 0 ELSE dense_weight * (1.0 / (rrf_k + d.rnk)) END
       + CASE WHEN l.rnk IS NULL THEN 0 ELSE lex_weight * (1.0 / (rrf_k + l.rnk)) END
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

GRANT EXECUTE ON FUNCTION public.hybrid_search_chunks(VECTOR, TEXT, INT, TEXT[], INT, FLOAT, FLOAT)
  TO authenticated, service_role;
