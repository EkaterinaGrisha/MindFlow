import type { TopicContent } from './types';
import { svdIndependent } from './svd/independent';
import { svdApplicationsPractice } from './svd/applications-practice';
import { svdApplicationsTheory } from './svd/applications-theory';

export const svdApplicationsTopic: TopicContent = {
  section: 'Линейная алгебра',
  theory: svdApplicationsTheory,
  practice: svdApplicationsPractice,
  independent: svdIndependent,
};
