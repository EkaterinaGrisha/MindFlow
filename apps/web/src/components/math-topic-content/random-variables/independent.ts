import type { IndependentTask } from '../types';

export const randomVariablesIndependent: IndependentTask[] = [
  { id: 't1', prompt: 'Монету бросают 4 раза. X = число орлов. Найдите E[X] и Var(X).', hint: 'X ~ B(n=4, p=0.5). E[X] = np, Var = np(1−p).' },
  { id: 't2', prompt: 'Объясните: почему при большой выборке среднее арифметическое стремится к E[X]?', hint: 'Закон больших чисел. Объясните интуитивно, не формально.' },
];
