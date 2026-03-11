export interface Affiliate {
  id: string;
  name: string;
  code: string;
  commission_percent: number;
  total_sales: number;
  total_revenue_cents: number;
  active: boolean;
  created_at: string;
}

export interface AffiliateOrder {
  id: string;
  order_number: number;
  product_name: string;
  total_cents: number;
  status: string;
  discord_username: string | null;
  created_at: string;
  affiliate_id?: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  amount_cents: number;
  status: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
}

export const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export const statusLabels: Record<string, string> = {
  pending_payment: "Pendente",
  paid: "Pago",
  delivering: "Entregando",
  delivered: "Entregue",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

export const payoutStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  canceled: "Cancelado",
};
