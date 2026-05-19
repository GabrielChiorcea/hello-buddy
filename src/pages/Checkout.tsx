/**
 * Checkout — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useCheckoutStyle } from '@/config/themes';
import { createStyleVariants, StyleVariantSuspense } from '@/lib/styleVariants';
import { useCheckoutData } from './checkoutStyles/shared';
import type { CheckoutDisplayData } from './checkoutStyles/shared';

const CHECKOUT_VARIANTS = createStyleVariants<{ data: CheckoutDisplayData }>({
  gamified: () => import('./checkoutStyles/gamifiedCheckout').then((m) => ({ default: m.GamifiedCheckout })),
  clean: () => import('./checkoutStyles/cleanCheckout').then((m) => ({ default: m.CleanCheckout })),
  premium: () => import('./checkoutStyles/premiumCheckout').then((m) => ({ default: m.PremiumCheckout })),
  friendly: () => import('./checkoutStyles/friendlyCheckout').then((m) => ({ default: m.FriendlyCheckout })),
});

const Checkout: React.FC = () => {
  const style = useCheckoutStyle();
  const data = useCheckoutData();
  const Variant = CHECKOUT_VARIANTS[style];

  return (
    <StyleVariantSuspense>
      <Variant data={data} />
    </StyleVariantSuspense>
  );
};

export default Checkout;
