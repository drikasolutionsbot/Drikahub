ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS owner_discord_username text DEFAULT NULL;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS owner_discord_id text DEFAULT NULL;