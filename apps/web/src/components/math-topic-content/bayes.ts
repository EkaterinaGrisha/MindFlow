import type { TopicContent } from './types';
import { bayesIndependent } from './bayes/independent';
import { bayesPractice } from './bayes/practice';
import { bayesTheory } from './bayes/theory';

export const bayesTopic: TopicContent = {
  section: 'Теория вероятностей',
  theory: bayesTheory,
  practice: bayesPractice,
  independent: bayesIndependent,
};
