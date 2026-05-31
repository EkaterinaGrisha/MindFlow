import { supabase } from './supabase';

export async function buildApiHeaders(baseHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...baseHeaders,
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

/** Returns only the Authorization header — for multipart/form-data uploads where Content-Type must not be set manually. */
export async function buildAuthOnlyHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export function getApiBaseUrl(): string {
  // Empty string = relative paths. Works when web and API share an origin
  // and nginx proxies /api/* to the API process (current VPS setup).
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
}
