import { useEffect, useState } from 'react';
import { supabase, type UserProfile } from './supabase';
import type { User } from '@supabase/supabase-js';

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    setProfile(data as UserProfile | null);
    setLoading(false);
  }

  return { user, profile, loading, isGuest: !user };
}

/** Build LLM personalization context from profile */
export function buildPersonalizationContext(profile: UserProfile | null) {
  if (!profile) {
    return {
      experience: 'гость без профиля',
      level: 'базовый',
      interests: 'математика, программирование',
      knowledgeSummary: 'Гость: персонализация отключена.',
    };
  }
  return {
    experience: profile.occupation ?? 'не указан',
    level: profile.level ?? 'не определён',
    interests: profile.interests?.join(', ') ?? 'не указаны',
    knowledgeSummary: `Профиль: ${profile.occupation ?? '—'}, уровень: ${profile.level ?? '—'}`,
  };
}
