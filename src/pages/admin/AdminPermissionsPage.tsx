import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Loader2, Mail, Lock, UserX, Users } from "lucide-react";
import TrashIcon from "@/components/ui/trash-icon";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  is_caller: boolean;
}

const AdminPermissionsPage = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAdmins(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar admins", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreate = async () => {
    if (!email.trim() || !password.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "create", email: email.trim(), password: password.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Admin criado com sucesso!");
      setEmail("");
      setPassword("");
      setDialogOpen(false);
      fetchAdmins();
    } catch (err: any) {
      toast.error("Erro ao criar admin", { description: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-admin-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Admin removido com sucesso!");
      fetchAdmins();
    } catch (err: any) {
      toast.error("Erro ao remover admin", { description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Permissões Admin
          </h1>
          <p className="text-muted-foreground">Gerencie quem tem acesso ao painel administrativo</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo administrador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Senha
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={creating || !email.trim() || password.trim().length < 6}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Administradores ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum administrador encontrado.</p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.user_id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{admin.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                        {admin.is_caller && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Você
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!admin.is_caller && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deleting === admin.user_id}
                        >
                          {deleting === admin.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon size={16} />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O acesso de <strong>{admin.email}</strong> ao painel admin será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(admin.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissionsPage;
