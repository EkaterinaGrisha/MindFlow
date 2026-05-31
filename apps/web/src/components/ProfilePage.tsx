import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { profileCompletionPercent } from '../lib/profileCompletion';

const availableInterests = ['Финансы', 'Биомед', 'AI/ML', 'Product', 'Data Engineering', 'EdTech'];
const availableGoals = ['Смена профессии', 'Повышение квалификации', 'Запуск собственного проекта'];

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>(availableGoals[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setOccupation(profile.occupation ?? '');
    setInterests(profile.interests ?? []);
    if (profile.goal) setGoal(profile.goal);
  }, [profile]);

  const percent = profileCompletionPercent(profile);

  const canSubmit = useMemo(
    () => occupation.trim() && interests.length > 0 && goal,
    [occupation, interests.length, goal],
  );

  const toggleInterest = (it: string) =>
    setInterests((prev) => (prev.includes(it) ? prev.filter((i) => i !== it) : [...prev, it]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSaving || !user) return;
    setIsSaving(true);
    setError(null);
    setSavedAt(null);

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName.trim() || null,
        occupation: occupation.trim(),
        interests,
        goal,
      })
      .eq('user_id', user.id);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSavedAt(Date.now());
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-surface-container-lowest p-6 md:p-10 ring-1 ring-outline-variant/20">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Профиль</p>
            <h1 className="text-2xl md:text-3xl font-bold text-primary mt-2">Ваш профиль</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-on-surface-variant">Заполнено</p>
            <p className="text-2xl font-bold text-secondary">{percent}%</p>
          </div>
        </div>
        <p className="text-outline mt-2 text-sm">
          Эти поля помогают AI-ментору подстроить объяснения под ваш опыт и интересы.
          Email и пароль здесь не требуются — вы уже вошли через OAuth.
        </p>

        <form onSubmit={onSubmit} className="space-y-6 mt-8">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-primary mb-2">
              Как к вам обращаться?{' '}
              <span className="text-xs text-on-surface-variant font-normal">(необязательно)</span>
            </label>
            <input
              id="full_name"
              className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
              placeholder="Например: Катя, DataLover"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-primary mb-2">
              Профессия и опыт <span className="text-red-500">*</span>
            </label>
            <textarea
              id="occupation"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
              placeholder="Например: бакалавр экономики, 3 года в аналитике, Python + SQL"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="text-sm font-medium text-primary mb-2">
              Интересы <span className="text-red-500">*</span>{' '}
              <span className="text-xs text-on-surface-variant font-normal">(выберите несколько)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((it) => {
                const sel = interests.includes(it);
                return (
                  <button
                    key={it}
                    type="button"
                    onClick={() => toggleInterest(it)}
                    className={`px-3 py-2 rounded-full text-sm border transition-all ${
                      sel
                        ? 'bg-secondary/10 border-secondary text-secondary'
                        : 'border-outline-variant/40 text-primary hover:border-secondary/40'
                    }`}
                  >
                    {it}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-primary mb-2">
              Цель обучения <span className="text-red-500">*</span>
            </p>
            <div className="space-y-2">
              {availableGoals.map((g) => (
                <label key={g} className="flex items-center gap-3 text-sm text-primary cursor-pointer">
                  <input type="radio" name="goal" checked={goal === g} onChange={() => setGoal(g)} />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {savedAt && !error && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Сохранено
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isSaving}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}
