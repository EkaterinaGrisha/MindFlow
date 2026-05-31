-- Supabase/PostgreSQL schema for user-centric personalization data.
-- Safe to run multiple times (idempotent where practical).

-- 0) Required extensions.
CREATE EXTENSION IF NOT EXISTS vector;

-- 1) Enum for the current proficiency level.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'user_level'
  ) THEN
    CREATE TYPE user_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
  END IF;
END
$$;

-- 2) Enum for concept mastery status in the knowledge graph.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'knowledge_status'
  ) THEN
    CREATE TYPE knowledge_status AS ENUM (
      'mastered',
      'in_progress',
      'weak_spot',
      'unknown'
    );
  END IF;
END
$$;

-- 3) User profiles table linked 1:1 with Supabase Auth users.
-- auth.users is managed by Supabase; do not create your own auth table.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  occupation VARCHAR(255),
  level user_level,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_style VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_profiles_interests_is_array CHECK (jsonb_typeof(interests) = 'array'),
  CONSTRAINT user_profiles_learning_style_allowed CHECK (
    learning_style IS NULL OR learning_style IN ('Theory', 'Case-study', 'Socratic')
  )
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_interests_gin
  ON public.user_profiles USING GIN (interests);

-- Keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4) Auto-create profile row right after auth signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 5) Knowledge graph: many concepts per user.
CREATE TABLE IF NOT EXISTS public.knowledge_graph (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  concept_id VARCHAR(255) NOT NULL,
  status knowledge_status NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.0,
  last_interaction TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT knowledge_graph_confidence_range CHECK (
    confidence >= 0.0 AND confidence <= 1.0
  ),
  CONSTRAINT knowledge_graph_user_concept_unique UNIQUE (user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_user_status
  ON public.knowledge_graph (user_id, status);

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_last_interaction
  ON public.knowledge_graph (last_interaction DESC);

-- 6) Learning activities: timeline/memory events per user.
CREATE TABLE IF NOT EXISTS public.learning_activities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_context VARCHAR(255) NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  selected_role VARCHAR(50) NOT NULL,
  embedding VECTOR(1024)
);

CREATE INDEX IF NOT EXISTS idx_learning_activities_user_timestamp
  ON public.learning_activities (user_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_learning_activities_selected_role
  ON public.learning_activities (selected_role);

-- 7) Row Level Security (RLS) for Supabase client access.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.user_profiles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.user_profiles
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'knowledge_graph' AND policyname = 'Users manage own knowledge graph'
  ) THEN
    CREATE POLICY "Users manage own knowledge graph"
      ON public.knowledge_graph
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'learning_activities' AND policyname = 'Users manage own learning activities'
  ) THEN
    CREATE POLICY "Users manage own learning activities"
      ON public.learning_activities
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;


-- 8) Per-course skill levels (each course tracked independently).
CREATE TABLE IF NOT EXISTS public.course_skill_levels (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  course_id VARCHAR(255) NOT NULL,
  level user_level NOT NULL,
  mastery_score SMALLINT NOT NULL,
  domain_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT course_skill_levels_score_range CHECK (mastery_score >= 0 AND mastery_score <= 100),
  CONSTRAINT course_skill_levels_domain_scores_is_array CHECK (jsonb_typeof(domain_scores) = 'array'),
  CONSTRAINT course_skill_levels_user_course_unique UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_skill_levels_user_assessed
  ON public.course_skill_levels (user_id, assessed_at DESC);

ALTER TABLE public.course_skill_levels ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'course_skill_levels' AND policyname = 'Users manage own course skill levels'
  ) THEN
    CREATE POLICY "Users manage own course skill levels"
      ON public.course_skill_levels
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- 9) Registration submissions for onboarding funnel.
CREATE TABLE IF NOT EXISTS public.registration_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  background TEXT NOT NULL,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  goal VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT registration_submissions_email_unique UNIQUE (email),
  CONSTRAINT registration_submissions_interests_is_array CHECK (jsonb_typeof(interests) = 'array')
);

ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to ensure the check is not the always-true expression.
DROP POLICY IF EXISTS "Anon can create registration submissions" ON public.registration_submissions;
CREATE POLICY "Anon can create registration submissions"
  ON public.registration_submissions
  FOR INSERT
  TO anon
  WITH CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- 10) RAG chunks store for semantic retrieval.
-- Drop view if it previously existed under this name.
DROP VIEW IF EXISTS public.rag_chunks;

CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  source_title TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1024),
  page_hint TEXT,
  chunk_index INT,
  topic_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('russian', chunk_text)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT rag_chunks_source_chunk_unique UNIQUE (source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw
  ON public.rag_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv
  ON public.rag_chunks USING GIN (tsv);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_topic_tags
  ON public.rag_chunks USING GIN (topic_tags);

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rag_chunks' AND policyname = 'Authenticated users read RAG chunks'
  ) THEN
    CREATE POLICY "Authenticated users read RAG chunks"
      ON public.rag_chunks FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- 11) RPC function for semantic nearest-neighbor search.
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding      VECTOR(1024),
  similarity_threshold FLOAT,
  match_count          INT,
  topic_filter         TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  topic_tags   TEXT[],
  score        FLOAT
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id::text AS chunk_id,
    rc.source_id,
    rc.source_title,
    rc.chunk_text,
    rc.page_hint,
    rc.topic_tags,
    1 - (rc.embedding <=> query_embedding) AS score
  FROM public.rag_chunks rc
  WHERE rc.embedding IS NOT NULL
    AND 1 - (rc.embedding <=> query_embedding) >= similarity_threshold
    AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 12) Retrieval quality metrics.
CREATE TABLE IF NOT EXISTS public.rag_metrics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  top_k INT NOT NULL,
  used_chunks INT NOT NULL,
  precision_at_k FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.rag_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rag_metrics' AND policyname = 'Authenticated users read RAG metrics'
  ) THEN
    CREATE POLICY "Authenticated users read RAG metrics"
      ON public.rag_metrics FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13) Knowledge Graph: concepts catalogue.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.kg_concepts (
  concept_id  TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  domain      TEXT NOT NULL,
  course_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14) Knowledge Graph: prerequisite edges between concepts.
CREATE TABLE IF NOT EXISTS public.kg_edges (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_concept  TEXT NOT NULL REFERENCES public.kg_concepts(concept_id) ON DELETE CASCADE,
  to_concept    TEXT NOT NULL REFERENCES public.kg_concepts(concept_id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'prerequisite',
  CONSTRAINT kg_edges_from_concept_fkey FOREIGN KEY (from_concept) REFERENCES public.kg_concepts(concept_id),
  CONSTRAINT kg_edges_to_concept_fkey   FOREIGN KEY (to_concept)   REFERENCES public.kg_concepts(concept_id),
  CONSTRAINT kg_edges_unique UNIQUE (from_concept, to_concept, relation_type)
);

-- 15) BKT mastery state per user per concept.
CREATE TABLE IF NOT EXISTS public.kg_mastery (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  concept_id    TEXT NOT NULL REFERENCES public.kg_concepts(concept_id) ON DELETE CASCADE,
  p_mastery     FLOAT NOT NULL DEFAULT 0.2,
  attempts      INT   NOT NULL DEFAULT 0,
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kg_mastery_range     CHECK (p_mastery >= 0.0 AND p_mastery <= 1.0),
  CONSTRAINT kg_mastery_user_concept_unique UNIQUE (user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_kg_mastery_user_concept
  ON public.kg_mastery (user_id, concept_id);

CREATE INDEX IF NOT EXISTS idx_kg_mastery_last_seen
  ON public.kg_mastery (last_seen DESC);

-- 16) IRT item parameters (difficulty, discrimination, guessing) per question.
CREATE TABLE IF NOT EXISTS public.kg_item_params (
  item_id  TEXT PRIMARY KEY,
  a        FLOAT NOT NULL DEFAULT 1.0,   -- discrimination
  b        FLOAT NOT NULL DEFAULT 0.0,   -- difficulty (logit scale)
  c        FLOAT NOT NULL DEFAULT 0.25,  -- pseudo-guessing (1/num_choices)
  CONSTRAINT kg_item_params_a_pos CHECK (a > 0),
  CONSTRAINT kg_item_params_c_range CHECK (c >= 0 AND c <= 1)
);

-- 17) RLS for new knowledge graph tables.
ALTER TABLE public.kg_concepts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kg_edges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kg_mastery   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kg_item_params ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- kg_concepts: readable by all authenticated users, writable only by service role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kg_concepts' AND policyname = 'Authenticated users read concepts'
  ) THEN
    CREATE POLICY "Authenticated users read concepts"
      ON public.kg_concepts FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- kg_edges: readable by all authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kg_edges' AND policyname = 'Authenticated users read edges'
  ) THEN
    CREATE POLICY "Authenticated users read edges"
      ON public.kg_edges FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- kg_mastery: users manage own rows only
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kg_mastery' AND policyname = 'Users manage own mastery'
  ) THEN
    CREATE POLICY "Users manage own mastery"
      ON public.kg_mastery FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- kg_item_params: readable by all authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kg_item_params' AND policyname = 'Authenticated users read item params'
  ) THEN
    CREATE POLICY "Authenticated users read item params"
      ON public.kg_item_params FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- 18) VIEW: kg_mastery_summary — joins mastery state with concept metadata.
