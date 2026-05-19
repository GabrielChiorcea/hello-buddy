/**
 * Cart — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useCartStyle } from '@/config/themes';
import { createStyleVariants, StyleVariantSuspense } from '@/lib/styleVariants';
import { useCartData } from './cartStyles/shared';
import type { CartDisplayData } from './cartStyles/shared';

const CART_VARIANTS = createStyleVariants<{ data: CartDisplayData }>({
  gamified: () => import('./cartStyles/gamifiedCart').then((m) => ({ default: m.GamifiedCart })),
  clean: () => import('./cartStyles/cleanCart').then((m) => ({ default: m.CleanCart })),
  premium: () => import('./cartStyles/premiumCart').then((m) => ({ default: m.PremiumCart })),
  friendly: () => import('./cartStyles/friendlyCart').then((m) => ({ default: m.FriendlyCart })),
});

const Cart: React.FC = () => {
  const style = useCartStyle();
  const data = useCartData();
  const Variant = CART_VARIANTS[style];

  return (
    <StyleVariantSuspense>
      <Variant data={data} />
    </StyleVariantSuspense>
  );
};

export default Cart;
