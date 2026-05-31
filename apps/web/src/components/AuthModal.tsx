import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Brain, Eye, EyeOff, Loader2, LogOut, User, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useOnboarding } from './onboarding/OnboardingProvider';
import OAuthButtons from './OAuthButtons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { restart: restartOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    resetForm();
  };

  const handleLogin = async (e: FormEvent) => {
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
    } else {
      setSuccessMsg('Вход выполнен!');
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 800);
    }
    setLoading(false);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      localStorage.setItem('mindflow-user-registered', '1');
      localStorage.setItem(
        'mindflow-user-profile',
        JSON.stringify({ background: '', interests: [], goal: '' }),
      );
      setSuccessMsg('Аккаунт создан! Перенаправляем...');
      setTimeout(() => {
        onClose();
        navigate('/dashboard?tour=1');
      }, 1000);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate('/');
  };

  if (!isOpen) return null;

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Пользователь';
  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : displayName[0]?.toUpperCase() ?? '?';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-primary">MindFlow</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logged-in state */}
            {user ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-secondary text-white text-lg font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{displayName}</p>
                    <p className="text-xs text-on-surface-variant">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { onClose(); navigate('/dashboard'); }}
                    className="py-2.5 px-4 rounded-xl border border-outline-variant/30 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                  >
                    Дашборд
                  </button>
                  <button
                    onClick={() => { onClose(); navigate('/profile'); }}
                    className="py-2.5 px-4 rounded-xl border border-outline-variant/30 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Профиль
                  </button>
                </div>

                <button
                  onClick={async () => {
                    await restartOnboarding();
                    onClose();
                    navigate('/dashboard?tour=1');
                  }}
                  className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Пройти онбординг заново
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из аккаунта
                </button>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => switchTab('login')}
                    className={`flex-1 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'login'
                        ? 'text-primary border-b-2 border-secondary'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Вход
                  </button>
                  <button
                    onClick={() => switchTab('register')}
                    className={`flex-1 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'register'
                        ? 'text-primary border-b-2 border-secondary'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Регистрация
                  </button>
                </div>

                <div className="p-6">
                  {/* Success */}
                  {successMsg && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                      {successMsg}
                    </div>
                  )}

                  {/* OAuth buttons — common to login & register */}
                  <OAuthButtons onError={setError} />
                  <p className="text-[11px] text-on-surface-variant mt-3 leading-snug">
                    Не храним email и имя — только идентификатор от Yandex/Google.
                  </p>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-outline-variant/30" />
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                      или email
                    </span>
                    <div className="flex-1 h-px bg-outline-variant/30" />
                  </div>

                  {/* LOGIN FORM */}
                  {activeTab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Пароль
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Вход...' : 'Войти'}
                      </button>

                      <p className="text-center text-xs text-on-surface-variant">
                        Нет аккаунта?{' '}
                        <button
                          type="button"
                          onClick={() => switchTab('register')}
                          className="text-secondary font-semibold hover:underline"
                        >
                          Зарегистрироваться
                        </button>
                      </p>
                    </form>
                  )}

                  {/* REGISTER FORM */}
                  {activeTab === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Как к тебе обращаться?{' '}
                          <span className="text-xs text-on-surface-variant font-normal">(необязательно, никнейм)</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Катя, DataLover, Студент..."
                          className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1.5">
                          Пароль{' '}
                          <span className="text-xs text-on-surface-variant">(минимум 8 символов)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Минимум 8 символов"
                            className="w-full px-4 py-3 rounded-xl bg-surface ring-1 ring-outline-variant/30 text-sm outline-none focus:ring-2 focus:ring-secondary/40 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
                      </button>

                      <p className="text-center text-xs text-on-surface-variant">
                        Уже есть аккаунт?{' '}
                        <button
                          type="button"
                          onClick={() => switchTab('login')}
                          className="text-secondary font-semibold hover:underline"
                        >
                          Войти
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
