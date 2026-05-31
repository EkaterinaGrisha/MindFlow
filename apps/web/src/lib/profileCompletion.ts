import type { UserProfile } from './supabase';

// Только поля, которые пользователь реально заполняет через ProfilePage.
// level и learning_style не входят: первый ставится диагностикой курса,
// второй — отдельно через настройки. Если включить их сюда — даже полностью
// заполненная форма даст 4/6 = 66%, и баннер «Заполните профиль» не уйдёт.
const TRACKED_FIELDS = [
  'full_name',
  'occupation',
  'goal',
  'interests',
] as const;

function isFieldFilled(profile: UserProfile, key: (typeof TRACKED_FIELDS)[number]): boolean {
  const value = profile[key];
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** True when the user has filled the minimum survey (matches CompleteProfile.tsx required fields). */
export function isProfileSurveyComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    isFieldFilled(profile, 'occupation') &&
    isFieldFilled(profile, 'interests') &&
    isFieldFilled(profile, 'goal')
  );
}

/** Profile completion in percent across all tracked fields. */
export function profileCompletionPercent(profile: UserProfile | null | undefined): number {
  if (!profile) return 0;
  const filled = TRACKED_FIELDS.filter((key) => isFieldFilled(profile, key)).length;
  return Math.round((filled / TRACKED_FIELDS.length) * 100);
}
