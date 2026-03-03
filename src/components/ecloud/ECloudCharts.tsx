import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, ShoppingCart, Ticket, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ChartData {
  date: string;
  label: string;
  vendas: number;
  tickets: number;
  receita: number;
}

interface ECloudChartsProps {
  tenantId: string;
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-md px-4 py-3 shadow-xl">
      <p className="text-[11px] font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-sm font-bold text-foreground">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ECloudCharts = ({ tenantId }: ECloudChartsProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [activeTab, setActiveTab] = useState<"vendas" | "tickets" | "receita">("vendas");

  useEffect(() => {
    fetchChartData();
  }, [tenantId, period]);

  const fetchChartData = async () => {
    setLoading(true);
    const days = period === "7d" ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [ordersRes, ticketsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("created_at, total_cents, status")
        .eq("tenant_id", tenantId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("tickets")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true }),
    ]);

    const map = new Map<string, { vendas: number; tickets: number; receita: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      map.set(key, { vendas: 0, tickets: 0, receita: 0 });
    }

    ordersRes.data?.forEach((o) => {
      const key = o.created_at.split("T")[0];
      const entry = map.get(key);
      if (entry) {
        entry.vendas++;
        if (o.status === "paid" || o.status === "delivered") {
          entry.receita += o.total_cents;
        }
      }
    });

    ticketsRes.data?.forEach((t) => {
      const key = t.created_at.split("T")[0];
      const entry = map.get(key);
      if (entry) entry.tickets++;
    });

    const chartData: ChartData[] = Array.from(map.entries()).map(([date, vals]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      ...vals,
    }));

    setData(chartData);
    setLoading(false);
  };

  const totalVendas = data.reduce((s, d) => s + d.vendas, 0);
  const totalTickets = data.reduce((s, d) => s + d.tickets, 0);
  const totalReceita = data.reduce((s, d) => s + d.receita, 0);

  // Compute change vs previous period
  const { prevVendas, prevTickets, prevReceita } = useMemo(() => {
    const days = period === "7d" ? 7 : 30;
    const half = Math.floor(days / 2);
    const recent = data.slice(-half);
    const older = data.slice(0, half);
    return {
      prevVendas: older.reduce((s, d) => s + d.vendas, 0),
      prevTickets: older.reduce((s, d) => s + d.tickets, 0),
      prevReceita: older.reduce((s, d) => s + d.receita, 0),
    };
  }, [data, period]);

  const recentVendas = data.slice(-Math.floor(data.length / 2)).reduce((s, d) => s + d.vendas, 0);
  const recentTickets = data.slice(-Math.floor(data.length / 2)).reduce((s, d) => s + d.tickets, 0);
  const recentReceita = data.slice(-Math.floor(data.length / 2)).reduce((s, d) => s + d.receita, 0);

  const pctChange = (recent: number, prev: number) => {
    if (prev === 0) return recent > 0 ? 100 : 0;
    return ((recent - prev) / prev) * 100;
  };

  const fmtBRL = (v: number) =>
    (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const summaryCards = [
    {
      key: "vendas" as const,
      label: "Vendas",
      value: totalVendas,
      displayValue: totalVendas.toString(),
      icon: ShoppingCart,
      change: pctChange(recentVendas, prevVendas),
      gradient: "from-primary to-accent",
      color: "hsl(var(--primary))",
    },
    {
      key: "tickets" as const,
      label: "Tickets",
      value: totalTickets,
      displayValue: totalTickets.toString(),
      icon: Ticket,
      change: pctChange(recentTickets, prevTickets),
      gradient: "from-secondary to-[hsl(35,100%,45%)]",
      color: "hsl(var(--secondary))",
    },
    {
      key: "receita" as const,
      label: "Receita",
      value: totalReceita,
      displayValue: fmtBRL(totalReceita),
      icon: DollarSign,
      change: pctChange(recentReceita, prevReceita),
      gradient: "from-emerald-500 to-emerald-600",
      color: "hsl(150, 60%, 45%)",
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  const maxBarValue = Math.max(...data.map((d) => d[activeTab]), 1);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-pink">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Desempenho</h2>
            <p className="text-xs text-muted-foreground">Análise de atividade em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-1">
          {(["7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 dias" : "30 dias"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6">
        {summaryCards.map((card) => {
          const isActive = activeTab === card.key;
          const ChangeIcon = card.change >= 0 ? ArrowUpRight : ArrowDownRight;
          return (
            <button
              key={card.key}
              onClick={() => setActiveTab(card.key)}
              className={`relative rounded-xl p-4 text-left transition-all duration-300 border-2 group ${
                isActive
                  ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
                  : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent" />
              )}
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${card.gradient}`}>
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-display">{card.displayValue}</p>
                </div>
                <div
                  className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-bold ${
                    card.change >= 0
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <ChangeIcon className="h-3 w-3" />
                  {Math.abs(card.change).toFixed(1)}%
                </div>
              </div>

              {/* Sparkline mini preview */}
              <div className="relative mt-3 flex items-end gap-[3px] h-8">
                {data.slice(-10).map((d, i) => {
                  const val = d[card.key];
                  const maxVal = Math.max(...data.slice(-10).map((x) => x[card.key]), 1);
                  const h = Math.max((val / maxVal) * 100, 6);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        backgroundColor: isActive ? card.color : "hsl(var(--muted-foreground) / 0.15)",
                        opacity: isActive ? 0.7 + (i / 10) * 0.3 : 0.5,
                      }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="px-6 pb-6">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <ResponsiveContainer width="100%" height={280}>
            {activeTab === "vendas" ? (
              <BarChart data={data} barCategoryGap="20%">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                <Bar dataKey="vendas" radius={[6, 6, 2, 2]} maxBarSize={40}>
                  {data.map((entry, index) => {
                    const isMax = entry.vendas === maxBarValue && entry.vendas > 0;
                    return (
                      <Cell
                        key={index}
                        fill={isMax ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient
                    id={`gradient-${activeTab}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        activeTab === "tickets"
                          ? "hsl(var(--secondary))"
                          : "hsl(150, 60%, 45%)"
                      }
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        activeTab === "tickets"
                          ? "hsl(var(--secondary))"
                          : "hsl(150, 60%, 45%)"
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={activeTab !== "tickets"}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={activeTab === "receita" ? 60 : 30}
                  tickFormatter={
                    activeTab === "receita"
                      ? (v) => `R$${(v / 100).toFixed(0)}`
                      : undefined
                  }
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={
                        activeTab === "receita" ? (v: number) => fmtBRL(v) : undefined
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey={activeTab}
                  stroke={
                    activeTab === "tickets"
                      ? "hsl(var(--secondary))"
                      : "hsl(150, 60%, 45%)"
                  }
                  fill={`url(#gradient-${activeTab})`}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--card))", strokeWidth: 2 }}
                  activeDot={{
                    r: 5,
                    fill:
                      activeTab === "tickets"
                        ? "hsl(var(--secondary))"
                        : "hsl(150, 60%, 45%)",
                    strokeWidth: 0,
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
