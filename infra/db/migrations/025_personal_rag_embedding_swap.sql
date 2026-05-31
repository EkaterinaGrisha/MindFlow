-- 025: swap rag_chunks_personal.embedding from vector(384) to vector(1024).
--
-- Контекст. После миграции 024 (Qwen3-0.6B, 1024D) глобальный корпус
-- rag_chunks уехал на 1024D, а rag_chunks_personal остался на 384D —
-- из-за этого загрузка персональных документов падала: API считал
-- 1024D-эмбеддинги Qwen3, БД отвергала INSERT (несоответствие dim).
--
-- Старые 384D-чанки сконвертировать нельзя (другая модель), поэтому
-- удаляем их и пересоздаём колонку. Пользователей всего 2 — попросим
-- перезалить документы.

BEGIN;

-- 1. Снести старые 384D-чанки.
DELETE FROM public.rag_chunks_personal;

-- 2. Дропнуть HNSW-индекс — без него ALTER COLUMN отработает быстрее.
DROP INDEX IF EXISTS public.idx_rag_chunks_personal_embedding;

-- 3. Сменить тип колонки на vector(1024).
ALTER TABLE public.rag_chunks_personal
  ALTER COLUMN embedding TYPE vector(1024);

-- 4. Поднять HNSW обратно (cosine — тот же оператор, что в rag_chunks).
CREATE INDEX idx_rag_chunks_personal_embedding
  ON public.rag_chunks_personal USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;