--     Adds status label and fading flag.
CREATE OR REPLACE VIEW public.kg_mastery_summary
WITH (security_invoker = true)
AS
SELECT
  km.user_id,
  kc.concept_id,
  kc.name        AS concept,
  kc.domain,
  kc.course_id,
  km.p_mastery,
  km.attempts,
  km.last_seen,
  CASE
    WHEN km.p_mastery >= 0.75                                              THEN 'mastered'
    WHEN km.p_mastery >= 0.45                                              THEN 'in_progress'
    WHEN km.p_mastery < 0.6 AND km.last_seen < NOW() - INTERVAL '14 days' THEN 'fading'
    ELSE 'weak_spot'
  END AS status
FROM public.kg_mastery km
JOIN public.kg_concepts kc ON kc.concept_id = km.concept_id;

-- 19) RPC: update_bkt_mastery — Bayesian Knowledge Tracing update with optional IRT weighting.
--
--     BKT base params: P(T)=0.30, P(G)=0.25, P(S)=0.10
--     Correct   : P(L|obs=1) = P(L)*(1-S)  / [P(L)*(1-S) + (1-P(L))*G]
--     Incorrect : P(L|obs=0) = P(L)*S       / [P(L)*S     + (1-P(L))*(1-G)]
--     Transition: P(L_new)   = P(L|obs) + (1 - P(L|obs)) * P(T)_adjusted
--
--     IRT adjustment (when p_item_id is provided):
--       θ = p_mastery mapped [0,1] → [-3,3]
--       P_irt = c + (1-c) / (1 + exp(-a*(θ-b)))
--       If correct: higher b (harder question) → larger p_transit boost
--       If incorrect: lower b (easier question) → stronger mastery penalty
CREATE OR REPLACE FUNCTION public.update_bkt_mastery(
  p_user_id      UUID,
  p_concept      TEXT,
  correct_answer BOOLEAN,
  p_item_id      TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_p_mastery   FLOAT;
  v_p_posterior FLOAT;
  v_p_new       FLOAT;
  v_p_transit   FLOAT;
  v_theta       FLOAT;
  v_p_irt       FLOAT;
  v_irt_a       FLOAT := 1.0;
  v_irt_b       FLOAT := 0.0;
  v_irt_c       FLOAT := 0.25;
  -- BKT base hyper-parameters
  p_transit_base CONSTANT FLOAT := 0.30;
  p_guess        CONSTANT FLOAT := 0.25;
  p_slip         CONSTANT FLOAT := 0.10;
BEGIN
  -- Fetch current mastery, defaulting to prior 0.2 for first encounter.
  SELECT p_mastery INTO v_p_mastery
  FROM public.kg_mastery
  WHERE user_id = p_user_id AND concept_id = p_concept;

  IF NOT FOUND THEN
    v_p_mastery := 0.2;
  END IF;

  -- Load IRT item parameters if an item ID was provided.
  IF p_item_id IS NOT NULL THEN
    SELECT a, b, c INTO v_irt_a, v_irt_b, v_irt_c
    FROM public.kg_item_params
    WHERE item_id = p_item_id;
  END IF;

  -- IRT-adjusted transition probability.
  -- Map p_mastery [0,1] → θ [-3,3], compute IRT probability, scale p_transit.
  v_theta  := (v_p_mastery - 0.5) * 6.0;
  v_p_irt  := v_irt_c + (1.0 - v_irt_c) / (1.0 + EXP(-v_irt_a * (v_theta - v_irt_b)));
  -- Harder questions answered correctly → higher effective transit (up to 2x).
  -- Easier questions answered correctly → lower effective transit (down to 0.5x).
  IF correct_answer THEN
    v_p_transit := p_transit_base * GREATEST(0.5, LEAST(2.0, 1.0 + (1.0 - v_p_irt)));
  ELSE
    -- Easier questions answered incorrectly → stronger downward signal.
    v_p_transit := p_transit_base * GREATEST(0.1, LEAST(1.0, v_p_irt));
  END IF;

  -- Bayesian update step.
  IF correct_answer THEN
    v_p_posterior := (v_p_mastery * (1.0 - p_slip))
                   / (v_p_mastery * (1.0 - p_slip) + (1.0 - v_p_mastery) * p_guess);
  ELSE
    v_p_posterior := (v_p_mastery * p_slip)
                   / (v_p_mastery * p_slip + (1.0 - v_p_mastery) * (1.0 - p_guess));
  END IF;

  -- Learning transition step with IRT-adjusted rate.
  v_p_new := v_p_posterior + (1.0 - v_p_posterior) * v_p_transit;

  -- Clamp to [0.0, 1.0].
  v_p_new := GREATEST(0.0, LEAST(1.0, v_p_new));

  -- Upsert mastery row.
  INSERT INTO public.kg_mastery (user_id, concept_id, p_mastery, attempts, last_seen)
  VALUES (p_user_id, p_concept, v_p_new, 1, NOW())
  ON CONFLICT (user_id, concept_id) DO UPDATE
    SET p_mastery = v_p_new,
        attempts  = kg_mastery.attempts + 1,
        last_seen     = NOW();
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 20) Seed: kg_concepts — all concepts referenced in courseDiagnostics.ts
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO public.kg_concepts (concept_id, name, domain, course_id) VALUES
  -- Math for Data Science
  ('algebra-linear-equations',    'Линейные уравнения',         'linear-algebra',      'math-for-data-science'),
  ('calculus-derivative',         'Производная',                'analysis-optimization','math-for-data-science'),
  ('linear-algebra-determinant',  'Определитель матрицы',       'linear-algebra',      'math-for-data-science'),
  ('linear-algebra-basis',        'Базис и пространство',       'linear-algebra',      'math-for-data-science'),
  ('statistics-hypothesis-testing','Проверка гипотез',          'statistics',          'math-for-data-science'),
  ('probability-independence',    'Независимость событий',      'probability-theory',  'math-for-data-science'),
  ('linear-algebra-rank',         'Ранг матрицы',               'linear-algebra',      'math-for-data-science'),
  ('probability-distributions',   'Распределения вероятностей', 'probability-theory',  'math-for-data-science'),
  ('optimization-gradient-descent','Градиентный спуск',         'analysis-optimization','math-for-data-science'),
  ('numerical-methods-monte-carlo','Метод Монте-Карло',         'analysis-optimization','math-for-data-science'),
  -- Machine Learning
  ('ml-logistic-regression',  'Логистическая регрессия', 'ml-basics',      'machine-learning'),
  ('ml-feature-scaling',      'Нормализация признаков',  'ml-basics',      'machine-learning'),
  ('ml-overfitting',          'Переобучение',            'ml-basics',      'machine-learning'),
  ('ml-regularization',       'Регуляризация',           'ml-basics',      'machine-learning'),
  ('ml-metrics-roc-auc',      'ROC-AUC метрика',         'ml-evaluation',  'machine-learning'),
  ('ml-validation-leakage',   'Валидация и утечка',      'ml-evaluation',  'machine-learning'),
  ('ml-vanishing-gradient',   'Затухающий градиент',     'ml-deep',        'machine-learning'),
  ('ml-batchnorm',            'Batch Normalization',     'ml-deep',        'machine-learning'),
  ('ml-tree-splitting',       'Критерии разбиения дерева','ml-models',     'machine-learning'),
  ('ml-bias-variance',        'Bias-Variance tradeoff',  'ml-models',      'machine-learning'),
  -- Algorithms
  ('algo-linear-search',   'Линейный поиск',             'algo-core',    'algorithms'),
  ('ds-stack',             'Стек',                       'algo-core',    'algorithms'),
  ('ds-array-access',      'Доступ к массиву',           'algo-core',    'algorithms'),
  ('ds-hash-table',        'Хеш-таблица',                'algo-core',    'algorithms'),
  ('algo-merge-sort',      'Сортировка слиянием',        'algo-sorting', 'algorithms'),
  ('graphs-dijkstra',      'Алгоритм Дейкстры',          'algo-graphs',  'algorithms'),
  ('graphs-bfs-shortest',  'BFS и кратчайший путь',      'algo-graphs',  'algorithms'),
  ('algo-dp',              'Динамическое программирование','algo-dp-adv', 'algorithms'),
  ('ds-dynamic-array',     'Динамический массив',        'algo-dp-adv',  'algorithms'),
  ('ds-rb-tree',           'Красно-чёрное дерево',       'algo-dp-adv',  'algorithms')
