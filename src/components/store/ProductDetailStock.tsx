import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { AddStockModal } from "./AddStockModal";

interface ProductDetailStockProps {
  productId: string;
}

export const ProductDetailStock = ({ productId }: ProductDetailStockProps) => {
  const { tenantId } = useTenant();
  const [stock, setStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchStock = useCallback(async () => {
    if (!tenantId || !productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-product-fields", {
        body: { action: "get_stock", tenant_id: tenantId, product_id: productId },
      });
      if (error) throw error;
      setStock(data?.stock || 0);
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }, [tenantId, productId]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleClearStock = async () => {
    if (!tenantId) return;
    setClearing(true);
    try {
      const { error } = await supabase.functions.invoke("manage-product-fields", {
        body: { action: "clear_stock", tenant_id: tenantId, product_id: productId },
      });
      if (error) throw error;
      toast({ title: "Estoque limpo! ✅" });
      setStock(0);
    } catch (e: any) {
      toast({ title: "Erro ao limpar estoque", description: e.message, variant: "destructive" });
    }
    setClearing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">Estoque Geral</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie o estoque do produto. Os campos (variações) configuram apenas a quantidade enviada por entrega.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl bg-muted p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque disponível</p>
                <p className="text-3xl font-bold">{stock} <span className="text-sm font-normal text-muted-foreground">itens</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              {stock > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearStock}
                  disabled={clearing}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                  Limpar
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="gradient-pink text-primary-foreground border-none hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Estoque
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-bold mb-2">Como funciona?</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• O estoque é <strong>geral</strong> para o produto inteiro.</li>
              <li>• Cada arquivo .txt ou item adicionado entra no pool geral.</li>
              <li>• Nas variações (campos), configure a <strong>"Quantidade por Entrega"</strong> para definir quantos itens serão enviados por compra.</li>
              <li>• Na entrega automática, o sistema puxa a quantidade configurada do estoque geral.</li>
            </ul>
          </div>
        </>
      )}

      {tenantId && (
        <AddStockModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          productId={productId}
          tenantId={tenantId}
          onAdded={() => {
            fetchStock();
            setAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
