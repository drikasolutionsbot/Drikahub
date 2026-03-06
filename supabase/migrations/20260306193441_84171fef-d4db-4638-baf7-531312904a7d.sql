
ALTER TABLE public.landing_config 
  ADD COLUMN IF NOT EXISTS efi_client_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS efi_client_secret text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS efi_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS efi_pix_key text DEFAULT NULL;
