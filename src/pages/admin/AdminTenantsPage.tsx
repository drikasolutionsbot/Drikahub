import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Tenant {
  id: string;
  name: string;
  discord_guild_id: string | null;
  plan: string | null;
  created_at: string;
}

const AdminTenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    setTenants((data as Tenant[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteTenant = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${name}"? Esta ação é irreversível.`)) return;
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Tenant "${name}" deletado` });
      fetchTenants();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">Gerenciar todos os lojistas</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted border-none"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Discord Guild</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Plano</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Criado em</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum tenant encontrado</td></tr>
            ) : (
              filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {tenant.discord_guild_id || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {tenant.plan || "free"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteTenant(tenant.id, tenant.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default AdminTenantsPage;
