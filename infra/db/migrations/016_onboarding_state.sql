-- Migration 016: Onboarding tour state on user_profiles
-- Tracks how far a user has progressed through the in-app onboarding tour
-- so we can resume from the same step on next login and avoid re-showing it.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.onboarding_step
  IS 'Index of the next onboarding tour step to show (0 = not started). Reset to 0 to replay the tour.';

COMMENT ON COLUMN public.user_profiles.onboarding_completed_at
  IS 'Set when the user finishes (or explicitly skips) the onboarding tour. NULL = not yet completed.';
