-- 022: Reliable user_profiles population on signup.
--
-- Проблема. Раньше handle_new_user делал только INSERT user_id, а реальные
-- поля (full_name, occupation, interests, goal) клиент дозаписывал через
-- UPDATE с RLS `auth.uid() = user_id`. При включённом email confirmation
-- после signUp сессии ещё нет → auth.uid() = NULL → UPDATE возвращает
-- 0 rows без ошибки. Поля оставались NULL. Плюс колонки goal в БД не было.
--
-- Решение: переложить запись на сам триггер. SECURITY DEFINER не зависит
-- от сессии и RLS — данные из raw_user_meta_data всегда попадают в
-- user_profiles. Колонку goal добавляем туда же.

-- ─── 1. Колонка goal ────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS goal VARCHAR(255);

-- ─── 2. Триггер handle_new_user подтягивает поля из metadata ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_full_name  text;
  v_occupation text;
  v_goal       text;
  v_interests  jsonb;
BEGIN
  v_full_name  := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  v_occupation := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'occupation', '')), '');
  v_goal       := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'goal', '')), '');
  v_interests  := COALESCE(NEW.raw_user_meta_data->'interests', '[]'::jsonb);
  IF jsonb_typeof(v_interests) <> 'array' THEN
    v_interests := '[]'::jsonb;
  END IF;

  INSERT INTO public.user_profiles (user_id, full_name, occupation, interests, goal)
  VALUES (NEW.id, v_full_name, v_occupation, v_interests, v_goal)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name,  public.user_profiles.full_name),
    occupation = COALESCE(EXCLUDED.occupation, public.user_profiles.occupation),
    goal       = COALESCE(EXCLUDED.goal,       public.user_profiles.goal),
    interests  = CASE
      WHEN jsonb_array_length(EXCLUDED.interests) > 0 THEN EXCLUDED.interests
      ELSE public.user_profiles.interests
    END;

  RETURN NEW;
END;
$function$;
