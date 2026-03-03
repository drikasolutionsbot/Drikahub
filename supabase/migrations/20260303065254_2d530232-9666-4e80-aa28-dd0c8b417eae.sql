
-- Create enum for hook types
CREATE TYPE public.hook_type AS ENUM ('add_role', 'remove_role', 'send_dm', 'send_channel_message', 'call_webhook');

-- Create product_hooks table
CREATE TABLE public.product_hooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hook_type public.hook_type NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_hooks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage product hooks"
  ON public.product_hooks FOR ALL
  USING (has_role(auth.uid(), tenant_id, 'owner'::app_role) OR has_role(auth.uid(), tenant_id, 'admin'::app_role));

CREATE POLICY "Members can view product hooks"
  ON public.product_hooks FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));
