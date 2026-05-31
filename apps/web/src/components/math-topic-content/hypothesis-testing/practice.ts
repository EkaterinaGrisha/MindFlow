import type { PracticeItem } from '../types';

export const hypothesisTestingPractice: PracticeItem[] = [
  {
    id: 'p1',
    title: 'Интерпретация p-value в A/B тесте',
    steps: [
      'Контроль: 1000 пользователей, конверсия 5%',
      'Тест: 1000 пользователей, конверсия 5.8%',
      'p-value = 0.24 → p > 0.05 → не отвергаем H₀',
      'Разница статистически незначима — нужно больше данных',
    ],
  },
];
