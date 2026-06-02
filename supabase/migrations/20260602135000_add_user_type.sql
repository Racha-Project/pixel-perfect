-- Add user_type column to profiles for trainer/client separation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'trainer'));

-- Add index for user_type queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Optional: Add trainer_profile column to store trainer-specific data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified_trainer BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trainer_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trainer_specialties TEXT[];
