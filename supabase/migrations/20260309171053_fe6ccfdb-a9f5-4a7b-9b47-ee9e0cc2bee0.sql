
-- Bot Commands table
CREATE TABLE public.bot_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Custom',
  enabled boolean NOT NULL DEFAULT true,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE public.bot_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot commands" ON public.bot_commands
  FOR ALL TO public
  USING (has_role(auth.uid(), tenant_id, 'owner'::app_role) OR has_role(auth.uid(), tenant_id, 'admin'::app_role));

CREATE POLICY "Members can view bot commands" ON public.bot_commands
  FOR SELECT TO public
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Bot Modules table
CREATE TABLE public.bot_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  custom boolean NOT NULL DEFAULT false,
  icon_key text NOT NULL DEFAULT 'puzzle',
  color text NOT NULL DEFAULT 'text-primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, module_key)
);

ALTER TABLE public.bot_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot modules" ON public.bot_modules
  FOR ALL TO public
  USING (has_role(auth.uid(), tenant_id, 'owner'::app_role) OR has_role(auth.uid(), tenant_id, 'admin'::app_role));

CREATE POLICY "Members can view bot modules" ON public.bot_modules
  FOR SELECT TO public
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_modules;
