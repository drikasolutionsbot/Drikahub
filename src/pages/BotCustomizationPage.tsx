import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/TenantContext";
import { Bot, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditBotProfileModal from "@/components/settings/EditBotProfileModal";

const BotCustomizationPage = () => {
  const { tenant, tenantId, refetch } = useTenant();
  const [editOpen, setEditOpen] = useState(false);

  if (!tenant) return <Skeleton className="h-64" />;

  const botName = tenant.bot_name || "Drika Bot";
  const botAvatar = tenant.bot_avatar_url;
  const botBanner = tenant.banner_url;
  const botId = (tenant as any).discord_bot_id || tenant.id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Personalização</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure o <strong className="text-foreground">{botName}</strong> para o seu estilo.
        </p>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        {/* Banner */}
        <div className="h-36 sm:h-44 w-full relative">
          {botBanner ? (
            <img src={botBanner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/30 via-primary/10 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        {/* Bot Info Overlay */}
        <div className="relative px-5 pb-5 -mt-10 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {botAvatar ? (
                <img
                  src={botAvatar}
                  alt="Bot avatar"
                  className="h-20 w-20 rounded-full object-cover border-4 border-card shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted border-4 border-card shadow-lg flex items-center justify-center">
                  <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            {/* Name & ID */}
            <div className="pb-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{botName}</h2>
              <p className="text-xs text-muted-foreground font-mono truncate">
                Bot ID: {botId?.slice(0, 20)}
              </p>
            </div>
          </div>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-9 w-9 rounded-full border-border bg-card/80 backdrop-blur-sm hover:bg-accent"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Informações Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Informações</h3>
          <p className="text-xs text-muted-foreground">Dados da aplicação.</p>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Nome da Aplicação</span>
            <span className="text-sm font-semibold text-foreground">{botName}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">ID da Aplicação</span>
            <span className="text-sm font-mono text-foreground">{botId}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm font-semibold text-emerald-400">Online</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditBotProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={tenant}
        tenantId={tenantId}
        refetchTenant={refetch}
      />
    </div>
  );
};

export default BotCustomizationPage;
