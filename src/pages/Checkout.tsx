/**
 * Checkout — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useCheckoutStyle } from '@/config/themes';
import { useCheckoutData } from './checkoutStyles/shared';
import { GamifiedCheckout } from './checkoutStyles/gamifiedCheckout';
import { CleanCheckout } from './checkoutStyles/cleanCheckout';
import { PremiumCheckout } from './checkoutStyles/premiumCheckout';
import { FriendlyCheckout } from './checkoutStyles/friendlyCheckout';

const CHECKOUT_VARIANTS = {
  gamified: GamifiedCheckout,
  clean: CleanCheckout,
  premium: PremiumCheckout,
  friendly: FriendlyCheckout,
} as const;

const Checkout: React.FC = () => {
  const style = useCheckoutStyle();
  const data = useCheckoutData();
  const Variant = CHECKOUT_VARIANTS[style];

  return <Variant data={data} />;
};

export default Checkout;
