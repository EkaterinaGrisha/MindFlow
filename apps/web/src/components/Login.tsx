import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OAuthButtons from './OAuthButtons';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  bad_state: 'Истекла сессия входа. Попробуй ещё раз.',
  token_exchange_failed: 'Yandex не выдал токен. Попробуй позже.',
  info_failed: 'Не удалось получить профиль из Yandex.',
  create_failed: 'Не удалось создать аккаунт. Напиши нам.',
  link_failed: 'Не удалось войти. Попробуй ещё раз.',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const oauthErrorParam = searchParams.get('oauth_error');
  const initialError = oauthErrorParam
    ? OAUTH_ERROR_MESSAGES[oauthErrorParam] ?? `Ошибка входа: ${oauthErrorParam}`
    : null;
  const [error, setError] = useState<string | null>(initialError);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Неверный email или пароль.'
          : signInError.message,
      );
      setLoading(false);
      return;
    }

    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-primary">MindFlow</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm ring-1 ring-outline-variant/20">
          <h1 className="text-2xl font-bold text-primary mb-1">Добро пожаловать</h1>
          <p className="text-sm text-on-surface-variant mb-6">Войди, чтобы продолжить обучение</p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <OAuthButtons onError={setError} />

          <p className="text-[11px] text-on-surface-variant mt-3 leading-snug">
            Мы не храним твой email и имя — только идентификатор от Yandex/Google для входа.
          </p>

          {!showEmailLogin && (
            <button
              type="button"
              onClick={() => setShowEmailLogin(true)}
              className="w-full mt-5 text-xs text-on-surface-variant hover:text-primary underline underline-offset-4"
            >
              Войти через email и пароль
            </button>
          )}

          {showEmailLogin && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-outline-variant/30" />
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                  или email
                </span>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-primary mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-primary mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Ещё нет аккаунта?{' '}
            <Link to="/register" className="text-secondary font-semibold hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>

        {/* Guest access */}
        <p className="text-center text-xs text-on-surface-variant mt-4">
          <button
            onClick={() => navigate('/subjects/mathematics')}
            className="hover:underline"
          >
            Продолжить как гость →
          </button>
        </p>
      </motion.div>
    </div>
  );
}
