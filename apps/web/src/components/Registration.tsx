import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OAuthButtons from './OAuthButtons';

type ProfilePayload = {
  full_name: string;
  email: string;
  password: string;
  background: string;
  interests: string[];
  goal: string;
};

const availableInterests = ['Финансы', 'Биомед', 'AI/ML', 'Product', 'Data Engineering', 'EdTech'];
const availableGoals = ['Смена профессии', 'Повышение квалификации', 'Запуск собственного проекта'];

export default function Registration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payload, setPayload] = useState<ProfilePayload>({
    full_name: '',
    email: '',
    password: '',
    background: '',
    interests: [],
    goal: availableGoals[0],
  });

  const canGoNext = useMemo(
    () => payload.email.trim() && payload.password.length >= 8,
    [payload.email, payload.password],
  );

  const canSubmit = useMemo(
    () => payload.background.trim() && payload.interests.length > 0 && payload.goal,
    [payload.background, payload.interests.length, payload.goal],
  );

  const toggleInterest = (interest: string) => {
    setPayload((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const onAccountStepSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canGoNext) { setStep(2); setError(null); }
  };

  const onFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      // 1. Sign up via Supabase Auth. Все поля идут в raw_user_meta_data —
      // триггер handle_new_user (миграция 022) подтягивает их в user_profiles
      // даже когда сессии ещё нет (email confirmation on).
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.full_name,
            occupation: payload.background,
            interests: payload.interests,
            goal: payload.goal,
          },
        },
      });

      if (signUpError) throw signUpError;
      const userId = data.user?.id;
      if (!userId) throw new Error('Не удалось получить user_id после регистрации.');

      // 2. Если email confirmation выключен — сессия уже есть, дублируем UPDATE
      // (триггер всё равно положил, но это страховка от рассинхрона данных
      // если пользователь успел сразу что-то поменять). RLS проверит auth.uid().
      if (data.session) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: payload.full_name,
            occupation: payload.background,
            interests: payload.interests,
            goal: payload.goal,
          })
          .eq('user_id', userId);
        if (profileError) console.warn('Profile update error:', profileError);
      }

      // 3. Save lightweight profile locally for guest-fallback
      localStorage.setItem('mindflow-user-registered', '1');
      localStorage.setItem(
        'mindflow-user-profile',
        JSON.stringify({ background: payload.background, interests: payload.interests, goal: payload.goal }),
      );

      navigate('/dashboard?tour=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-2xl bg-surface-container-lowest p-6 md:p-10 shadow-sm ring-1 ring-outline-variant/20">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Регистрация</p>
          <h1 className="text-3xl font-bold text-primary mt-2">Создайте профиль обучения</h1>
          <p className="text-outline mt-2">Шаг {step} из 2</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="account-step"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <OAuthButtons onError={setError} />
                <p className="text-[11px] text-on-surface-variant leading-snug">
                  Рекомендуем — мы не получим твой email и имя, только идентификатор от провайдера.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-outline-variant/30" />
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                    или email
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/30" />
                </div>
              </div>

              <form onSubmit={onAccountStepSubmit} className="space-y-5">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-primary mb-2">
                  Как к тебе обращаться?{' '}
                  <span className="text-xs text-on-surface-variant font-normal">(необязательно, никнейм)</span>
                </label>
                <input id="full_name" className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
                  placeholder="Например: Катя, DataLover, Студент"
                  value={payload.full_name}
                  onChange={(e) => setPayload((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">Email</label>
                <input id="email" type="email" className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
                  value={payload.email}
                  onChange={(e) => setPayload((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
                  Пароль <span className="text-xs text-on-surface-variant">(минимум 8 символов)</span>
                </label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
                    value={payload.password}
                    onChange={(e) => setPayload((p) => ({ ...p, password: e.target.value }))}
                    minLength={8} required />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={!canGoNext}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50">
                Продолжить
              </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form
              key="profile-step"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              onSubmit={onFinalSubmit}
              className="space-y-6"
            >
              <div>
                <label htmlFor="background" className="block text-sm font-medium text-primary mb-2">
                  Профессиональный & жизненный опыт
                </label>
                <textarea id="background" rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30"
                  placeholder="Например: бакалавр экономики, 3 года в аналитике, Python + SQL"
                  value={payload.background}
                  onChange={(e) => setPayload((p) => ({ ...p, background: e.target.value }))} required />
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-2">Интересы (выберите несколько)</p>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest) => {
                    const sel = payload.interests.includes(interest);
                    return (
                      <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-full text-sm border transition-all ${sel ? 'bg-secondary/10 border-secondary text-secondary' : 'border-outline-variant/40 text-primary hover:border-secondary/40'}`}>
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-2">Цель обучения</p>
                <div className="space-y-2">
                  {availableGoals.map((goal) => (
                    <label key={goal} className="flex items-center gap-3 text-sm text-primary cursor-pointer">
                      <input type="radio" name="goal" checked={payload.goal === goal}
                        onChange={() => setPayload((p) => ({ ...p, goal }))} />
                      {goal}
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="w-full py-3 rounded-xl bg-surface-container-high text-primary font-semibold">
                  Назад
                </button>
                <button type="submit" disabled={!canSubmit || isSaving}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50">
                  {isSaving ? 'Сохранение...' : 'Завершить регистрацию'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
