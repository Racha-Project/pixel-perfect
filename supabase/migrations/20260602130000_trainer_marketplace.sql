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
