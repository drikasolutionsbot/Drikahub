import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AffiliateOverview from "@/components/affiliates/AffiliateOverview";
import AffiliateList from "@/components/affiliates/AffiliateList";
import AffiliatePayouts from "@/components/affiliates/AffiliatePayouts";
import { Affiliate, AffiliateOrder, AffiliatePayout } from "@/components/affiliates/types";

const AffiliatesPage = () => {
  const { tenantId } = useTenant();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [orders, setOrders] = useState<AffiliateOrder[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-affiliates", {
        body: { action: "analytics", tenant_id: tenantId },
      });
      if (error) throw error;
      setAffiliates(data?.affiliates ?? []);
      setOrders(data?.orders ?? []);
      setPayouts(data?.payouts ?? []);
    } catch (e: any) {
      toast({ title: "Erro ao carregar afiliados", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Afiliados
        </h1>
        <p className="text-muted-foreground text-sm">
          Gerencie links de indicação, acompanhe conversões e controle comissões
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
          <TabsTrigger value="payouts">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AffiliateOverview
            affiliates={affiliates}
            orders={orders}
            payouts={payouts}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="affiliates">
          <AffiliateList
            affiliates={affiliates}
            loading={loading}
            tenantId={tenantId}
            onRefresh={fetchAll}
          />
        </TabsContent>

        <TabsContent value="payouts">
          <AffiliatePayouts
            affiliates={affiliates}
            tenantId={tenantId}
            payouts={payouts}
            onRefresh={fetchAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliatesPage;
