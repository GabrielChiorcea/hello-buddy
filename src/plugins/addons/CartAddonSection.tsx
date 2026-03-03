/**
 * Plugin Add-ons – secțiunea "Adaugă la comandă" în coș
 * Mod avansat: sugestii bazate pe conținutul coșului (reguli per categorie).
 * Fallback: dacă nu există reguli, afișează add-on-urile globale.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { getImageUrl } from '@/lib/imageUrl';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { fetchSuggestedAddonsForCartApi, fetchAddonProductsApi } from '@/api/api';
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
  const cartItems = useAppSelector((state) => state.cart.items);
  const [addonProducts, setAddonProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract cart product IDs for the query
  const cartProductIds = useMemo(
    () => cartItems.map((item) => item.product.id),
    [cartItems]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchAddons = async () => {
      let res;
      if (cartProductIds.length > 0) {
        // Mod avansat: sugestii bazate pe conținutul coșului
        res = await fetchSuggestedAddonsForCartApi(cartProductIds);
      } else {
        // Coș gol: fallback la global
        res = await fetchAddonProductsApi();
      }

      if (cancelled) return;

      let products = res.success && res.data ? res.data : [];

      // Deduplicare de siguranță
      const seen = new Set<string>();
      products = products.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      // Exclude produsele deja în coș (fallback frontend)
      const cartIdSet = new Set(cartProductIds);
      products = products.filter((p) => !cartIdSet.has(p.id));

      setAddonProducts(products);
      setLoading(false);
    };

    fetchAddons();
    return () => {
      cancelled = true;
    };
  }, [cartProductIds]);

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
          Niciun produs add-on disponibil.
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
