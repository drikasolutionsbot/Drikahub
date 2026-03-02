import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Key } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Token {
  id: string;
  token: string;
  label: string | null;
  tenant_id: string;
  allowed_ip: string | null;
  expires_at: string | null;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
  tenants?: { name: string } | null;
}

interface Tenant {
  id: string;
  name: string;
}

const AdminTokensPage = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New token form
  const [newTenantId, setNewTenantId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newIp, setNewIp] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("access_tokens")
      .select("*, tenants(name)")
      .order("created_at", { ascending: false });
    setTokens((data as Token[]) || []);
    setLoading(false);
  };

  const fetchTenants = async () => {
    const { data } = await supabase.from("tenants").select("id, name").order("name");
    setTenants((data as Tenant[]) || []);
  };

  useEffect(() => {
    fetchTokens();
    fetchTenants();
  }, []);

  const createToken = async () => {
    if (!newTenantId) {
      toast({ title: "Selecione um tenant", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("access_tokens").insert({
      tenant_id: newTenantId,
      label: newLabel || null,
      allowed_ip: newIp || null,
      created_by: user?.id,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Token criado com sucesso!" });
      setDialogOpen(false);
      setNewLabel("");
      setNewIp("");
      setNewTenantId("");
      fetchTokens();
    }
  };

  const revokeToken = async (id: string) => {
    const { error } = await supabase
      .from("access_tokens")
      .update({ revoked: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Token revogado" });
      fetchTokens();
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "Token copiado!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Tokens de Acesso</h1>
          <p className="text-muted-foreground">Gerenciar tokens dos lojistas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-pink text-primary-foreground border-none hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Novo Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Novo Token</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={newTenantId} onValueChange={setNewTenantId}>
                  <SelectTrigger className="bg-muted border-none">
                    <SelectValue placeholder="Selecione um tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label (Opcional)</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Token principal"
                  className="bg-muted border-none"
                />
              </div>
              <div className="space-y-2">
                <Label>IP Permitido (Opcional)</Label>
                <Input
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Deixe vazio para qualquer IP"
                  className="bg-muted border-none"
                />
              </div>
              <Button
                onClick={createToken}
                disabled={creating}
                className="w-full gradient-pink text-primary-foreground border-none hover:opacity-90"
              >
                {creating ? "Criando..." : "Gerar Token"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Token</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Tenant</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Label</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">IP</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Último uso</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Nenhum token criado
                </td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {t.token.slice(0, 8)}...{t.token.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToken(t.token)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{t.tenants?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.label || "—"}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{t.allowed_ip || "Qualquer"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={t.revoked ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {t.revoked ? "Revogado" : "Ativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {t.last_used_at
                      ? new Date(t.last_used_at).toLocaleString("pt-BR")
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    {!t.revoked && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => revokeToken(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTokensPage;
