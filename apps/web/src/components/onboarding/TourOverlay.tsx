import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Sparkles, Compass, BookOpen, PartyPopper } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';
import { TOUR_STEPS, type TourStep } from './tourSteps';
import StepIllustration from './StepIllustration';

const INTRO_SEEN_KEY = 'mindflow.onboarding.introSeen';

const MOBILE_BREAKPOINT = 768;
const BUBBLE_WIDTH = 340;
const BUBBLE_OFFSET = 16;
const SPOTLIGHT_PAD = 8;

type Rect = { top: number; left: number; width: number; height: number };

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
}

function useTargetRect(selector: string | undefined, deps: unknown[]): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    // Initial measure on next frame so target has time to mount after route change.
    raf = window.requestAnimationFrame(measure);
    const interval = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(interval);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, ...deps]);

  return rect;
}

function computeBubblePosition(
  rect: Rect | null,
  placement: TourStep['placement'],
  vw: number,
  vh: number,
): { top: number; left: number; arrow: 'top' | 'bottom' | 'left' | 'right' | 'none' } {
  if (!rect || placement === 'center') {
    return { top: vh / 2 - 160, left: vw / 2 - BUBBLE_WIDTH / 2, arrow: 'none' };
  }
  const cx = rect.left + rect.width / 2;
  const below = rect.top + rect.height + BUBBLE_OFFSET;
  const above = rect.top - BUBBLE_OFFSET - 220;
  const rightOf = rect.left + rect.width + BUBBLE_OFFSET;
  const leftOf = rect.left - BUBBLE_OFFSET - BUBBLE_WIDTH;

  let top = below;
  let left = cx - BUBBLE_WIDTH / 2;
  let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

  if (placement === 'top') {
    top = above;
    arrow = 'bottom';
  } else if (placement === 'right') {
    top = rect.top;
    left = rightOf;
    arrow = 'left';
  } else if (placement === 'left') {
    top = rect.top;
    left = leftOf;
    arrow = 'right';
  } else {
    top = below;
    arrow = 'top';
  }

  // Clamp horizontally with 12px margin.
  left = Math.max(12, Math.min(left, vw - BUBBLE_WIDTH - 12));
  // Clamp vertically.
  top = Math.max(12, Math.min(top, vh - 240));
  return { top, left, arrow };
}

type Phase = 'intro' | 'tour' | 'outro';

