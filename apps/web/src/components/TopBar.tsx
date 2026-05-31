import { useState } from 'react';
import { HelpCircle, Search, Sparkles, User } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useSubscription } from '../lib/useSubscription';
import AuthModal from './AuthModal';

export default function TopBar() {
  const { user, profile } = useAuth();
  const { isPro, isTrialActive, daysLeftInTrial } = useSubscription();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search → /graph filter.
  // On /graph: URL ?q= is the source of truth, the input updates it live.
  // Elsewhere: input keeps a local draft; Enter navigates to /graph?q=...
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const onGraph = location.pathname === '/graph';
  const [draftQuery, setDraftQuery] = useState('');
  const query = onGraph ? (searchParams.get('q') ?? '') : draftQuery;

  const setQuery = (next: string) => {
    if (onGraph) {
      const params = new URLSearchParams(searchParams);
      if (next) params.set('q', next);
      else params.delete('q');
      setSearchParams(params, { replace: true });
    } else {
      setDraftQuery(next);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onGraph) return;
    const q = query.trim();
    navigate(q ? `/graph?q=${encodeURIComponent(q)}` : '/graph');
  };

  const displayName =
    profile?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Профиль';

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : displayName[0]?.toUpperCase() ?? '?';

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={user ? 'login' : 'login'}
      />

      <header className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-primary lg:hidden">
              MindFlow
            </span>
            <nav className="hidden md:flex gap-1">
              {[
                { to: "/dashboard", label: "Дашборд", tour: undefined },
                { to: "/progress", label: "Прогресс", tour: undefined },
                { to: "/graph", label: "Граф знаний", tour: "graph-link" },
                { to: "/plan", label: "Мой план", tour: undefined },
                { to: "/mentor", label: "AI-ментор", tour: "workspace-link" },
              ].map(({ to, label, tour }) => (
                <NavLink
                  key={to}
                  to={to}
                  data-tour={tour}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "font-bold text-primary bg-surface-container"
                        : "font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Guide / Help */}
            <Link
              to="/guide"
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors"
              title="Как это работает"
              aria-label="Открыть гайд «Как это работает»"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>

            {/* Search → filters /graph */}
            <form onSubmit={handleSubmit} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск тем..."
                aria-label="Поиск тем в графе знаний"
                className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-52 focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
              />
            </form>

            {/* Pro / Trial badge */}
            {user && isPro && (
              <Link
                to="/pricing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Pro
              </Link>
            )}
            {user && !isPro && isTrialActive && daysLeftInTrial !== null && (
              <Link
                to="/pricing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/15 text-secondary text-xs font-semibold hover:bg-secondary/25 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Пробный · {daysLeftInTrial}д
              </Link>
            )}
            {user && !isPro && !isTrialActive && (
              <Link
                to="/pricing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container transition-colors"
              >
                Попробовать Pro
              </Link>
            )}

            {/* Profile button — always opens AuthModal */}
            {user ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
                title={profile?.full_name ?? user.email}
              >
                <div className="w-7 h-7 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <span className="text-sm font-medium text-primary hidden md:block">
                  {displayName}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
                title="Войти или зарегистрироваться"
              >
                <div className="w-7 h-7 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-primary hidden md:block">
                  Профиль
                </span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