ON CONFLICT (concept_id) DO NOTHING;

-- 21) Seed: kg_edges — prerequisite relationships between concepts.
INSERT INTO public.kg_edges (from_concept, to_concept, relation_type) VALUES
  -- Math prerequisites
  ('algebra-linear-equations',   'linear-algebra-determinant',   'prerequisite'),
  ('linear-algebra-determinant', 'linear-algebra-rank',          'prerequisite'),
  ('linear-algebra-rank',        'linear-algebra-basis',         'prerequisite'),
  ('calculus-derivative',        'optimization-gradient-descent','prerequisite'),
  ('probability-independence',   'probability-distributions',    'prerequisite'),
  ('probability-distributions',  'statistics-hypothesis-testing','prerequisite'),
  ('statistics-hypothesis-testing','numerical-methods-monte-carlo','prerequisite'),
  -- ML prerequisites
  ('ml-logistic-regression',   'ml-regularization',     'prerequisite'),
  ('ml-overfitting',           'ml-regularization',     'prerequisite'),
  ('ml-logistic-regression',   'ml-metrics-roc-auc',    'prerequisite'),
  ('ml-metrics-roc-auc',       'ml-validation-leakage', 'prerequisite'),
  ('ml-vanishing-gradient',    'ml-batchnorm',          'prerequisite'),
  ('ml-overfitting',           'ml-tree-splitting',     'prerequisite'),
  ('ml-regularization',        'ml-bias-variance',      'prerequisite'),
  ('ml-tree-splitting',        'ml-bias-variance',      'prerequisite'),
  -- Algorithms prerequisites
  ('ds-array-access',    'ds-dynamic-array',     'prerequisite'),
  ('ds-array-access',    'ds-stack',             'prerequisite'),
  ('ds-stack',           'ds-hash-table',        'prerequisite'),
  ('algo-linear-search', 'algo-merge-sort',      'prerequisite'),
  ('ds-hash-table',      'graphs-dijkstra',      'prerequisite'),
  ('ds-stack',           'graphs-bfs-shortest',  'prerequisite'),
  ('algo-merge-sort',    'algo-dp',              'prerequisite'),
  ('ds-dynamic-array',   'ds-rb-tree',           'prerequisite')
