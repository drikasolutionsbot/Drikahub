import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck, Plus, Trash2, Loader2, Pencil, Save, X, RefreshCw,
  Eye, Settings2, Package, ShoppingCart, Boxes, Shield, Cloud,
  Wrench, Crown, Users, CheckCircle2, XCircle, ChevronDown, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TenantRole {
  id: string;
  tenant_id: string;
  discord_role_id: string | null;
  name: string;
  color: string;
  synced: boolean;
  can_view: boolean;
  can_manage_app: boolean;
  can_manage_resources: boolean;
  can_change_server: boolean;
  can_manage_permissions: boolean;
  can_manage_bot_appearance: boolean;
  can_manage_products: boolean;
  can_manage_store: boolean;
  can_manage_stock: boolean;
  can_manage_protection: boolean;
  can_manage_ecloud: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

const PERMISSIONS = [
  { key: "can_view", label: "Visualizar Painel", icon: Eye, desc: "Acesso ao dashboard" },
  { key: "can_manage_app", label: "Gerenciar App", icon: Settings2, desc: "Configurações gerais" },
  { key: "can_manage_resources", label: "Gerenciar Recursos", icon: Wrench, desc: "Comandos e módulos" },
  { key: "can_change_server", label: "Trocar Servidor", icon: RefreshCw, desc: "Alterar servidor Discord" },
  { key: "can_manage_permissions", label: "Gerenciar Permissões", icon: Crown, desc: "Cargos e permissões" },
  { key: "can_manage_bot_appearance", label: "Aparência do Bot", icon: Pencil, desc: "Avatar, nome e status" },
  { key: "can_manage_products", label: "Gerenciar Produtos", icon: Package, desc: "CRUD de produtos" },
  { key: "can_manage_store", label: "Gerenciar Loja", icon: ShoppingCart, desc: "Config da loja" },
  { key: "can_manage_stock", label: "Gerenciar Estoque", icon: Boxes, desc: "Itens de estoque" },
  { key: "can_manage_protection", label: "Gerenciar Proteção", icon: Shield, desc: "Anti-raid/nuke" },
  { key: "can_manage_ecloud", label: "Gerenciar eCloud", icon: Cloud, desc: "Hosting eCloud" },
] as const;

const colorToHex = (color: number) =>
  color === 0 ? "#99AAB5" : `#${color.toString(16).padStart(6, "0")}`;

const RolesPage = () => {
  const { tenant, tenantId } = useTenant();
  const queryClient = useQueryClient();
  const guildId = tenant?.discord_guild_id;

  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TenantRole | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#FF69B4");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, Partial<TenantRole>>>({});
  const [syncing, setSyncing] = useState(false);

  // Fetch tenant roles from DB
  const { data: roles = [], isLoading } = useQuery<TenantRole[]>({
    queryKey: ["tenant-roles", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase.functions.invoke("manage-roles", {
        body: { action: "list", tenant_id: tenantId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // Fetch Discord roles for reference
  const { data: discordRoles = [] } = useQuery<DiscordRole[]>({
    queryKey: ["discord-roles-raw", guildId],
    queryFn: async () => {
      if (!guildId) return [];
      const { data, error } = await supabase.functions.invoke("discord-guild-info", {
        body: { tenant_id: tenantId },
      });
      if (error) throw error;
      return (data?.roles ?? [])
        .filter((r: DiscordRole) => r.name !== "@everyone" && !r.managed)
        .sort((a: DiscordRole, b: DiscordRole) => b.position - a.position);
    },
    enabled: !!guildId,
  });

  const handleCreate = async () => {
    if (!newName.trim() || !tenantId) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-roles", {
        body: { action: "create", tenant_id: tenantId, name: newName.trim(), color: newColor },
      });
      if (error || data?.error) throw new Error(data?.error || "Erro ao criar cargo");
      toast.success(`Cargo "${newName}" criado e sincronizado com Discord!`);
      setNewName("");
      setNewColor("#FF69B4");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tenant-roles", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["discord-roles-raw", guildId] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !tenantId) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-roles", {
        body: { action: "delete", tenant_id: tenantId, id: deleteTarget.id },
      });
      if (error || data?.error) throw new Error(data?.error || "Erro");
      toast.success(`Cargo "${deleteTarget.name}" removido do Discord e do banco!`);
      queryClient.invalidateQueries({ queryKey: ["tenant-roles", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["discord-roles-raw", guildId] });
      setDeleteTarget(null);
      if (expandedRole === deleteTarget.id) setExpandedRole(null);
    } catch (e: any) {
      toast.error(e.message);
      setDeleteTarget(null);
    }
  };

  const getDraft = (roleId: string) => editDrafts[roleId] || {};

  const updateDraft = (roleId: string, key: string, value: any) => {
    setEditDrafts((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [key]: value },
    }));
  };

  const handleSavePermissions = async (role: TenantRole) => {
    if (!tenantId) return;
    const draft = getDraft(role.id);
    if (Object.keys(draft).length === 0) return;

    setSaving(role.id);
    try {
      const { data, error } = await supabase.functions.invoke("manage-roles", {
        body: { action: "update", tenant_id: tenantId, id: role.id, ...draft },
      });
      if (error || data?.error) throw new Error(data?.error || "Erro");
      toast.success(`Permissões de "${role.name}" atualizadas!`);
      setEditDrafts((prev) => {
        const copy = { ...prev };
        delete copy[role.id];
        return copy;
      });
      queryClient.invalidateQueries({ queryKey: ["tenant-roles", tenantId] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const discardDraft = (roleId: string) => {
    setEditDrafts((prev) => {
      const copy = { ...prev };
      delete copy[roleId];
      return copy;
    });
  };

  const getPermValue = (role: TenantRole, key: string) => {
    const draft = getDraft(role.id);
    return draft[key as keyof TenantRole] !== undefined
      ? (draft[key as keyof TenantRole] as boolean)
      : (role[key as keyof TenantRole] as boolean);
  };

  const activePermsCount = (role: TenantRole) =>
    PERMISSIONS.filter((p) => getPermValue(role, p.key)).length;

  const hasDraft = (roleId: string) => Object.keys(getDraft(roleId)).length > 0;

  // Stats
  const totalRoles = roles.length;
  const syncedRoles = roles.filter((r) => r.synced).length;
  const rolesWithPerms = roles.filter((r) => PERMISSIONS.some((p) => r[p.key as keyof TenantRole])).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Cargos</h1>
            <p className="text-sm text-muted-foreground">Gerencie cargos do Discord e suas permissões no painel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["tenant-roles", tenantId] });
            queryClient.invalidateQueries({ queryKey: ["discord-roles-raw", guildId] });
            toast.success("Dados atualizados!");
          }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-1" /> Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Cargo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nome do Cargo</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Moderador" className="mt-1" />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-14 rounded border border-input cursor-pointer" />
                    <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} className="font-mono w-28" />
                    <div className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: newColor }} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newName.trim() || creating} className="bg-indigo-600 hover:bg-indigo-700">
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Criar no Discord
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Cargos</p>
              <p className="text-xl font-bold">{totalRoles}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sincronizados</p>
              <p className="text-xl font-bold">{syncedRoles}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Com Permissões</p>
              <p className="text-xl font-bold">{rolesWithPerms}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No guild warning */}
      {!guildId && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 text-center">
            <Shield className="h-10 w-10 mx-auto mb-3 text-amber-400" />
            <p className="text-sm text-muted-foreground">Conecte um servidor Discord nas Configurações para gerenciar cargos.</p>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      {roles.length === 0 && guildId ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum cargo cadastrado. Crie um cargo para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const isExpanded = expandedRole === role.id;
            const draft = getDraft(role.id);
            const dirty = hasDraft(role.id);

            return (
              <Card key={role.id} className={`border-border/50 transition-all ${isExpanded ? "ring-1 ring-indigo-500/30" : ""}`}>
                {/* Role Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                >
                  <div className="h-8 w-8 rounded-full border-2 border-border flex-shrink-0" style={{ backgroundColor: role.color || "#99AAB5" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{role.name}</span>
                      {role.synced && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Sincronizado
                        </Badge>
                      )}
                      {dirty && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                          Alterações não salvas
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activePermsCount(role)} de {PERMISSIONS.length} permissões ativas
                      {role.discord_role_id && <span className="ml-2">• ID: {role.discord_role_id}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {dirty && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); discardDraft(role.id); }}
                          className="text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleSavePermissions(role); }}
                          disabled={saving === role.id}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {saving === role.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                          Salvar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(role); }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded Permissions */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-4 pt-3">
                    <p className="text-sm font-medium mb-3 text-muted-foreground">Permissões do Painel</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PERMISSIONS.map((perm) => {
                        const Icon = perm.icon;
                        const value = getPermValue(role, perm.key);
                        return (
                          <div
                            key={perm.key}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              value ? "border-indigo-500/30 bg-indigo-500/5" : "border-border/50 bg-card/30"
                            }`}
                          >
                            <Icon className={`h-4 w-4 flex-shrink-0 ${value ? "text-indigo-400" : "text-muted-foreground"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{perm.label}</p>
                              <p className="text-[10px] text-muted-foreground">{perm.desc}</p>
                            </div>
                            <Switch
                              checked={value}
                              onCheckedChange={(v) => updateDraft(role.id, perm.key, v)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Role info */}
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Cor</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: role.color }} />
                          <span className="font-mono">{role.color}</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Discord Role ID</span>
                        <p className="mt-1 font-mono">{role.discord_role_id || "—"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Criado em</span>
                        <p className="mt-1">{new Date(role.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div>
                        <span className="font-medium">Atualizado em</span>
                        <p className="mt-1">{new Date(role.updated_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Discord Roles Reference */}
      {discordRoles.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Cargos no Discord
            </CardTitle>
            <CardDescription>Referência dos cargos atuais no servidor Discord</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {discordRoles.map((dr) => (
                <Badge
                  key={dr.id}
                  variant="outline"
                  className="gap-1.5 py-1"
                  style={{ borderColor: colorToHex(dr.color), color: colorToHex(dr.color) }}
                >
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorToHex(dr.color) }} />
                  {dr.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              O cargo <strong>"{deleteTarget?.name}"</strong> será removido do Discord e do banco de dados. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesPage;
