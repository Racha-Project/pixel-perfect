-- Enhanced matching fields for users and trainers

-- Add new fields to profiles table (user side)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS experience_level text CHECK (experience_level IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS preferred_style text CHECK (preferred_style IN ('strict','supportive','analytical','flexible')) DEFAULT 'supportive',
ADD COLUMN IF NOT EXISTS health_conditions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS training_modality text[] DEFAULT '{online}',
ADD COLUMN IF NOT EXISTS sessions_per_week int DEFAULT 3,
ADD COLUMN IF NOT EXISTS budget_max int DEFAULT 1000,
ADD COLUMN IF NOT EXISTS preferred_gender text CHECK (preferred_gender IN ('male','female','other','any')) DEFAULT 'any',
ADD COLUMN IF NOT EXISTS preferred_days text[] DEFAULT '{monday,wednesday,friday}',
ADD COLUMN IF NOT EXISTS preferred_time text[] DEFAULT '{morning,evening}';

-- Add new fields to trainers table
ALTER TABLE trainers
ADD COLUMN IF NOT EXISTS target_client_level text[] DEFAULT '{beginner,intermediate}',
ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{monday,tuesday,wednesday,thursday,friday,saturday,sunday}',
ADD COLUMN IF NOT EXISTS available_time_slots jsonb DEFAULT '{"morning":["09:00","10:00","11:00"],"afternoon":["13:00","14:00","15:00"],"evening":["18:00","19:00","20:00"]}',
ADD COLUMN IF NOT EXISTS response_rate int DEFAULT 90,
ADD COLUMN IF NOT EXISTS profile_completeness numeric(3,2) DEFAULT 0.85,
ADD COLUMN IF NOT EXISTS max_distance_km int DEFAULT 50;

-- Add created_at for cold start calculation
ALTER TABLE trainers
ADD COLUMN IF NOT EXISTS first_active_date timestamptz DEFAULT now();

-- Update existing trainers with default values
UPDATE trainers 
SET target_client_level = ARRAY['beginner','intermediate'],
    available_days = ARRAY['monday','tuesday','wednesday','thursday','friday'],
    available_time_slots = '{"morning":["09:00","10:00","11:00"],"afternoon":["13:00","14:00","15:00"],"evening":["18:00","19:00","20:00"]}',
    response_rate = 90,
    profile_completeness = 0.85,
    max_distance_km = 50
WHERE target_client_level IS NULL;

-- Update existing profiles with default values
UPDATE profiles
SET experience_level = 'beginner',
    preferred_style = 'supportive',
    training_modality = ARRAY['online'],
    sessions_per_week = 3,
    budget_max = 1000,
    preferred_gender = 'any',
    preferred_days = ARRAY['monday','wednesday','friday'],
    preferred_time = ARRAY['morning','evening']
WHERE experience_level IS NULL;
