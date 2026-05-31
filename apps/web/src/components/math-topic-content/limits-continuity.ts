import type { TopicContent } from './types';
import { limitsContinuityIndependent } from './limits-continuity/independent';
import { limitsContinuityTheory } from './limits-continuity/theory';

export const limitsContinuityTopic: TopicContent = {
  section: 'Математический анализ',
  theory: limitsContinuityTheory,
  practice: [],
  independent: limitsContinuityIndependent,
};
