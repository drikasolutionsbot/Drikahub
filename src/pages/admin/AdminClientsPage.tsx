import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Key, Copy, Trash2, Eye, EyeOff, Loader2, Users } from "lucide-react";

const AdminClientsPage = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [tokens, setTokens] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  // New tenant form
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantGuildId, setNewTenantGuildId] = useState("");
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);

  // Token generation
  const [tokenLabel, setTokenLabel] = useState("");
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [tokenDialogTenantId, setTokenDialogTenantId] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    setTenants(data || []);
    setLoading(false);
  }, []);

  const fetchTokens = useCallback(async (tenantId: string) => {
    const { data } = await supabase
      .from("access_tokens")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setTokens((prev) => ({ ...prev, [tenantId]: data || [] }));
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) return;
    setCreatingTenant(true);
    try {
      const { error } = await supabase.from("tenants").insert({
        name: newTenantName.trim(),
        discord_guild_id: newTenantGuildId.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Cliente criado com sucesso!" });
      setNewTenantName("");
      setNewTenantGuildId("");
      setTenantDialogOpen(false);
      fetchTenants();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setCreatingTenant(false);
  };

  const handleGenerateToken = async (tenantId: string) => {
    setGeneratingToken(tenantId);
    try {
      const { data, error } = await supabase
        .from("access_tokens")
        .insert({
          tenant_id: tenantId,
          label: tokenLabel.trim() || null,
          created_by: (await supabase.auth.getUser()).data.user?.id || null,
        })
        .select("token")
        .single();

      if (error) throw error;
      setGeneratedToken(data.token);
      toast({ title: "Token gerado com sucesso!" });
      fetchTokens(tenantId);
    } catch (err: any) {
      toast({ title: "Erro ao gerar token", description: err.message, variant: "destructive" });
    }
    setGeneratingToken(null);
  };

  const handleRevokeToken = async (tokenId: string, tenantId: string) => {
    const { error } = await supabase
      .from("access_tokens")
      .update({ revoked: true })
      .eq("id", tokenId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Token revogado" });
      fetchTokens(tenantId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const toggleExpand = (tenantId: string) => {
    if (expandedTenant === tenantId) {
      setExpandedTenant(null);
    } else {
      setExpandedTenant(tenantId);
      if (!tokens[tenantId]) fetchTokens(tenantId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie clientes e tokens de acesso</p>
        </div>
        <Dialog open={tenantDialogOpen} onOpenChange={setTenantDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-pink text-primary-foreground border-none hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Adicionar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome do Cliente *</Label>
                <Input
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Ex: Loja do João"
                  className="bg-muted border-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Discord Guild ID (opcional)</Label>
                <Input
                  value={newTenantGuildId}
                  onChange={(e) => setNewTenantGuildId(e.target.value)}
                  placeholder="Ex: 1234567890"
                  className="bg-muted border-none"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleCreateTenant}
                disabled={creatingTenant || !newTenantName.trim()}
                className="gradient-pink text-primary-foreground border-none hover:opacity-90"
              >
                {creatingTenant ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => {
                const isExpanded = expandedTenant === tenant.id;
                const tenantTokens = tokens[tenant.id] || [];

                return (
                  <div key={tenant.id} className="rounded-lg border border-border overflow-hidden">
                    {/* Tenant row */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(tenant.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-foreground">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {tenant.discord_guild_id || "Sem Guild ID"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{tenant.plan || "free"}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(tenant.created_at), "dd/MM/yyyy")}
                        </span>
                        <Key className={`h-4 w-4 transition-transform ${isExpanded ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </div>

                    {/* Expanded tokens section */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 px-4 py-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">Tokens de Acesso</h4>
                          <Dialog
                            open={tokenDialogTenantId === tenant.id}
                            onOpenChange={(open) => {
                              setTokenDialogTenantId(open ? tenant.id : null);
                              if (!open) {
                                setGeneratedToken(null);
                                setTokenLabel("");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" className="gradient-pink text-primary-foreground border-none hover:opacity-90">
                                <Key className="mr-1 h-3 w-3" /> Gerar Token
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle>Gerar Token para {tenant.name}</DialogTitle>
                              </DialogHeader>

                              {generatedToken ? (
                                <div className="space-y-4 py-2">
                                  <p className="text-sm text-muted-foreground">
                                    Token gerado! Copie agora, ele não será exibido novamente.
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={generatedToken}
                                      readOnly
                                      className="bg-muted border-none font-mono text-xs"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(generatedToken)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="ghost">Fechar</Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </div>
                              ) : (
                                <div className="space-y-4 py-2">
                                  <div className="space-y-2">
                                    <Label>Rótulo (opcional)</Label>
                                    <Input
                                      value={tokenLabel}
                                      onChange={(e) => setTokenLabel(e.target.value)}
                                      placeholder="Ex: Token principal"
                                      className="bg-muted border-none"
                                    />
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="ghost">Cancelar</Button>
                                    </DialogClose>
                                    <Button
                                      onClick={() => handleGenerateToken(tenant.id)}
                                      disabled={!!generatingToken}
                                      className="gradient-pink text-primary-foreground border-none hover:opacity-90"
                                    >
                                      {generatingToken ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Key className="mr-2 h-4 w-4" />
                                      )}
                                      Gerar
                                    </Button>
                                  </DialogFooter>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>

                        {tenantTokens.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum token gerado.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Rótulo</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Último uso</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="w-20"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tenantTokens.map((tk) => (
                                <TableRow key={tk.id}>
                                  <TableCell className="text-sm">{tk.label || "—"}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-xs">
                                        {showTokens[tk.id]
                                          ? tk.token
                                          : `${tk.token.substring(0, 8)}...`}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() =>
                                          setShowTokens((prev) => ({ ...prev, [tk.id]: !prev[tk.id] }))
                                        }
                                      >
                                        {showTokens[tk.id] ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(tk.token)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={tk.revoked ? "destructive" : "default"}>
                                      {tk.revoked ? "Revogado" : "Ativo"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {tk.last_used_at
                                      ? format(new Date(tk.last_used_at), "dd/MM HH:mm")
                                      : "Nunca"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(tk.created_at), "dd/MM/yyyy")}
                                  </TableCell>
                                  <TableCell>
                                    {!tk.revoked && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => handleRevokeToken(tk.id, tenant.id)}
                                        title="Revogar token"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClientsPage;
