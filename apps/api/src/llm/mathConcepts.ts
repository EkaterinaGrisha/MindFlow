/**
 * Snapshot of MATH course concepts for backend use (LLM prompts, validators).
 *
 * Must stay in sync with apps/web/src/lib/courseTopics.ts.
 * Only the minimal fields the backend needs are included.
 */

export interface MathConcept {
  conceptId: string;
  name: string;
  section: string;
}

export const MATH_CONCEPTS: MathConcept[] = [
  { conceptId: "math-la-matrix-ops",          name: "Операции с матрицами",                 section: "Линейная алгебра" },
  { conceptId: "math-la-rank-basis",          name: "Ранг и базис",                          section: "Линейная алгебра" },
  { conceptId: "math-la-eigenvalues",         name: "Собственные значения",                  section: "Линейная алгебра" },
  { conceptId: "math-la-svd",                 name: "Сингулярное разложение (SVD) — часть 1", section: "Линейная алгебра" },
  { conceptId: "math-la-svd-app",             name: "Сингулярное разложение (SVD) — часть 2", section: "Линейная алгебра" },
  { conceptId: "math-calc-limits",            name: "Предел и непрерывность",                section: "Математический анализ" },
  { conceptId: "math-calc-derivative",        name: "Производная и градиент",                section: "Математический анализ" },
  { conceptId: "math-calc-partial",           name: "Частные производные",                   section: "Математический анализ" },
  { conceptId: "math-calc-grad-descent",      name: "Градиентный спуск — часть 1",           section: "Математический анализ" },
  { conceptId: "math-calc-grad-descent-part2",name: "Градиентный спуск — часть 2",           section: "Математический анализ" },
  { conceptId: "math-prob-random-vars",       name: "Случайные величины",                    section: "Теория вероятностей" },
  { conceptId: "math-prob-distributions",     name: "Основные распределения",                section: "Теория вероятностей" },
  { conceptId: "math-prob-conditional",       name: "Условная вероятность",                  section: "Теория вероятностей" },
  { conceptId: "math-prob-bayes",             name: "Формула Байеса",                        section: "Теория вероятностей" },
  { conceptId: "math-stat-estimators",        name: "Точечные оценки",                       section: "Математическая статистика" },
  { conceptId: "math-stat-confidence",        name: "Доверительные интервалы",               section: "Математическая статистика" },
  { conceptId: "math-stat-hypothesis",        name: "Проверка гипотез",                      section: "Математическая статистика" },
  { conceptId: "math-stat-pvalue",            name: "p-value и ошибки I/II рода",            section: "Математическая статистика" },
  { conceptId: "math-disc-combinatorics",     name: "Комбинаторные правила",                 section: "Дискретная математика" },
  { conceptId: "math-disc-boolean",           name: "Булева алгебра",                        section: "Дискретная математика" },
  { conceptId: "math-disc-graphs",            name: "Теория графов",                         section: "Дискретная математика" },
  { conceptId: "math-disc-recurrence",        name: "Рекуррентные соотношения",              section: "Дискретная математика" },
  { conceptId: "math-num-roots",              name: "Поиск корней уравнений",                section: "Численные методы" },
  { conceptId: "math-num-integration",        name: "Численное интегрирование",              section: "Численные методы" },
  { conceptId: "math-num-interpolation",      name: "Интерполяция",                          section: "Численные методы" },
  { conceptId: "math-num-newton",             name: "Метод Ньютона",                         section: "Численные методы" },
];

export const MATH_CONCEPT_IDS: Set<string> = new Set(MATH_CONCEPTS.map((c) => c.conceptId));
