export type Difficulty = "basic" | "intermediate" | "advanced";

export interface DiagnosticQuestion {
  id: string;
  prompt: string;
  context?: string;
  options: string[];
  correctIndex: number;
  conceptId: string;
  difficulty: Difficulty;
}

export interface TopicGate {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
}

export interface CourseDiagnostic {
  courseId: string;
  courseTitle: string;
  destination: string;
  estimatedMinutes: number;
  questions: DiagnosticQuestion[];
  randomSelection?: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  topicGates: TopicGate[];
}

export interface SkillLevelDescriptor {
  code: "L1" | "L2" | "L3";
  title: string;
  outcomes: string[];
}

export interface SkillDomainRubric {
  domainId: string;
  title: string;
  levels: {
    junior: SkillLevelDescriptor;
    middle: SkillLevelDescriptor;
    senior: SkillLevelDescriptor;
  };
}

export interface CourseSkillRubric {
  courseId: string;
  levelLabels: {
    junior: string;
    middle: string;
    senior: string;
  };
  domains: SkillDomainRubric[];
  conceptToDomain: Record<string, string>;
}

const mathQuestions: DiagnosticQuestion[] = [
  { id: "math-1", prompt: "Решите уравнение $2x + 3 = 11$", options: ["$x = 4$", "$x = 3$", "$x = 5$", "$x = 6$"], correctIndex: 0, conceptId: "math-la-matrix-ops", difficulty: "basic" },
  { id: "math-2", prompt: "Найдите производную $f(x) = x^2$", options: ["$2x$", "$x$", "$x^3$", "$2$"], correctIndex: 0, conceptId: "math-calc-derivative", difficulty: "basic" },
  { id: "math-3", prompt: "Чему равен определитель $\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$?", options: ["$-2$", "$2$", "$10$", "$0$"], correctIndex: 0, conceptId: "math-la-matrix-ops", difficulty: "basic" },
  { id: "math-11", prompt: "Евклидова норма вектора $[1, 2, 3]$ равна", options: ["$\\sqrt{14}$", "$6$", "$14$", "$\\sqrt{6}$"], correctIndex: 0, conceptId: "math-la-rank-basis", difficulty: "basic" },
  { id: "math-12", prompt: "Если $\\det(A) = 5$ для матрицы $3 \\times 3$, то $\\det(2A)$ равно", options: ["$40$", "$10$", "$15$", "$20$"], correctIndex: 0, conceptId: "math-la-matrix-ops", difficulty: "basic" },
  { id: "math-13", prompt: "При сильной правосторонней асимметрии доходов более устойчивая оценка центра", options: ["Медиана", "Среднее", "Мода", "Дисперсия"], correctIndex: 0, conceptId: "math-stat-hypothesis", difficulty: "basic" },
  { id: "math-4", prompt: "Если $P(A) = 0{,}3$ и $P(B) = 0{,}5$, $A$ и $B$ независимы. Чему равно $P(A \\cap B)$?", options: ["$0{,}15$", "$0{,}8$", "$0{,}2$", "$0{,}35$"], correctIndex: 0, conceptId: "math-prob-conditional", difficulty: "intermediate" },
  { id: "math-5", prompt: "Ранг матрицы $\\begin{pmatrix} 1 & 2 & 3 \\\\ 2 & 4 & 6 \\\\ 1 & 1 & 1 \\end{pmatrix}$ равен", options: ["$1$", "$2$", "$3$", "$0$"], correctIndex: 1, conceptId: "math-la-rank-basis", difficulty: "intermediate" },
  { id: "math-6", prompt: "Что показывает p-value в классической проверке гипотез?", options: ["Вероятность получить наблюдение не менее экстремальное при верной $H_0$", "Вероятность, что $H_0$ истинна", "Мощность теста", "Долю ошибок II рода"], correctIndex: 0, conceptId: "math-stat-hypothesis", difficulty: "intermediate" },
  { id: "math-7", prompt: "Какой метод численно ищет минимум функции по направлению антиградиента?", options: ["Градиентный спуск", "Метод Эйлера", "Метод Монте-Карло", "Преобразование Фурье"], correctIndex: 0, conceptId: "math-calc-grad-descent", difficulty: "intermediate" },
  { id: "math-14", prompt: "Вероятность болезни $0{,}1\\%$, чувствительность $98\\%$, ложноположительный $1\\%$. $P(\\text{болен} \\mid +)$ примерно", options: ["$\\approx 8{,}9\\%$", "$\\approx 98\\%$", "$\\approx 50\\%$", "$\\approx 0{,}1\\%$"], correctIndex: 0, conceptId: "math-prob-distributions", difficulty: "intermediate" },
  { id: "math-15", prompt: "Для $n = 20$ и неизвестной дисперсии при сравнении средних выбирают", options: ["$t$-тест", "$z$-тест", "$\\chi^2$-тест", "Критерий знаков"], correctIndex: 0, conceptId: "math-stat-hypothesis", difficulty: "intermediate" },
  { id: "math-16", prompt: "Ключевое отличие SGD от batch GD", options: ["Обновление по мини-батчам/наблюдениям даёт шумный, но быстрый шаг", "SGD всегда использует второй порядок", "Batch не использует градиенты", "SGD гарантирует точный минимум за один шаг"], correctIndex: 0, conceptId: "math-calc-grad-descent", difficulty: "intermediate" },
  { id: "math-8", prompt: "Если матрица $A$ имеет $3$ линейно независимых столбца в $\\mathbb{R}^5$, размерность её столбцового пространства", options: ["$3$", "$5$", "$2$", "$8$"], correctIndex: 0, conceptId: "math-la-rank-basis", difficulty: "advanced" },
  { id: "math-9", prompt: "Для нормального распределения $N(\\mu, \\sigma^2)$ математическое ожидание равно", options: ["$\\mu$", "$\\sigma$", "$\\sigma^2$", "$0$ всегда"], correctIndex: 0, conceptId: "math-prob-distributions", difficulty: "advanced" },
  { id: "math-10", prompt: "Какой подход помогает оценить интеграл без аналитического решения при высокой размерности?", options: ["Монте-Карло", "Метод Гаусса", "Метод Ньютона", "LU-разложение"], correctIndex: 0, conceptId: "math-num-integration", difficulty: "advanced" },
  { id: "math-17", prompt: "Метод Бонферрони для $100$ гипотез при $\\alpha = 0{,}05$ даёт порог", options: ["$0{,}0005$", "$0{,}005$", "$0{,}05$", "$0{,}5$"], correctIndex: 0, conceptId: "math-stat-hypothesis", difficulty: "advanced" },
  { id: "math-18", prompt: "Для $A = \\begin{pmatrix} 3 & 1 \\\\ -6 & -4 \\end{pmatrix}$ верное LU-разложение", options: ["$L = \\begin{pmatrix} 1 & 0 \\\\ -2 & 1 \\end{pmatrix},\\ U = \\begin{pmatrix} 3 & 1 \\\\ 0 & -2 \\end{pmatrix}$", "$L = \\begin{pmatrix} 3 & 0 \\\\ -6 & 1 \\end{pmatrix},\\ U = \\begin{pmatrix} 1 & 1 \\\\ 0 & -2 \\end{pmatrix}$", "$L = \\begin{pmatrix} 1 & 0 \\\\ 2 & 1 \\end{pmatrix},\\ U = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$", "LU для матрицы не существует"], correctIndex: 0, conceptId: "math-num-integration", difficulty: "advanced" },
];

function takeRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function buildDiagnosticQuestionSet(diagnostic: CourseDiagnostic): DiagnosticQuestion[] {
  const plan = diagnostic.randomSelection;
  if (!plan) {
    return diagnostic.questions;
  }

  const basic = diagnostic.questions.filter((question) => question.difficulty === "basic");
  const intermediate = diagnostic.questions.filter((question) => question.difficulty === "intermediate");
  const advanced = diagnostic.questions.filter((question) => question.difficulty === "advanced");

  return [
    ...takeRandom(basic, plan.basic),
    ...takeRandom(intermediate, plan.intermediate),
    ...takeRandom(advanced, plan.advanced),
  ];
}

// ─── CAT (Computerized Adaptive Testing) ──────────────────────────────────────

export const CAT_MAX_ITEMS = 8;

const CAT_A = 1.0;  // default discrimination
const CAT_C = 0.25; // guessing rate (4 choices)

// IRT 3PL probability: P(correct | theta)
function irtP(theta: number, a: number, b: number, c: number): number {
  return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

// Fisher information for an item at a given ability level
function fisherInfo(theta: number, a: number, b: number, c: number): number {
  const p = irtP(theta, a, b, c);
  const denom = (1 - c) ** 2 * p * (1 - p);
  if (denom < 1e-9) return 0;
  return (a * (p - c)) ** 2 / denom;
}

function difficultyToB(d: Difficulty): number {
  if (d === "advanced") return 1.0;
  if (d === "intermediate") return 0.0;
  return -1.0;
}

// Select the next item that maximises Fisher information at current theta
export function selectNextItem(
  theta: number,
  answeredIds: string[],
  pool: DiagnosticQuestion[],
): DiagnosticQuestion | null {
  const available = pool.filter((q) => !answeredIds.includes(q.id));
  if (available.length === 0) return null;

  let best = available[0];
  let bestInfo = -1;
  for (const q of available) {
    const info = fisherInfo(theta, CAT_A, difficultyToB(q.difficulty), CAT_C);
    if (info > bestInfo) {
      bestInfo = info;
      best = q;
    }
  }
  return best;
}

// EAP quadrature grid (13 points), standard normal prior
const QUAD_POINTS = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];

