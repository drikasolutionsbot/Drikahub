ALTER TABLE public.landing_config 
  ADD COLUMN IF NOT EXISTS auto_activate_plan boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS suspend_on_expire boolean NOT NULL DEFAULT true;