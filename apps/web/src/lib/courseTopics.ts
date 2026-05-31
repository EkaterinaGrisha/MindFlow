/**
 * Single source of truth for the Math course structure.
 *
 * All UI surfaces (Catalog, Dashboard sidebar, Knowledge Graph, Progress page)
 * derive their topic identities from here. Mastery state lives in Supabase
 * (`kg_mastery`), but topic names, ordering, and grouping come from this file.
 *
 * The DB seed migration must keep `concept_id` and `name` aligned with the
 * entries below so server-side mastery rows can be joined back to UI topics.
 */

export interface CourseTopic {
  conceptId: string;
  name: string;
  /** Short label for graph nodes (math symbol or 2-3 word abbreviation). */
  shortLabel?: string;
  /** One-sentence explanation of why this topic matters. */
  whyItMatters?: string;
}

export interface CourseSection {
  id: string;
  title: string;
  description: string;
  domain: string;
  topics: CourseTopic[];
}

export const MATH_COURSE_ID = 'math-for-data-science';

export const MATH_SECTIONS: CourseSection[] = [
  {
    id: 'linear-algebra',
    title: 'Линейная алгебра',
    description: 'Векторы, матрицы, собственные значения и SVD — база для ML-моделей.',
    domain: 'Линейная алгебра',
    topics: [
      { conceptId: 'math-la-matrix-ops',  name: 'Операции с матрицами',
        shortLabel: 'A·B',
        whyItMatters: 'Любая модель ML — это перемножение матриц. Без этого нет нейросетей, рекомендаций, PCA.' },
      { conceptId: 'math-la-rank-basis',  name: 'Ранг и базис',
        shortLabel: 'rank',
        whyItMatters: 'Определяет сколько у задачи реально независимых измерений — основа размерности данных.' },
      { conceptId: 'math-la-eigenvalues', name: 'Собственные значения',
        shortLabel: 'λ, v',
        whyItMatters: 'PCA, спектральная кластеризация, PageRank — всё построено на собственных векторах.' },
      { conceptId: 'math-la-svd',         name: 'Сингулярное разложение (SVD) — часть 1',
        shortLabel: 'SVD',
        whyItMatters: 'Универсальный способ "разложить" любые данные на главные компоненты.' },
      { conceptId: 'math-la-svd-app',     name: 'Сингулярное разложение (SVD) — часть 2',
        shortLabel: 'SVD+',
        whyItMatters: 'PCA, сжатие изображений, латентные факторы Netflix — приложения SVD.' },
    ],
  },
  {
    id: 'calculus',
    title: 'Математический анализ',
    description: 'Производные, градиенты и оптимизация функций потерь.',
    domain: 'Математический анализ',
    topics: [
      { conceptId: 'math-calc-limits',       name: 'Предел и непрерывность',
        shortLabel: 'lim',
        whyItMatters: 'Фундамент всего: производных, интегралов, непрерывных распределений.' },
      { conceptId: 'math-calc-derivative',   name: 'Производная и градиент',
        shortLabel: "f'(x)",
        whyItMatters: 'Скорость изменения функции. Точно так же обучаются нейросети.' },
      { conceptId: 'math-calc-partial',      name: 'Частные производные',
        shortLabel: '∂f',
        whyItMatters: 'Производные по нескольким переменным — основа градиентов в ML.' },
      { conceptId: 'math-calc-grad-descent', name: 'Градиентный спуск — часть 1',
        shortLabel: '∇L',
        whyItMatters: 'Главный алгоритм обучения моделей: «иди против градиента ошибки». Основы, learning rate, овраги, Batch GD.' },
      { conceptId: 'math-calc-grad-descent-part2', name: 'Градиентный спуск — часть 2',
        shortLabel: '∇L+',
        whyItMatters: 'SGD, momentum, Adam, расписания learning rate и пример с линейной регрессией.' },
    ],
  },
  {
    id: 'probability',
    title: 'Теория вероятностей',
    description: 'Случайные величины, распределения, условная вероятность и байесовский подход.',
    domain: 'Теория вероятностей',
    topics: [
      { conceptId: 'math-prob-random-vars',   name: 'Случайные величины',
        shortLabel: 'X',
        whyItMatters: 'Любая неопределённость в данных моделируется как случайная величина.' },
      { conceptId: 'math-prob-distributions', name: 'Основные распределения',
        shortLabel: 'P(X)',
        whyItMatters: 'Нормальное, Бернулли, Пуассон — язык, на котором A/B-тесты и ML говорят с данными.' },
      { conceptId: 'math-prob-conditional',   name: 'Условная вероятность',
        shortLabel: 'P(A|B)',
        whyItMatters: 'Основа классификации, фильтров спама, Bayes-сетей.' },
      { conceptId: 'math-prob-bayes',         name: 'Формула Байеса',
        shortLabel: 'Bayes',
        whyItMatters: 'Наивный Байес, Bayesian A/B, обновление гипотез — всё отсюда.' },
    ],
  },
  {
    id: 'statistics',
    title: 'Математическая статистика',
    description: 'Оценивание параметров, доверительные интервалы и проверка гипотез.',
    domain: 'Математическая статистика',
    topics: [
      { conceptId: 'math-stat-estimators', name: 'Точечные оценки',
        shortLabel: 'θ̂',
        whyItMatters: 'Как из выборки оценить параметр генеральной совокупности — основа всей статистики.' },
      { conceptId: 'math-stat-confidence', name: 'Доверительные интервалы',
        shortLabel: 'CI',
        whyItMatters: 'Не «точка», а диапазон с уровнем доверия — честная неопределённость в отчётах.' },
      { conceptId: 'math-stat-hypothesis', name: 'Проверка гипотез',
        shortLabel: 'H₀',
        whyItMatters: 'A/B-тесты, проверка эффектов — формальная процедура решения «работает или нет».' },
      { conceptId: 'math-stat-pvalue',     name: 'p-value и ошибки I/II рода',
        shortLabel: 'p<α',
        whyItMatters: 'Понимание p-value спасает от ложных открытий и неправильных продуктовых решений.' },
    ],
  },
  {
    id: 'discrete',
    title: 'Дискретная математика',
    description: 'Комбинаторика, графы и логика для алгоритмов и структур данных.',
    domain: 'Дискретная математика',
    topics: [
      { conceptId: 'math-disc-combinatorics', name: 'Комбинаторные правила',
        shortLabel: 'C(n,k)',
        whyItMatters: 'Сколько способов? Основа дискретной вероятности и оценки сложности.' },
      { conceptId: 'math-disc-boolean',       name: 'Булева алгебра',
        shortLabel: '∧∨¬',
        whyItMatters: 'Логика условий в коде, фильтры запросов, цифровые схемы.' },
      { conceptId: 'math-disc-graphs',        name: 'Теория графов',
        shortLabel: 'G(V,E)',
        whyItMatters: 'Соц.сети, дороги, нейросети — всё это графы. PageRank, BFS, shortest path.' },
      { conceptId: 'math-disc-recurrence',    name: 'Рекуррентные соотношения',
        shortLabel: 'aₙ₊₁',
        whyItMatters: 'Сложность алгоритмов (T(n) = 2T(n/2)+n), DP, временные ряды.' },
    ],
  },
  {
    id: 'numerical',
    title: 'Численные методы',
    description: 'Численная оптимизация, интерполяция и устойчивые вычисления в Python.',
    domain: 'Численные методы',
    topics: [
      { conceptId: 'math-num-roots',         name: 'Поиск корней уравнений',
        shortLabel: 'f(x)=0',
        whyItMatters: 'Любая нелинейная задача сводится к поиску корня. Метод бисекции, секущих.' },
      { conceptId: 'math-num-integration',   name: 'Численное интегрирование',
        shortLabel: '∫dx',
        whyItMatters: 'Когда формулы нет — считаем приближённо. Monte Carlo, Симпсон, трапеции.' },
      { conceptId: 'math-num-interpolation', name: 'Интерполяция',
        shortLabel: 'spline',
        whyItMatters: 'Восстановление функции по точкам — основа сплайнов и непрерывных кривых.' },
      { conceptId: 'math-num-newton',        name: 'Метод Ньютона',
        shortLabel: 'Newton',
        whyItMatters: 'Универсальный решатель уравнений и оптимизатор второго порядка.' },
    ],
  },
];

