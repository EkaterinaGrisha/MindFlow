import type { TopicContent } from './types';
import { hypothesisTestingIndependent } from './hypothesis-testing/independent';
import { hypothesisTestingPractice } from './hypothesis-testing/practice';
import { hypothesisTestingTheory } from './hypothesis-testing/theory';

export const hypothesisTestingTopic: TopicContent = {
  section: 'Математическая статистика',
  theory: hypothesisTestingTheory,
  practice: hypothesisTestingPractice,
  independent: hypothesisTestingIndependent,
};
