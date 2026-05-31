import type { TopicContent } from './types';
import { partialDerivativesIndependent } from './partial-derivatives/independent';

export const partialDerivativesTopic: TopicContent = {
  section: 'Математический анализ',
  theory: [],
  practice: [],
  independent: partialDerivativesIndependent,
};
