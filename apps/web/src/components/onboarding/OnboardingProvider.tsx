import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useOnboardingState } from '../../lib/useOnboardingState';

type OnboardingContextValue = {
  step: number;
  totalSteps: number;
  isOpen: boolean;
  loading: boolean;
  open: () => void;
  close: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  skip: () => Promise<void>;
  restart: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const ONBOARDING_TOTAL_STEPS = 4;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const state = useOnboardingState();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state.loading) return;
    if (state.completedAt) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') === '1') {
      setIsOpen(true);
      return;
    }
    if (state.step > 0 && state.step < ONBOARDING_TOTAL_STEPS) {
      setIsOpen(true);
    }
  }, [state.loading, state.completedAt, state.step]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const next = useCallback(async () => {
    const upcoming = state.step + 1;
    if (upcoming >= ONBOARDING_TOTAL_STEPS) {
      await state.complete();
      setIsOpen(false);
      return;
    }
    await state.setStep(upcoming);
  }, [state]);

  const prev = useCallback(async () => {
    if (state.step <= 0) return;
    await state.setStep(state.step - 1);
  }, [state]);

  const skip = useCallback(async () => {
    await state.complete();
    setIsOpen(false);
  }, [state]);

  const restart = useCallback(async () => {
    await state.restart();
    setIsOpen(true);
  }, [state]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      step: state.step,
      totalSteps: ONBOARDING_TOTAL_STEPS,
      isOpen,
      loading: state.loading,
      open,
      close,
      next,
      prev,
      skip,
      restart,
    }),
    [state.step, state.loading, isOpen, open, close, next, prev, skip, restart],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
