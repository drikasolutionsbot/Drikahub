import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users, Store, CreditCard, DollarSign, TrendingUp, ShoppingCart, Crown, Ticket, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const PLAN_COLORS: Record<string, string> = {
  free: "hsl(var(--muted-foreground))",
  starter: "#3b82f6",
  pro: "#10b981",
  business: "#f59e0b",
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    tenants: 0,
    orders: 0,
    ordersThisMonth: 0,
    ordersLastMonth: 0,
    revenue: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    products: 0,
    tickets: 0,
    paidOrders: 0,
  });
  const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [revenueChart, setRevenueChart] = useState<{ date: string; revenue: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topTenants, setTopTenants] = useState<{ name: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const lastMonthStart = startOfMonth(subDays(startOfMonth(now), 1)).toISOString();

      const [tenantsRes, ordersRes, productsRes, ticketsRes, recentRes] = await Promise.all([
        supabase.from("tenants").select("id, name, plan"),
        supabase.from("orders").select("total_cents, status, created_at, tenant_id"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, product_name, discord_username, total_cents, status, created_at").order("created_at", { ascending: false }).limit(8),
      ]);

      const tenants = tenantsRes.data || [];
      const orders = ordersRes.data || [];

      // Plan distribution
      const planCounts: Record<string, number> = {};
      tenants.forEach((t) => {
        const p = t.plan || "free";
        planCounts[p] = (planCounts[p] || 0) + 1;
      });
      setPlanDistribution(
        Object.entries(planCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: PLAN_COLORS[name] || PLAN_COLORS.free,
        }))
      );

      // Revenue chart (last 30 days)
      const last30 = subDays(now, 30);
      const dailyMap: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = format(subDays(now, 29 - i), "dd/MM");
        dailyMap[d] = 0;
      }
      orders.forEach((o) => {
        if ((o.status === "paid" || o.status === "delivered") && new Date(o.created_at) >= last30) {
          const d = format(new Date(o.created_at), "dd/MM");
          if (dailyMap[d] !== undefined) dailyMap[d] += o.total_cents / 100;
        }
      });
      setRevenueChart(Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue })));

      // Top tenants by revenue
      const tenantRevMap: Record<string, { name: string; revenue: number; orders: number }> = {};
      orders.forEach((o) => {
        if (o.status === "paid" || o.status === "delivered") {
          if (!tenantRevMap[o.tenant_id]) {
            const t = tenants.find((t) => t.id === o.tenant_id);
            tenantRevMap[o.tenant_id] = { name: t?.name || "Desconhecido", revenue: 0, orders: 0 };
          }
          tenantRevMap[o.tenant_id].revenue += o.total_cents;
          tenantRevMap[o.tenant_id].orders += 1;
        }
      });
      setTopTenants(
        Object.values(tenantRevMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );

      // Monthly stats
      const thisMonthOrders = orders.filter((o) => o.created_at >= monthStart);
      const lastMonthOrders = orders.filter((o) => o.created_at >= lastMonthStart && o.created_at < monthStart);
      const paidStatuses = ["paid", "delivered"];
      const revenueThisMonth = thisMonthOrders.filter((o) => paidStatuses.includes(o.status)).reduce((s, o) => s + o.total_cents, 0);
      const revenueLastMonth = lastMonthOrders.filter((o) => paidStatuses.includes(o.status)).reduce((s, o) => s + o.total_cents, 0);

      setStats({
        tenants: tenants.length,
        orders: orders.length,
        ordersThisMonth: thisMonthOrders.length,
        ordersLastMonth: lastMonthOrders.length,
        revenue: orders.filter((o) => paidStatuses.includes(o.status)).reduce((s, o) => s + o.total_cents, 0),
        revenueThisMonth,
        revenueLastMonth,
        products: productsRes.count || 0,
        tickets: ticketsRes.count || 0,
        paidOrders: orders.filter((o) => paidStatuses.includes(o.status)).length,
      });

      setRecentOrders(recentRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const revenueGrowth = stats.revenueLastMonth > 0
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth * 100).toFixed(1)
    : stats.revenueThisMonth > 0 ? "100" : "0";
  const ordersGrowth = stats.ordersLastMonth > 0
    ? ((stats.ordersThisMonth - stats.ordersLastMonth) / stats.ordersLastMonth * 100).toFixed(1)
    : stats.ordersThisMonth > 0 ? "100" : "0";

  const cards = [
    { title: "Total de Clientes", value: stats.tenants, icon: Users, color: "text-primary", change: null },
    { title: "Pedidos do Mês", value: stats.ordersThisMonth, icon: ShoppingCart, color: "text-blue-400", change: `${Number(ordersGrowth) >= 0 ? "+" : ""}${ordersGrowth}%` },
    { title: "Receita do Mês", value: `R$ ${(stats.revenueThisMonth / 100).toFixed(2)}`, icon: DollarSign, color: "text-emerald-400", change: `${Number(revenueGrowth) >= 0 ? "+" : ""}${revenueGrowth}%` },
    { title: "Receita Total", value: `R$ ${(stats.revenue / 100).toFixed(2)}`, icon: TrendingUp, color: "text-amber-400", change: `${stats.paidOrders} pagos` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "..." : card.value}
              </p>
              {card.change && !loading && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  card.change.startsWith("+") ? "text-emerald-500" : card.change.startsWith("-") ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {card.change.startsWith("+") ? <ArrowUpRight className="h-3 w-3" /> : card.change.startsWith("-") ? <ArrowDownRight className="h-3 w-3" /> : null}
                  {card.change} vs mês anterior
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Receita (últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={60} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#adminRevGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planDistribution} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={65} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Clientes">
                    {planDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum pedido.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{o.product_name}</p>
                      <p className="text-xs text-muted-foreground">{o.discord_username || "Usuário"}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={o.status} />
                      <span className="text-sm font-mono font-medium">R$ {(o.total_cents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tenants */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Top Clientes por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTenants.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem dados.</p>
            ) : (
              <div className="space-y-3">
                {topTenants.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-amber-500/20 text-amber-500" : i === 1 ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.orders} pedidos pagos</p>
                    </div>
                    <span className="text-sm font-mono font-semibold text-emerald-500">
                      R$ {(t.revenue / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extra Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Store className="h-3.5 w-3.5" /> Produtos
          </div>
          <p className="text-xl font-bold">{loading ? "..." : stats.products}</p>
        </Card>
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CreditCard className="h-3.5 w-3.5" /> Total de Pedidos
          </div>
          <p className="text-xl font-bold">{loading ? "..." : stats.orders}</p>
        </Card>
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Ticket className="h-3.5 w-3.5" /> Tickets
          </div>
          <p className="text-xl font-bold">{loading ? "..." : stats.tickets}</p>
        </Card>
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="h-3.5 w-3.5" /> Ticket Médio
          </div>
          <p className="text-xl font-bold">
            {loading ? "..." : stats.paidOrders > 0 ? `R$ ${(stats.revenue / stats.paidOrders / 100).toFixed(2)}` : "R$ 0,00"}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
