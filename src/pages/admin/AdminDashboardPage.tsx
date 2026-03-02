import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Key, DollarSign, ShoppingCart } from "lucide-react";

interface Stats {
  totalTenants: number;
  activeTokens: number;
  totalOrders: number;
  totalRevenueCents: number;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeTokens: 0,
    totalOrders: 0,
    totalRevenueCents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [tenantsRes, tokensRes, ordersRes] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.from("access_tokens").select("id", { count: "exact", head: true }).eq("revoked", false),
        supabase.from("orders").select("total_cents"),
      ]);

      const totalRevenueCents = (ordersRes.data || []).reduce(
        (sum, o: any) => sum + (o.total_cents || 0),
        0
      );

      setStats({
        totalTenants: tenantsRes.count || 0,
        activeTokens: tokensRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalRevenueCents,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Tokens Ativos",
      value: stats.activeTokens,
      icon: Key,
      color: "text-emerald-400",
    },
    {
      title: "Total Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-400",
    },
    {
      title: "Receita Total",
      value: `R$ ${(stats.totalRevenueCents / 100).toFixed(2)}`,
      icon: DollarSign,
      color: "text-secondary",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do SaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// need cn import
import { cn } from "@/lib/utils";

export default AdminDashboardPage;
