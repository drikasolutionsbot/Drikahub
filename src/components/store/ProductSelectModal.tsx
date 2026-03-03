import { useState } from "react";
import { Search, Package, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  type: string;
  price_cents: number;
  stock: number | null;
  active: boolean;
  description: string | null;
}

interface ProductSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSelect: (product: Product) => void;
  onCreateNew: () => void;
}

const typeLabels: Record<string, string> = {
  digital_auto: "Digital",
  service: "Serviço",
  hybrid: "Híbrido",
};

export const ProductSelectModal = ({
  open,
  onOpenChange,
  products,
  onSelect,
  onCreateNew,
}: ProductSelectModalProps) => {
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border p-0 gap-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-lg font-bold">Selecionar Produto</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-border"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="px-5 pb-5 max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Create new card */}
            <button
              onClick={onCreateNew}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 p-4 min-h-[120px] transition-all duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Novo</p>
                <p className="text-[11px] text-muted-foreground">Novo produto</p>
              </div>
            </button>

            {/* Existing products */}
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="group flex flex-col rounded-xl border border-border hover:border-primary/40 bg-muted/30 hover:bg-primary/5 overflow-hidden transition-all duration-200"
              >
                {/* Icon area */}
                <div className="flex items-center justify-center py-4 bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
                {/* Info */}
                <div className="p-3 text-left">
                  <p className="text-sm font-semibold truncate text-foreground">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {product.description || typeLabels[product.type] || product.type}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-emerald-400">
                      {formatPrice(product.price_cents)}
                    </span>
                    {product.stock !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        {product.stock} variações
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && products.length > 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
