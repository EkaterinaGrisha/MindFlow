import type { TopicContent } from './types';
import { derivativeGradientIndependent } from './derivative-gradient/independent';

export const derivativeGradientTopic: TopicContent = {
  section: 'Математический анализ',
  theory: [],
  practice: [],
  independent: derivativeGradientIndependent,
};
