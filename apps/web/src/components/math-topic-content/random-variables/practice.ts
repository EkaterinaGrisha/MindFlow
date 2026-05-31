import type { PracticeItem } from '../types';

export const randomVariablesPractice: PracticeItem[] = [
  {
    id: 'p1',
    title: 'Математическое ожидание кубика',
    steps: [
      'X — число очков на кубике: значения {1,2,3,4,5,6}, P = 1/6 каждое',
      'E[X] = 1/6 · (1+2+3+4+5+6) = 21/6 = 3.5',
      'E[X²] = 1/6 · (1+4+9+16+25+36) = 91/6 ≈ 15.17',
      'Var(X) = E[X²] − (E[X])² = 91/6 − 12.25 = 35/12 ≈ 2.92',
      'σ ≈ 1.71',
    ],
  },
];
