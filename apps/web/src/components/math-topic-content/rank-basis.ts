import type { TopicContent } from './types';
import { rankBasisIndependent } from './rank-basis/independent';
import { rankBasisPractice } from './rank-basis/practice';
import { rankBasisTheory } from './rank-basis/theory';

export const rankBasisTopic: TopicContent = {
  section: 'Линейная алгебра',
  theory: rankBasisTheory,
  practice: rankBasisPractice,
  independent: rankBasisIndependent,
};
