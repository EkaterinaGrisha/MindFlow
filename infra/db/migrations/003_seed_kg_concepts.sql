-- Migration 003: Seed Knowledge Graph reference data
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.

INSERT INTO public.kg_concepts (concept_id, name, domain, course_id) VALUES
  -- Math for Data Science
  ('algebra-linear-equations',     'Линейные уравнения',          'linear-algebra',       'math-for-data-science'),
  ('calculus-derivative',          'Производная',                 'analysis-optimization','math-for-data-science'),
  ('linear-algebra-determinant',   'Определитель матрицы',        'linear-algebra',       'math-for-data-science'),
  ('linear-algebra-basis',         'Базис и пространство',        'linear-algebra',       'math-for-data-science'),
  ('statistics-hypothesis-testing','Проверка гипотез',            'statistics',           'math-for-data-science'),
  ('probability-independence',     'Независимость событий',       'probability-theory',   'math-for-data-science'),
  ('linear-algebra-rank',          'Ранг матрицы',                'linear-algebra',       'math-for-data-science'),
  ('probability-distributions',    'Распределения вероятностей',  'probability-theory',   'math-for-data-science'),
  ('optimization-gradient-descent','Градиентный спуск',           'analysis-optimization','math-for-data-science'),
  ('numerical-methods-monte-carlo','Метод Монте-Карло',           'analysis-optimization','math-for-data-science'),
  -- Machine Learning
  ('ml-logistic-regression',  'Логистическая регрессия',  'ml-basics',    'machine-learning'),
  ('ml-feature-scaling',      'Нормализация признаков',   'ml-basics',    'machine-learning'),
  ('ml-overfitting',          'Переобучение',             'ml-basics',    'machine-learning'),
  ('ml-regularization',       'Регуляризация',            'ml-basics',    'machine-learning'),
  ('ml-metrics-roc-auc',      'ROC-AUC метрика',          'ml-evaluation','machine-learning'),
  ('ml-validation-leakage',   'Валидация и утечка',       'ml-evaluation','machine-learning'),
  ('ml-vanishing-gradient',   'Затухающий градиент',      'ml-deep',      'machine-learning'),
  ('ml-batchnorm',            'Batch Normalization',      'ml-deep',      'machine-learning'),
  ('ml-tree-splitting',       'Критерии разбиения дерева','ml-models',    'machine-learning'),
  ('ml-bias-variance',        'Bias-Variance tradeoff',   'ml-models',    'machine-learning'),
  -- Algorithms
  ('algo-linear-search',  'Линейный поиск',               'algo-core',    'algorithms'),
  ('ds-stack',            'Стек',                         'algo-core',    'algorithms'),
  ('ds-array-access',     'Доступ к массиву',             'algo-core',    'algorithms'),
  ('ds-hash-table',       'Хеш-таблица',                  'algo-core',    'algorithms'),
  ('algo-merge-sort',     'Сортировка слиянием',          'algo-sorting', 'algorithms'),
  ('graphs-dijkstra',     'Алгоритм Дейкстры',            'algo-graphs',  'algorithms'),
  ('graphs-bfs-shortest', 'BFS и кратчайший путь',        'algo-graphs',  'algorithms'),
  ('algo-dp',             'Динамическое программирование','algo-dp-adv',  'algorithms'),
  ('ds-dynamic-array',    'Динамический массив',          'algo-dp-adv',  'algorithms'),
  ('ds-rb-tree',          'Красно-чёрное дерево',         'algo-dp-adv',  'algorithms')
ON CONFLICT (concept_id) DO NOTHING;

