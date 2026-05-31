-- Migration 002: learning_activities.embedding VECTOR(1536) → VECTOR(384)
-- Reason: Cloudflare BGE-small produces 384-dim embeddings; 1536 was set for
-- OpenAI text-embedding-ada-002 which is not used in this project.
-- This also makes the column nullable so writes can succeed even if Cloudflare
-- embeddings are temporarily unavailable.

ALTER TABLE public.learning_activities
  ALTER COLUMN embedding TYPE VECTOR(384),
  ALTER COLUMN embedding DROP NOT NULL;
