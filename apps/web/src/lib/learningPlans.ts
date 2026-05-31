import { buildApiHeaders, getApiBaseUrl } from './api';

export interface LearningPlanItem {
  id:          string;
  plan_id:     string;
  position:    number;
  topic_slug:  string | null;
  concept_id:  string | null;
  note:        string | null;
  is_done:     boolean;
  done_at:     string | null;
  created_at:  string;
}

export interface LearningPlan {
  id:          string;
  title:       string;
  goal:        string | null;
  is_archived: boolean;
  due_date:    string | null;
  created_at:  string;
  updated_at:  string;
  /**
   * Populated by GET /api/learning-plans only. Create/update endpoints return
   * the base row without items — keep using whatever you already have locally.
   */
  items?:      LearningPlanItem[];
}

export interface GeneratedPlanDraft {
  suggestedTitle: string;
  conceptIds:     string[];
  goal:           string;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await buildApiHeaders((init.headers as Record<string, string>) ?? {});
  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export async function listLearningPlans(): Promise<LearningPlan[]> {
  const data = await api<{ plans: LearningPlan[] }>('/api/learning-plans');
  return data.plans;
}

export async function createLearningPlan(
  input: { title?: string; goal?: string; dueDate?: string | null; conceptIds?: string[] } = {},
): Promise<LearningPlan> {
  const data = await api<{ plan: LearningPlan }>('/api/learning-plans', {
    method: 'POST',
    body:   JSON.stringify(input),
  });
  return data.plan;
}

export async function generateLearningPlan(goalText: string): Promise<GeneratedPlanDraft> {
  return api<GeneratedPlanDraft>('/api/learning-plans/generate', {
    method: 'POST',
    body:   JSON.stringify({ goalText }),
  });
}

export async function updateLearningPlan(
  planId: string,
  patch: { title?: string; goal?: string; isArchived?: boolean; dueDate?: string | null },
): Promise<LearningPlan> {
  const data = await api<{ plan: LearningPlan }>(`/api/learning-plans/${planId}`, {
    method: 'PATCH',
    body:   JSON.stringify(patch),
  });
  return data.plan;
}

export async function deleteLearningPlan(planId: string): Promise<void> {
  await api<{ ok: true }>(`/api/learning-plans/${planId}`, { method: 'DELETE' });
}

export async function addLearningPlanItem(
  planId: string,
  input: { topicSlug?: string; conceptId?: string; note?: string },
): Promise<LearningPlanItem> {
  const data = await api<{ item: LearningPlanItem }>(`/api/learning-plans/${planId}/items`, {
    method: 'POST',
    body:   JSON.stringify(input),
  });
  return data.item;
}

export async function updateLearningPlanItem(
  planId: string,
  itemId: string,
  patch: { isDone?: boolean; position?: number; note?: string },
): Promise<LearningPlanItem> {
  const data = await api<{ item: LearningPlanItem }>(
    `/api/learning-plans/${planId}/items/${itemId}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
  return data.item;
}

export async function deleteLearningPlanItem(planId: string, itemId: string): Promise<void> {
  await api<{ ok: true }>(`/api/learning-plans/${planId}/items/${itemId}`, { method: 'DELETE' });
}