ON CONFLICT (from_concept, to_concept, relation_type) DO NOTHING;

-- 22) Seed: kg_item_params — IRT parameters derived from question difficulty labels.
--     basic → b=-1.0, intermediate → b=0.0, advanced → b=1.0
--     a=1.0 (discrimination), c=0.25 (4 choices → guessing)
INSERT INTO public.kg_item_params (item_id, a, b, c) VALUES
  -- Math basic
  ('math-1',  1.0, -1.0, 0.25), ('math-2',  1.0, -1.0, 0.25), ('math-3',  1.0, -1.0, 0.25),
  ('math-11', 1.0, -1.0, 0.25), ('math-12', 1.0, -1.0, 0.25), ('math-13', 1.0, -1.0, 0.25),
  -- Math intermediate
  ('math-4',  1.0,  0.0, 0.25), ('math-5',  1.0,  0.0, 0.25), ('math-6',  1.0,  0.0, 0.25),
  ('math-7',  1.0,  0.0, 0.25), ('math-14', 1.0,  0.0, 0.25), ('math-15', 1.0,  0.0, 0.25),
  ('math-16', 1.0,  0.0, 0.25),
  -- Math advanced
  ('math-8',  1.0,  1.0, 0.25), ('math-9',  1.0,  1.0, 0.25), ('math-10', 1.0,  1.0, 0.25),
  ('math-17', 1.0,  1.0, 0.25), ('math-18', 1.0,  1.0, 0.25),
  -- ML basic
  ('ml-1', 1.0, -1.0, 0.25), ('ml-2', 1.0, -1.0, 0.25), ('ml-3', 1.0, -1.0, 0.25),
  -- ML intermediate
  ('ml-4', 1.0,  0.0, 0.25), ('ml-5', 1.0,  0.0, 0.25), ('ml-6', 1.0,  0.0, 0.25),
  ('ml-7', 1.0,  0.0, 0.25),
  -- ML advanced
  ('ml-8', 1.0,  1.0, 0.25), ('ml-9', 1.0,  1.0, 0.25), ('ml-10', 1.0, 1.0, 0.25),
  -- Algorithms basic
  ('algo-1', 1.0, -1.0, 0.25), ('algo-2', 1.0, -1.0, 0.25), ('algo-3', 1.0, -1.0, 0.25),
  -- Algorithms intermediate
  ('algo-4', 1.0,  0.0, 0.25), ('algo-5', 1.0,  0.0, 0.25), ('algo-6', 1.0,  0.0, 0.25),
  ('algo-7', 1.0,  0.0, 0.25),
  -- Algorithms advanced
  ('algo-8', 1.0,  1.0, 0.25), ('algo-9', 1.0,  1.0, 0.25), ('algo-10', 1.0, 1.0, 0.25)
ON CONFLICT (item_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 23) Spaced repetition schedule (SM-2 algorithm).
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.kg_reviews (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  concept_id      TEXT NOT NULL REFERENCES public.kg_concepts(concept_id) ON DELETE CASCADE,
  next_review_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interval_days   INT   NOT NULL DEFAULT 1,
  ease_factor     FLOAT NOT NULL DEFAULT 2.5,
  repetitions     INT   NOT NULL DEFAULT 0,
  last_quality    INT,  -- SM-2 quality score 0-5 from last review
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT kg_reviews_ease_factor_range CHECK (ease_factor >= 1.3),
  CONSTRAINT kg_reviews_user_concept_unique UNIQUE (user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_kg_reviews_user_due
  ON public.kg_reviews (user_id, next_review_at);

ALTER TABLE public.kg_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kg_reviews' AND policyname = 'Users manage own reviews'
  ) THEN
    CREATE POLICY "Users manage own reviews"
      ON public.kg_reviews FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- 24) RPC: schedule_review — SM-2 algorithm to schedule next concept review.
