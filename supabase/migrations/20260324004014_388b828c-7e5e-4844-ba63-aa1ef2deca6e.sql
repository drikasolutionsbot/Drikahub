CREATE TABLE public.tenant_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  credits_remaining integer NOT NULL DEFAULT 100,
  daily_limit integer NOT NULL DEFAULT 100,
  last_reset_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.tenant_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own credits"
  ON public.tenant_credits FOR SELECT
  TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Members can update own credits"
  ON public.tenant_credits FOR UPDATE
  TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Members can insert own credits"
  ON public.tenant_credits FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Service role full access"
  ON public.tenant_credits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);