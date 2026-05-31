-- Migration 010: add source_url and language columns to rag_chunks
-- source_url: link to the original source (external URL or internal /topics/... path)
-- language: text language tag, defaults to 'ru'

ALTER TABLE public.rag_chunks ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.rag_chunks ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ru';
