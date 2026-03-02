import { useState } from "react";
import { Palette, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/TenantContext";

const CustomizationPage = () => {
  const { tenant } = useTenant();
  const [status, setStatus] = useState("/panel");
  const [interval, setInterval] = useState("30");
  const [prefix, setPrefix] = useState("d!");

  const botName = tenant?.name || "Drika Bot";
  const botId = tenant?.discord_guild_id || "000000000000000000";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Personalização</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Configure o <span className="font-semibold text-foreground">{botName}</span> para o seu estilo.
        </p>
      </div>

      {/* Banner */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        {/* Banner background */}
        <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-accent/20 relative">
          <button className="absolute top-3 right-3 p-2 rounded-lg bg-background/60 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {/* Avatar + info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent px-6 pb-4 pt-10">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-sidebar border-4 border-background flex items-center justify-center overflow-hidden">
                {tenant?.logo_url ? (
                  <img src={tenant.logo_url} alt={botName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-primary">
                    {botName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="pb-1">
              <h2 className="text-lg font-bold text-foreground">{botName}</h2>
              <p className="text-xs text-muted-foreground font-mono">Bot ID: {botId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="geral">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start px-0 gap-4">
          <TabsTrigger
            value="geral"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 pb-2"
          >
            Geral
          </TabsTrigger>
          <TabsTrigger
            value="embeds"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent px-1 pb-2"
          >
            Embeds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Status */}
            <Card className="p-5 space-y-5 bg-sidebar border-border">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-primary inline-block" />
                  Status
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">Configurações de status do bot.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status (um por linha)</label>
                <Textarea
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  rows={4}
                  className="bg-background border-border resize-none font-mono text-sm"
                  placeholder="/panel&#10;Drika Solutions&#10;Online"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Intervalo de Status (segundos)</label>
                <Input
                  type="number"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="bg-background border-border font-mono"
                />
              </div>
            </Card>

            {/* Right — Info + Prefix */}
            <div className="space-y-6">
              <Card className="p-5 space-y-4 bg-sidebar border-border">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary inline-block" />
                    Informações
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Dados da aplicação.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nome da Aplicação</span>
                    <span className="text-sm font-semibold text-foreground">{botName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ID da Aplicação</span>
                    <span className="text-sm font-mono text-foreground">{botId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-semibold text-green-500">Online</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-4 bg-sidebar border-border">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary inline-block" />
                    Prefixo
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Prefixo para comandos do bot.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Prefixo do Bot</label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="bg-background border-border font-mono"
                  />
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="embeds" className="mt-6">
          <Card className="p-8 bg-sidebar border-border flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Construtor de Embeds em breve.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomizationPage;