--     quality: 5=perfect, 4=correct, 3=correct with difficulty,
--              2=incorrect but easy, 1=incorrect, 0=blackout
--     SM-2 reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
CREATE OR REPLACE FUNCTION public.schedule_review(
  p_user_id    UUID,
  p_concept_id TEXT,
  p_quality    INT  -- 0-5
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reps         INT;
  v_ease         FLOAT;
  v_interval     INT;
  v_new_interval INT;
  v_new_ease     FLOAT;
BEGIN
  -- Load current SM-2 state or initialise defaults.
  SELECT repetitions, ease_factor, interval_days
    INTO v_reps, v_ease, v_interval
  FROM public.kg_reviews
  WHERE user_id = p_user_id AND concept_id = p_concept_id;

  IF NOT FOUND THEN
    v_reps     := 0;
    v_ease     := 2.5;
    v_interval := 1;
  END IF;

  -- SM-2 update.
  IF p_quality >= 3 THEN
    -- Correct response
    CASE v_reps
      WHEN 0 THEN v_new_interval := 1;
      WHEN 1 THEN v_new_interval := 6;
      ELSE        v_new_interval := ROUND(v_interval * v_ease);
    END CASE;
    v_reps := v_reps + 1;
  ELSE
    -- Incorrect response — reset
    v_new_interval := 1;
    v_reps         := 0;
  END IF;

  -- Update ease factor (clamped at 1.3).
  v_new_ease := GREATEST(
    1.3,
    v_ease + 0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02)
  );

  INSERT INTO public.kg_reviews
    (user_id, concept_id, next_review_at, interval_days, ease_factor, repetitions, last_quality, updated_at)
  VALUES
    (p_user_id, p_concept_id,
     NOW() + (v_new_interval || ' days')::INTERVAL,
     v_new_interval, v_new_ease, v_reps, p_quality, NOW())
  ON CONFLICT (user_id, concept_id) DO UPDATE
    SET next_review_at = NOW() + (v_new_interval || ' days')::INTERVAL,
        interval_days  = v_new_interval,
        ease_factor    = v_new_ease,
        repetitions    = v_reps,
        last_quality   = p_quality,
        updated_at     = NOW();
END;
$$;

-- 25) RPC: get_due_reviews — returns concepts due for review today.
CREATE OR REPLACE FUNCTION public.get_due_reviews(p_user_id UUID)
RETURNS TABLE (
  concept_id     TEXT,
  concept_name   TEXT,
  domain         TEXT,
  course_id      TEXT,
  next_review_at TIMESTAMPTZ,
  interval_days  INT,
  ease_factor    FLOAT,
  p_mastery      FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    kc.concept_id,
    kc.name        AS concept_name,
    kc.domain,
    kc.course_id,
    kr.next_review_at,
    kr.interval_days,
    kr.ease_factor,
    COALESCE(km.p_mastery, 0.2) AS p_mastery
  FROM public.kg_reviews kr
  JOIN public.kg_concepts kc ON kc.concept_id = kr.concept_id
  LEFT JOIN public.kg_mastery km
    ON km.user_id = kr.user_id AND km.concept_id = kr.concept_id
  WHERE kr.user_id = p_user_id
    AND kr.next_review_at <= NOW()
  ORDER BY kr.next_review_at ASC;
$$;

-- 26) Skill decay: scheduled via pg_cron (run after enabling pg_cron extension).
--     Decays p_mastery by 8% for concepts not seen in 14+ days, floor 0.1.
--     To activate: SELECT cron.schedule('skill-decay','0 3 * * *', $$ ... $$);
--     Defined as a regular function so it can be called manually too.
CREATE OR REPLACE FUNCTION public.apply_skill_decay()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.kg_mastery
  SET p_mastery = GREATEST(p_mastery * 0.92, 0.1),
      last_seen = last_seen  -- preserve original last_seen; decay doesn't count as activity
  WHERE last_seen < NOW() - INTERVAL '14 days'
    AND p_mastery > 0.1;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- To enable daily skill decay via pg_cron (run once after enabling extension):
-- SELECT cron.schedule('skill-decay', '0 3 * * *',
--   'SELECT public.apply_skill_decay()');

-- 27) Update kg_mastery_summary VIEW to include fading status (already handled by case in view,
--     but also update update_bkt_mastery to call schedule_review after each correct answer).
-- This trigger ensures spaced repetition schedule is updated whenever mastery changes.
CREATE OR REPLACE FUNCTION public.auto_schedule_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_quality INT;
BEGIN
  -- Map p_mastery change to SM-2 quality score
  IF NEW.p_mastery >= 0.75 THEN
    v_quality := 5;
  ELSIF NEW.p_mastery >= 0.60 THEN
    v_quality := 4;
  ELSIF NEW.p_mastery >= 0.45 THEN
    v_quality := 3;
  ELSIF NEW.p_mastery >= 0.30 THEN
    v_quality := 2;
  ELSE
    v_quality := 1;
  END IF;

  PERFORM public.schedule_review(NEW.user_id, NEW.concept_id, v_quality);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kg_mastery_schedule_review ON public.kg_mastery;
