import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cloud,
  Activity,
  Users,
  UserCheck,
  Hash,
  Shield,
  ExternalLink,
  RefreshCw,
  Server,
  Crown,
  Clock,
  Webhook,
  ShoppingCart,
  Ticket,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
  member_count: number;
  presence_count: number;
}

interface RecentLog {
  id: string;
  type: "webhook" | "order" | "ticket";
  title: string;
  description: string;
  status: "success" | "warning" | "error";
  created_at: string;
}

const RESTORECORD_LINKS = [
  { label: "Dashboard", url: "https://restorecord.com/dashboard", icon: Activity },
  { label: "Servidores", url: "https://restorecord.com/dashboard/servers", icon: Server },
  { label: "Membros Verificados", url: "https://restorecord.com/dashboard/members", icon: UserCheck },
  { label: "Migrações", url: "https://restorecord.com/dashboard/migrations", icon: Users },
];

const PLAN_FEATURES: Record<string, { label: string; color: string; limits: string }> = {
  free: { label: "Free", color: "text-muted-foreground", limits: "Recursos básicos" },
  starter: { label: "Starter", color: "text-blue-400", limits: "Até 500 membros backup" },
  pro: { label: "Pro", color: "text-primary", limits: "Membros ilimitados + Prioridade" },
  business: { label: "Business", color: "text-secondary", limits: "Snapshots + API + Suporte VIP" },
};

const ECloudPage = () => {
  const { tenant, tenantId } = useTenant();
  const [guildInfo, setGuildInfo] = useState<GuildInfo | null>(null);
  const [botOnline, setBotOnline] = useState<boolean | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!tenant?.discord_guild_id || !tenantId) return;

    try {
      // Fetch guild info (includes member count + online)
      const { data: guild, error: guildErr } = await supabase.functions.invoke("discord-guild-info", {
        body: { guild_id: tenant.discord_guild_id },
      });

      if (!guildErr && guild && !guild.error) {
        setGuildInfo(guild);
        setBotOnline(true);
      } else {
        setBotOnline(false);
      }

      // Fetch recent webhook logs
      const { data: webhooks } = await supabase
        .from("webhook_logs")
        .select("id, provider_key, event_type, status, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, product_name, status, discord_username, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent tickets
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, product_name, status, discord_username, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(3);

      const logs: RecentLog[] = [];

      webhooks?.forEach((w) =>
        logs.push({
          id: w.id,
          type: "webhook",
          title: `Webhook ${w.provider_key}`,
          description: w.event_type || "Notificação recebida",
          status: w.status === "processed" ? "success" : w.status === "ignored" ? "warning" : "error",
          created_at: w.created_at,
        })
      );

      orders?.forEach((o) =>
        logs.push({
          id: o.id,
          type: "order",
          title: o.product_name,
          description: `${o.discord_username || "Usuário"} — ${o.status}`,
          status: o.status === "paid" || o.status === "delivered" ? "success" : o.status === "canceled" ? "error" : "warning",
          created_at: o.created_at,
        })
      );

      tickets?.forEach((t) =>
        logs.push({
          id: t.id,
          type: "ticket",
          title: `Ticket ${t.product_name || ""}`,
          description: `${t.discord_username || "Usuário"} — ${t.status}`,
          status: t.status === "closed" || t.status === "delivered" ? "success" : "warning",
          created_at: t.created_at,
        })
      );

      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentLogs(logs.slice(0, 10));
    } catch (err) {
      console.error("eCloud fetch error:", err);
      setBotOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant?.discord_guild_id, tenantId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const plan = PLAN_FEATURES[tenant?.plan || "free"] || PLAN_FEATURES.free;

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (status === "warning") return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  const logIcon = (type: string) => {
    if (type === "webhook") return <Webhook className="h-4 w-4 text-muted-foreground" />;
    if (type === "order") return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
    return <Ticket className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cloud className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">eCloud</h1>
          {botOnline !== null && (
            <Badge variant={botOnline ? "default" : "destructive"} className="gap-1.5">
              <span className={`h-2 w-2 rounded-full ${botOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {botOnline ? "Online" : "Offline"}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Membros"
            value={guildInfo?.member_count?.toLocaleString("pt-BR") || "—"}
            icon={Users}
            change={guildInfo ? `${guildInfo.presence_count} online` : undefined}
            changeType="positive"
          />
          <StatCard
            title="Status do Bot"
            value={botOnline ? "Ativo" : "Inativo"}
            icon={Activity}
            change={botOnline ? "Respondendo normalmente" : "Sem resposta"}
            changeType={botOnline ? "positive" : "negative"}
          />
          <StatCard
            title="Servidor"
            value={guildInfo?.name || tenant?.name || "—"}
            icon={Server}
            change={tenant?.discord_guild_id ? `ID: ${tenant.discord_guild_id}` : "Não vinculado"}
            changeType="neutral"
          />
          <StatCard
            title="Plano Atual"
            value={plan.label}
            icon={Crown}
            change={plan.limits}
            changeType="neutral"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Logs */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Atividade Recente</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">{logIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusIcon(log.status)}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RestoreCord Quick Links */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">RestoreCord</h2>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Gerencie backups e restauração de membros via RestoreCord.
          </p>

          <div className="space-y-2">
            {RESTORECORD_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 hover:border-primary/30 transition-colors group"
              >
                <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium flex-1">{link.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>

          {/* Server info mini card */}
          {guildInfo && (
            <div className="mt-4 rounded-lg border border-border p-3 bg-muted/30">
              <div className="flex items-center gap-3">
                {guildInfo.icon ? (
                  <img src={guildInfo.icon} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{guildInfo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {guildInfo.member_count.toLocaleString("pt-BR")} membros · {guildInfo.presence_count} online
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ECloudPage;
