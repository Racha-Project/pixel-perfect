
-- ============ ENUMS ============
CREATE TYPE public.fitness_goal AS ENUM ('weight_loss','muscle_gain','recomposition','general_fitness');
CREATE TYPE public.gender_type  AS ENUM ('male','female','other');
CREATE TYPE public.activity_level AS ENUM ('sedentary','light','moderate','active','very_active');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  age INTEGER,
  gender public.gender_type,
  goal public.fitness_goal,
  activity_level public.activity_level DEFAULT 'moderate',
  language TEXT DEFAULT 'th',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============ WORKOUT PLANS ============
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal public.fitness_goal,
  days_per_week INTEGER,
  plan JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT ALL ON public.workout_plans TO service_role;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.workout_plans FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ WORKOUT LOGS ============
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  reps INTEGER,
  sets INTEGER,
  duration_sec INTEGER,
  calories_burned NUMERIC,
  notes TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT ALL ON public.workout_logs TO service_role;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workout logs" ON public.workout_logs FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ NUTRITION LOGS ============
CREATE TABLE public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC DEFAULT 0,
  carbs_g NUMERIC DEFAULT 0,
  fat_g NUMERIC DEFAULT 0,
  water_ml NUMERIC DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO authenticated;
GRANT ALL ON public.nutrition_logs TO service_role;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own nutrition" ON public.nutrition_logs FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ HEALTH SCORES ============
CREATE TABLE public.health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score NUMERIC NOT NULL,
  details JSONB,
  UNIQUE(user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_scores TO authenticated;
GRANT ALL ON public.health_scores TO service_role;
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scores" ON public.health_scores FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ DIGITAL TWIN PREDICTIONS ============
CREATE TABLE public.digital_twin_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_for DATE NOT NULL,
  predicted_weight_kg NUMERIC,
  predicted_body_fat NUMERIC,
  predicted_muscle_kg NUMERIC,
  predicted_fitness_score NUMERIC,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_twin_predictions TO authenticated;
GRANT ALL ON public.digital_twin_predictions TO service_role;
ALTER TABLE public.digital_twin_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own twin" ON public.digital_twin_predictions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON public.achievements FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ CHAT HISTORY ============
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT ALL ON public.chat_history TO service_role;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat" ON public.chat_history FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ AUTO-CREATE PROFILE ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
