import { supabase } from './supabase';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { error: error?.message ?? null };
}

export function signInWithYandex(): void {
  window.location.href = `${API_BASE}/api/auth/yandex/start`;
}
