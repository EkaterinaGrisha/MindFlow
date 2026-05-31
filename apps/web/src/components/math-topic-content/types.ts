export type Level = 'базовый' | 'стандартный' | 'продвинутый';

export type TheoryBlock = { title: string; body: string };
export type PracticeItem = {
  id: string;
  title: string;
  steps: string[];
  level?: Level;
};
export type LabItem = {
  id: string;
  title: string;
  question: string;
  mechanics: string[];
  explore: string[];
};

export type IndependentTask = {
  id: string;
  prompt: string;
  hint: string;
  level?: Level;
  solution?: string;
};

export type TopicContent = {
  section: string;
  theory: TheoryBlock[];
  practice: PracticeItem[];
  independent: IndependentTask[];
  labs?: LabItem[];
};
