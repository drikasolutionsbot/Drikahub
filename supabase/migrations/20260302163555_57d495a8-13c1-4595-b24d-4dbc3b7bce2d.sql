
-- RLS policies for access_tokens
CREATE POLICY "Super admins can manage tokens"
ON public.access_tokens FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can view all tenants
CREATE POLICY "Super admins can view all tenants"
ON public.tenants FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins full CRUD on tenants
CREATE POLICY "Super admins can manage all tenants"
ON public.tenants FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can manage all user_roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can view all orders
CREATE POLICY "Super admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));
