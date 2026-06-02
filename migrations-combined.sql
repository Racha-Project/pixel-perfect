-- Combined Migrations for Fitder X
-- Generated: 2026-06-02T10:39:58.728Z
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/zzvfjrvcvajncoympjzy/sql/new


-- ========== 20260602083636_62a537c9-ec1f-41dd-9a6a-7b745ee7a4cf.sql ==========

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


-- ========== 20260602083703_2160bf3a-4f1f-42ed-8aa8-da92b8bcaab3.sql ==========

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;


-- ========== 20260602120000_achievements_streaks_screenings.sql ==========
-- ============ USER STREAKS ============
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own streaks" ON public.user_streaks FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ USER ACHIEVEMENTS ============
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON public.user_achievements FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- ============ HEALTH SCREENINGS ============
CREATE TABLE public.health_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  health_score INTEGER,
  risk_level TEXT,
  ai_summary TEXT,
  recommendations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_screenings TO authenticated;
GRANT ALL ON public.health_screenings TO service_role;
ALTER TABLE public.health_screenings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own screenings" ON public.health_screenings FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);


-- ========== 20260602130000_trainer_marketplace.sql ==========
-- Trainer Marketplace: trainers, reviews, bookings tables

CREATE TABLE IF NOT EXISTS trainers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  bio text DEFAULT '',
  specialties text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  experience_years int DEFAULT 1,
  experience_level text DEFAULT 'intermediate' CHECK (experience_level IN ('beginner','intermediate','advanced','expert')),
  hourly_rate_thb int DEFAULT 500,
  training_modality text[] DEFAULT '{online}',
  training_style text DEFAULT 'supportive' CHECK (training_style IN ('strict','supportive','analytical','flexible')),
  target_levels text[] DEFAULT '{beginner,intermediate}',
  rating numeric(3,2) DEFAULT 0,
  review_count int DEFAULT 0,
  retention_rate int DEFAULT 80,
  gender text DEFAULT 'other',
  location text DEFAULT 'Bangkok',
  avatar_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trainer_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(trainer_id, user_id)
);

CREATE TABLE IF NOT EXISTS trainer_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES trainers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_time text NOT NULL,
  modality text DEFAULT 'online',
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes text DEFAULT '',
  price_thb int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainers_public_read" ON trainers FOR SELECT USING (is_active = true);
