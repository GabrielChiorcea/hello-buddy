/**
 * ProductCard — Dispatcher care alege varianta vizuală
 * în funcție de stilul configurat la build-time în src/config/themes/index.ts
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { getProductUrl } from '@/config/routes';
import { useProductCardStyle } from '@/config/themes';
import { createStyleVariants, StyleVariantSuspense } from '@/lib/styleVariants';
import { useProductCardData, type CardVariantProps } from './productCardStyles/shared';

const CARD_VARIANTS = createStyleVariants<CardVariantProps>({
  gamified: () => import('./productCardStyles/gamifiedCard').then((m) => ({ default: m.GamifiedCard })),
  clean: () => import('./productCardStyles/cleanCard').then((m) => ({ default: m.CleanCard })),
  premium: () => import('./productCardStyles/premiumCard').then((m) => ({ default: m.PremiumCard })),
  friendly: () => import('./productCardStyles/friendlyCard').then((m) => ({ default: m.FriendlyCard })),
});

interface ProductCardProps {
  product: Product;
  className?: string;
  disableLink?: boolean;
  /** Ascunde puncte loialitate și panglica „gratis” (ex. în catalog) */
  suppressLoyaltyHints?: boolean;
  /** Limitează ingredientele/descrierea la 2 rânduri */
  compactSubtitle?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  disableLink = false,
  suppressLoyaltyHints = false,
  compactSubtitle = false,
}) => {
  const style = useProductCardStyle();
  const data = useProductCardData(product, { suppressLoyaltyHints });
  const Variant = CARD_VARIANTS[style];

  const card = (
    <StyleVariantSuspense>
      <Variant product={product} className={className} data={data} compactSubtitle={compactSubtitle} />
    </StyleVariantSuspense>
  );

  if (disableLink) return card;

  return (
    <Link to={getProductUrl(product.id)} className="block">
      {card}
    </Link>
  );
};

export { ProductCard };
