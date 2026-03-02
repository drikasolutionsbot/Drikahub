
-- Add super_admin to enum (standalone statement)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