CREATE POLICY "reviews_public_read" ON trainer_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_own_insert" ON trainer_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_own" ON trainer_bookings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed: 8 sample trainers (Thai fitness professionals)
INSERT INTO trainers (display_name, bio, specialties, certifications, experience_years, experience_level, hourly_rate_thb, training_modality, training_style, target_levels, rating, review_count, retention_rate, gender, location, is_verified) VALUES
(
  'อาจารย์ พิทักษ์ สุขสมบูรณ์',
  'ผู้เชี่ยวชาญด้าน Strength Training และ Powerlifting มากกว่า 12 ปี เคยเป็นนักกีฬาระดับชาติ ปัจจุบันโค้ชออนไลน์ผ่าน Zoom',
  ARRAY['Strength Training','Powerlifting','Muscle Gain','Body Recomposition'],
  ARRAY['NASM-CPT','CSCS','ACE Strength'],
  12, 'expert', 1200,
  ARRAY['online','gym'],
  'analytical',
  ARRAY['intermediate','advanced'],
  4.92, 87, 94,
  'male', 'Bangkok', true
),
(
  'โค้ชนิตยา วงศ์สุวรรณ',
  'Certified Personal Trainer เชี่ยวชาญ Weight Loss และ HIIT เน้นผลลัพธ์ระยะยาวด้วยแนวทาง Lifestyle Change',
  ARRAY['Weight Loss','HIIT','Fat Loss','Functional Training'],
  ARRAY['ACE-CPT','Precision Nutrition L1'],
  7, 'advanced', 800,
  ARRAY['online','home'],
  'supportive',
  ARRAY['beginner','intermediate'],
  4.85, 124, 91,
  'female', 'Chiang Mai', true
),
(
  'โค้ชเอก มนัสวี',
  'อดีตนักวิ่ง Marathon ระดับชาติ ผันตัวมาเป็น Endurance & Cardio Coach ออกแบบโปรแกรมวิ่ง ไตรกีฬา',
  ARRAY['Endurance','Cardio','Running','Triathlon'],
  ARRAY['ISSA-CPT','Running Coach L2'],
  9, 'expert', 900,
  ARRAY['online','outdoor'],
  'strict',
  ARRAY['intermediate','advanced'],
  4.78, 63, 88,
  'male', 'Bangkok', true
),
(
  'แพทย์หญิง ปาริฉัตร รักษ์กาย',
  'นักกายภาพบำบัดและ Wellness Coach ผู้เชี่ยวชาญด้านการฟื้นฟูและป้องกันการบาดเจ็บ เหมาะสำหรับผู้ฟื้นตัวจากอาการบาดเจ็บ',
  ARRAY['Injury Prevention','Rehabilitation','Yoga','Mobility'],
  ARRAY['Physical Therapist','Yoga Alliance RYT-200'],
  10, 'expert', 1500,
  ARRAY['online','clinic'],
  'flexible',
  ARRAY['beginner','intermediate','advanced'],
  4.97, 45, 97,
  'female', 'Bangkok', true
),
(
  'โค้ชนัท ฟิตแอนด์ฟัน',
  'Personal Trainer หน้าใหม่ไฟแรง เน้น Calisthenics และ Bodyweight Training เหมาะกับมือใหม่ที่ไม่มีอุปกรณ์',
  ARRAY['Calisthenics','Bodyweight','Beginner Fitness','Home Workout'],
  ARRAY['ISSA-CPT'],
  3, 'intermediate', 450,
  ARRAY['online','home'],
  'supportive',
  ARRAY['beginner'],
  4.60, 38, 82,
  'male', 'Nonthaburi', false
),
(
  'โค้ชมายด์ บอดี้บิลเดอร์',
  'นักกีฬา Bodybuilding ระดับ National มากกว่า 15 ปี เชี่ยวชาญด้าน Hypertrophy, Muscle Sculpting และ Contest Prep',
  ARRAY['Bodybuilding','Hypertrophy','Contest Prep','Muscle Gain'],
  ARRAY['IFBB Pro Card','NASM-CPT','Sports Nutrition'],
  15, 'expert', 1800,
  ARRAY['online','gym'],
  'strict',
  ARRAY['intermediate','advanced'],
  4.88, 56, 92,
  'male', 'Bangkok', true
),
(
  'โค้ชกุ๊กกิ๊ก Pilates & Yoga',
  'Certified Pilates Instructor และ Yoga Teacher เชี่ยวชาญ Core Strength, Flexibility และ Mindfulness',
  ARRAY['Pilates','Yoga','Core Strength','Flexibility','Stress Relief'],
  ARRAY['STOTT Pilates','Yoga Alliance RYT-500'],
  8, 'advanced', 700,
  ARRAY['online','studio','home'],
  'flexible',
  ARRAY['beginner','intermediate'],
  4.90, 102, 95,
  'female', 'Phuket', true
),
(
  'โค้ชต่าย CrossFit & Functional',
  'Head Coach ของ CrossFit Box ชื่อดังในกรุงเทพ เชี่ยวชาญ Functional Fitness, Olympic Lifting และ Sport Performance',
  ARRAY['CrossFit','Functional Training','Olympic Lifting','Sport Performance'],
  ARRAY['CrossFit L2','USAW Olympic Lifting','CSCS'],
  11, 'expert', 1100,
  ARRAY['online','gym'],
  'strict',
  ARRAY['intermediate','advanced'],
  4.82, 79, 89,
  'male', 'Bangkok', true
);


-- ========== 20260602135000_add_user_type.sql ==========
-- Add user_type column to profiles for trainer/client separation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'trainer'));

-- Add index for user_type queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Optional: Add trainer_profile column to store trainer-specific data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_trainer BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trainer_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trainer_specialties TEXT[];

