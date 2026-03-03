import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import { TrendingUp } from "lucide-react";

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

export const ECloudCharts = ({ tenantId }: ECloudChartsProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");

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

    // Group by day
    const map = new Map<string, { vendas: number; tickets: number; receita: number }>();

    // Fill all days
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

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg">Desempenho</h2>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <button
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              period === "7d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              period === "30d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            30 dias
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold">{totalVendas}</p>
          <p className="text-xs text-muted-foreground">Vendas</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold">{totalTickets}</p>
          <p className="text-xs text-muted-foreground">Tickets</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold">
            {(totalReceita / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-muted-foreground">Receita</p>
        </div>
      </div>

      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="vendas" className="flex-1">Vendas</TabsTrigger>
          <TabsTrigger value="tickets" className="flex-1">Tickets</TabsTrigger>
          <TabsTrigger value="receita" className="flex-1">Receita</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="tickets" className="pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="tickets"
                stroke="hsl(var(--secondary))"
                fill="hsl(var(--secondary) / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="receita" className="pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [
                  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                  "Receita",
                ]}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent) / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};
