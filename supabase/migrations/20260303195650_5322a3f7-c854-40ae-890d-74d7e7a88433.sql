
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Members can view payment providers" ON public.payment_providers;
DROP POLICY IF EXISTS "Owners can manage payment providers" ON public.payment_providers;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Members can view payment providers"
  ON public.payment_providers
  FOR SELECT
  TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Owners can manage payment providers"
  ON public.payment_providers
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), tenant_id, 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), tenant_id, 'owner'::app_role));
