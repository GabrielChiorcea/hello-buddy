/**
 * ProductCard — Clean / Minimal
 * Fără umbre, flat, simplu — ideal pentru healthy brands, salad bars.
 */

import React from 'react';
import { Check, Plus } from 'lucide-react';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { CardVariantProps } from './shared';

export const CleanCard: React.FC<CardVariantProps> = ({ product, className, data }) => {
  const { handleAddToCart, isAdded, imageUrl, showFreeRibbon } = data;

  return (
    <div
      className={cn(
        'flex flex-row items-center gap-3 rounded-lg bg-card overflow-hidden transition-colors group p-3',
        'border border-border/30',
        'md:flex-col md:items-stretch md:gap-0 md:p-0',
        'md:border md:border-border/50 md:rounded-lg',
        'md:hover:border-border md:transition-colors',
        !product.isAvailable && 'opacity-50',
        className,
      )}
    >
      {/* Imagine */}
      <div
        className={cn(
          'relative w-[64px] h-[64px] shrink-0 overflow-hidden rounded-md',
          'md:w-full md:aspect-square md:h-auto md:rounded-none md:rounded-t-lg',
        )}
      >
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="text-xs text-muted-foreground">Indisponibil</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex flex-1 min-w-0 flex-col gap-0.5', 'md:p-3 md:flex-1')}>
        <h3 className="font-medium text-foreground text-sm truncate">{product.name}</h3>
        <p className="text-xs text-muted-foreground truncate md:hidden">
          {product.description}
        </p>
        <p className="text-[13px] text-muted-foreground/70 line-clamp-1 hidden md:block">{product.description}</p>

        {/* Desktop bottom */}
        <div className="hidden md:flex items-center justify-between mt-auto pt-2">
          <span className="text-sm font-semibold text-foreground">
            {product.price} {texts.common.currency}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
              isAdded ? 'bg-success/10 text-success' : 'bg-secondary text-foreground hover:bg-secondary/80',
              (!product.isAvailable || isAdded) && 'opacity-50',
            )}
          >
            {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Mobile bottom */}
        <div className="flex items-center justify-between mt-1 md:hidden">
          <span className="text-sm font-semibold text-foreground">
            {product.price} {texts.common.currency}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
              isAdded ? 'bg-success/10 text-success' : 'bg-secondary text-foreground hover:bg-secondary/80',
              (!product.isAvailable || isAdded) && 'opacity-50',
            )}
          >
            {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
