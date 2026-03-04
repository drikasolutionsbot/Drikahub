
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'pending',
  payment_provider text NOT NULL DEFAULT 'pushinpay',
  payment_id text,
  payer_name text,
  payer_email text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage subscription payments"
  ON public.subscription_payments
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Members can view own subscription payments"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (is_tenant_member(auth.uid(), tenant_id));
