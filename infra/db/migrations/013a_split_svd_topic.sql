-- Split SVD into two catalog concepts while preserving the existing concept id
-- for the foundational first part.

BEGIN;

UPDATE public.kg_concepts
SET name = 'Сингулярное разложение (SVD) — часть 1'
WHERE concept_id = 'math-la-svd';

INSERT INTO public.kg_concepts (concept_id, name, domain, course_id)
VALUES ('math-la-svd-app', 'Сингулярное разложение (SVD) — часть 2', 'Линейная алгебра', 'math-for-data-science')
ON CONFLICT (concept_id) DO UPDATE
SET name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    course_id = EXCLUDED.course_id;

INSERT INTO public.kg_edges (from_concept, to_concept, relation_type)
VALUES ('math-la-svd', 'math-la-svd-app', 'prerequisite')
ON CONFLICT (from_concept, to_concept, relation_type) DO NOTHING;

COMMIT;
