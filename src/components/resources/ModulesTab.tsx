import { useState, useEffect, useCallback } from "react";
import {
  HandMetal, Store, Shield, Gift, Crown, Link2, Ticket, Zap, Cloud, MessageSquare,
  Plus, Puzzle, Loader2,
} from "lucide-react";
import TrashIcon from "@/components/ui/trash-icon";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BotModule {
  id: string;
  tenant_id: string;
  module_key: string;
  name: string;
  description: string;
  enabled: boolean;
  custom: boolean;
  icon_key: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  "hand-metal": HandMetal,
  "store": Store,
  "ticket": Ticket,
  "shield": Shield,
  "zap": Zap,
  "gift": Gift,
  "crown": Crown,
  "link-2": Link2,
  "cloud": Cloud,
  "message-square": MessageSquare,
  "puzzle": Puzzle,
};

export const ModulesTab = () => {
  const [modules, setModules] = useState<BotModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const { tenantId } = useTenant();

  const loadModules = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-bot-modules", {
        body: { action: "list", tenant_id: tenantId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setModules(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar módulos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`bot_modules_${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bot_modules", filter: `tenant_id=eq.${tenantId}` },
        () => {
          loadModules();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, loadModules]);

  const toggleModule = async (mod: BotModule) => {
    try {
      const { error } = await supabase.functions.invoke("manage-bot-modules", {
        body: { action: "update", tenant_id: tenantId, id: mod.id, enabled: !mod.enabled },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  };

  const addModule = async () => {
    if (!newName.trim() || !newDesc.trim()) {
      toast({ title: "Preencha nome e descrição", variant: "destructive" });
      return;
    }
    if (modules.some((m) => m.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast({ title: "Módulo já existe", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("manage-bot-modules", {
        body: {
          action: "create",
          tenant_id: tenantId,
          name: newName.trim(),
          description: newDesc.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setNewName("");
      setNewDesc("");
      setCreateOpen(false);
      toast({ title: "Módulo criado!" });
    } catch (err: any) {
      toast({ title: "Erro ao criar módulo", description: err.message, variant: "destructive" });
    }
  };

  const removeModule = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-bot-modules", {
        body: { action: "delete", tenant_id: tenantId, id },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  const activeCount = modules.filter((m) => m.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ative ou desative os módulos do bot para este servidor.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{activeCount} ativos</span>
            <span>/</span>
            <span>{modules.length} total</span>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((mod) => {
          const Icon = ICON_MAP[mod.icon_key] || Puzzle;
          return (
            <div
              key={mod.id}
              className={cn(
                "flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all",
                !mod.enabled && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Icon className={cn("h-5 w-5", mod.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{mod.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={mod.enabled} onCheckedChange={() => toggleModule(mod)} />
                {mod.custom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeModule(mod.id)}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Módulo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do módulo</Label>
              <Input placeholder="Meu Módulo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="O que este módulo faz..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} maxLength={100} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={addModule}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
