import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './useAuth';

const LS_STEP = 'mindflow.onboarding.step';
const LS_DONE = 'mindflow.onboarding.completedAt';

export type OnboardingState = {
  step: number;
  completedAt: string | null;
  loading: boolean;
  shouldShow: boolean;
  setStep: (next: number) => Promise<void>;
  complete: () => Promise<void>;
  restart: () => Promise<void>;
};

function readLocal() {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_STEP) : null;
  const done = typeof window !== 'undefined' ? localStorage.getItem(LS_DONE) : null;
  const step = raw === null ? 0 : Number(raw);
  return {
    step: Number.isFinite(step) ? step : 0,
    completedAt: done,
  };
}

function writeLocal(step: number, completedAt: string | null) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_STEP, String(step));
  if (completedAt) localStorage.setItem(LS_DONE, completedAt);
  else localStorage.removeItem(LS_DONE);
}

export function useOnboardingState(): OnboardingState {
  const { user, loading: authLoading } = useAuth();
  const [step, setStepInner] = useState(0);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      if (!user) {
        const local = readLocal();
        if (!cancelled) {
          setStepInner(local.step);
          setCompletedAt(local.completedAt);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from('user_profiles')
        .select('onboarding_step, onboarding_completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      const local = readLocal();
      const dbStep = (data?.onboarding_step as number | undefined) ?? null;
      const dbDone = (data?.onboarding_completed_at as string | null | undefined) ?? null;

      const mergedStep = dbStep !== null ? dbStep : local.step;
      const mergedDone = dbDone ?? local.completedAt;

      setStepInner(mergedStep);
      setCompletedAt(mergedDone);
      writeLocal(mergedStep, mergedDone);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const setStep = useCallback(
    async (next: number) => {
      setStepInner(next);
      writeLocal(next, completedAt);
      if (user) {
        await supabase
          .from('user_profiles')
          .update({ onboarding_step: next })
          .eq('user_id', user.id);
      }
    },
    [user, completedAt],
  );

  const complete = useCallback(async () => {
    const now = new Date().toISOString();
    setCompletedAt(now);
    writeLocal(step, now);
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ onboarding_completed_at: now })
        .eq('user_id', user.id);
    }
  }, [user, step]);

  const restart = useCallback(async () => {
    setStepInner(0);
    setCompletedAt(null);
    writeLocal(0, null);
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ onboarding_step: 0, onboarding_completed_at: null })
        .eq('user_id', user.id);
    }
  }, [user]);

  return {
    step,
    completedAt,
    loading,
    shouldShow: !loading && !completedAt,
    setStep,
    complete,
    restart,
  };
}
