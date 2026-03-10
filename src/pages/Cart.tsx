/**
 * Cart — Dispatcher care alege varianta vizuală
 */

import React from 'react';
import { useCartStyle } from '@/config/themes';
import { useCartData } from './cartStyles/shared';
import { GamifiedCart } from './cartStyles/gamifiedCart';
import { CleanCart } from './cartStyles/cleanCart';
import { PremiumCart } from './cartStyles/premiumCart';
import { FriendlyCart } from './cartStyles/friendlyCart';

const CART_VARIANTS = {
  gamified: GamifiedCart,
  clean: CleanCart,
  premium: PremiumCart,
  friendly: FriendlyCart,
} as const;

const Cart: React.FC = () => {
  const style = useCartStyle();
  const data = useCartData();
  const Variant = CART_VARIANTS[style];

  return <Variant data={data} />;
};

export default Cart;
