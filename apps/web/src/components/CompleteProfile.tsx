import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

const availableInterests = ['Финансы', 'Биомед', 'AI/ML', 'Product', 'Data Engineering', 'EdTech'];
const availableGoals = ['Смена профессии', 'Повышение квалификации', 'Запуск собственного проекта'];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [background, setBackground] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>(availableGoals[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setBackground(profile.occupation ?? '');
    setInterests(profile.interests ?? []);
    if (profile.goal) setGoal(profile.goal);
  }, [profile]);

  const canSubmit = useMemo(
    () => background.trim() && interests.length > 0 && goal,
    [background, interests.length, goal],
  );

  const toggleInterest = (it: string) =>
    setInterests((prev) => (prev.includes(it) ? prev.filter((i) => i !== it) : [...prev, it]));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSaving || !user) return;
    setIsSaving(true);
    setError(null);

    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName.trim(),
        occupation: background.trim(),
        interests,
        goal,
      })
      .eq('user_id', user.id)
      .select('user_id');

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError('Не удалось сохранить профиль. Перезайдите в аккаунт и попробуйте ещё раз.');
      return;
    }
    navigate('/dashboard?tour=1');
  };

  if (loading) return null;
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-surface-container-lowest p-6 md:p-10 shadow-sm ring-1 ring-outline-variant/20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Профиль</p>
        <h1 className="text-3xl font-bold text-primary mt-2">Дополните профиль</h1>
        <p className="text-outline mt-2">
          Эти поля помогут AI-ментору подстроить объяснения под ваш опыт и интересы.
        </p>

        <form onSubmit={onSubmit} className="space-y-6 mt-8">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-primary mb-2">
              Как к тебе обращаться?{' '}
              <span className="text-xs text-on-surface-variant font-normal">(необязательно, никнейм)</span>
            </label>
            <input
              id="full_name"
              className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
              placeholder="Например: Катя, DataLover, Студент"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="background" className="block text-sm font-medium text-primary mb-2">
              Профессиональный & жизненный опыт
            </label>
            <textarea
              id="background"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
              placeholder="Например: бакалавр экономики, 3 года в аналитике, Python + SQL"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="text-sm font-medium text-primary mb-2">Интересы (выберите несколько)</p>
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
            <p className="text-sm font-medium text-primary mb-2">Цель обучения</p>
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

          <button
            type="submit"
            disabled={!canSubmit || isSaving}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}