export function initThetaWeights(): number[] {
  const raw = QUAD_POINTS.map((t) => Math.exp(-0.5 * t * t));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

// Update ability estimate using EAP after one observed response
export function updateThetaEAP(
  weights: number[],
  item: DiagnosticQuestion,
  correct: boolean,
): { theta: number; weights: number[] } {
  const b = difficultyToB(item.difficulty);
  const updated = QUAD_POINTS.map((t, i) => {
    const p = irtP(t, CAT_A, b, CAT_C);
    return weights[i] * (correct ? p : 1 - p);
  });
  const sum = updated.reduce((a, x) => a + x, 0) || 1e-10;
  const norm = updated.map((w) => w / sum);
  const theta = QUAD_POINTS.reduce((acc, t, i) => acc + t * norm[i], 0);
  return { theta, weights: norm };
}

const mlQuestions: DiagnosticQuestion[] = [
  { id: "ml-1", prompt: "Для задачи бинарной классификации логистическая регрессия предсказывает", options: ["Вероятность класса", "Только дискретную метку", "Среднее значение признаков", "Дисперсию ошибки"], correctIndex: 0, conceptId: "ml-logistic-regression", difficulty: "basic" },
  { id: "ml-2", prompt: "Что обычно делают перед обучением модели на признаках разного масштаба?", options: ["Нормализацию/стандартизацию", "Удаляют целевую переменную", "Увеличивают learning rate", "Всегда применяют PCA"], correctIndex: 0, conceptId: "ml-feature-scaling", difficulty: "basic" },
  { id: "ml-3", prompt: "Переобучение означает, что модель", options: ["Хорошо знает train, плохо обобщает на test", "Плохо обучилась и на train", "Всегда имеет высокий bias", "Никогда не использует регуляризацию"], correctIndex: 0, conceptId: "ml-overfitting", difficulty: "basic" },
  { id: "ml-4", prompt: "$L_2$-регуляризация в линейной модели в первую очередь", options: ["Штрафует большие веса", "Увеличивает размер датасета", "Заменяет функцию потерь на hinge", "Убирает смещение"], correctIndex: 0, conceptId: "ml-regularization", difficulty: "intermediate" },
  { id: "ml-5", prompt: "Что показывает ROC-AUC?", options: ["Способность модели ранжировать положительные объекты выше отрицательных", "Точность только на положительном классе", "Скорость обучения", "Количество параметров сети"], correctIndex: 0, conceptId: "ml-metrics-roc-auc", difficulty: "intermediate" },
  { id: "ml-6", prompt: "Почему в deep-сетях возникает vanishing gradient?", options: ["Градиенты затухают при обратном проходе через многие слои", "Потому что batch size слишком велик", "Потому что loss всегда выпуклая", "Из-за отсутствия dropout"], correctIndex: 0, conceptId: "ml-vanishing-gradient", difficulty: "intermediate" },
  { id: "ml-7", prompt: "Для борьбы с leakage в валидации важно", options: ["Строить preprocessing внутри CV pipeline", "Всегда увеличивать test size", "Удалять выбросы вручную после split", "Использовать только accuracy"], correctIndex: 0, conceptId: "ml-validation-leakage", difficulty: "intermediate" },
  { id: "ml-8", prompt: "BatchNorm в нейросетях помогает", options: ["Стабилизировать распределения активаций и ускорить обучение", "Заменить оптимизатор", "Убрать необходимость в данных", "Сделать функцию потерь линейной"], correctIndex: 0, conceptId: "ml-batchnorm", difficulty: "advanced" },
  { id: "ml-9", prompt: "В деревьях решений Gini impurity используется для", options: ["Оценки качества разбиения узла", "Подбора learning rate", "Оценки косинусного сходства", "Выбора функции активации"], correctIndex: 0, conceptId: "ml-tree-splitting", difficulty: "advanced" },
  { id: "ml-10", prompt: "Что такое bias-variance tradeoff?", options: ["Компромисс между недообучением и переобучением", "Смена train/test местами", "Сравнение CPU и GPU", "Выбор между $L_1$ и $L_2$ без данных"], correctIndex: 0, conceptId: "ml-bias-variance", difficulty: "advanced" },
];

const algorithmsQuestions: DiagnosticQuestion[] = [
  { id: "algo-1", prompt: "Сложность линейного поиска в массиве длины $n$", options: ["$O(n)$", "$O(\\log n)$", "$O(1)$", "$O(n \\log n)$"], correctIndex: 0, conceptId: "algo-linear-search", difficulty: "basic" },
  { id: "algo-2", prompt: "Какой принцип лежит в основе стека?", options: ["LIFO", "FIFO", "Приоритет", "Хеширование"], correctIndex: 0, conceptId: "ds-stack", difficulty: "basic" },
  { id: "algo-3", prompt: "Сложность доступа к элементу по индексу в массиве", options: ["$O(1)$", "$O(n)$", "$O(\\log n)$", "$O(n^2)$"], correctIndex: 0, conceptId: "ds-array-access", difficulty: "basic" },
  { id: "algo-4", prompt: "Средняя сложность merge sort", options: ["$O(n \\log n)$", "$O(n)$", "$O(\\log n)$", "$O(n^2)$"], correctIndex: 0, conceptId: "algo-merge-sort", difficulty: "intermediate" },
  { id: "algo-5", prompt: "Для поиска кратчайшего пути в графе с неотрицательными весами обычно применяют", options: ["Алгоритм Дейкстры", "DFS", "KMP", "Bellman-Ford только для DAG"], correctIndex: 0, conceptId: "graphs-dijkstra", difficulty: "intermediate" },
  { id: "algo-6", prompt: "Хеш-таблица в среднем обеспечивает вставку", options: ["$O(1)$", "$O(n)$", "$O(\\log n)$", "$O(n \\log n)$"], correctIndex: 0, conceptId: "ds-hash-table", difficulty: "intermediate" },
  { id: "algo-7", prompt: "Динамическое программирование эффективно, когда задача имеет", options: ["Оптимальную подструктуру и перекрывающиеся подзадачи", "Только жадное свойство", "Только сортировку", "Только рекурсию без мемоизации"], correctIndex: 0, conceptId: "algo-dp", difficulty: "intermediate" },
  { id: "algo-8", prompt: "Амортизированная сложность push_back в динамическом массиве", options: ["$O(1)$", "$O(n)$", "$O(\\log n)$", "$O(n^2)$"], correctIndex: 0, conceptId: "ds-dynamic-array", difficulty: "advanced" },
  { id: "algo-9", prompt: "Что гарантирует красно-черное дерево?", options: ["Высоту $O(\\log n)$", "Полную сбалансированность", "Отсортированный обход за $O(1)$", "Отсутствие поворотов"], correctIndex: 0, conceptId: "ds-rb-tree", difficulty: "advanced" },
  { id: "algo-10", prompt: "Когда BFS даёт кратчайший путь?", options: ["В невзвешенном графе", "Во всех графах", "Только в деревьях", "Только при отрицательных весах"], correctIndex: 0, conceptId: "graphs-bfs-shortest", difficulty: "advanced" },
];

export const courseDiagnostics: CourseDiagnostic[] = [
  {
    courseId: "math-for-data-science",
    courseTitle: "Математика для Data Science",
    destination: "/subjects/mathematics",
    estimatedMinutes: 12,
    questions: mathQuestions,
    randomSelection: {
      basic: 4,
      intermediate: 5,
      advanced: 3,
    },
    topicGates: [
      { id: "math-linear-algebra", title: "Линейная алгебра", description: "Матрицы, ранг, базисы и геометрия пространств.", prerequisites: ["math-la-matrix-ops", "math-la-rank-basis"] },
      { id: "math-calculus-opt", title: "Матан и оптимизация", description: "Производные, градиенты, методы оптимизации.", prerequisites: ["math-calc-derivative", "math-calc-grad-descent"] },
      { id: "math-probability", title: "Теория вероятностей", description: "Распределения, независимость событий, оценки вероятностей.", prerequisites: ["math-prob-conditional", "math-prob-distributions"] },
      { id: "math-statistics", title: "Статистика и проверка гипотез", description: "Интерпретация p-value и статистический вывод.", prerequisites: ["math-stat-hypothesis"] },
      { id: "math-numerical", title: "Численные методы", description: "Монте-Карло и численные подходы к сложным вычислениям.", prerequisites: ["math-num-integration"] },
    ],
  },
  {
    courseId: "machine-learning",
    courseTitle: "Машинное обучение (ML)",
    destination: "/dashboard",
    estimatedMinutes: 12,
    questions: mlQuestions,
    topicGates: [
      { id: "ml-basics", title: "Классический ML", description: "Линейные модели, preprocessing и борьба с overfitting.", prerequisites: ["ml-logistic-regression", "ml-feature-scaling", "ml-overfitting", "ml-regularization"] },
      { id: "ml-evaluation", title: "Валидация и метрики", description: "ROC-AUC, корректная CV и data leakage.", prerequisites: ["ml-metrics-roc-auc", "ml-validation-leakage"] },
      { id: "ml-deep", title: "Deep Learning Core", description: "Градиенты, нормализация и устойчивость обучения.", prerequisites: ["ml-vanishing-gradient", "ml-batchnorm"] },
      { id: "ml-models", title: "Деревья и ансамбли", description: "Критерии разбиения и управление bias/variance.", prerequisites: ["ml-tree-splitting", "ml-bias-variance"] },
    ],
  },
  {
    courseId: "algorithms",
    courseTitle: "Алгоритмы и структуры данных",
    destination: "/dashboard",
    estimatedMinutes: 12,
    questions: algorithmsQuestions,
    topicGates: [
      { id: "algo-core", title: "Базовые структуры", description: "Массивы, стеки, хеш-таблицы и их сложность.", prerequisites: ["algo-linear-search", "ds-stack", "ds-array-access", "ds-hash-table"] },
      { id: "algo-sorting", title: "Сортировки и оценка сложности", description: "Стабильные сортировки и асимптотика.", prerequisites: ["algo-merge-sort"] },
      { id: "algo-graphs", title: "Графовые алгоритмы", description: "BFS и Дейкстра для путей в графах.", prerequisites: ["graphs-bfs-shortest", "graphs-dijkstra"] },
      { id: "algo-dp-adv", title: "DP и продвинутые деревья", description: "Динамическое программирование, амортизированный анализ, balanced BST.", prerequisites: ["algo-dp", "ds-dynamic-array", "ds-rb-tree"] },
    ],
  },
];

export const diagnosticsByCourseId = Object.fromEntries(
  courseDiagnostics.map((diagnostic) => [diagnostic.courseId, diagnostic]),
);


export const courseSkillRubrics: CourseSkillRubric[] = [
  {
    courseId: "math-for-data-science",
    levelLabels: {
      junior: "Junior (L1)",
      middle: "Middle (L2)",
      senior: "Senior (L3)",
    },
    domains: [
      {
        domainId: "linear-algebra",
        title: "Линейная алгебра",
        levels: {
          junior: {
            code: "L1",
            title: "Junior",
            outcomes: ["Умножение матриц", "Норма вектора", "Свойства определителя"],
          },
          middle: {
            code: "L2",
            title: "Middle",
            outcomes: ["Собственные числа", "Ранг матрицы", "Решение систем уравнений"],
          },
          senior: {
            code: "L3",
            title: "Senior",
            outcomes: ["SVD", "Тензорное исчисление", "Численные методы декомпозиции"],
          },
        },
      },
      {
        domainId: "probability-theory",
        title: "Теория вероятностей",
        levels: {
          junior: {
            code: "L1",
            title: "Junior",
            outcomes: ["Условная вероятность", "Независимость", "Закон больших чисел"],
          },
          middle: {
            code: "L2",
            title: "Middle",
            outcomes: ["Теорема Байеса", "ЦПТ", "Дискретные и непрерывные распределения"],
          },
          senior: {
            code: "L3",
            title: "Senior",
            outcomes: ["Марковские процессы", "Случайные блуждания", "Информационная энтропия"],
          },
        },
      },
      {
        domainId: "statistics",
        title: "Статистика",
        levels: {
          junior: {
            code: "L1",
            title: "Junior",
            outcomes: ["Среднее/Медиана", "Дисперсия", "p-value"],
          },
          middle: {
            code: "L2",
            title: "Middle",
            outcomes: ["Ошибки I/II рода", "Z/T-тесты", "Доверительные интервалы"],
          },
          senior: {
            code: "L3",
            title: "Senior",
            outcomes: ["Мощность теста", "Коррекции множественного тестирования", "Бутстреп"],
          },
        },
      },
      {
        domainId: "analysis-optimization",
        title: "Анализ и оптимизация",
        levels: {
          junior: {
            code: "L1",
            title: "Junior",
            outcomes: ["Градиент", "Частная производная", "Шаг обучения"],
          },
          middle: {
            code: "L2",
            title: "Middle",
            outcomes: ["Backpropagation", "SGD", "Выпуклость функций потерь"],
          },
          senior: {
            code: "L3",
            title: "Senior",
            outcomes: ["Матрица Гессе", "Методы второго порядка", "Лагранжианы"],
          },
        },
      },
    ],
    conceptToDomain: {
      "math-la-matrix-ops":     "linear-algebra",
      "math-la-rank-basis":     "linear-algebra",
      "math-prob-conditional":  "probability-theory",
      "math-prob-distributions":"probability-theory",
      "math-stat-hypothesis":   "statistics",
      "math-calc-derivative":   "analysis-optimization",
      "math-calc-grad-descent": "analysis-optimization",
      "math-num-integration":   "analysis-optimization",
    },
  },
];

export const rubricByCourseId = Object.fromEntries(
  courseSkillRubrics.map((rubric) => [rubric.courseId, rubric]),
);
