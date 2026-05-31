-- 028: cost-tracking колонки в learning_activities для unit-экономики Pro.
--
-- Что считаем. На каждый /api/llm/respond фиксируем кто и за сколько токенов
-- ответил: provider (deepseek/cloudflare/openrouter), model, input_tokens,
-- output_tokens. Стоимость считаем на бэке по LUT тарифов и пишем в cost_rub
-- (NUMERIC, рубли), чтобы при изменении цены не пересчитывать историю.
--
-- Все колонки NULLable — старые записи не теряются, провайдеры без usage
-- (anonymous-fallback) пишут просто NULL.

ALTER TABLE public.learning_activities
  ADD COLUMN IF NOT EXISTS llm_provider   TEXT,
  ADD COLUMN IF NOT EXISTS llm_model      TEXT,
  ADD COLUMN IF NOT EXISTS input_tokens   INTEGER,
  ADD COLUMN IF NOT EXISTS output_tokens  INTEGER,
  ADD COLUMN IF NOT EXISTS cost_rub       NUMERIC(10, 4);

-- Индекс для отчётов «сколько потратили за период». Composite с timestamp
-- (он уже NOT NULL DEFAULT NOW), даёт быстрые window-агрегации в админке.
CREATE INDEX IF NOT EXISTS idx_learning_activities_provider_ts
  ON public.learning_activities (llm_provider, "timestamp" DESC)
  WHERE llm_provider IS NOT NULL;
