import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Search, UserCog, Trash2, CreditCard, Settings, Shield,
  ChevronLeft, ChevronRight, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  admin_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  plan_changed: { label: "Plano alterado", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: CreditCard },
  tenant_deleted: { label: "Tenant excluído", color: "bg-red-500/15 text-red-400 border-red-500/20", icon: Trash2 },
  tenant_created: { label: "Tenant criado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: Settings },
  payment_confirmed: { label: "Pagamento confirmado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: CreditCard },
  role_changed: { label: "Cargo alterado", color: "bg-purple-500/15 text-purple-400 border-purple-500/20", icon: Shield },
  config_updated: { label: "Config atualizada", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: Settings },
  default: { label: "Ação", color: "bg-muted text-muted-foreground border-border", icon: UserCog },
};

const ENTITY_TYPES = ["all", "tenant", "payment", "config", "role"];

const PAGE_SIZE = 20;

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from("admin_audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }
      if (search.trim()) {
        query = query.or(`entity_name.ilike.%${search}%,admin_email.ilike.%${search}%,action.ilike.%${search}%`);
      }

      const { data, count } = await query;
      setLogs(data || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchLogs();
  }, [page, entityFilter, search]);

  const getConfig = (action: string) => ACTION_CONFIG[action] || ACTION_CONFIG.default;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
        <p className="text-muted-foreground">Registro de todas as ações administrativas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou ação..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas entidades</SelectItem>
            <SelectItem value="tenant">Tenants</SelectItem>
            <SelectItem value="payment">Pagamentos</SelectItem>
            <SelectItem value="config">Configurações</SelectItem>
            <SelectItem value="role">Cargos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const config = getConfig(log.action);
                const Icon = config.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${config.color}`}>
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                          {log.entity_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        {log.entity_name && <span className="font-medium">{log.entity_name}</span>}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <span className="text-muted-foreground">
                            {" — "}
                            {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(log.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        </span>
                        {log.admin_email && (
                          <span className="truncate">por {log.admin_email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
