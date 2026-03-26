-- ═══════════════════════════════════════════════════════════
--  SOOPHA LEARN — Setup base de données Supabase
--  Colle ce script dans Supabase > SQL Editor > New Query
--  Exécute une seule fois au démarrage
-- ═══════════════════════════════════════════════════════════

-- 1. TABLE PROFILES — données publiques des utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  country       TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE QCM_RESULTS — réponses aux QCM
CREATE TABLE IF NOT EXISTS public.qcm_results (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id    TEXT NOT NULL,          -- ex: 'j1', 'j2', 'web-hacking'
  slide_index  INTEGER NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  answered_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, slide_index)
);

-- 3. TABLE COURSE_COMPLETIONS — cours terminés avec score final
CREATE TABLE IF NOT EXISTS public.course_completions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id    TEXT NOT NULL,
  score_pct    FLOAT NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) — Chaque user ne voit que ses données
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qcm_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique, écriture seulement par le propriétaire
CREATE POLICY "Profiles visibles par tous" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "User peut modifier son profil" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- QCM Results : chaque user gère les siennes
CREATE POLICY "User gère ses QCM" ON public.qcm_results
  FOR ALL USING (auth.uid() = user_id);

-- Course completions : lecture publique (leaderboard), écriture propriétaire
CREATE POLICY "Completions visibles par tous" ON public.course_completions
  FOR SELECT USING (true);

CREATE POLICY "User gère ses completions" ON public.course_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User peut mettre à jour ses completions" ON public.course_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
--  TRIGGER — Crée automatiquement un profil à l'inscription
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'given_name', 'Apprenant'),
    COALESCE(NEW.raw_user_meta_data->>'country', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
--  VÉRIFICATION — Lance ces requêtes pour vérifier que tout est OK
-- ═══════════════════════════════════════════════════════════

-- SELECT * FROM public.profiles LIMIT 5;
-- SELECT * FROM public.qcm_results LIMIT 5;
-- SELECT * FROM public.course_completions LIMIT 5;