CREATE TRIGGER trg_kg_mastery_schedule_review
AFTER INSERT OR UPDATE OF p_mastery ON public.kg_mastery
FOR EACH ROW
EXECUTE FUNCTION public.auto_schedule_review();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 28) Churn / engagement analytics.
-- ═══════════════════════════════════════════════════════════════════════════════

-- VIEW: user_engagement_features — feature vector for churn detection.
CREATE OR REPLACE VIEW public.user_engagement_features
WITH (security_invoker = true)
AS
SELECT
  u.user_id,
  COUNT(DISTINCT DATE(la."timestamp"))                    AS active_days,
  COUNT(la.id)                                           AS total_interactions,
  MAX(la."timestamp")                                    AS last_active_at,
  COALESCE(
    EXTRACT(EPOCH FROM (NOW() - MAX(la."timestamp"))) / 86400,
    999
  )::INT                                                 AS days_inactive,
  COALESCE(AVG(csl.mastery_score), 0)                   AS avg_mastery_score,
  COUNT(DISTINCT csl.course_id)                         AS courses_started,
  COALESCE(MAX(km_agg.avg_p), 0)                        AS avg_kg_mastery
FROM public.user_profiles u
LEFT JOIN public.learning_activities la
  ON la.user_id = u.user_id
LEFT JOIN public.course_skill_levels csl
  ON csl.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, AVG(p_mastery) AS avg_p
  FROM public.kg_mastery
  GROUP BY user_id
) km_agg ON km_agg.user_id = u.user_id
GROUP BY u.user_id;

-- VIEW: at_risk_users — heuristic churn risk flag (no ML needed until data accumulates).
-- At-risk if: inactive 5+ days AND < 10 interactions OR inactive 10+ days (any).
CREATE OR REPLACE VIEW public.at_risk_users
WITH (security_invoker = true)
AS
SELECT
  user_id,
  active_days,
  total_interactions,
  days_inactive,
  avg_mastery_score,
  CASE
    WHEN days_inactive >= 10                                      THEN 'high'
    WHEN days_inactive >= 5 AND total_interactions < 10           THEN 'medium'
    WHEN days_inactive >= 3 AND avg_mastery_score < 30            THEN 'medium'
    ELSE 'low'
  END AS churn_risk
FROM public.user_engagement_features
WHERE days_inactive >= 3;

-- VIEW: cohort_funnel — conversion funnel for Reports page.
CREATE OR REPLACE VIEW public.cohort_funnel
WITH (security_invoker = true)
AS
SELECT
  COUNT(DISTINCT u.user_id)                                              AS registered,
  COUNT(DISTINCT csl.user_id)                                           AS completed_diagnostic,
  COUNT(DISTINCT CASE WHEN la_agg.interactions >= 5 THEN u.user_id END) AS active_learners,
  COUNT(DISTINCT CASE WHEN km_agg.mastered_count >= 3 THEN u.user_id END) AS mastered_3_concepts
FROM public.user_profiles u
LEFT JOIN public.course_skill_levels csl
  ON csl.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS interactions
  FROM public.learning_activities
  GROUP BY user_id
) la_agg ON la_agg.user_id = u.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) FILTER (WHERE p_mastery >= 0.75) AS mastered_count
  FROM public.kg_mastery
  GROUP BY user_id
) km_agg ON km_agg.user_id = u.user_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 29) Performance: replace IVFFLAT with HNSW for rag_chunks embeddings.
--     HNSW gives ~10x query speedup at 10k+ chunks with slightly higher memory.
-- ═══════════════════════════════════════════════════════════════════════════════
DROP INDEX IF EXISTS idx_rag_chunks_embedding_ivfflat;
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw
  ON public.rag_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 30) Trigger function for rag_chunks inserts — auto-assigns chunk_index.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rag_chunks_insert_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.chunk_index IS NULL THEN
    SELECT COALESCE(MAX(chunk_index), -1) + 1
      INTO NEW.chunk_index
      FROM public.rag_chunks
     WHERE source_id = NEW.source_id;
  END IF;
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rag_chunks_insert ON public.rag_chunks;
CREATE TRIGGER trg_rag_chunks_insert
BEFORE INSERT ON public.rag_chunks
FOR EACH ROW
EXECUTE FUNCTION public.rag_chunks_insert_fn();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 31) RPC: match_chunks_with_embeddings — like match_chunks but returns the
--     raw embedding vector so callers can do re-ranking or cluster analysis.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.match_chunks_with_embeddings(
  query_embedding      VECTOR(1024),
  similarity_threshold FLOAT,
  match_count          INT,
  topic_filter         TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  topic_tags   TEXT[],
  score        FLOAT,
  embedding    VECTOR(1024)
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id::text AS chunk_id,
    rc.source_id,
    rc.source_title,
    rc.chunk_text,
    rc.page_hint,
    rc.topic_tags,
    1 - (rc.embedding <=> query_embedding) AS score,
    rc.embedding
  FROM public.rag_chunks rc
  WHERE rc.embedding IS NOT NULL
    AND 1 - (rc.embedding <=> query_embedding) >= similarity_threshold
    AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 31a) RPC: hybrid_search_chunks — Reciprocal Rank Fusion of dense + FTS.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding VECTOR(1024),
  query_text      TEXT,
  match_count     INT,
  topic_filter    TEXT[] DEFAULT NULL,
  rrf_k           INT DEFAULT 60
)
RETURNS TABLE (
  chunk_id     TEXT,
  source_id    TEXT,
  source_title TEXT,
  chunk_text   TEXT,
  page_hint    TEXT,
  topic_tags   TEXT[],
  dense_score  FLOAT,
  lex_score    FLOAT,
  rrf_score    FLOAT,
  embedding    VECTOR(1024)
)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  pool_size INT := GREATEST(match_count * 4, 16);
  ts_query  tsquery := plainto_tsquery('russian', COALESCE(query_text, ''));
