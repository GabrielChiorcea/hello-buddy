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
        'flex flex-row items-stretch gap-0 rounded-2xl overflow-hidden transition-all group',
        'bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.10)]',
        // Desktop: vertical card, solid background
        'md:flex-col md:rounded-xl md:bg-card md:backdrop-blur-none md:border-border md:shadow-sm',
        !product.isAvailable && 'opacity-60',
        className,
      )}
    >
      {/* Image */}
      <div className={cn(
        // Mobile: square image with rounded corners, padding around it
        'relative w-[120px] shrink-0 overflow-hidden m-3 rounded-2xl shadow-lg flex items-center justify-center',
        // Desktop: full width, aspect ratio
        'md:w-full md:h-auto md:aspect-[4/3] md:rounded-none md:shadow-none md:m-0',
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

      {/* Info */}
      <div className={cn(
        'flex flex-1 min-w-0 flex-col justify-between py-3 pr-3',
        'md:p-4 md:gap-1',
      )}>
        {/* Title */}
        <h3 className="font-bold text-foreground text-base md:text-base truncate md:line-clamp-1 min-w-0">
          {product.name}
        </h3>

        {/* Ingredients (mobile) / description (desktop) */}
        {product.ingredients && product.ingredients.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 md:hidden">
            {product.ingredients.map(i => i.name).join(', ')}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 hidden md:block md:mt-1">
          {product.description}
        </p>

        {/* Price - prominent on mobile */}
        <span className="text-lg md:text-lg font-extrabold text-primary mt-1.5 md:hidden">
          {product.price} {texts.common.currency}
        </span>
        {/* Desktop price inline */}
        <span className="text-lg font-bold text-primary hidden md:block mt-1">
          {product.price} {texts.common.currency}
        </span>

        {/* Desktop prep time */}
        {product.preparationTime && (
          <div className="items-center gap-1 text-xs text-muted-foreground mt-1 hidden md:flex md:mt-2">
            <Clock className="h-3 w-3" />
            <span>{product.preparationTime} min</span>
          </div>
        )}

        {pointsInfo && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {pointsInfo}
          </span>
        )}

        {/* Add to cart button - wide on mobile */}
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={!product.isAvailable || isAdded}
          className={cn(
            'md:hidden mt-2 w-full h-10 rounded-xl transition-all text-sm font-semibold shadow-md',
            isAdded && 'bg-success hover:bg-success',
          )}
        >
          {isAdded ? (
            <>
              <Check className="mr-1.5 h-4 w-4" />
              {texts.catalog.added}
            </>
          ) : (
            <>
              <ShoppingCart className="mr-1.5 h-4 w-4" />
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
            'hidden md:inline-flex transition-all mt-2',
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
  );

  if (disableLink) return cardContent;

  return (
    <Link to={getProductUrl(product.id)} className="block">
      {cardContent}
    </Link>
  );
};

export { ProductCard };
