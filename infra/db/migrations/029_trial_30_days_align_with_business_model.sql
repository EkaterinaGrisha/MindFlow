-- 029: согласовать длительность триала с бизнес-моделью «первый месяц free».
--
-- Контекст. Миграция 007 ввела триггер на user_profiles, создающий subscription
-- с 7-дневным триалом. apps/api/src/billingEndpoint.ts при ручной активации
-- (POST /api/billing/start-trial) ставит 30 дней. Это рассогласование:
-- авто-триал короче ручного. Бизнес-модель — Pro 349₽/мес + первый месяц free,
-- то есть 30 дней. Триггер выравниваем под бизнес-модель.
--
-- Идемпотентность: пользователи, у которых триал уже создан (даже истёк),
-- не затрагиваются — ON CONFLICT (user_id) DO NOTHING в теле триггера.
-- Истёкшие триалы продлеваются ручным апсёртом, не триггером.
--
-- Backfill для уже зарегистрированных пользователей с истёкшим/отсутствующим
-- триалом (на момент миграции — 5 человек, в т.ч. 2 ранних пользователя без
-- subscription, появившихся ДО миграции 007) выполнен отдельным DML-запросом:
--   INSERT INTO subscriptions ... SELECT FROM auth.users ON CONFLICT ...
--   SET trial_ends_at = GREATEST(existing, NOW() + 30 days), status = 'active'

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (
    NEW.user_id,
    'free',
    'active',
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Триггер уже существует с 007 (on_user_profile_created_add_subscription),
-- не пересоздаём — CREATE OR REPLACE FUNCTION меняет логику без вмешательства
-- в сам триггер.
