// ─── Типы блоков контента ────────────────────────────────────────────────────

export type VerifiedBlock = {
  type: 'verified'
  text: string
}

export type ScalarsBlock = {
  type: 'scalars'
  items: Array<{
    label: string
    matrix: number[][]
    color?: 'blue' | 'red' | 'green' | 'default'
  }>
}

/** Матрица выражений слева → матрица результатов справа */
export type OperationBlock = {
  type: 'operation'
  expressions: string[][]
  result: number[][]
  resultColor?: 'green' | 'blue'
}

/** До/после: две матрицы со стрелкой-подписью между ними */
export type TransformBlock = {
  type: 'transform'
  from: { label: string; matrix: number[][] }
  arrowLabel: string
  to: { label: string; matrix: number[][] }
}

export type InsightBlock = {
  type: 'insight'
  title: string
  text: string
}

/** Цепочка строк алгебраических выражений */
export type FormulaBlock = {
  type: 'formula'
  lines: string[]
}

/** Вычисление элементов матричного произведения */
export type ComputeBlock = {
  type: 'compute'
  rows: Array<{
    label: string
    expression: string
  }>
  result: {
    label: string
    matrix: number[][]
    color?: 'blue' | 'red' | 'green'
  }
}

export type AnswerBlock = {
  type: 'answer'
  label: string
  matrix: number[][]
  takeaway: string
}

export type ContentBlock =
  | VerifiedBlock
  | ScalarsBlock
  | OperationBlock
  | TransformBlock
  | InsightBlock
  | FormulaBlock
  | ComputeBlock
  | AnswerBlock

// ─── Структура шага и задачи ─────────────────────────────────────────────────

export interface MatrixStep {
  title: string
  description: string
  isCurrent?: boolean
  blocks: ContentBlock[]
}

export interface MatrixPracticeItem {
  id: string
  level: 'базовый' | 'стандартный' | 'продвинутый'
  title: string
  formula: string
  given: Array<{ label: string; matrix: number[][] }>
  steps: MatrixStep[]
}

// ─── Данные задач ─────────────────────────────────────────────────────────────