BEGIN
  RETURN QUERY
  WITH dense AS (
    SELECT
      rc.id,
      1 - (rc.embedding <=> query_embedding) AS score,
      ROW_NUMBER() OVER (ORDER BY rc.embedding <=> query_embedding) AS rnk
    FROM public.rag_chunks rc
    WHERE rc.embedding IS NOT NULL
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
    ORDER BY rc.embedding <=> query_embedding
    LIMIT pool_size
  ),
  lex AS (
    SELECT
      rc.id,
      ts_rank_cd(rc.tsv, ts_query) AS score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(rc.tsv, ts_query) DESC) AS rnk
    FROM public.rag_chunks rc
    WHERE ts_query <> ''::tsquery
      AND rc.tsv @@ ts_query
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
    ORDER BY ts_rank_cd(rc.tsv, ts_query) DESC
    LIMIT pool_size
  ),
  fused AS (
    SELECT
      COALESCE(d.id, l.id) AS id,
      COALESCE(d.score, 0)::float AS dense_score,
      COALESCE(l.score, 0)::float AS lex_score,
      (CASE WHEN d.rnk IS NULL THEN 0 ELSE 1.0 / (rrf_k + d.rnk) END
       + CASE WHEN l.rnk IS NULL THEN 0 ELSE 1.0 / (rrf_k + l.rnk) END
      )::float AS rrf_score
    FROM dense d
    FULL OUTER JOIN lex l ON d.id = l.id
  )
  SELECT
    rc.id::text     AS chunk_id,
    rc.source_id,
    rc.source_title,
    rc.chunk_text,
    rc.page_hint,
    rc.topic_tags,
    f.dense_score,
    f.lex_score,
    f.rrf_score,
    rc.embedding
  FROM fused f
  JOIN public.rag_chunks rc ON rc.id = f.id
  ORDER BY f.rrf_score DESC
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 32) Mentor sessions — conversation sessions between a user and the AI mentor.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  topic         TEXT,
  page_type     VARCHAR(100),
  message_count INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_user_started
  ON public.mentor_sessions (user_id, started_at DESC);

ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_sessions' AND policyname = 'Users manage own mentor sessions'
  ) THEN
    CREATE POLICY "Users manage own mentor sessions"
      ON public.mentor_sessions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- 33) Mentor messages — individual turns within a mentor session.
CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  ai_role      VARCHAR(50),
  used_fallback BOOLEAN NOT NULL DEFAULT FALSE,
  rag_sources  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_session
  ON public.mentor_messages (session_id, created_at ASC);

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_messages' AND policyname = 'Users manage own mentor messages'
  ) THEN
    CREATE POLICY "Users manage own mentor messages"
      ON public.mentor_messages FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- 34) RPC: increment_session_message_count — atomic counter bump for mentor sessions.
CREATE OR REPLACE FUNCTION public.increment_session_message_count(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.mentor_sessions
     SET message_count = message_count + 1
   WHERE id = p_session_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 35) VIEW: rag_quality_dashboard — daily RAG retrieval quality metrics.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.rag_quality_dashboard
WITH (security_invoker = true)
AS
SELECT
  DATE_TRUNC('day', rm.created_at)::DATE              AS day,
  COUNT(*)                                             AS total_requests,
  ROUND(AVG(rm.precision_at_k)::NUMERIC, 4)           AS avg_precision_at_k,
  ROUND(MIN(rm.precision_at_k)::NUMERIC, 4)           AS min_precision_at_k,
  ROUND(MAX(rm.precision_at_k)::NUMERIC, 4)           AS max_precision_at_k,
  ROUND(
    (AVG(rm.used_chunks::FLOAT / NULLIF(rm.top_k, 0)))::NUMERIC, 4
  )                                                    AS avg_chunk_utilization,
  ROUND(AVG(rm.top_k)::NUMERIC, 1)                    AS avg_top_k
FROM public.rag_metrics rm
GROUP BY DATE_TRUNC('day', rm.created_at)
ORDER BY day DESC;
