import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { buildApiHeaders, getApiBaseUrl } from './api';

export type SubscriptionStatus = {
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  inTrial: boolean;
  trialEndsAt: string | null;
  expiresAt: string | null;
};

export type SubscriptionState = {
  sub: SubscriptionStatus | null;
  loading: boolean;
  isPro: boolean;
  isTrialActive: boolean;
  hasAccess: boolean;
  daysLeftInTrial: number | null;
  refresh: () => void;
  startTrial: () => Promise<void>;
};

export function useSubscription(): SubscriptionState {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSub(null);
      setLoading(false);
      return;
    }

    try {
      const headers = await buildApiHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/billing/status`, { headers });
      if (res.ok) {
        const data = await res.json() as SubscriptionStatus;
        setSub(data);
      } else {
        setSub(null);
      }
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchStatus();
    });
    return () => subscription.unsubscribe();
  }, [fetchStatus]);

  const startTrial = useCallback(async () => {
    const headers = await buildApiHeaders();
    const res = await fetch(`${getApiBaseUrl()}/api/billing/start-trial`, {
      method: 'POST',
      headers,
    });
    if (res.ok) await fetchStatus();
  }, [fetchStatus]);

  const isPro = sub?.plan === 'pro' && sub.status === 'active';
  const isTrialActive = sub?.inTrial === true;
  const hasAccess = isPro || isTrialActive;

  let daysLeftInTrial: number | null = null;
  if (sub?.trialEndsAt && isTrialActive) {
    const diff = new Date(sub.trialEndsAt).getTime() - Date.now();
    daysLeftInTrial = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return { sub, loading, isPro, isTrialActive, hasAccess, daysLeftInTrial, refresh: fetchStatus, startTrial };
}
