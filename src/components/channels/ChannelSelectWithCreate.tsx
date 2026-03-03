import { useState } from "react";
import { Plus, Hash, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChannelSelectWithCreateProps {
  value: string;
  onChange: (value: string) => void;
  channels: { id: string; name: string }[];
  onChannelCreated: () => void;
  tenantId: string | null;
  guildId?: string | null;
  placeholder?: string;
  defaultNewName?: string;
}

const ChannelSelectWithCreate = ({
  value,
  onChange,
  channels,
  onChannelCreated,
  tenantId,
  guildId,
  placeholder = "Selecione um canal",
  defaultNewName = "",
}: ChannelSelectWithCreateProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState(defaultNewName);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Preencha o nome do canal");
      return;
    }

    let resolvedGuildId = guildId;
    if (!resolvedGuildId && tenantId) {
      try {
        const { data } = await supabase
          .from("tenants")
          .select("discord_guild_id")
          .eq("id", tenantId)
          .single();
        resolvedGuildId = data?.discord_guild_id;
      } catch {}
    }

    if (!resolvedGuildId) {
      toast.error("Servidor Discord não configurado");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-discord-channel", {
        body: {
          guild_id: resolvedGuildId,
          name: newName.trim(),
          type: "text",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Canal #${data.channel?.name} criado!`);

      // Refresh channels list then select the new one
      await onChannelCreated();
      if (data.channel?.id) {
        onChange(data.channel.id);
      }

      setNewName("");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar canal");
    } finally {
      setCreating(false);
    }
  };

  const handleValueChange = (val: string) => {
    if (val === "__create__") {
      setCreateOpen(true);
      return;
    }
    onChange(val);
  };

  return (
    <>
      <Select value={value || undefined} onValueChange={handleValueChange}>
        <SelectTrigger className="mt-1 bg-muted/50 border-border h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__create__">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Plus className="h-3.5 w-3.5" />
              Criar novo canal
            </div>
          </SelectItem>
          {channels.map((ch) => (
            <SelectItem key={ch.id} value={ch.id}>
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                {ch.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Canal no Discord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do canal</Label>
              <Input
                placeholder="ex: boas-vindas"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <p className="text-[11px] text-muted-foreground">Será convertido para minúsculas com hifens</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Canal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChannelSelectWithCreate;
