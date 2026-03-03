/**
 * Plugin Add-ons – secțiunea "Adaugă la comandă" în coș
 * Afișează produsele marcate în Admin ca add-on la coș, grupate pe categorie.
 */

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppDispatch } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { getImageUrl } from '@/lib/imageUrl';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { fetchAddonProductsApi } from '@/api/api';
import { Product } from '@/types';

function groupByCategory(products: Product[]): { displayName: string; products: Product[] }[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.category || 'Altele';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).map(([displayName, products]) => ({ displayName, products }));
}

export function CartAddonSection() {
  const dispatch = useAppDispatch();
  const [addonProducts, setAddonProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAddonProductsApi().then((res) => {
      if (cancelled) return;
      setAddonProducts(res.success && res.data ? res.data : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddAddon = (product: Product) => {
    dispatch(addItem(product));
    toast({
      title: 'Adăugat în coș',
      description: product.name,
    });
  };

  const groups = groupByCategory(addonProducts);

  return (
    <div className="pt-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Adaugă la comandă
      </h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Se încarcă...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Niciun produs add-on configurat. Marchează produse din Admin → Produse ca «Add-on la coș».
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ displayName, products }) => (
            <div key={displayName}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {displayName}
              </h3>
              <div className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <Card key={product.id} className="flex items-center gap-3 p-3 w-full max-w-md">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-14 w-14 rounded-md object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {product.price} {texts.common.currency}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddAddon(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adaugă
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
