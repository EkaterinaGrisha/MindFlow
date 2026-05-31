import type { TopicContent } from './types';
import { randomVariablesIndependent } from './random-variables/independent';
import { randomVariablesPractice } from './random-variables/practice';
import { randomVariablesTheory } from './random-variables/theory';

export const randomVariablesTopic: TopicContent = {
  section: 'Теория вероятностей',
  theory: randomVariablesTheory,
  practice: randomVariablesPractice,
  independent: randomVariablesIndependent,
};
