/**
 * Shared hook și tipuri pentru variantele ProductCard.
 */

import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { texts } from '@/config/texts';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { toast } from '@/hooks/use-toast';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { getImageUrl } from '@/lib/imageUrl';

const categoryNames: Record<string, string> = {
  pizza: 'Pizza',
  burger: 'Burgeri',
  paste: 'Paste',
  salate: 'Salate',
  desert: 'Deserturi',
  bauturi: 'Băuturi',
};

export interface ProductCardDisplayData {
  handleAddToCart: (e: React.MouseEvent) => void;
  isAdded: boolean;
  pointsInfo: string | null;
  imageUrl: string;
  categoryLabel: string;
  /** Whether to show the "GRATIS" corner ribbon */
  showFreeRibbon: boolean;
  /** Produsul are opțiuni configurabile (optionGroups) */
  hasOptions: boolean;
}

export interface CardVariantProps {
  product: Product;
  className?: string;
  data: ProductCardDisplayData;
  /** Ingrediente/descriere max. 2 rânduri — evită carduri uriașe (ex. Produse similare) */
  compactSubtitle?: boolean;
}

/** O singură linie de text pentru zona meta a cardului */
export function getProductCardMetaLine(product: Product): string {
  if (product.ingredients?.length) {
    return product.ingredients.map((i) => i.name).join(', ');
  }
  return product.description || '';
}

export function useProductCardData(
  product: Product,
  opts?: { suppressLoyaltyHints?: boolean }
): ProductCardDisplayData {
  const suppressLoyaltyHints = opts?.suppressLoyaltyHints ?? false;
  const dispatch = useAppDispatch();
  const [isAdded, setIsAdded] = useState(false);
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const cartItems = useAppSelector((s) => s.cart.items);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem({ product }));
    setIsAdded(true);
    toast({ title: texts.notifications.addedToCart, description: product.name });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const pointsInfo =
    suppressLoyaltyHints || !tiersEnabled || !isAuthenticated || !user?.tier
      ? null
      : (() => {
          const base = Math.max(1, Math.round(product.price));
          const mult = user.tier?.pointsMultiplier ?? 1;
          return `+${Math.round(base * mult)} pct`;
        })();

  // Determine if this product should show the free ribbon
  const showFreeRibbon = useMemo(() => {
    if (suppressLoyaltyHints) return false;
    const campaigns = user?.freeProductCampaignsSummary;
    if (!campaigns || campaigns.length === 0) return false;

    // Collect category names from campaigns + all free product IDs
    const freeCategories = new Set<string>();
    const freeProductIds = new Set<string>();
    for (const c of campaigns) {
      // Use campaign-level categoryName (direct from campaign)
      if (c.categoryName) {
        freeCategories.add(c.categoryName);
      }
      if (c.productDetails) {
        for (const p of c.productDetails) {
          freeCategories.add(p.categoryName);
          freeProductIds.add(p.id);
        }
      }
    }

    // This product's category must match a free campaign category
    if (!freeCategories.has(product.category)) return false;

    // Check if cart already has a product from this category that's in the free list
    const cartHasFreeFromCategory = cartItems.some(
      (ci) => freeProductIds.has(ci.product.id) && ci.product.category === product.category
    );
    if (cartHasFreeFromCategory) return false;

    return true;
  }, [suppressLoyaltyHints, user?.freeProductCampaignsSummary, product.category, cartItems]);

  return {
    handleAddToCart,
    isAdded,
    pointsInfo,
    imageUrl: getImageUrl(product.image),
    categoryLabel: categoryNames[product.category] ?? product.category,
    showFreeRibbon,
    hasOptions: Array.isArray(product.optionGroups) && product.optionGroups.length > 0,
  };
}