INSERT INTO public.kg_edges (from_concept, to_concept, relation_type) VALUES
  -- Math prerequisites
  ('algebra-linear-equations',    'linear-algebra-determinant',    'prerequisite'),
  ('linear-algebra-determinant',  'linear-algebra-rank',           'prerequisite'),
  ('linear-algebra-rank',         'linear-algebra-basis',          'prerequisite'),
  ('calculus-derivative',         'optimization-gradient-descent', 'prerequisite'),
  ('probability-independence',    'probability-distributions',     'prerequisite'),
  ('probability-distributions',   'statistics-hypothesis-testing', 'prerequisite'),
  ('statistics-hypothesis-testing','numerical-methods-monte-carlo','prerequisite'),
  -- ML prerequisites
  ('ml-logistic-regression',  'ml-regularization',    'prerequisite'),
  ('ml-overfitting',          'ml-regularization',    'prerequisite'),
  ('ml-logistic-regression',  'ml-metrics-roc-auc',   'prerequisite'),
  ('ml-metrics-roc-auc',      'ml-validation-leakage','prerequisite'),
  ('ml-vanishing-gradient',   'ml-batchnorm',         'prerequisite'),
  ('ml-overfitting',          'ml-tree-splitting',    'prerequisite'),
  ('ml-regularization',       'ml-bias-variance',     'prerequisite'),
  ('ml-tree-splitting',       'ml-bias-variance',     'prerequisite'),
  -- Algorithms prerequisites
  ('ds-array-access',    'ds-dynamic-array',    'prerequisite'),
  ('ds-array-access',    'ds-stack',            'prerequisite'),
  ('ds-stack',           'ds-hash-table',       'prerequisite'),
  ('algo-linear-search', 'algo-merge-sort',     'prerequisite'),
  ('ds-hash-table',      'graphs-dijkstra',     'prerequisite'),
  ('ds-stack',           'graphs-bfs-shortest', 'prerequisite'),
  ('algo-merge-sort',    'algo-dp',             'prerequisite'),
  ('ds-dynamic-array',   'ds-rb-tree',          'prerequisite')
ON CONFLICT (from_concept, to_concept, relation_type) DO NOTHING;

INSERT INTO public.kg_item_params (item_id, a, b, c) VALUES
  ('math-1',  1.0, -1.0, 0.25), ('math-2',  1.0, -1.0, 0.25), ('math-3',  1.0, -1.0, 0.25),
  ('math-11', 1.0, -1.0, 0.25), ('math-12', 1.0, -1.0, 0.25), ('math-13', 1.0, -1.0, 0.25),
  ('math-4',  1.0,  0.0, 0.25), ('math-5',  1.0,  0.0, 0.25), ('math-6',  1.0,  0.0, 0.25),
  ('math-7',  1.0,  0.0, 0.25), ('math-14', 1.0,  0.0, 0.25), ('math-15', 1.0,  0.0, 0.25),
  ('math-16', 1.0,  0.0, 0.25),
  ('math-8',  1.0,  1.0, 0.25), ('math-9',  1.0,  1.0, 0.25), ('math-10', 1.0,  1.0, 0.25),
  ('math-17', 1.0,  1.0, 0.25), ('math-18', 1.0,  1.0, 0.25),
  ('ml-1', 1.0, -1.0, 0.25), ('ml-2', 1.0, -1.0, 0.25), ('ml-3', 1.0, -1.0, 0.25),
  ('ml-4', 1.0,  0.0, 0.25), ('ml-5', 1.0,  0.0, 0.25), ('ml-6', 1.0,  0.0, 0.25),
  ('ml-7', 1.0,  0.0, 0.25),
  ('ml-8', 1.0,  1.0, 0.25), ('ml-9', 1.0,  1.0, 0.25), ('ml-10', 1.0, 1.0, 0.25),
  ('algo-1', 1.0, -1.0, 0.25), ('algo-2', 1.0, -1.0, 0.25), ('algo-3', 1.0, -1.0, 0.25),
  ('algo-4', 1.0,  0.0, 0.25), ('algo-5', 1.0,  0.0, 0.25), ('algo-6', 1.0,  0.0, 0.25),
  ('algo-7', 1.0,  0.0, 0.25),
  ('algo-8', 1.0,  1.0, 0.25), ('algo-9', 1.0,  1.0, 0.25), ('algo-10', 1.0, 1.0, 0.25)
ON CONFLICT (item_id) DO NOTHING;
