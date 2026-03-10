/**
 * Shared hook și tipuri pentru variantele ProductCard.
 */

import { useState } from 'react';
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
}

export interface CardVariantProps {
  product: Product;
  className?: string;
  data: ProductCardDisplayData;
}

export function useProductCardData(product: Product): ProductCardDisplayData {
  const dispatch = useAppDispatch();
  const [isAdded, setIsAdded] = useState(false);
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem(product));
    setIsAdded(true);
    toast({ title: texts.notifications.addedToCart, description: product.name });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const pointsInfo =
    tiersEnabled && isAuthenticated && user?.tier
      ? (() => {
          const base = Math.max(1, Math.round(product.price));
          const mult = user.tier?.pointsMultiplier ?? 1;
          return `+${Math.round(base * mult)} pct`;
        })()
      : null;

  return {
    handleAddToCart,
    isAdded,
    pointsInfo,
    imageUrl: getImageUrl(product.image),
    categoryLabel: categoryNames[product.category] ?? product.category,
  };
}