// ─── Within-section sequential prerequisites ──────────────────────────────────

/** Sequential prerequisites within each section (topic N → topic N+1). */
export const MATH_PREREQUISITES: Array<{ from: string; to: string }> =
  MATH_SECTIONS.flatMap((s) =>
    s.topics.slice(1).map((t, i) => ({ from: s.topics[i].conceptId, to: t.conceptId })),
  );

// ─── Cross-section prerequisites ──────────────────────────────────────────────
// These are the REAL connections across disciplines: what mathematical
// foundation a topic from one section relies on from another.
// Each edge has a short explanation of WHY the link exists.

export interface CrossPrereq {
  from: string;
  to: string;
  /** Human explanation of why this link exists. */
  reason: string;
}

export const MATH_CROSS_PREREQUISITES: CrossPrereq[] = [
  // ── Calculus needs Linear Algebra for gradient descent ───────────────────
  {
    from: 'math-la-matrix-ops',
    to:   'math-calc-grad-descent',
    reason: 'Градиентный спуск в ML — это умножение матриц на векторы параметров.',
  },
  // ── Probability needs Calculus for continuous distributions ──────────────
  {
    from: 'math-calc-limits',
    to:   'math-prob-distributions',
    reason: 'Непрерывные распределения определяются через пределы и интегралы.',
  },
  // ── Probability needs Combinatorics ──────────────────────────────────────
  {
    from: 'math-disc-combinatorics',
    to:   'math-prob-random-vars',
    reason: 'Дискретная вероятность = подсчёт благоприятных исходов по комбинаторным правилам.',
  },
  // ── Statistics is built on Probability ───────────────────────────────────
  {
    from: 'math-prob-distributions',
    to:   'math-stat-estimators',
    reason: 'Оценки параметров (среднее, дисперсия) — характеристики распределений.',
  },
  {
    from: 'math-prob-distributions',
    to:   'math-stat-confidence',
    reason: 'Доверительные интервалы строятся на квантилях распределения (нормального, t).',
  },
  {
    from: 'math-prob-distributions',
    to:   'math-stat-hypothesis',
    reason: 'Проверка гипотез использует распределение тестовой статистики при H₀.',
  },
  // ── Numerical methods need Calculus ──────────────────────────────────────
  {
    from: 'math-calc-derivative',
    to:   'math-num-newton',
    reason: 'Метод Ньютона: xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ) — буквально про производную.',
  },
  {
    from: 'math-calc-derivative',
    to:   'math-num-roots',
    reason: 'Большинство методов поиска корней (секущих, Ньютона) опираются на производную.',
  },
  {
    from: 'math-calc-limits',
    to:   'math-num-integration',
    reason: 'Численное интегрирование — это аппроксимация предельной суммы Римана.',
  },
  // ── Numerical methods need Linear Algebra ────────────────────────────────
  {
    from: 'math-la-matrix-ops',
    to:   'math-num-interpolation',
    reason: 'Сплайны и полиномиальная интерполяция — это решение системы Ax=b.',
  },
  // ── Statistics + Linear Algebra → regression ─────────────────────────────
  {
    from: 'math-la-rank-basis',
    to:   'math-la-svd-app',
    reason: 'Низкоранговые приближения — главное приложение SVD.',
  },
  {
    from: 'math-stat-estimators',
    to:   'math-la-svd-app',
    reason: 'PCA и регрессия через SVD используют статистические оценки на компонентах.',
  },
  // ── Graphs + matrices → network analysis ─────────────────────────────────
  {
    from: 'math-la-matrix-ops',
    to:   'math-disc-graphs',
    reason: 'Граф представляется матрицей смежности; её свойства = свойства сети.',
  },
];

