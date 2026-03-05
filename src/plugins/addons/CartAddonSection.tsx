/**
 * Plugin Add-ons – secțiunea "Adaugă la comandă" în coș (Smart Add-ons V2)
 * Clean, lightweight design — small horizontal cards, no arrows, peek-scroll UX.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function getBadge(
  product: Product,
  subtotal: number,
  ruleId: string | number | null,
): { label: string; variant: 'primary' | 'success' | 'muted' } | null {
  if (subtotal + product.price >= FREE_DELIVERY_THRESHOLD && subtotal < FREE_DELIVERY_THRESHOLD) {
    return { label: '🚚 Livrare gratuită', variant: 'success' };
  }
  if (ruleId) {
    return { label: '✨ Recomandat', variant: 'primary' };
  }
  if (product.price <= 10) {
    return { label: 'Preț mic', variant: 'muted' };
  }
  return null;
}

const badgeStyles = {
  primary: 'bg-primary text-primary-foreground font-semibold shadow-sm',
  success: 'bg-success text-success-foreground font-semibold shadow-sm',
  muted: 'bg-accent text-accent-foreground font-medium',
};

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

  const sectionHeader = (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">🎁</span>
      <h3 className="text-sm font-bold text-foreground">Adaugă la comandă</h3>
      <span className="ml-auto text-xs text-muted-foreground italic">Swipe →</span>
    </div>
  );

  if (loading) {
    return (
      <div className="pt-4">
        {sectionHeader}
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[140px] rounded-xl border border-border bg-card overflow-hidden"
            >
              <Skeleton className="h-20 w-full" />
              <div className="p-2 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="pt-4">
      {sectionHeader}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mr-4 pr-4">
        {suggestions.map((s) => {
          const product = s.product;
          const qty = getQuantity(product.id);
          const badge = getBadge(product, subtotal, s.ruleId);

          return (
            <div
              key={product.id}
              className="shrink-0 w-[140px] rounded-xl border border-border bg-card overflow-hidden group hover:shadow-md transition-shadow duration-200"
            >
              {/* Image */}
              <div className="relative h-20 overflow-hidden">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {badge && (
                  <span
                    className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${badgeStyles[badge.variant]}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-2">
                <p className="text-xs font-medium text-foreground truncate leading-tight">
                  {product.name}
                </p>
                <p className="text-xs font-bold text-primary mt-0.5">
                  {product.price} {texts.common.currency}
                </p>

                <div className="mt-1.5">
                  {qty === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs rounded-lg border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAdd(s)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adaugă
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between border border-primary/30 rounded-lg h-7">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10 rounded-l-lg"
                        onClick={() => handleChangeQty(product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-bold text-foreground">{qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10 rounded-r-lg"
                        onClick={() => handleChangeQty(product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
