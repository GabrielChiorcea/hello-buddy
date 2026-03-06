/**
 * ProductCard — Glovo-style responsive card
 * Mobile: horizontal list item (image left, info right)
 * Desktop: vertical card with image on top
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, Check, Plus } from 'lucide-react';
import { Product } from '@/types';
import { texts } from '@/config/texts';
import { getProductUrl } from '@/config/routes';
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageUrl';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';

const categoryNames: Record<string, string> = {
  pizza: 'Pizza',
  burger: 'Burgeri',
  paste: 'Paste',
  salate: 'Salate',
  desert: 'Deserturi',
  bauturi: 'Băuturi',
};

interface ProductCardProps {
  product: Product;
  className?: string;
  disableLink?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, disableLink = false }) => {
  const dispatch = useAppDispatch();
  const [isAdded, setIsAdded] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem(product));
    setIsAdded(true);
    toast({
      title: texts.notifications.addedToCart,
      description: product.name,
    });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const pointsInfo = tiersEnabled && isAuthenticated && user?.tier ? (() => {
    const basePoints = Math.max(1, Math.round(product.price));
    const multiplier = user.tier?.pointsMultiplier ?? 1;
    const withBonus = Math.round(basePoints * multiplier);
    return `+${withBonus} pct`;
  })() : null;

  const cardContent = (
    <div
      className={cn(
        // Mobile: horizontal row
        'flex flex-row items-stretch gap-0 rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md group',
        // Desktop: vertical card
        'md:flex-col',
        !product.isAvailable && 'opacity-60',
        className,
      )}
    >
      {/* Image */}
      <div className={cn(
        // Mobile: small square on left
        'relative w-28 shrink-0 overflow-hidden',
        // Desktop: full width, aspect ratio
        'md:w-full md:aspect-[4/3]',
      )}>
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-xs font-semibold text-muted-foreground">Indisponibil</span>
          </div>
        )}
        {/* Desktop-only category badge */}
        <Badge
          variant="secondary"
          className="absolute left-2 top-2 text-[10px] hidden md:inline-flex"
        >
          {categoryNames[product.category] ?? product.category}
        </Badge>
      </div>

      {/* Info */}
      <div className={cn(
        'flex flex-1 min-w-0 p-3 gap-2',
        // Mobile: row layout with info left, action right
        'flex-row items-center justify-between',
        // Desktop: column layout
        'md:flex-col md:items-stretch md:p-4',
      )}>
        {/* Text block */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm md:text-base truncate md:line-clamp-1">
            {product.name}
          </h3>
          {/* Mobile: category inline, Desktop: description */}
          <p className="text-xs text-muted-foreground mt-0.5 md:hidden">
            {categoryNames[product.category] ?? product.category}
            {product.preparationTime && ` · ${product.preparationTime} min`}
          </p>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 hidden md:block">
            {product.description}
          </p>
          {/* Desktop prep time */}
          {product.preparationTime && (
            <div className="items-center gap-1 text-xs text-muted-foreground mt-2 hidden md:flex">
              <Clock className="h-3 w-3" />
              <span>{product.preparationTime} min</span>
            </div>
          )}
        </div>

        {/* Price + action */}
        <div className={cn(
          'flex items-center gap-2 shrink-0',
          'md:flex-row md:justify-between md:mt-3',
        )}>
          <div className="flex flex-col items-end md:items-start">
            <span className="text-sm md:text-lg font-bold text-primary whitespace-nowrap">
              {product.price} {texts.common.currency}
            </span>
            {pointsInfo && (
              <span className="text-[10px] text-muted-foreground hidden md:block">
                {pointsInfo}
              </span>
            )}
          </div>

          {/* Mobile: compact round button; Desktop: full button */}
          <Button
            size="icon"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'h-8 w-8 rounded-full shrink-0 md:hidden transition-all',
              isAdded && 'bg-success hover:bg-success',
            )}
          >
            {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'hidden md:inline-flex transition-all',
              isAdded && 'bg-success hover:bg-success',
            )}
          >
            {isAdded ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                {texts.catalog.added}
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1 h-4 w-4" />
                {texts.catalog.addToCart}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (disableLink) return cardContent;

  return (
    <Link to={getProductUrl(product.id)} className="block">
      {cardContent}
    </Link>
  );
};

export { ProductCard };
