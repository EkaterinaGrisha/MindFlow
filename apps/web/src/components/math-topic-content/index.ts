import type { ComponentType } from 'react';
import type { TopicContent } from './types';
import { bayesTopic } from './bayes';
import { derivativeGradientTopic } from './derivative-gradient';
import { eigenvaluesTopic } from './eigenvalues';
import { hypothesisTestingTopic } from './hypothesis-testing';
import { matrixOperationsTopic } from './matrix-operations';
import { limitsContinuityTopic } from './limits-continuity';
import { partialDerivativesTopic } from './partial-derivatives';
import { gradientDescentPart1Topic } from './gradient-descent-part1';
import { gradientDescentPart2Topic } from './gradient-descent-part2';
import { randomVariablesTopic } from './random-variables';
import { rankBasisTopic } from './rank-basis';
import { svdTopic } from './svd';
import { svdApplicationsTopic } from './svd-applications';

import EigenvaluesTheoryRich from './eigenvalues/theory-rich';
import MatrixOperationsTheoryRich from './matrix-operations/theory-rich';
import LimitsContinuityTheoryRich from './limits-continuity/theory-rich';
import LimitsContinuityWorkedRich from './limits-continuity/practice';
import DerivativeGradientTheoryRich from './derivative-gradient/theory';
import DerivativeGradientWorkedRich from './derivative-gradient/practice';
import PartialDerivativesTheoryRich from './partial-derivatives/theory-rich';
import PartialDerivativesWorkedRich from './partial-derivatives/practice';
import GradientDescentPart1TheoryRich from './gradient-descent-part1/theory-rich';
import GradientDescentPart1WorkedRich from './gradient-descent-part1/practice';
import GradientDescentPart2TheoryRich from './gradient-descent-part2/theory-rich';
import GradientDescentPart2WorkedRich from './gradient-descent-part2/practice';
import RankBasisTheoryRich from './rank-basis/theory-rich';
import SVDTheoryRich from './svd/theory-rich';
import SVDApplicationsTheoryRich from './svd/applications-theory-rich';
import SVDWorkedRich from './svd/worked-rich';
import SVDApplicationsWorkedRich from './svd/applications-worked-rich';

import MatrixOperationsWorkedRich from './matrix-operations/worked-rich';
import RankBasisWorkedRich from './rank-basis/worked-rich';
import EigenvaluesWorkedRich from './eigenvalues/worked-rich';

export type { TopicContent, IndependentTask } from './types';

export const TOPIC_CONTENT: Record<string, TopicContent> = {
  'Операции с матрицами': matrixOperationsTopic,
  'Ранг и базис': rankBasisTopic,
  'Собственные значения': eigenvaluesTopic,
  'Сингулярное разложение (SVD)': svdTopic,
  'Сингулярное разложение (SVD) — часть 1': svdTopic,
  'Сингулярное разложение (SVD) — часть 2': svdApplicationsTopic,
  'Предел и непрерывность': limitsContinuityTopic,
  'Производная и градиент': derivativeGradientTopic,
  'Частные производные': partialDerivativesTopic,
  'Градиентный спуск — часть 1': gradientDescentPart1Topic,
  'Градиентный спуск — часть 2': gradientDescentPart2Topic,
  'Случайные величины': randomVariablesTopic,
  'Формула Байеса': bayesTopic,
  'Проверка гипотез': hypothesisTestingTopic,
};

/**
 * Optional rich theory components keyed by topic name. When present, MathTopic
 * renders the React component instead of the plain `theory: TheoryBlock[]`
 * data. To add a rich theory page for a new topic: drop a `theory-rich.tsx`
 * (default export) into the topic folder and register it here.
 */
export const TOPIC_RICH_THEORY: Record<string, ComponentType> = {
  'Операции с матрицами': MatrixOperationsTheoryRich,
  'Предел и непрерывность': LimitsContinuityTheoryRich,
  'Ранг и базис': RankBasisTheoryRich,
  'Собственные значения': EigenvaluesTheoryRich,
  'Сингулярное разложение (SVD)': SVDTheoryRich,
  'Сингулярное разложение (SVD) — часть 1': SVDTheoryRich,
  'Сингулярное разложение (SVD) — часть 2': SVDApplicationsTheoryRich,
  'Производная и градиент': DerivativeGradientTheoryRich,
  'Частные производные': PartialDerivativesTheoryRich,
  'Градиентный спуск — часть 1': GradientDescentPart1TheoryRich,
  'Градиентный спуск — часть 2': GradientDescentPart2TheoryRich,
};

/**
 * Optional rich worked-examples components. When present, MathTopic renders
 * the React component instead of the plain `practice: PracticeItem[]` data.
 * Component receives optional onGoTheory / onGoPractice callbacks.
 */
export const TOPIC_RICH_WORKED: Record<string, ComponentType<{ onGoTheory?: () => void; onGoPractice?: () => void }>> = {
  'Операции с матрицами': MatrixOperationsWorkedRich,
  'Ранг и базис': RankBasisWorkedRich,
  'Собственные значения': EigenvaluesWorkedRich,
  'Предел и непрерывность': LimitsContinuityWorkedRich,
  'Сингулярное разложение (SVD)': SVDWorkedRich,
  'Сингулярное разложение (SVD) — часть 1': SVDWorkedRich,
  'Сингулярное разложение (SVD) — часть 2': SVDApplicationsWorkedRich,
  'Производная и градиент': DerivativeGradientWorkedRich,
  'Частные производные': PartialDerivativesWorkedRich,
  'Градиентный спуск — часть 1': GradientDescentPart1WorkedRich,
  'Градиентный спуск — часть 2': GradientDescentPart2WorkedRich,
};
