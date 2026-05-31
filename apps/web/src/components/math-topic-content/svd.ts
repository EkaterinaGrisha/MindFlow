import type { TopicContent } from './types';
import { svdIndependent } from './svd/independent';
import { svdPractice } from './svd/practice';
import { svdTheory } from './svd/theory';

export const svdTopic: TopicContent = {
  section: 'Линейная алгебра',
  theory: svdTheory,
  practice: svdPractice,
  independent: svdIndependent,
};