export default function TourOverlay() {
  const { step, totalSteps, isOpen, next, prev, skip, close } = useOnboarding();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const current = TOUR_STEPS[step];

  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === 'undefined') return 'tour';
    return localStorage.getItem(INTRO_SEEN_KEY) === '1' ? 'tour' : 'intro';
  });

  // When the tour opens fresh after a restart, drop the outro state and re-decide intro vs tour.
  useEffect(() => {
    if (!isOpen) return;
    if (step > 0) {
      setPhase('tour');
      return;
    }
    if (phase === 'outro') {
      const seen = typeof window !== 'undefined' && localStorage.getItem(INTRO_SEEN_KEY) === '1';
      setPhase(seen ? 'tour' : 'intro');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  // Auto-navigate to step's route when off-route.
  useEffect(() => {
    if (!isOpen || !current?.route) return;
    if (location.pathname !== current.route) {
      navigate(current.route);
    }
  }, [isOpen, current, location.pathname, navigate]);

  const rect = useTargetRect(isMobile ? undefined : current?.target, [
    isOpen,
    location.pathname,
    step,
  ]);

  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  useEffect(() => {
    const onR = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void skip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        void next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        void prev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, next, prev, skip]);

  const bubble = useMemo(
    () => computeBubblePosition(isMobile ? null : rect, current?.placement, vp.w, vp.h),
    [rect, current, vp, isMobile],
  );

  // Outro can outlive provider's isOpen (we mark onboarding complete before showing the goodbye card).
  if (!isOpen && phase !== 'outro') return null;

  if (phase === 'intro') {
    return (
      <CenteredCard
        icon={<Compass className="w-6 h-6" />}
        title="Покажем платформу за минуту"
        body="4 коротких шага: граф знаний, AI Workspace, структура курса и как считается прогресс. Управление: «Далее» / Enter / →, «Назад» / ←, «Пропустить» / Esc."
        primaryLabel="Начать тур"
        onPrimary={() => {
          if (typeof window !== 'undefined') localStorage.setItem(INTRO_SEEN_KEY, '1');
          setPhase('tour');
        }}
        secondaryLabel="Пропустить"
        onSecondary={() => {
          if (typeof window !== 'undefined') localStorage.setItem(INTRO_SEEN_KEY, '1');
          void skip();
        }}
      />
    );
  }

  if (phase === 'outro') {
    return (
      <CenteredCard
        icon={<PartyPopper className="w-6 h-6" />}
        title="Готово, можно начинать"
        body="Подсказки можно запустить заново в профиле. Подробный разбор всех возможностей — в гайде «Как это работает»."
        primaryLabel="В дашборд"
        onPrimary={() => {
          setPhase('tour');
          close();
          navigate('/dashboard');
        }}
        secondaryLabel="Открыть гайд"
        secondaryIcon={<BookOpen className="w-4 h-4" />}
        onSecondary={() => {
          setPhase('tour');
          close();
          navigate('/guide');
        }}
        onDismiss={() => {
          setPhase('tour');
          close();
        }}
      />
    );
  }

  if (!current) return null;

  const isLast = step === totalSteps - 1;
  const ctaLabel = current.ctaLabel ?? (isLast ? 'Понятно, вперёд!' : 'Далее');

  const onPrimary = async () => {
    if (isLast) {
      setPhase('outro');
      await next(); // marks complete + flips provider isOpen=false; outro overrides the gate.
    } else {
      await next();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dim layers cut around the spotlight on desktop, single dim on mobile */}
      {!isMobile && rect ? (
        <>
          {dimRectsAround(rect, vp).map((style, i) => (
            <div
              key={i}
              className="absolute bg-black/55 pointer-events-auto"
              style={style}
              onClick={() => void skip()}
            />
          ))}
          <div
            className="absolute rounded-xl ring-2 ring-secondary pointer-events-none"
            style={{
              top: rect.top - SPOTLIGHT_PAD,
              left: rect.left - SPOTLIGHT_PAD,
              width: rect.width + SPOTLIGHT_PAD * 2,
              height: rect.height + SPOTLIGHT_PAD * 2,
              boxShadow: '0 0 0 2px rgba(124,58,237,0.35), 0 0 24px rgba(124,58,237,0.45)',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-black/60 pointer-events-auto"
          onClick={() => void skip()}
        />
      )}

      {/* Bubble */}
      <div
        className="absolute pointer-events-auto bg-surface-container-lowest text-primary rounded-2xl shadow-2xl ring-1 ring-outline-variant/20 p-5"
        style={{
          top: isMobile ? '50%' : bubble.top,
          left: isMobile ? '50%' : bubble.left,
          transform: isMobile ? 'translate(-50%, -50%)' : undefined,
          width: isMobile ? 'min(92vw, 380px)' : BUBBLE_WIDTH,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isMobile && rect && bubble.arrow !== 'none' && (
          <BubbleArrow side={bubble.arrow} />
        )}

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-secondary">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Шаг {step + 1} из {totalSteps}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void skip()}
            className="text-on-surface-variant hover:text-primary"
            aria-label="Пропустить онбординг"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-lg font-extrabold text-primary leading-snug mb-2">{current.title}</h2>

        {isMobile && current.illustration && (
          <div className="mb-3 rounded-xl bg-surface-container-low p-3">
            <StepIllustration kind={current.illustration} />
          </div>
        )}

        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{current.body}</p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void prev()}
            disabled={step === 0}
            className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-secondary' : 'w-1.5 bg-outline-variant/60'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => void onPrimary()}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {!current.target && !isMobile && (
          // Defensive: target missing on desktop — show a hint.
          <p className="text-[10px] text-on-surface-variant/70 mt-3 text-center">
            Подсказка не привязана к элементу: возможно, нужный экран ещё не открыт.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void close()}
        className="sr-only"
        aria-label="Закрыть оверлей"
      />
    </div>
  );
}

function dimRectsAround(rect: Rect, vp: { w: number; h: number }): React.CSSProperties[] {
  const t = Math.max(0, rect.top - SPOTLIGHT_PAD);
  const l = Math.max(0, rect.left - SPOTLIGHT_PAD);
  const r = Math.min(vp.w, rect.left + rect.width + SPOTLIGHT_PAD);
  const b = Math.min(vp.h, rect.top + rect.height + SPOTLIGHT_PAD);
  return [
    { top: 0, left: 0, width: vp.w, height: t },
    { top: b, left: 0, width: vp.w, height: vp.h - b },
    { top: t, left: 0, width: l, height: b - t },
    { top: t, left: r, width: vp.w - r, height: b - t },
  ];
}

function BubbleArrow({ side }: { side: 'top' | 'bottom' | 'left' | 'right' }) {
  const base =
    'absolute w-3 h-3 rotate-45 bg-surface-container-lowest ring-1 ring-outline-variant/20';
  const pos =
    side === 'top'
      ? 'left-1/2 -translate-x-1/2 -top-1.5'
      : side === 'bottom'
        ? 'left-1/2 -translate-x-1/2 -bottom-1.5'
        : side === 'left'
          ? 'top-6 -left-1.5'
          : 'top-6 -right-1.5';
  return <span className={`${base} ${pos}`} aria-hidden />;
}

type CenteredCardProps = {
  icon: React.ReactNode;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  secondaryIcon?: React.ReactNode;
  onSecondary?: () => void;
  onDismiss?: () => void;
};

function CenteredCard({
  icon,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  secondaryIcon,
  onSecondary,
  onDismiss,
}: CenteredCardProps) {
  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => (onDismiss ?? onSecondary ?? onPrimary)()}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest rounded-2xl shadow-2xl ring-1 ring-outline-variant/20 p-6 w-[min(92vw,420px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-extrabold text-primary leading-snug mb-2">{title}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{body}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            {primaryLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="inline-flex items-center justify-center gap-2 border border-outline-variant/30 text-sm font-semibold text-primary rounded-xl px-4 py-2.5 hover:bg-surface-container-low transition-colors"
            >
              {secondaryIcon}
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
