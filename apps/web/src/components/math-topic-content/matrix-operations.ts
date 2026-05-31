import type { PracticeItem, TopicContent } from './types';
import { matrixOperationsIndependent } from './matrix-operations/independent';
import { matrixOperationsPractice } from './matrix-operations/practice';
import { matrixOperationsTheory } from './matrix-operations/theory';

const matrixOperationsPracticeFallback: PracticeItem[] = matrixOperationsPractice.map((item) => ({
  id: item.id,
  title: item.title,
  level: item.level,
  steps: item.steps.map((step) => `${step.title}: ${step.description}`),
}));

export const matrixOperationsTopic: TopicContent = {
  section: 'Линейная алгебра',
  theory: matrixOperationsTheory,
  practice: matrixOperationsPracticeFallback,
  independent: matrixOperationsIndependent,
};