// All edges merged (used by the depth layout)
export const MATH_ALL_EDGES: Array<{ from: string; to: string; cross: boolean; reason?: string }> = [
  ...MATH_PREREQUISITES.map((e) => ({ ...e, cross: false })),
  ...MATH_CROSS_PREREQUISITES.map((e) => ({ from: e.from, to: e.to, cross: true, reason: e.reason })),
];

// ─── Synthesis / application bridges ──────────────────────────────────────────
// Famous combinations: «знание этих тем открывает применение X».
// Shown in the UI as a separate panel so students see the real-world value.

export interface MathApplication {
  id: string;
  title: string;
  emoji: string;
  /** Which topics power this application. */
  topics: string[];
  /** Sentence explaining why this combo works. */
  description: string;
}

export const MATH_APPLICATIONS: MathApplication[] = [
  {
    id: 'optimization',
    title: 'Оптимизация в ML',
    emoji: '🎯',
    topics: ['math-la-matrix-ops', 'math-calc-partial', 'math-calc-grad-descent'],
    description: 'Матрицы + частные производные = градиентный спуск. Так обучаются нейросети, регрессия, бустинги.',
  },
  {
    id: 'ab-testing',
    title: 'A/B-тесты',
    emoji: '🧪',
    topics: ['math-prob-distributions', 'math-stat-hypothesis', 'math-stat-pvalue'],
    description: 'Распределения + проверка гипотез + p-value — формальная процедура решения «фича работает или нет».',
  },
  {
    id: 'pca',
    title: 'PCA и снижение размерности',
    emoji: '📊',
    topics: ['math-la-eigenvalues', 'math-la-svd', 'math-la-svd-app', 'math-stat-estimators'],
    description: 'Собственные значения + SVD + оценки — основа PCA, латентных факторов и сжатия данных.',
  },
  {
    id: 'pagerank',
    title: 'PageRank и сетевой анализ',
    emoji: '🔗',
    topics: ['math-disc-graphs', 'math-la-matrix-ops', 'math-la-eigenvalues'],
    description: 'Граф → матрица смежности → главный собственный вектор = ранжирование страниц.',
  },
  {
    id: 'bayes-ml',
    title: 'Байесовский классификатор',
    emoji: '🧠',
    topics: ['math-prob-conditional', 'math-prob-bayes', 'math-prob-distributions'],
    description: 'Условная вероятность + Байес + распределения = naive Bayes для классификации текстов.',
  },
  {
    id: 'monte-carlo',
    title: 'Monte Carlo',
    emoji: '🎲',
    topics: ['math-prob-random-vars', 'math-num-integration'],
    description: 'Случайные величины + численное интегрирование = метод Монте-Карло (риск-моделирование, физика).',
  },
];

// ─── Lookup tables ────────────────────────────────────────────────────────────

export const MATH_TOPIC_BY_CONCEPT_ID: Record<string, { topic: CourseTopic; section: CourseSection }> =
  Object.fromEntries(
    MATH_SECTIONS.flatMap((section) =>
      section.topics.map((topic) => [topic.conceptId, { topic, section }] as const),
    ),
  );

export const MATH_TOPIC_BY_NAME: Record<string, { topic: CourseTopic; section: CourseSection }> =
  Object.fromEntries(
    MATH_SECTIONS.flatMap((section) =>
      section.topics.map((topic) => [topic.name, { topic, section }] as const),
    ),
  );
