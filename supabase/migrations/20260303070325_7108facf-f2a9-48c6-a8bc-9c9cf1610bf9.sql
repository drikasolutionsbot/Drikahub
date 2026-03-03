
-- Create vip_plans table
CREATE TABLE public.vip_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  discord_role_id text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vip plans" ON public.vip_plans FOR ALL
  USING (has_role(auth.uid(), tenant_id, 'owner'::app_role) OR has_role(auth.uid(), tenant_id, 'admin'::app_role));

CREATE POLICY "Members can view vip plans" ON public.vip_plans FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Create vip_members table
CREATE TABLE public.vip_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.vip_plans(id) ON DELETE CASCADE,
  discord_user_id text NOT NULL,
  discord_username text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vip members" ON public.vip_members FOR ALL
  USING (has_role(auth.uid(), tenant_id, 'owner'::app_role) OR has_role(auth.uid(), tenant_id, 'admin'::app_role));

CREATE POLICY "Members can view vip members" ON public.vip_members FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));
