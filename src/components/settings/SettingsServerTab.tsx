import { useState } from "react";
import { Server, Unplug, Loader2, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DISCORD_CLIENT_ID = "1477916070508757092";
const BOT_PERMISSIONS = "536870920";

interface Props {
  tenant: any;
  tenantId: string | null;
  refetchTenant: () => void;
}

const SettingsServerTab = ({ tenant, tenantId, refetchTenant }: Props) => {
  const [disconnecting, setDisconnecting] = useState(false);
  const [newGuildId, setNewGuildId] = useState("");
  const [connecting, setConnecting] = useState(false);

  const isConnected = !!tenant?.discord_guild_id;

  const handleDisconnect = async () => {
    if (!tenantId) return;
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-tenant", {
        body: {
          tenant_id: tenantId,
          updates: { discord_guild_id: null },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refetchTenant();
      toast({ title: "Servidor desconectado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao desconectar", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnect = async () => {
    const trimmedId = newGuildId.trim();
    if (!trimmedId || !tenantId) return;

    if (!/^\d{17,20}$/.test(trimmedId)) {
      toast({ title: "ID inválido", description: "O ID do servidor deve conter apenas números (17-20 dígitos).", variant: "destructive" });
      return;
    }

    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-tenant", {
        body: {
          tenant_id: tenantId,
          updates: { discord_guild_id: trimmedId },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await refetchTenant();
      setNewGuildId("");
      toast({ title: "Servidor vinculado com sucesso! 🎉" });
    } catch (err: any) {
      toast({ title: "Erro ao vincular", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleAddBot = () => {
    const guildParam = newGuildId.trim() ? `&guild_id=${newGuildId.trim()}` : "";
    const url = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands${guildParam}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Current Server */}
      <div className="wallet-section">
        <div className="wallet-section-header mb-5">
          <div className="wallet-section-icon">
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-display font-semibold text-sm">Servidor Discord</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Gerencie a conexão com seu servidor</p>
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            {/* Connected status */}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-400">Servidor conectado</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                  ID: {tenant.discord_guild_id}
                </p>
              </div>
            </div>

            {/* Disconnect button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={disconnecting}
                >
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                  Desconectar servidor
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Desconectar servidor?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    O bot deixará de operar neste servidor. Todas as configurações de canais, tickets e embeds 
                    ficarão salvas, mas só funcionarão quando um servidor for reconectado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnect}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, desconectar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Disconnected status */}
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-400">Nenhum servidor conectado</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Conecte um servidor para que o bot funcione
                </p>
              </div>
            </div>

            {/* Add bot */}
            <Button
              onClick={handleAddBot}
              className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white"
              size="lg"
            >
              <ExternalLink className="h-4 w-4" />
              Adicionar Drika Bot ao Discord
            </Button>

            {/* Guild ID input */}
            <div className="space-y-2">
              <Input
                placeholder="Cole o ID do seu servidor Discord"
                value={newGuildId}
                onChange={(e) => setNewGuildId(e.target.value)}
                className="font-mono"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Adicione o bot no seu servidor, copie o ID do servidor no Discord e cole acima.
              </p>
            </div>

            {/* Connect button */}
            <Button
              onClick={handleConnect}
              disabled={connecting || !newGuildId.trim()}
              className="w-full gap-2 gradient-pink text-primary-foreground"
              size="lg"
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Vincular servidor por ID
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsServerTab;
