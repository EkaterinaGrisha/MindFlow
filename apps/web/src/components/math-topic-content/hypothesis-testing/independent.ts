import type { IndependentTask } from '../types';

export const hypothesisTestingIndependent: IndependentTask[] = [
  { id: 't1', prompt: 'Сформулируйте H₀ и H₁: группа A — 200 чел., 40 конверсий; группа B — 200 чел., 52 конверсии.', hint: 'H₀: p_A = p_B. Какой тест подойдёт для двух пропорций?' },
  { id: 't2', prompt: 'p-value = 0.03. Что это означает? Можно ли утверждать, что H₀ ложна с вероятностью 97%?', hint: 'p-value — это НЕ вероятность того, что H₀ верна.' },
];
