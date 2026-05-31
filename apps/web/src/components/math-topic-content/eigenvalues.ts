import type { TopicContent } from './types';
import { eigenvaluesIndependent } from './eigenvalues/independent';
import { eigenvaluesPractice } from './eigenvalues/practice';
import { eigenvaluesTheory } from './eigenvalues/theory';

export const eigenvaluesTopic: TopicContent = {
  section: 'Линейная алгебра',
  theory: eigenvaluesTheory,
  practice: eigenvaluesPractice,
  independent: eigenvaluesIndependent,
};
