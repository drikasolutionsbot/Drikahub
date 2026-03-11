import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Search, Settings, TrendingUp, DollarSign, Calendar, Gift, Copy, Check, Link2, Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AffiliateOverview from "@/components/affiliates/AffiliateOverview";
import AffiliateList from "@/components/affiliates/AffiliateList";
import AffiliatePayouts from "@/components/affiliates/AffiliatePayouts";
import type { Affiliate, AffiliateOrder, AffiliatePayout } from "@/components/affiliates/types";

const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

interface TenantAffiliate {
  id: string;
  name: string;
  plan: string;
  referral_code: string | null;
  referral_credits_cents: number;
  created_at: string;
  referred_by_tenant_id: string | null;
  affiliate_active: boolean;
}

const AdminAffiliatesPage = () => {
  // Tenant-affiliate data
  const [tenantAffiliates, setTenantAffiliates] = useState<TenantAffiliate[]>([]);
  const [referralCounts, setReferralCounts] = useState<Record<string, { total: number; paid: number }>>({});
  const [tenantSearch, setTenantSearch] = useState("");

  // Store affiliates data (manual)
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);

  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [config, setConfig] = useState({ referral_bonus_days: 7, referral_bonus_credits_cents: 500 });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantAffRes, globalRes, configRes] = await Promise.all([
        supabase.functions.invoke("manage-affiliates", {
          body: { action: "admin_tenant_affiliates", tenant_id: "_admin" },
        }),
        supabase.functions.invoke("manage-affiliates", {
          body: { action: "admin_global", tenant_id: "_admin" },
        }),
        supabase
          .from("landing_config")
          .select("referral_bonus_days, referral_bonus_credits_cents")
          .limit(1)
          .single(),
      ]);

      if (!tenantAffRes.error && tenantAffRes.data) {
        setTenantAffiliates(tenantAffRes.data.tenants ?? []);
        setReferralCounts(tenantAffRes.data.referral_counts ?? {});
        if (tenantAffRes.data.config) setConfig(tenantAffRes.data.config);
      }

      if (!globalRes.error && globalRes.data) {
        setAffiliates(globalRes.data.affiliates ?? []);
        setOrders(globalRes.data.orders ?? []);
        setPayouts(globalRes.data.payouts ?? []);
      }

      if (configRes.data) setConfig(configRes.data as any);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      const { error } = await supabase
        .from("landing_config")
        .update({
          referral_bonus_days: config.referral_bonus_days,
          referral_bonus_credits_cents: config.referral_bonus_credits_cents,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Configuração salva ✅" });
      setConfigOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
    setConfigSaving(false);
  };

  const copyLink = (code: string, id: string) => {
    const link = `https://drikahub.com?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast({ title: "Link copiado! 📋", description: link });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stats
  const totalTenantAffiliates = tenantAffiliates.length;
  const totalReferrals = Object.values(referralCounts).reduce((s, c) => s + c.total, 0);
  const totalPaidReferrals = Object.values(referralCounts).reduce((s, c) => s + c.paid, 0);
  const totalCreditsDistributed = tenantAffiliates.reduce((s, t) => s + t.referral_credits_cents, 0);

  const filteredTenantAffiliates = tenantAffiliates.filter(t =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    (t.referral_code && t.referral_code.toLowerCase().includes(tenantSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Programa de Afiliados
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie afiliados do SaaS e afiliados das lojas</p>
        </div>
        <Button variant="outline" onClick={() => setConfigOpen(true)} className="gap-2">
          <Settings className="h-4 w-4" /> Configurar Premiação
        </Button>
      </div>

      <Tabs defaultValue="tenant_affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenant_affiliates">Afiliados SaaS ({totalTenantAffiliates})</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral Lojas</TabsTrigger>
          <TabsTrigger value="store_affiliates">Afiliados Lojas ({affiliates.length})</TabsTrigger>
          <TabsTrigger value="payouts">Pagamentos ({payouts.length})</TabsTrigger>
        </TabsList>

        {/* TAB: Tenant Affiliates (SaaS-level) */}
        <TabsContent value="tenant_affiliates" className="space-y-4">
          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 space-y-1 border-border/50 bg-card/60">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Afiliados Ativos</span>
              </div>
              <p className="text-2xl font-bold">{totalTenantAffiliates}</p>
            </Card>
            <Card className="p-4 space-y-1 border-border/50 bg-card/60">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Total Indicações</span>
              </div>
              <p className="text-2xl font-bold">{totalReferrals}</p>
            </Card>
            <Card className="p-4 space-y-1 border-border/50 bg-card/60">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Convertidas (Pro)</span>
              </div>
              <p className="text-2xl font-bold">{totalPaidReferrals}</p>
            </Card>
            <Card className="p-4 space-y-1 border-border/50 bg-card/60">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Créditos Distribuídos</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatBRL(totalCreditsDistributed)}</p>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filteredTenantAffiliates.length === 0 ? (
            <Card className="border-border/50 bg-card/60">
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Nenhum cliente ativou o modo afiliado ainda
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTenantAffiliates.map(t => {
                const counts = referralCounts[t.id] ?? { total: 0, paid: 0 };
                const bonusDaysEarned = counts.paid * config.referral_bonus_days;
                return (
                  <div key={t.id} className="group flex items-center gap-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 hover:border-primary/30 transition-all">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-pink shrink-0">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{t.name}</p>
                        <Badge variant={t.plan === "pro" ? "default" : "secondary"} className="text-[10px]">
                          {t.plan}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        {t.referral_code && (
                          <span className="font-mono flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            ?ref={t.referral_code}
                          </span>
                        )}
                        <span>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-sm font-bold">{counts.total}</p>
                      <p className="text-[10px] text-muted-foreground">indicações</p>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-sm font-bold text-emerald-400">{counts.paid}</p>
                      <p className="text-[10px] text-muted-foreground">convertidas</p>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-sm font-bold">+{bonusDaysEarned}d</p>
                      <p className="text-[10px] text-muted-foreground">dias ganhos</p>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-sm font-bold text-primary">{formatBRL(t.referral_credits_cents)}</p>
                      <p className="text-[10px] text-muted-foreground">créditos</p>
                    </div>
                    {t.referral_code && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyLink(t.referral_code!, t.id)}
                      >
                        {copiedId === t.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: Store Affiliates Overview */}
        <TabsContent value="overview">
          <AffiliateOverview
            affiliates={affiliates}
            orders={orders}
            payouts={payouts}
            loading={loading}
          />
        </TabsContent>

        {/* TAB: Store Affiliates List */}
        <TabsContent value="store_affiliates">
          <AffiliateList
            affiliates={affiliates}
            loading={loading}
            tenantId={null}
            onRefresh={fetchData}
            adminMode
          />
        </TabsContent>

        {/* TAB: Payouts */}
        <TabsContent value="payouts">
          <AffiliatePayouts
            affiliates={affiliates}
            tenantId={null}
            payouts={payouts}
            onRefresh={fetchData}
            adminMode
          />
        </TabsContent>
      </Tabs>

      {/* Config modal */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Configurar Premiação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dias bônus por indicação Pro paga</Label>
              <Input
                type="number"
                min={0}
                value={config.referral_bonus_days}
                onChange={(e) => setConfig({ ...config, referral_bonus_days: Number(e.target.value) })}
              />
              <p className="text-[11px] text-muted-foreground">
                Dias adicionados ao plano Pro do afiliado quando o indicado pagar
              </p>
            </div>
            <div className="space-y-2">
              <Label>Créditos por indicação (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={(config.referral_bonus_credits_cents / 100).toFixed(2)}
                onChange={(e) => setConfig({ ...config, referral_bonus_credits_cents: Math.round(Number(e.target.value) * 100) })}
              />
              <p className="text-[11px] text-muted-foreground">
                Créditos internos adicionados ao saldo do afiliado
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancelar</Button>
            <Button onClick={saveConfig} disabled={configSaving} className="gradient-pink text-primary-foreground border-none">
              {configSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAffiliatesPage;
