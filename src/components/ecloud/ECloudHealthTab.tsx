import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  HardDrive, CheckCircle2, XCircle, AlertTriangle, Clock, Database,
  ShieldCheck, RefreshCw, Activity, TrendingUp, Calendar, Loader2,
} from "lucide-react";
import { formatDistanceToNow, differenceInHours, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupRecord {
  id: string;
  backup_type: string;
  status: string;
  members_count: number;
  verified_count: number;
  orders_count: number;
  products_count: number;
  started_at: string;
  completed_at: string | null;
}

interface ECloudHealthTabProps {
  tenantId: string;
}

export const ECloudHealthTab = ({ tenantId }: ECloudHealthTabProps) => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-backup", {
        body: { action: "list", tenant_id: tenantId },
      });
      if (error) throw error;
      setBackups(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const lastBackup = backups[0] || null;
  const lastSuccessful = backups.find((b) => b.status === "completed") || null;
  const failedCount = backups.filter((b) => b.status === "failed").length;
  const successCount = backups.filter((b) => b.status === "completed").length;
  const totalBackups = backups.length;
  const successRate = totalBackups > 0 ? Math.round((successCount / totalBackups) * 100) : 0;

  const hoursSinceLastBackup = lastSuccessful?.completed_at
    ? differenceInHours(new Date(), new Date(lastSuccessful.completed_at))
    : null;

  const healthStatus: "healthy" | "warning" | "critical" =
    hoursSinceLastBackup === null
      ? "critical"
      : hoursSinceLastBackup <= 26
      ? "healthy"
      : hoursSinceLastBackup <= 50
      ? "warning"
      : "critical";

  const healthConfig = {
    healthy: {
      label: "Saudável",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      icon: CheckCircle2,
      description: "Backups automáticos funcionando normalmente.",
    },
    warning: {
      label: "Atenção",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      icon: AlertTriangle,
      description: "Último backup há mais de 26h. Verifique o sistema.",
    },
    critical: {
      label: "Crítico",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      icon: XCircle,
      description: "Sem backups recentes. Seus dados podem estar em risco.",
    },
  };

  const health = healthConfig[healthStatus];
  const HealthIcon = health.icon;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status Hero */}
      <Card className={`p-6 ${health.bg} ${health.border} border`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl ${health.bg} flex items-center justify-center`}>
              <HealthIcon className={`h-7 w-7 ${health.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">Status do Sistema</h2>
                <Badge variant={healthStatus === "healthy" ? "default" : "destructive"} className="text-xs">
                  {health.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{health.description}</p>
              {lastSuccessful?.completed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Último backup bem-sucedido: {formatDistanceToNow(new Date(lastSuccessful.completed_at), { addSuffix: true, locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBackups} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total de Backups</span>
          </div>
          <p className="text-2xl font-bold">{totalBackups}</p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold">{successRate}%</p>
            <span className="text-xs text-muted-foreground mb-1">{successCount}/{totalBackups}</span>
          </div>
          <Progress value={successRate} className="mt-2 h-1.5" />
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Falhas</span>
          </div>
          <p className="text-2xl font-bold">{failedCount}</p>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">Próximo Backup</span>
          </div>
          <p className="text-lg font-bold">00:00</p>
          <p className="text-xs text-muted-foreground">Automático diário</p>
        </Card>
      </div>

      {/* Last Backup Details */}
      {lastSuccessful && (
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Último Backup Completo</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{lastSuccessful.members_count.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Membros</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{lastSuccessful.verified_count.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Verificados</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{lastSuccessful.orders_count.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Pedidos</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{lastSuccessful.products_count.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">Produtos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {lastSuccessful.completed_at
                ? format(new Date(lastSuccessful.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : "—"}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {lastSuccessful.backup_type === "daily" ? "Automático" : "Manual"}
            </Badge>
          </div>
        </Card>
      )}

      {/* Backup Timeline */}
      <Card className="p-5 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base">Histórico de Backups</h3>
        </div>

        {backups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum backup registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {backups.slice(0, 15).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  b.status === "completed" ? "bg-emerald-500/10" : b.status === "running" ? "bg-yellow-500/10" : "bg-destructive/10"
                }`}>
                  {b.status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  ) : b.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {b.backup_type === "daily" ? "Automático" : "Manual"}
                    </span>
                    <Badge
                      variant={b.status === "completed" ? "default" : b.status === "running" ? "secondary" : "destructive"}
                      className="text-[10px]"
                    >
                      {b.status === "completed" ? "OK" : b.status === "running" ? "Executando" : "Falhou"}
                    </Badge>
                  </div>
                  {b.status === "completed" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.members_count} membros · {b.verified_count} verificados · {b.orders_count} pedidos · {b.products_count} produtos
                    </p>
                  )}
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatDistanceToNow(new Date(b.started_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Proteção de Dados Automática</p>
            <p className="text-xs text-muted-foreground mt-1">
              O eCloud executa backups completos automaticamente todos os dias às 00:00 (UTC).
              Cada backup inclui: membros do Discord, membros verificados, pedidos, produtos e cargos do servidor.
              Nenhuma seleção manual é necessária — tudo é salvo automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
