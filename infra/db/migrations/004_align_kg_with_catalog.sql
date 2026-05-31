-- Migration 004: Align Knowledge Graph concepts and edges with the
-- in-app course catalogue (apps/web/src/lib/courseTopics.ts).
--
-- Before this migration the KG seed contained a different set of topics from
-- the catalogue, so the Dashboard "Граф знаний" widget and the catalogue
-- showed mismatched topic names. This migration replaces the math course's
-- KG rows with the canonical 6×4 topic structure used by the UI.
--
-- Idempotent: safe to re-run.

BEGIN;

-- 1) Drop math edges that reference soon-to-be-removed concepts.
DELETE FROM public.kg_edges
WHERE from_concept IN (
  SELECT concept_id FROM public.kg_concepts WHERE course_id = 'math-for-data-science'
)
   OR to_concept IN (
  SELECT concept_id FROM public.kg_concepts WHERE course_id = 'math-for-data-science'
);

-- 2) Drop mastery rows whose concept is being retired (cascades not enough
--    because we want to keep mastery for ML/algorithms unchanged).
DELETE FROM public.kg_mastery
WHERE concept_id IN (
  SELECT concept_id FROM public.kg_concepts WHERE course_id = 'math-for-data-science'
);

-- 3) Drop the old math concepts.
DELETE FROM public.kg_concepts WHERE course_id = 'math-for-data-science';

-- 4) Insert canonical math concepts (must match courseTopics.ts).
INSERT INTO public.kg_concepts (concept_id, name, domain, course_id) VALUES
  -- Линейная алгебра
  ('math-la-matrix-ops',        'Операции с матрицами',           'Линейная алгебра',          'math-for-data-science'),
  ('math-la-rank-basis',        'Ранг и базис',                   'Линейная алгебра',          'math-for-data-science'),
  ('math-la-eigenvalues',       'Собственные значения',           'Линейная алгебра',          'math-for-data-science'),
  ('math-la-svd',               'Сингулярное разложение (SVD)',   'Линейная алгебра',          'math-for-data-science'),
  -- Математический анализ
  ('math-calc-limits',          'Предел и непрерывность',         'Математический анализ',     'math-for-data-science'),
  ('math-calc-derivative',      'Производная и градиент',         'Математический анализ',     'math-for-data-science'),
  ('math-calc-partial',         'Частные производные',            'Математический анализ',     'math-for-data-science'),
  ('math-calc-grad-descent',    'Градиентный спуск',              'Математический анализ',     'math-for-data-science'),
  -- Теория вероятностей
  ('math-prob-random-vars',     'Случайные величины',             'Теория вероятностей',       'math-for-data-science'),
  ('math-prob-distributions',   'Основные распределения',         'Теория вероятностей',       'math-for-data-science'),
  ('math-prob-conditional',     'Условная вероятность',           'Теория вероятностей',       'math-for-data-science'),
  ('math-prob-bayes',           'Формула Байеса',                 'Теория вероятностей',       'math-for-data-science'),
  -- Математическая статистика
  ('math-stat-estimators',      'Точечные оценки',                'Математическая статистика', 'math-for-data-science'),
  ('math-stat-confidence',      'Доверительные интервалы',        'Математическая статистика', 'math-for-data-science'),
  ('math-stat-hypothesis',      'Проверка гипотез',               'Математическая статистика', 'math-for-data-science'),
  ('math-stat-pvalue',          'p-value и ошибки I/II рода',     'Математическая статистика', 'math-for-data-science'),
  -- Дискретная математика
  ('math-disc-combinatorics',   'Комбинаторные правила',          'Дискретная математика',     'math-for-data-science'),
  ('math-disc-boolean',         'Булева алгебра',                 'Дискретная математика',     'math-for-data-science'),
  ('math-disc-graphs',          'Теория графов',                  'Дискретная математика',     'math-for-data-science'),
  ('math-disc-recurrence',      'Рекуррентные соотношения',       'Дискретная математика',     'math-for-data-science'),
  -- Численные методы
  ('math-num-roots',            'Поиск корней уравнений',         'Численные методы',          'math-for-data-science'),
  ('math-num-integration',      'Численное интегрирование',       'Численные методы',          'math-for-data-science'),
  ('math-num-interpolation',    'Интерполяция',                   'Численные методы',          'math-for-data-science'),
  ('math-num-newton',           'Метод Ньютона',                  'Численные методы',          'math-for-data-science')
ON CONFLICT (concept_id) DO UPDATE
  SET name      = EXCLUDED.name,
      domain    = EXCLUDED.domain,
      course_id = EXCLUDED.course_id;

-- 5) Insert sequential prerequisite edges within each section
--    (topic N → topic N+1).
INSERT INTO public.kg_edges (from_concept, to_concept, relation_type) VALUES
  -- Линейная алгебра
  ('math-la-matrix-ops',     'math-la-rank-basis',     'prerequisite'),
  ('math-la-rank-basis',     'math-la-eigenvalues',    'prerequisite'),
  ('math-la-eigenvalues',    'math-la-svd',            'prerequisite'),
  -- Математический анализ
  ('math-calc-limits',       'math-calc-derivative',   'prerequisite'),
  ('math-calc-derivative',   'math-calc-partial',      'prerequisite'),
  ('math-calc-partial',      'math-calc-grad-descent', 'prerequisite'),
  -- Теория вероятностей
  ('math-prob-random-vars',  'math-prob-distributions','prerequisite'),
  ('math-prob-distributions','math-prob-conditional',  'prerequisite'),
  ('math-prob-conditional',  'math-prob-bayes',        'prerequisite'),
  -- Математическая статистика
  ('math-stat-estimators',   'math-stat-confidence',   'prerequisite'),
  ('math-stat-confidence',   'math-stat-hypothesis',   'prerequisite'),
  ('math-stat-hypothesis',   'math-stat-pvalue',       'prerequisite'),
  -- Дискретная математика
  ('math-disc-combinatorics','math-disc-boolean',      'prerequisite'),
  ('math-disc-boolean',      'math-disc-graphs',       'prerequisite'),
  ('math-disc-graphs',       'math-disc-recurrence',   'prerequisite'),
  -- Численные методы
  ('math-num-roots',         'math-num-integration',   'prerequisite'),
  ('math-num-integration',   'math-num-interpolation', 'prerequisite'),
  ('math-num-interpolation', 'math-num-newton',        'prerequisite')
ON CONFLICT (from_concept, to_concept, relation_type) DO NOTHING;

COMMIT;
