/**
 * ProductCard — Dispatcher care alege varianta vizuală
 * în funcție de stilul configurat la build-time în src/config/themes/styles.ts
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { getProductUrl } from '@/config/routes';
import { useProductCardStyle } from '@/config/themes/styles';
import { useProductCardData } from './productCardStyles/shared';
import { GamifiedCard } from './productCardStyles/gamifiedCard';
import { CleanCard } from './productCardStyles/cleanCard';
import { PremiumCard } from './productCardStyles/premiumCard';
import { FriendlyCard } from './productCardStyles/friendlyCard';

const CARD_VARIANTS = {
  gamified: GamifiedCard,
  clean: CleanCard,
  premium: PremiumCard,
  friendly: FriendlyCard,
} as const;

interface ProductCardProps {
  product: Product;
  className?: string;
  disableLink?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, disableLink = false }) => {
  const style = useProductCardStyle();
  const data = useProductCardData(product);
  const Variant = CARD_VARIANTS[style];

  const card = <Variant product={product} className={className} data={data} />;

  if (disableLink) return card;

  return (
    <Link to={getProductUrl(product.id)} className="block">
      {card}
    </Link>
  );
};

export { ProductCard };