export const matrixOperationsPractice: MatrixPracticeItem[] = [

  // ── Базовый №1 ──────────────────────────────────────────────────────────────
  {
    id: 'p1',
    level: 'базовый',
    title: 'Сложение, вычитание и умножение на скаляр',
    formula: 'C = 2A − 3B',
    given: [
      { label: 'A', matrix: [[3, -1], [0, 4]] },
      { label: 'B', matrix: [[1,  5], [-2, 0]] },
    ],
    steps: [
      {
        title: 'Проверка размерностей',
        description:
          'Перед вычитанием убеждаемся, что матрицы имеют одинаковый размер. ' +
          'A и B — обе 2×2.',
        blocks: [
          { type: 'verified', text: 'Совместимость подтверждена: обе матрицы 2×2' },
        ],
      },
      {
        title: 'Умножение на скаляр',
        description:
          'Умножаем каждый элемент матрицы A на 2, каждый элемент B — на 3.',
        blocks: [
          {
            type: 'scalars',
            items: [
              { label: '2A =', matrix: [[6, -2], [0,  8]], color: 'blue' },
              { label: '3B =', matrix: [[3, 15], [-6, 0]], color: 'red'  },
            ],
          },
          {
            type: 'insight',
            title: 'Подсказка куратора',
            text:
              'При вычислении −2 можно либо вычесть умноженную матрицу, ' +
              'либо умножить B на −3 и сложить. ' +
              'Единообразный подход исключает арифметические ошибки.',
          },
        ],
      },
      {
        title: 'Вычитание',
        description:
          'Из каждого элемента 2A вычитаем соответствующий элемент 3B.',
        isCurrent: true,
        blocks: [
          {
            type: 'operation',
            expressions: [
              ['6−3',    '−2−15'],
              ['0−(−6)', '8−0'  ],
            ],
            result: [[3, -17], [6, 8]],
            resultColor: 'green',
          },
          {
            type: 'answer',
            label: 'C =',
            matrix: [[3, -17], [6, 8]],
            takeaway:
              'Сложение, вычитание и умножение на скаляр — поэлементные операции. ' +
              'Размер матрицы не меняется. ' +
              'Единственное условие: размеры обеих матриц должны совпадать.',
          },
        ],
      },
    ],
  },

  // ── Базовый №2 ──────────────────────────────────────────────────────────────
  {
    id: 'p2',
    level: 'базовый',
    title: 'Транспонирование произведения матрицы на скаляр',
    formula: 'B = (3A)ᵀ',
    given: [
      { label: 'A', matrix: [[2, 1, 0], [-1, 3, 4]] },
    ],
    steps: [
      {
        title: 'Определение размерности',
        description: 'Матрица A — 2×3: 2 строки и 3 столбца.',
        blocks: [
          { type: 'verified', text: 'Матрица A имеет размер 2×3' },
        ],
      },
      {
        title: 'Умножение на скаляр',
        description: 'Умножаем каждый элемент A на 3.',
        blocks: [
          {
            type: 'scalars',
            items: [
              { label: '3A =', matrix: [[6, 3, 0], [-3, 9, 12]], color: 'blue' },
            ],
          },
        ],
      },
      {
        title: 'Транспонирование',
        description:
          'Строки становятся столбцами. ' +
          'Размер меняется с 2×3 на 3×2.',
        isCurrent: true,
        blocks: [
          {
            type: 'transform',
            from: { label: '3A',    matrix: [[6, 3, 0], [-3, 9, 12]] },
            arrowLabel: 'транспонирование',
            to:   { label: '(3A)ᵀ =', matrix: [[6, -3], [3, 9], [0, 12]] },
          },
        ],
      },
      {
        title: 'Проверка через свойство',
        description:
          'Свойство (λA)ᵀ = λ(Aᵀ) позволяет сначала транспонировать, ' +
          'а потом умножать — результат тот же.',
        blocks: [
          {
            type: 'formula',
            lines: [
              '(3A)ᵀ = 3 · Aᵀ',
              'Aᵀ = [[2, −1], [1, 3], [0, 4]]',
              '3 · Aᵀ = [[6, −3], [3, 9], [0, 12]]  ✓',
            ],
          },
          {
            type: 'answer',
            label: 'B =',
            matrix: [[6, -3], [3, 9], [0, 12]],
            takeaway:
              'Транспонирование меняет строки и столбцы местами: размер m×n становится n×m. ' +
              'Числовые значения элементов при этом не изменяются.',
          },
        ],
      },
    ],
  },

  // ── Стандартный №3 ──────────────────────────────────────────────────────────
  {
    id: 'p3',
    level: 'стандартный',
    title: 'Умножение матриц с транспонированием: Aᵀ · Bᵀ',
    formula: 'C = Aᵀ · Bᵀ',
    given: [
      { label: 'A', matrix: [[1, 2], [0, 1], [-1, 0]] },   // 3×2
      { label: 'B', matrix: [[2, 0, 1], [-1, 1, 0]] },      // 2×3
    ],
    steps: [
      {
        title: 'Размеры исходных матриц',
        description: 'A — матрица 3×2 (три строки, два столбца). B — матрица 2×3.',
        blocks: [
          { type: 'verified', text: 'A: 3×2,  B: 2×3 — размеры зафиксированы' },
        ],
      },
      {
        title: 'Совместимость Aᵀ · Bᵀ',
        description:
          'После транспонирования: Aᵀ — 2×3, Bᵀ — 3×2. ' +
          'Умножение (2×3)·(3×2) возможно — результат 2×2.',
        blocks: [
          {
            type: 'formula',
            lines: [
              'Aᵀ: 2×3    Bᵀ: 3×2',
              '(2×3) · (3×2)  →  результат 2×2  ✓',
            ],
          },
        ],
      },
      {
        title: 'Применение свойства транспонирования',
        description:
          'Вместо прямого Aᵀ·Bᵀ используем свойство: Aᵀ·Bᵀ = (B·A)ᵀ. ' +
          'Сначала находим B·A, потом транспонируем.',
        blocks: [
          {
            type: 'formula',
            lines: [
              'Aᵀ · Bᵀ = (B · A)ᵀ',
              'B: 2×3,  A: 3×2  →  B·A: 2×2  ✓',
            ],
          },
        ],
      },
      {
        title: 'Вычисление D = B · A',
        description: 'Перемножаем B (2×3) на A (3×2) по правилу строка × столбец.',
        blocks: [
          {
            type: 'compute',
            rows: [
              { label: 'd₁₁', expression: '2·1 + 0·0 + 1·(−1) = 2 + 0 − 1 = 1'       },
              { label: 'd₁₂', expression: '2·2 + 0·1 + 1·0   = 4 + 0 + 0 = 4'         },
              { label: 'd₂₁', expression: '(−1)·1 + 1·0 + 0·(−1) = −1 + 0 + 0 = −1'  },
              { label: 'd₂₂', expression: '(−1)·2 + 1·1 + 0·0    = −2 + 1 + 0 = −1'  },
            ],
            result: { label: 'D = B · A =', matrix: [[1, 4], [-1, -1]], color: 'blue' },
          },
        ],
      },
      {
        title: 'Транспонирование результата',
        description: 'C = (B·A)ᵀ = Dᵀ — меняем строки и столбцы местами.',
        isCurrent: true,
        blocks: [
          {
            type: 'transform',
            from: { label: 'D =',    matrix: [[1, 4], [-1, -1]] },
            arrowLabel: 'транспонирование',
            to:   { label: 'C = Dᵀ =', matrix: [[1, -1], [4, -1]] },
          },
          {
            type: 'answer',
            label: 'C =',
            matrix: [[1, -1], [4, -1]],
            takeaway:
              'Свойство (AB)ᵀ = BᵀAᵀ позволило заменить Aᵀ·Bᵀ на (B·A)ᵀ. ' +
              'Порядок букв при транспонировании произведения всегда меняется на обратный.',
          },
        ],
      },
    ],
  },

  // ── Стандартный №4 ──────────────────────────────────────────────────────────
  {
    id: 'p4',
    level: 'стандартный',
    title: 'Матричное уравнение: выражение X через линейные операции',
    formula: '2X + A = X + B',
    given: [
      { label: 'A', matrix: [[2, 1], [1,  2]] },
      { label: 'B', matrix: [[3, 0], [1, -1]] },
    ],
    steps: [
      {
        title: 'Анализ уравнения',
        description:
          'Линейное матричное уравнение относительно неизвестной X. ' +
          'Все матрицы квадратные порядка 2 — все операции определены.',
        blocks: [
          { type: 'verified', text: 'Все матрицы 2×2 — операции совместимы' },
        ],
      },
      {
        title: 'Перенос слагаемых',
        description:
          'X из правой части переносим в левую, A — в правую. ' +
          'При переносе через «=» знак меняется.',
        blocks: [
          {
            type: 'formula',
            lines: [
              '2X + A = X + B',
              '2X − X = B − A',
            ],
          },
        ],
      },
      {
        title: 'Упрощение и решение',
        description: '2X − X = X, поэтому уравнение сводится к X = B − A.',
        isCurrent: true,
        blocks: [
          {
            type: 'formula',
            lines: ['X = B − A'],
          },
          {
            type: 'operation',
            expressions: [
              ['3−2',  '0−1' ],
              ['1−1', '−1−2'],
            ],
            result: [[1, -1], [0, -3]],
            resultColor: 'green',
          },
        ],
      },
      {
        title: 'Проверка',
        description:
          'Подставляем X в исходное уравнение и сверяем левую и правую части.',
        blocks: [
          {
            type: 'formula',
            lines: [
              '2X + A = [[2,−2],[0,−6]] + [[2,1],[1,2]] = [[4,−1],[1,−4]]',
              'X + B  = [[1,−1],[0,−3]] + [[3,0],[1,−1]] = [[4,−1],[1,−4]]  ✓',
            ],
          },
          {
            type: 'answer',
            label: 'X =',
            matrix: [[1, -1], [0, -3]],
            takeaway:
              'Матричные уравнения решаются по тем же правилам, что и обычные: ' +
              'переносим слагаемые, приводим подобные. ' +
              'Главное условие — все матрицы должны быть одного размера.',
          },
        ],
      },
    ],
  },

  // ── Продвинутый №5 ──────────────────────────────────────────────────────────
  {
    id: 'p5',
    level: 'продвинутый',
    title: 'Матричное уравнение с обратными матрицами и транспонированием',
    formula: '(A · X · B)ᵀ = D',
    given: [
      { label: 'A', matrix: [[1, 2], [3,  4]] },
      { label: 'B', matrix: [[2, 1], [0, -1]] },
      { label: 'D', matrix: [[5, 1], [-2, 3]] },
    ],
    steps: [
      {
        title: 'Проверка размерностей',
        description:
          'A, B, D — все 2×2. ' +
          'Чтобы произведение A·X·B было определено, X тоже должна быть 2×2. ' +
          'После транспонирования размер не меняется — правая часть D совместима.',
        blocks: [
          { type: 'verified', text: 'Все матрицы 2×2 — X должна быть 2×2' },
        ],
      },
      {
        title: 'Снятие транспонирования',
        description:
          'Транспонируем обе части. ' +
          'По свойству (Mᵀ)ᵀ = M левая часть упрощается до A·X·B = Dᵀ.',
        blocks: [
          {
            type: 'formula',
            lines: [
              '(A · X · B)ᵀ = D',
              '((A · X · B)ᵀ)ᵀ = Dᵀ',
              'A · X · B = Dᵀ',
            ],
          },
          {
            type: 'transform',
            from: { label: 'D =',  matrix: [[5, 1], [-2, 3]] },
            arrowLabel: 'транспонирование',
            to:   { label: 'Dᵀ =', matrix: [[5, -2], [1, 3]] },
          },
        ],
      },
      {
        title: 'Выражение X через обратные матрицы',
        description:
          'Умножаем обе части слева на A⁻¹, справа — на B⁻¹. ' +
          'Порядок строго фиксирован: матричное умножение некоммутативно.',
        blocks: [
          {
            type: 'formula',
            lines: [
              'A · X · B = Dᵀ',
              'A⁻¹ · A · X · B = A⁻¹ · Dᵀ',
              'X · B = A⁻¹ · Dᵀ',
              'X · B · B⁻¹ = A⁻¹ · Dᵀ · B⁻¹',
              'X = A⁻¹ · Dᵀ · B⁻¹',
            ],
          },
          {
            type: 'insight',
            title: 'Важно',
            text:
              'Умножать на A⁻¹ слева и на B⁻¹ справа нужно именно в таком порядке. ' +
              'Нельзя переставлять множители — матричное умножение некоммутативно.',
          },
        ],
      },
      {
        title: 'Вычисление A⁻¹',
        description:
          'Используем формулу для 2×2: [[a,b],[c,d]]⁻¹ = (1 / det)·[[d,−b],[−c,a]].',
        blocks: [
          {
            type: 'formula',
            lines: [
              'det(A) = 1·4 − 2·3 = 4 − 6 = −2',
              'A⁻¹ = (1/−2) · [[4, −2], [−3, 1]]',
            ],
          },
          {
            type: 'scalars',
            items: [
              { label: 'A⁻¹ =', matrix: [[-2, 1], [1.5, -0.5]], color: 'blue' },
            ],
          },
        ],
      },
      {
        title: 'Вычисление B⁻¹',
        description: 'Аналогично находим обратную матрицу для B.',
        blocks: [
          {
            type: 'formula',
            lines: [
              'det(B) = 2·(−1) − 1·0 = −2',
              'B⁻¹ = (1/−2) · [[−1, −1], [0, 2]]',
            ],
          },
          {
            type: 'scalars',
            items: [
              { label: 'B⁻¹ =', matrix: [[0.5, 0.5], [0, -1]], color: 'red' },
            ],
          },
        ],
      },
      {
        title: 'Промежуточное произведение A⁻¹ · Dᵀ',
        description: 'Вычисляем каждый элемент по правилу строка × столбец.',
        blocks: [
          {
            type: 'compute',
            rows: [
              { label: '(1,1)', expression: '(−2)·5 + 1·1           = −10 + 1    = −9'   },
              { label: '(1,2)', expression: '(−2)·(−2) + 1·3        = 4 + 3      = 7'    },
              { label: '(2,1)', expression: '1.5·5 + (−0.5)·1       = 7.5 − 0.5 = 7'    },
              { label: '(2,2)', expression: '1.5·(−2) + (−0.5)·3   = −3 − 1.5  = −4.5' },
            ],
            result: { label: 'A⁻¹ · Dᵀ =', matrix: [[-9, 7], [7, -4.5]], color: 'blue' },
          },
        ],
      },
      {
        title: 'Итоговое произведение на B⁻¹',
        description: 'Домножаем справа на B⁻¹ — получаем X.',
        isCurrent: true,
        blocks: [
          {
            type: 'compute',
            rows: [
              { label: '(1,1)', expression: '(−9)·0.5 + 7·0           = −4.5'           },
              { label: '(1,2)', expression: '(−9)·0.5 + 7·(−1)        = −4.5 − 7 = −11.5' },
              { label: '(2,1)', expression: '7·0.5 + (−4.5)·0         = 3.5'            },
              { label: '(2,2)', expression: '7·0.5 + (−4.5)·(−1)      = 3.5 + 4.5 = 8' },
            ],
            result: { label: 'X =', matrix: [[-4.5, -11.5], [3.5, 8]], color: 'green' },
          },
          {
            type: 'answer',
            label: 'X =',
            matrix: [[-4.5, -11.5], [3.5, 8]],
            takeaway:
              'Цепочка решения: (1) транспонировали обе части — убрали ᵀ; ' +
              '(2) умножили слева на A⁻¹ — убрали A; ' +
              '(3) умножили справа на B⁻¹ — убрали B. ' +
              'Порядок умножения на обратные матрицы строго фиксирован.',
          },
        ],
      },
    ],
  },
]
