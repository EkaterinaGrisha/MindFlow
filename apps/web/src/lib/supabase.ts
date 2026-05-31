import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'http://localhost:54321';
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'public-anon-key-placeholder';

if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  console.warn('Supabase env vars not set. Auth and DB features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  user_id: string;
  full_name: string | null;
  occupation: string | null;
  goal: string | null;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  interests: string[];
  learning_style: 'Theory' | 'Case-study' | 'Socratic' | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MathTopicProgress = {
  id: number;
  user_id: string;
  section: string;
  topic: string;
  page_type: 'theory' | 'practice' | 'independent';
  completed: boolean;
  score: number | null;
  time_spent_seconds: number;
  last_visited_at: string;
};
