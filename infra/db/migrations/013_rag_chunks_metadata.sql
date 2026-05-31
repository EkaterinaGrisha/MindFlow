-- Migration 013: Add metadata JSONB column to rag_chunks
-- Stores per-chunk diagnostic fields set by the ingest pipeline:
--   extraction_method  TEXT    — 'unpdf' | 'unpdf+mojibake' | 'pdftotext' | 'failed'
--   cyrillic_ratio     FLOAT   — fraction of Cyrillic chars in extracted text (0..1)
--
-- These fields are used to:
--   1. Debug encoding issues in Russian PDFs (FIZMATLIT Kostrikin etc.)
--   2. Build the "до/после" comparison table for the defence report.
--   3. Power /api/admin/metrics (rag section already reads rag_chunks).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rag_chunks'
      AND column_name  = 'metadata'
  ) THEN
    ALTER TABLE public.rag_chunks ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Partial index speeds up admin queries like
--   WHERE metadata->>'extraction_method' = 'unpdf+mojibake'
CREATE INDEX IF NOT EXISTS idx_rag_chunks_extraction_method
  ON public.rag_chunks ((metadata->>'extraction_method'))
  WHERE metadata IS NOT NULL;

-- Also add source_url if it was never persisted to the table
-- (ingest.ts has always sent it but older migrations omitted the column).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rag_chunks'
      AND column_name  = 'source_url'
  ) THEN
    ALTER TABLE public.rag_chunks ADD COLUMN source_url TEXT;
  END IF;
END $$;
