import { Check, Sparkles, BookOpen, Users, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { useSubscription } from '../lib/useSubscription';

const FREE_FEATURES = [
  'Теория по всем темам линейной алгебры',
  'Базовый AI-ментор (роль Лектора)',
  'Диагностика уровня',
  'Прогресс и история',
];

const PRO_FEATURES = [
  'Всё из бесплатного плана',
  'Все 5 ролей AI-ментора (Зеркало, Песочница, Критик, Лектор)',
  'Загрузка своего учебника в базу знаний',
  'Приватный AI-тьютор по вашему учебнику',
  'Режим дебатов между ролями',
  'Инструмент автора — создание интерактивных курсов',
  'Приоритетная поддержка',
];

export default function Pricing() {
  const { user } = useAuth();
  const { sub, isPro, isTrialActive, daysLeftInTrial, startTrial } = useSubscription();
  const navigate = useNavigate();

  async function handleGetPro() {
    if (!user) {
      navigate('/register');
      return;
    }
    // Trial — если ещё не активирован
    if (!sub?.trialEndsAt) {
      await startTrial();
      return;
    }
    // Placeholder: future payment integration
    alert('Оплата скоро появится. Пока доступен 7-дневный пробный период.');
  }

  return (
    <div className="min-h-screen bg-surface py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-on-surface mb-3">Тарифы MindFlow</h1>
          <p className="text-on-surface-variant text-lg">
            Начни бесплатно — получи 7 дней полного доступа без карты
          </p>
        </div>

        {/* Trial banner */}
        {isTrialActive && daysLeftInTrial !== null && (
          <div className="mb-8 bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-center">
            <Sparkles className="inline w-5 h-5 text-secondary mr-2" />
            <span className="text-secondary font-semibold">
              Пробный период активен — осталось {daysLeftInTrial}{' '}
              {daysLeftInTrial === 1 ? 'день' : daysLeftInTrial < 5 ? 'дня' : 'дней'}
            </span>
          </div>
        )}

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-on-surface-variant" />
                <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  Базовый
                </span>
              </div>
              <div className="text-4xl font-bold text-on-surface">
                0 ₽
                <span className="text-base font-normal text-on-surface-variant ml-2">/ месяц</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-on-surface-variant">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="w-full py-3 rounded-2xl border border-outline-variant text-on-surface font-semibold hover:bg-surface-container-high transition-colors"
            >
              {user ? 'Это ваш план' : 'Начать бесплатно'}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-white/80" />
                <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <div className="text-4xl font-bold">
                990 ₽
                <span className="text-base font-normal text-white/70 ml-2">/ месяц</span>
              </div>
              <p className="text-white/60 text-sm mt-1">7 дней бесплатно, отмена в любой момент</p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-white/80 mt-0.5 shrink-0" />
                  <span className="text-sm text-white/90">{f}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="w-full py-3 rounded-2xl bg-white/20 text-white font-semibold text-center">
                Активная подписка
              </div>
            ) : (
              <button
                onClick={handleGetPro}
                className="w-full py-3 rounded-2xl bg-white text-primary font-semibold hover:bg-white/90 transition-colors"
              >
                {!user
                  ? 'Зарегистрироваться и попробовать'
                  : isTrialActive
                  ? 'Подключить подписку'
                  : 'Начать 7-дневный пробный период'}
              </button>
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6 text-secondary" />,
              title: 'Личный учебник в AI',
              desc: 'Загрузи любой PDF — ментор будет отвечать, опираясь именно на него',
              to: '/personal-ai',
            },
            {
              icon: <Users className="w-6 h-6 text-secondary" />,
              title: '5 ролей ментора',
              desc: 'Лектор, Зеркало, Критик, Песочница — каждый учит иначе',
              to: '/mentor',
            },
            {
              icon: <Sparkles className="w-6 h-6 text-secondary" />,
              title: 'Инструмент автора',
              desc: 'Создавай интерактивные курсы из своих материалов с помощью AI-методиста',
              to: '/author',
            },
          ].map(({ icon, title, desc, to }) => (
            <Link key={title} to={to} className="block bg-surface-container-low rounded-2xl p-6 hover:bg-surface-container transition-colors">
              <div className="mb-3">{icon}</div>
              <h3 className="font-semibold text-on-surface mb-1">{title}</h3>
              <p className="text-sm text-on-surface-variant">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
