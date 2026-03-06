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
        // Mobile: glassmorphism card
        'flex flex-row items-center gap-4 rounded-2xl overflow-hidden transition-all group py-4 pl-4 pr-0',
        'bg-card/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)]',
        // Desktop: vertical card, solid background
        'md:flex-col md:items-stretch md:gap-0 md:py-0 md:pl-0 md:pr-0 md:rounded-xl md:bg-card md:backdrop-blur-none md:border-border md:shadow-sm',
        !product.isAvailable && 'opacity-60',
        className,
      )}
    >
      {/* Image */}
      <div className={cn(
        // Mobile: poză cu border-radius, centrată vertical
        'relative w-28 h-28 shrink-0 overflow-hidden rounded-xl flex items-center justify-center',
        // Desktop: full width, aspect ratio
        'md:w-full md:h-auto md:aspect-[4/3] md:rounded-none',
      )}>
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
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

      {/* Info – Mobile layout */}
      <div className={cn(
        'flex flex-1 min-w-0 flex-col justify-between gap-3 pr-4',
        'md:p-4 md:pr-4 md:gap-1',
      )}>
        {/* Row 1: Title + Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm md:text-base truncate md:line-clamp-1 flex-1 min-w-0">
            {product.name}
          </h3>
          <span className="text-sm md:text-lg font-bold text-primary whitespace-nowrap shrink-0">
            {product.price} {texts.common.currency}
          </span>
        </div>

        {/* Row 2: Ingredients (mobile, toate afișate) / description (desktop) */}
        {product.ingredients && product.ingredients.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 md:hidden md:mt-0">
            {product.ingredients.map(i => i.name).join(', ')}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 hidden md:block md:mt-1">
          {product.description}
        </p>
        {/* Desktop prep time */}
        {product.preparationTime && (
          <div className="items-center gap-1 text-xs text-muted-foreground mt-1 hidden md:flex md:mt-2">
            <Clock className="h-3 w-3" />
            <span>{product.preparationTime} min</span>
          </div>
        )}

        {/* Row 3: Add to cart button */}
        <div className="flex items-center justify-between mt-3 md:mt-3">
          {pointsInfo && (
            <span className="text-[10px] text-muted-foreground">
              {pointsInfo}
            </span>
          )}
          {/* Mobile: full-width cart button with icon */}
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'ml-auto md:hidden h-9 px-3 rounded-lg transition-all text-xs',
              isAdded && 'bg-success hover:bg-success',
            )}
          >
            {isAdded ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                {texts.catalog.added}
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                {texts.catalog.addToCart}
              </>
            )}
          </Button>
          {/* Desktop button */}
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
