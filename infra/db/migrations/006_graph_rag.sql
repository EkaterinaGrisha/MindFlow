-- Migration 006: Graph RAG enrichment
-- Adds description + topic_slug to kg_concepts and a neighbor-lookup RPC.
-- Safe to re-run (uses IF NOT EXISTS / DO NOTHING / OR REPLACE).

-- ── 1. Add description column ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kg_concepts' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.kg_concepts ADD COLUMN description TEXT;
  END IF;
END $$;

-- ── 2. Add topic_slug column (maps concept to frontend topic folder name) ──────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kg_concepts' AND column_name = 'topic_slug'
  ) THEN
    ALTER TABLE public.kg_concepts ADD COLUMN topic_slug TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kg_concepts_topic_slug
  ON public.kg_concepts (topic_slug);

-- ── 3. Update concept descriptions and topic slugs ────────────────────────────
UPDATE public.kg_concepts SET
  description  = 'Числовая характеристика квадратной матрицы. Определяет обратимость матрицы, объём параллелепипеда, образованного строками (столбцами). det(AB)=det(A)·det(B).',
  topic_slug   = 'matrix-operations'
WHERE concept_id = 'linear-algebra-determinant';

UPDATE public.kg_concepts SET
  description  = 'Система линейных уравнений Ax=b. Метод Гаусса, решения через определители (правило Крамера), геометрический смысл — пересечение гиперплоскостей.',
  topic_slug   = 'matrix-operations'
WHERE concept_id = 'algebra-linear-equations';

UPDATE public.kg_concepts SET
  description  = 'Ранг матрицы — максимальное количество линейно независимых строк (или столбцов). Определяет размерность образа линейного отображения.',
  topic_slug   = 'rank-basis'
WHERE concept_id = 'linear-algebra-rank';

UPDATE public.kg_concepts SET
  description  = 'Базис — минимальный порождающий набор векторов пространства. Координаты, смена базиса, ортонормированный базис (Грам-Шмидт).',
  topic_slug   = 'rank-basis'
WHERE concept_id = 'linear-algebra-basis';

UPDATE public.kg_concepts SET
  description  = 'Производная функции — скорость изменения. Правила дифференцирования, производная сложной функции (chain rule). Основа вычисления градиентов в ML.',
  topic_slug   = 'derivative-gradient'
WHERE concept_id = 'calculus-derivative';

UPDATE public.kg_concepts SET
  description  = 'Итерационный алгоритм минимизации функции потерь. Шаг обновления: θ := θ − α·∇L(θ). Варианты: SGD, Adam, RMSProp.',
  topic_slug   = 'derivative-gradient'
WHERE concept_id = 'optimization-gradient-descent';

UPDATE public.kg_concepts SET
  description  = 'Независимость событий A и B: P(A∩B)=P(A)·P(B). Условная вероятность P(A|B)=P(A∩B)/P(B). База для наивного Байеса.',
  topic_slug   = 'random-variables'
WHERE concept_id = 'probability-independence';

UPDATE public.kg_concepts SET
  description  = 'Основные законы распределения: нормальное, Пуассона, биномиальное, экспоненциальное. Параметры (μ, σ), ЦПТ.',
  topic_slug   = 'random-variables'
WHERE concept_id = 'probability-distributions';

UPDATE public.kg_concepts SET
  description  = 'Нулевая и альтернативная гипотезы, уровень значимости α, p-value. Критерий Стьюдента, χ², критерии согласия.',
  topic_slug   = 'hypothesis-testing'
WHERE concept_id = 'statistics-hypothesis-testing';

UPDATE public.kg_concepts SET
  description  = 'Стохастический метод вычисления интегралов и оценки вероятностей путём моделирования случайных выборок.',
  topic_slug   = NULL
WHERE concept_id = 'numerical-methods-monte-carlo';

-- ML concepts (нет соответствующей страницы в текущем курсе — topic_slug NULL)
UPDATE public.kg_concepts SET
  description = 'Линейный классификатор с сигмоид-функцией активации. Вероятностная интерпретация: P(y=1|x) = σ(wᵀx).',
  topic_slug  = NULL
WHERE concept_id = 'ml-logistic-regression';

UPDATE public.kg_concepts SET
  description = 'Нормировка признаков к единому масштабу. Min-max scaling, стандартизация (z-score). Влияет на сходимость градиентного спуска.',
  topic_slug  = NULL
WHERE concept_id = 'ml-feature-scaling';

UPDATE public.kg_concepts SET
  description = 'Переобучение: модель запоминает обучающую выборку, теряет обобщающую способность. Диагностика: кривые обучения.',
  topic_slug  = NULL
