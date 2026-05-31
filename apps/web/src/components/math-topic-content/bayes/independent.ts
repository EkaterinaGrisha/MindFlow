import type { IndependentTask } from '../types';

export const bayesIndependent: IndependentTask[] = [
  { id: 't1', prompt: 'Завод: 60% — завод A (1% брака), 40% — завод B (2% брака). Деталь бракованная. Вероятность, что с завода A?', hint: 'P(брак) = 0.01·0.6 + 0.02·0.4. Затем формула Байеса.' },
];
