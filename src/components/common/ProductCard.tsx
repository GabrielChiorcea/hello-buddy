/**
 * ProductCard — Modern food delivery style
 * Mobile: compact horizontal card with circular + button
 * Desktop: vertical card with full add-to-cart button
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
        // Mobile: compact horizontal card
        'flex flex-row items-center gap-3 rounded-xl bg-card overflow-hidden transition-all group p-3',
        'shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)]',
        // Desktop: vertical card with hover elevation
        'md:flex-col md:items-stretch md:gap-0 md:p-0 md:rounded-2xl',
        'md:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)]',
        'md:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] md:hover:-translate-y-1',
        'md:transition-all md:duration-300',
        !product.isAvailable && 'opacity-60',
        className,
      )}
    >
      {/* Image */}
      <div className={cn(
        'relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-xl flex items-center justify-center',
        'md:w-full md:h-[180px] md:rounded-none md:rounded-t-2xl',
      )}>
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-xs font-semibold text-muted-foreground">Indisponibil</span>
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute left-2.5 top-2.5 text-[10px] hidden md:inline-flex bg-background/80 backdrop-blur-sm border-0"
        >
          {categoryNames[product.category] ?? product.category}
        </Badge>
      </div>

      {/* Info */}
      <div className={cn(
        'flex flex-1 min-w-0 flex-col justify-between gap-0.5',
        'md:p-4 md:gap-0',
      )}>
        <h3 className="font-semibold text-foreground text-sm md:text-[15px] md:leading-snug truncate md:truncate-none flex-1 min-w-0">
          {product.name}
        </h3>

        {/* Mobile: 1-line description */}
        <p className="text-xs text-muted-foreground truncate md:hidden">
          {product.ingredients && product.ingredients.length > 0
            ? product.ingredients.map(i => i.name).join(', ')
            : product.description}
        </p>

        {/* Desktop description */}
        <p className="text-[13px] text-muted-foreground line-clamp-2 hidden md:block mt-1 leading-relaxed">
          {product.description}
        </p>

        {/* Desktop: prep time + price row */}
        <div className="hidden md:flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            {product.preparationTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{product.preparationTime} min</span>
              </div>
            )}
            {pointsInfo && (
              <span className="text-[11px] text-muted-foreground">
                {pointsInfo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {product.price} {texts.common.currency}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable || isAdded}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full transition-all shrink-0',
                isAdded
                  ? 'bg-success text-success-foreground scale-95'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110',
                (!product.isAvailable || isAdded) && 'opacity-70',
              )}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile: price + circular add button */}
        <div className="flex items-center justify-between mt-1.5 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">
              {product.price} {texts.common.currency}
            </span>
            {pointsInfo && (
              <span className="text-[10px] text-muted-foreground">
                {pointsInfo}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0',
              isAdded
                ? 'bg-success text-success-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
              (!product.isAvailable || isAdded) && 'opacity-70',
            )}
          >
            {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
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