WHERE concept_id = 'ml-overfitting';

UPDATE public.kg_concepts SET
  description = 'L1 (Lasso) и L2 (Ridge) регуляризация добавляют штраф за большие веса, снижая переобучение.',
  topic_slug  = NULL
WHERE concept_id = 'ml-regularization';

UPDATE public.kg_concepts SET
  description = 'ROC-кривая и площадь под ней (AUC) — метрика качества бинарного классификатора, не зависящая от порога.',
  topic_slug  = NULL
WHERE concept_id = 'ml-metrics-roc-auc';

UPDATE public.kg_concepts SET
  description = 'Временна́я утечка данных при кросс-валидации. Правильная стратегия разбиения train/val/test.',
  topic_slug  = NULL
WHERE concept_id = 'ml-validation-leakage';

UPDATE public.kg_concepts SET
  description = 'Градиент затухает при обратном распространении через глубокие сети. Решения: ReLU, skip-connections, нормализация.',
  topic_slug  = NULL
WHERE concept_id = 'ml-vanishing-gradient';

UPDATE public.kg_concepts SET
  description = 'Нормализация активаций внутри батча стабилизирует обучение глубоких сетей.',
  topic_slug  = NULL
WHERE concept_id = 'ml-batchnorm';

UPDATE public.kg_concepts SET
  description = 'Критерии разбиения узлов дерева решений: Gini Impurity, Information Gain (энтропия), MSE для регрессии.',
  topic_slug  = NULL
WHERE concept_id = 'ml-tree-splitting';

UPDATE public.kg_concepts SET
  description = 'Декомпозиция ошибки модели: смещение (bias) + дисперсия (variance) + шум. Компромисс при выборе сложности модели.',
  topic_slug  = NULL
WHERE concept_id = 'ml-bias-variance';

-- ── 4. RPC: get_concept_neighbors ─────────────────────────────────────────────
-- Returns all 1-hop neighbors for a list of concept_ids.
-- direction='prerequisite'  → neighbor must be known BEFORE the source
-- direction='next_step'     → source is prerequisite for neighbor (neighbor comes after)
CREATE OR REPLACE FUNCTION public.get_concept_neighbors(
  p_concept_ids TEXT[]
)
RETURNS TABLE (
  source_concept_id   TEXT,
  neighbor_concept_id TEXT,
  neighbor_name       TEXT,
  neighbor_domain     TEXT,
  neighbor_description TEXT,
  neighbor_topic_slug  TEXT,
  relation_type        TEXT,
  direction            TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- Outgoing: source → neighbor  (source is prerequisite; neighbor is next step)
  SELECT
    e.from_concept           AS source_concept_id,
    e.to_concept             AS neighbor_concept_id,
    c.name                   AS neighbor_name,
    c.domain                 AS neighbor_domain,
    c.description            AS neighbor_description,
    c.topic_slug             AS neighbor_topic_slug,
    e.relation_type,
    'next_step'::text        AS direction
  FROM public.kg_edges e
  JOIN public.kg_concepts c ON c.concept_id = e.to_concept
  WHERE e.from_concept = ANY(p_concept_ids)

  UNION ALL

  -- Incoming: neighbor → source  (neighbor is prerequisite for source)
  SELECT
    e.to_concept             AS source_concept_id,
    e.from_concept           AS neighbor_concept_id,
    c.name                   AS neighbor_name,
    c.domain                 AS neighbor_domain,
    c.description            AS neighbor_description,
    c.topic_slug             AS neighbor_topic_slug,
    e.relation_type,
    'prerequisite'::text     AS direction
  FROM public.kg_edges e
  JOIN public.kg_concepts c ON c.concept_id = e.from_concept
  WHERE e.to_concept = ANY(p_concept_ids);
$$;

-- ── 5. RPC: search_concepts_by_topic_slug ─────────────────────────────────────
-- Finds concept_ids matching a list of topic slugs (from rag_chunks.topic_tags).
CREATE OR REPLACE FUNCTION public.search_concepts_by_topic_slug(
  p_topic_slugs TEXT[]
)
RETURNS TABLE (
  concept_id  TEXT,
  name        TEXT,
  domain      TEXT,
  description TEXT,
  topic_slug  TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT concept_id, name, domain, description, topic_slug
  FROM public.kg_concepts
  WHERE topic_slug = ANY(p_topic_slugs);
$$;

-- Grant execute to authenticated role (service role bypasses RLS anyway)
GRANT EXECUTE ON FUNCTION public.get_concept_neighbors(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_concepts_by_topic_slug(TEXT[]) TO authenticated;
