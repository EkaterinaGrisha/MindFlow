-- 027: отозвать EXECUTE у anon/authenticated на остальные SECURITY DEFINER
-- функции, помеченные advisor'ом.
--
-- 4 триггерные (вызываются триггерами на auth.users / user_profiles /
-- learning_plan_items): REVOKE не блокирует вызов из триггера, привилегия
-- идёт через owner — продолжат работать.
--
-- 2 поисковые KG-RPC (get_concept_neighbors, search_concepts_by_topic_slug):
-- из app-кода (apps/web, apps/api) не вызываются. Если когда-нибудь
-- понадобятся с фронта — GRANT обратно одной строкой.

REVOKE EXECUTE ON FUNCTION
  public.handle_new_user(),
  public.handle_new_user_subscription(),
  public.rag_chunks_insert_fn(),
  public.touch_learning_plan(),
  public.get_concept_neighbors(text[]),
  public.search_concepts_by_topic_slug(text[])
FROM PUBLIC, anon, authenticated;
