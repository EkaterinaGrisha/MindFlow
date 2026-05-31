import type { IndependentTask } from '../types';

export const matrixOperationsIndependent: IndependentTask[] = [
  {
    id: 'mo-i1',
    level: 'базовый',
    prompt: `**Задание 1 — Сложение и вычитание матриц**

Даны матрицы:

$$A = \\begin{pmatrix} 5 & -2 \\\\ 0 & 4 \\\\ 1 & 3 \\end{pmatrix}, \\quad B = \\begin{pmatrix} 1 & 2 \\\\ -1 & 0 \\\\ 4 & -1 \\end{pmatrix}$$

Найдите $C = A + B$ и $D = A - B$.`,
    hint: `Сложение и вычитание матриц выполняются поэлементно: $c_{ij} = a_{ij} + b_{ij}$.

Складывайте числа на одинаковых позициях — размеры матриц совпадают, всё в порядке.`,
    solution: `**Решение** (поэлементно):

| Позиция | $a_{ij}$ | $b_{ij}$ | $c_{ij} = a+b$ | $d_{ij} = a-b$ |
|---------|----------|----------|----------------|----------------|
| $(1,1)$ | $5$ | $1$ | $6$ | $4$ |
| $(1,2)$ | $-2$ | $2$ | $0$ | $-4$ |
| $(2,1)$ | $0$ | $-1$ | $-1$ | $1$ |
| $(2,2)$ | $4$ | $0$ | $4$ | $4$ |
| $(3,1)$ | $1$ | $4$ | $5$ | $-3$ |
| $(3,2)$ | $3$ | $-1$ | $2$ | $4$ |

$$C = A + B = \\begin{pmatrix} 6 & 0 \\\\ -1 & 4 \\\\ 5 & 2 \\end{pmatrix}, \\quad D = A - B = \\begin{pmatrix} 4 & -4 \\\\ 1 & 4 \\\\ -3 & 4 \\end{pmatrix}$$`,
  },
  {
    id: 'mo-i2',
    level: 'базовый',
    prompt: `**Задание 2 — Умножение на скаляр и транспонирование**

Дана матрица:

$$A = \\begin{pmatrix} 2 & -1 & 0 \\\\ 3 & 1 & -2 \\end{pmatrix}$$

Найдите:

а) $B = 3A$

б) $C = A^\\top$`,
    hint: `При умножении на скаляр умножается **каждый** элемент: $b_{ij} = 3a_{ij}$.

При транспонировании строки становятся столбцами: $c_{ij} = a_{ji}$.
Размер $A$ равен $2 \\times 3$, значит $A^\\top$ будет $3 \\times 2$.`,
    solution: `**а)** Умножаем каждый элемент на $3$:

$$B = 3A = \\begin{pmatrix} 6 & -3 & 0 \\\\ 9 & 3 & -6 \\end{pmatrix}$$

**б)** Строки $A$ становятся столбцами $A^\\top$:

$$C = A^\\top = \\begin{pmatrix} 2 & 3 \\\\ -1 & 1 \\\\ 0 & -2 \\end{pmatrix}$$`,
  },
  {
    id: 'mo-i3',
    level: 'стандартный',
    prompt: `**Задание 3 — Умножение матриц**

Даны матрицы:

$$A = \\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\\\ -1 & 0 \\end{pmatrix}_{3 \\times 2}, \\quad B = \\begin{pmatrix} 2 & 0 & 1 \\\\ -1 & 1 & 0 \\end{pmatrix}_{2 \\times 3}$$

Найдите $C = AB$. Проверьте, можно ли найти $BA$, и если да — вычислите.`,
    hint: `$A$ — размера $3 \\times 2$, $B$ — размера $2 \\times 3$.

- $AB$: внутренние размеры совпадают $(2 = 2)$ → определено, результат $3 \\times 3$.
- $BA$: $2 \\times 3$ на $3 \\times 2$ → тоже определено, результат $2 \\times 2$.

Используйте формулу $c_{ij} = \\sum_k a_{ik} b_{kj}$.`,
    solution: `**Вычисляем $AB$** (результат $3 \\times 3$):

$$AB = \\begin{pmatrix}
1\\cdot2 + 2\\cdot(-1) & 1\\cdot0 + 2\\cdot1 & 1\\cdot1 + 2\\cdot0 \\\\
0\\cdot2 + 1\\cdot(-1) & 0\\cdot0 + 1\\cdot1 & 0\\cdot1 + 1\\cdot0 \\\\
(-1)\\cdot2 + 0\\cdot(-1) & (-1)\\cdot0 + 0\\cdot1 & (-1)\\cdot1 + 0\\cdot0
\\end{pmatrix} = \\begin{pmatrix} 0 & 2 & 1 \\\\ -1 & 1 & 0 \\\\ -2 & 0 & -1 \\end{pmatrix}$$

**Вычисляем $BA$** (результат $2 \\times 2$):

$$BA = \\begin{pmatrix}
2\\cdot1 + 0\\cdot0 + 1\\cdot(-1) & 2\\cdot2 + 0\\cdot1 + 1\\cdot0 \\\\
(-1)\\cdot1 + 1\\cdot0 + 0\\cdot(-1) & (-1)\\cdot2 + 1\\cdot1 + 0\\cdot0
\\end{pmatrix} = \\begin{pmatrix} 1 & 4 \\\\ -1 & -1 \\end{pmatrix}$$

**Вывод:** $AB \\ne BA$ — матричное умножение некоммутативно, даже размеры результатов различаются.`,
  },
  {
    id: 'mo-i4',
    level: 'стандартный',
    prompt: `**Задание 4 — Комбинированное выражение**

Даны матрицы:

$$A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}, \\quad B = \\begin{pmatrix} 3 & 0 \\\\ 1 & -1 \\end{pmatrix}$$

Найдите матрицу $X = 2A - B^\\top$.`,
    hint: `Порядок действий:
1. Транспонируйте $B$ → получите $B^\\top$.
2. Умножьте $A$ на $2$ → получите $2A$.
3. Вычтите: $X = 2A - B^\\top$.

Транспонирование и умножение на скаляр независимы, вычитание — последним.`,
    solution: `**Шаг 1.** Транспонируем $B$:

$$B^\\top = \\begin{pmatrix} 3 & 1 \\\\ 0 & -1 \\end{pmatrix}$$

**Шаг 2.** Умножаем $A$ на $2$:

$$2A = \\begin{pmatrix} 4 & 2 \\\\ 2 & 4 \\end{pmatrix}$$

**Шаг 3.** Вычитаем:

$$X = 2A - B^\\top = \\begin{pmatrix} 4-3 & 2-1 \\\\ 2-0 & 4-(-1) \\end{pmatrix} = \\begin{pmatrix} 1 & 1 \\\\ 2 & 5 \\end{pmatrix}$$`,
  },
  {
    id: 'mo-i5',
    level: 'продвинутый',
    prompt: `**Задание 5 — Матричное уравнение**

Решите уравнение относительно неизвестной матрицы $X$:

$$3X + A = 2X + B$$

где

$$A = \\begin{pmatrix} 1 & 0 \\\\ 2 & -1 \\end{pmatrix}, \\quad B = \\begin{pmatrix} 4 & 1 \\\\ 0 & 3 \\end{pmatrix}$$

Проверьте ответ подстановкой в исходное уравнение.`,
    hint: `Решайте как обычное уравнение — переносите $X$ влево, $A$ вправо:

$$3X - 2X = B - A \\implies X = B - A$$

Вычитание матриц — поэлементное.`,
    solution: `**Решение:**

$$3X + A = 2X + B \\implies 3X - 2X = B - A \\implies X = B - A$$

$$X = \\begin{pmatrix} 4-1 & 1-0 \\\\ 0-2 & 3-(-1) \\end{pmatrix} = \\begin{pmatrix} 3 & 1 \\\\ -2 & 4 \\end{pmatrix}$$

**Проверка:**

Левая часть:
$$3X + A = 3\\begin{pmatrix} 3 & 1 \\\\ -2 & 4 \\end{pmatrix} + \\begin{pmatrix} 1 & 0 \\\\ 2 & -1 \\end{pmatrix} = \\begin{pmatrix} 9 & 3 \\\\ -6 & 12 \\end{pmatrix} + \\begin{pmatrix} 1 & 0 \\\\ 2 & -1 \\end{pmatrix} = \\begin{pmatrix} 10 & 3 \\\\ -4 & 11 \\end{pmatrix}$$

Правая часть:
$$2X + B = 2\\begin{pmatrix} 3 & 1 \\\\ -2 & 4 \\end{pmatrix} + \\begin{pmatrix} 4 & 1 \\\\ 0 & 3 \\end{pmatrix} = \\begin{pmatrix} 6 & 2 \\\\ -4 & 8 \\end{pmatrix} + \\begin{pmatrix} 4 & 1 \\\\ 0 & 3 \\end{pmatrix} = \\begin{pmatrix} 10 & 3 \\\\ -4 & 11 \\end{pmatrix}$$

Левая = Правая $\\checkmark$`,
  },
];
