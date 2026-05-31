-- 026: отозвать EXECUTE у anon/authenticated на SECURITY DEFINER RPC,
-- которые принимают p_user_id и пишут в чужой профиль / отдают чужие данные.
--
-- IDOR: до миграции любой клиент с anon/user-JWT мог дёрнуть
-- update_bkt_mastery / schedule_review / get_due_reviews с чужим
-- p_user_id и записать/прочитать чужой прогресс. SECURITY DEFINER
-- усиливает уязвимость — функция работала от postgres-owner, RLS
-- внутри не помогает.
--
-- В рантайме эти RPC дёргает только API из knowledgeGraph.ts через
-- service_role (он сохраняет EXECUTE и не теряет доступ). С фронта
-- их никто не вызывает.

REVOKE EXECUTE ON FUNCTION
  public.update_bkt_mastery(uuid, text, boolean, text, text, integer, integer),
  public.schedule_review(uuid, text, integer),
  public.get_due_reviews(uuid)
FROM PUBLIC, anon, authenticated;
