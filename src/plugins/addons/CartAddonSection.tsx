/**
 * Plugin Add-ons – secțiunea "Adaugă la comandă" în coș (Smart Add-ons V2)
 * Carousel orizontal, badge-uri contextuale, selector cantitate după prima adăugare.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem, changeQuantity } from '@/store/slices/cartSlice';
import { getImageUrl } from '@/lib/imageUrl';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import {
  fetchSuggestedAddonsForCartApi,
  fetchAddonProductsApi,
  trackAddonConversion,
  type AddonSuggestion,
} from '@/api/api';
import { Product } from '@/types';
import { FREE_DELIVERY_THRESHOLD } from '@/config/cart';

function suggestionFromProduct(p: Product): AddonSuggestion {
  return { product: p, ruleId: null };
}

function getBadges(
  product: Product,
  subtotal: number,
  ruleId: string | number | null,
): { key: string; label: string }[] {
  const badges: { key: string; label: string }[] = [];

  // Contextual: free delivery threshold
  if (subtotal + product.price >= FREE_DELIVERY_THRESHOLD && subtotal < FREE_DELIVERY_THRESHOLD) {
    badges.push({ key: 'free-delivery', label: 'Livrare gratuită cu acest produs' });
  }

  // Contextual: rule-based suggestion = perfect match
  if (ruleId) {
    badges.push({ key: 'match', label: 'Potrivire perfectă' });
  }

  // Time-based
  const hour = new Date().getHours();
  if (hour >= 18) {
    badges.push({ key: 'evening', label: 'Popular seara' });
  } else if (hour >= 6 && hour < 11) {
    badges.push({ key: 'morning', label: 'Ideal pentru dimineață' });
  }

  // Price-based
  if (product.price <= 10) {
    badges.push({ key: 'cheap', label: 'Preț mic' });
  }

  return badges.slice(0, 2);
}

export function CartAddonSection() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const subtotal = useAppSelector((state) => state.cart.subtotal);
  const [suggestions, setSuggestions] = useState<AddonSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const cartProductIds = useMemo(
    () => cartItems.flatMap((item) => Array(item.quantity).fill(item.product.id)),
    [cartItems]
  );

  const cartKey = useMemo(
    () => (cartProductIds.length ? cartProductIds.join(',') : ''),
    [cartProductIds]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchAddons = async () => {
      let list: AddonSuggestion[];
      if (cartProductIds.length > 0) {
        const res = await fetchSuggestedAddonsForCartApi(cartProductIds);
        list = res.success && res.data ? res.data : [];
      } else {
        const res = await fetchAddonProductsApi();
        const products = res.success && res.data ? res.data : [];
        list = products.map(suggestionFromProduct);
      }

      if (cancelled) return;

      const seen = new Set<string>();
      list = list.filter((s) => {
        if (seen.has(s.product.id)) return false;
        seen.add(s.product.id);
        return true;
      });
      const cartIdSet = new Set(cartProductIds);
      list = list.filter((s) => !cartIdSet.has(s.product.id));

      setSuggestions(list);
      setLoading(false);
    };

    fetchAddons();
    return () => {
      cancelled = true;
    };
  }, [cartKey, cartProductIds]);

  const getQuantity = (productId: string) =>
    cartItems.find((i) => i.product.id === productId)?.quantity ?? 0;

  const handleAdd = (suggestion: AddonSuggestion) => {
    dispatch(addItem(suggestion.product));
    toast({ title: 'Adăugat în coș', description: suggestion.product.name });
    trackAddonConversion({
      productId: suggestion.product.id,
      ruleId: suggestion.ruleId,
      origin: 'origin_addons',
      cartValue: subtotal,
    });
  };

  const handleChangeQty = (productId: string, delta: number) => {
    const q = getQuantity(productId);
    const newQty = q + delta;
    if (newQty <= 0) {
      // 0 scoate produsul din coș (folosește logica existentă din cartSlice)
      dispatch(changeQuantity({ productId, quantity: 0 }));
      return;
    }
    dispatch(changeQuantity({ productId, quantity: newQty }));
    if (delta > 0) {
      const s = suggestions.find((x) => x.product.id === productId);
      if (s) {
        trackAddonConversion({
          productId: s.product.id,
          ruleId: s.ruleId,
          origin: 'origin_addons',
          cartValue: subtotal,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="pt-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Adaugă la comandă</h2>
        <Carousel
          opts={{
            align: 'start',
            loop: false,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {[0, 1, 2].map((i) => (
              <CarouselItem
                key={i}
                className="pl-2 md:pl-4 basis-full sm:basis-[280px] md:basis-[300px]"
              >
                <Card className="overflow-hidden flex flex-col h-full">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="pt-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Adaugă la comandă</h2>
        <p className="text-sm text-muted-foreground">Niciun produs add-on disponibil.</p>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Adaugă la comandă</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {suggestions.map((s) => {
            const product = s.product;
            const qty = getQuantity(product.id);
            const badges = getBadges(product, subtotal, s.ruleId);

            return (
              <CarouselItem
                key={product.id}
                className="pl-2 md:pl-4 basis-full sm:basis-[280px] md:basis-[300px]"
              >
                <Card className="overflow-hidden flex flex-col h-full">
                  <div className="relative">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-32 w-full object-cover"
                    />
                    {badges.length > 0 && (
                      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                        {badges.map((b) => (
                          <span
                            key={b.key}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground truncate max-w-full"
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="font-medium text-foreground truncate text-sm">{product.name}</p>
                    <p className="text-sm text-primary font-medium mt-0.5">
                      {product.price} {texts.common.currency}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {qty === 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleAdd(s)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adaugă
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleChangeQty(product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{qty}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleChangeQty(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-y-1/2" />
        <CarouselNext className="right-0 -translate-y-1/2" />
      </Carousel>
    </div>
  );
}
