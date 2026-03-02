import { useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Server, ExternalLink, Users, UserCheck, Settings2, Plus, UserPlus } from "lucide-react";
import MemberSearchModal from "@/components/dashboard/MemberSearchModal";

const DISCORD_CLIENT_ID = "1477916070508757092";
const BOT_PERMISSIONS = "8";

const DashboardPage = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<"membros" | "cargos">("membros");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);

  if (tenantLoading || !tenant) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const handleAddBot = () => {
    const url = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Servidor de Operações</h1>
        <p className="text-muted-foreground">
          Servidor onde <strong className="text-foreground">{tenant.name}</strong> está operando.
        </p>
      </div>

      {/* Server Info + Audit */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Servidor Principal */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold border-l-2 border-primary pl-3">
              Servidor Principal
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {tenant.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{tenant.name}</p>
              {tenant.discord_guild_id && (
                <p className="text-xs font-mono text-muted-foreground">
                  ({tenant.discord_guild_id})
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground border-l-2 border-primary pl-2 mb-2">
              Informações do Servidor
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Users className="h-3 w-3" /> 0 membros
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <UserCheck className="h-3 w-3" /> 0 clientes
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={handleAddBot}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Adicionar <strong>Drika Bot</strong> ao servidor
          </Button>
        </div>

        {/* Auditoria */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-lg font-semibold border-l-2 border-primary pl-3">
            Auditoria
          </h2>
          <p className="text-sm text-muted-foreground">
            Nenhum registro de auditoria encontrado.
          </p>
        </div>
      </div>

      {/* Permissões */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Permissões</h2>
          <p className="text-muted-foreground">Configure as permissões da Aplicação.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border">
          <button
            onClick={() => setActiveTab("membros")}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === "membros"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Membros
          </button>
          <button
            onClick={() => setActiveTab("cargos")}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === "cargos"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cargos
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "membros" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lista de membros */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold border-l-2 border-primary pl-3">Lista de membros</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setMemberSearchOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="font-medium text-muted-foreground">Nenhum membro na lista</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Adicione membros para começar a configurar as permissões.
                </p>
              </div>
            </div>

            {/* Configurar permissões */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center py-16">
              <Settings2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecione um membro para configurar as permissões
              </p>
            </div>
          </div>
        )}

        {activeTab === "cargos" && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Server className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">Nenhum cargo configurado</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Configure cargos para gerenciar permissões do servidor.
              </p>
            </div>
          </div>
        )}
      </div>

      <MemberSearchModal
        open={memberSearchOpen}
        onOpenChange={setMemberSearchOpen}
      />
    </div>
  );
};

export default DashboardPage;
