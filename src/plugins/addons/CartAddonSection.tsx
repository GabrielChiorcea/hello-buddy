/**
 * Plugin Add-ons – secțiunea "Adaugă la comandă" în coș (Smart Add-ons V2)
 * Casino / Rewards style — dark cards, gold accents, shimmer effects.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Minus, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { motion } from 'framer-motion';

function suggestionFromProduct(p: Product): AddonSuggestion {
  return { product: p, ruleId: null };
}

function getBadges(
  product: Product,
  subtotal: number,
  ruleId: string | number | null,
): { key: string; label: string; variant: 'gold' | 'green' | 'default' }[] {
  const badges: { key: string; label: string; variant: 'gold' | 'green' | 'default' }[] = [];

  if (subtotal + product.price >= FREE_DELIVERY_THRESHOLD && subtotal < FREE_DELIVERY_THRESHOLD) {
    badges.push({ key: 'free-delivery', label: '🚚 Livrare gratuită', variant: 'green' });
  }

  if (ruleId) {
    badges.push({ key: 'match', label: '✨ Potrivire perfectă', variant: 'gold' });
  }

  const hour = new Date().getHours();
  if (hour >= 18) {
    badges.push({ key: 'evening', label: '🌙 Popular seara', variant: 'default' });
  } else if (hour >= 6 && hour < 11) {
    badges.push({ key: 'morning', label: '☀️ Ideal dimineața', variant: 'default' });
  }

  if (product.price <= 10) {
    badges.push({ key: 'cheap', label: 'Preț mic', variant: 'default' });
  }

  return badges.slice(0, 2);
}

const badgeStyles = {
  gold: 'bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-black font-bold',
  green: 'bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white font-bold',
  default: 'bg-white/20 text-white/90 backdrop-blur-sm font-medium',
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

  /* ── Section header ── */
  const sectionHeader = (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 streak-glow">
        <Gift className="h-4.5 w-4.5 text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Adaugă la comandă</h2>
        <p className="text-xs text-muted-foreground">Produse recomandate pentru tine</p>
      </div>
      <Sparkles className="h-4 w-4 text-amber-400/50 ml-auto streak-sparkle" />
    </div>
  );

  if (loading) {
    return (
      <div className="pt-6">
        {sectionHeader}
        <Carousel opts={{ align: 'start', loop: false, dragFree: true }} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {[0, 1, 2].map((i) => (
              <CarouselItem
                key={i}
                className="pl-2 md:pl-4 basis-full sm:basis-[280px] md:basis-[300px]"
              >
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/10 flex flex-col h-full">
                  <Skeleton className="h-36 w-full bg-white/5" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-1/3 bg-white/5" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                </div>
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
        {sectionHeader}
        <p className="text-sm text-muted-foreground">Niciun produs add-on disponibil.</p>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {sectionHeader}
      <Carousel opts={{ align: 'start', loop: false, dragFree: true }} className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {suggestions.map((s, idx) => {
            const product = s.product;
            const qty = getQuantity(product.id);
            const badges = getBadges(product, subtotal, s.ruleId);

            return (
              <CarouselItem
                key={product.id}
                className="pl-2 md:pl-4 basis-full sm:basis-[280px] md:basis-[300px]"
              >
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-amber-500/15 flex flex-col h-full shadow-xl shadow-amber-900/10 group hover:border-amber-500/30 transition-colors duration-300">
                    {/* Ambient glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />

                    {/* Image */}
                    <div className="relative overflow-hidden">
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

                      {/* Badges */}
                      {badges.length > 0 && (
                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                          {badges.map((b) => (
                            <span
                              key={b.key}
                              className={`text-[10px] px-2 py-0.5 rounded-full truncate max-w-full ${badgeStyles[b.variant]}`}
                            >
                              {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="font-semibold text-white truncate text-sm">{product.name}</p>
                      <p className="text-sm font-bold streak-shimmer mt-1">
                        {product.price} {texts.common.currency}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        {qty === 0 ? (
                          <Button
                            size="sm"
                            className="flex-1 relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold border-0 rounded-xl shadow-lg shadow-amber-500/20 streak-shine"
                            onClick={() => handleAdd(s)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adaugă
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 border border-amber-500/30 rounded-xl bg-amber-500/10">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-l-xl"
                              onClick={() => handleChangeQty(product.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold text-amber-400">{qty}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-r-xl"
                              onClick={() => handleChangeQty(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-y-1/2 bg-gray-800/80 border-amber-500/20 text-amber-400 hover:bg-gray-700 hover:text-amber-300" />
        <CarouselNext className="right-0 -translate-y-1/2 bg-gray-800/80 border-amber-500/20 text-amber-400 hover:bg-gray-700 hover:text-amber-300" />
      </Carousel>
    </div>
  );
}
