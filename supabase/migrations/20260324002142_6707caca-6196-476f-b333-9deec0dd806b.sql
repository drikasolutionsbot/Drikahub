CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'copy',
  user_input text NOT NULL DEFAULT '',
  enhanced_prompt text,
  result_text text,
  result_image_url text,
  credits_used integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own tenant generations"
  ON public.ai_generations FOR SELECT TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Members can insert generations"
  ON public.ai_generations FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(auth.uid(), tenant_id) AND auth.uid() = user_id);

CREATE INDEX idx_ai_generations_tenant ON public.ai_generations(tenant_id, created_at DESC);
CREATE INDEX idx_ai_generations_category ON public.ai_generations(tenant_id, category);