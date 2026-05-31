import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { profileCompletionPercent } from '../lib/profileCompletion';

const THRESHOLD = 70;

export default function ProfileCompletionBanner() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading || !user) return null;
  const percent = profileCompletionPercent(profile);
  if (percent >= THRESHOLD) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      className="w-full text-left rounded-2xl bg-secondary/5 ring-1 ring-secondary/20 hover:ring-secondary/40 transition-all p-4 md:p-5 flex items-center gap-4"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-semibold text-primary">
          Заполните профиль на {percent}% — ментор будет точнее советовать темы
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-secondary/15 overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-secondary shrink-0" />
    </button>
  );
}
