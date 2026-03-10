/**
 * ProductCard — Friendly / Casual
 * Stil cald, rotunjit, umbre moi — ideal pentru bistro, italian.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, Plus } from 'lucide-react';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import type { CardVariantProps } from './shared';

export const FriendlyCard: React.FC<CardVariantProps> = ({ product, className, data }) => {
  const { handleAddToCart, isAdded, pointsInfo, imageUrl, categoryLabel } = data;

  return (
    <div
      className={cn(
        'flex flex-row items-center gap-3 rounded-xl bg-card overflow-hidden transition-all group p-3',
        'shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)]',
        'md:flex-col md:items-stretch md:gap-0 md:p-0 md:rounded-2xl',
        'md:border md:border-border/40',
        'md:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_14px_-2px_rgba(0,0,0,0.06)]',
        'md:hover:shadow-[0_4px_6px_rgba(0,0,0,0.04),0_12px_28px_-4px_rgba(0,0,0,0.12)]',
        'md:hover:-translate-y-0.5 md:transition-all md:duration-300 md:ease-out',
        !product.isAvailable && 'opacity-60',
        className,
      )}
    >
      {/* Imagine */}
      <div
        className={cn(
          'relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-xl flex items-center justify-center',
          'md:w-full md:aspect-[4/3] md:h-auto md:rounded-none md:rounded-t-2xl',
        )}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <span className="text-xs font-semibold text-muted-foreground">Indisponibil</span>
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 text-[10px] font-medium hidden md:inline-flex bg-card/90 backdrop-blur-md border-0 shadow-sm px-2.5 py-0.5"
        >
          {categoryLabel}
        </Badge>
      </div>

      {/* Info */}
      <div className={cn('flex flex-1 min-w-0 flex-col justify-between gap-0.5', 'md:px-4 md:pt-3.5 md:pb-4 md:gap-0 md:flex-1')}>
        <h3 className="font-semibold text-foreground text-sm md:text-[15px] md:leading-snug truncate md:whitespace-normal md:line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate md:hidden">
          {product.ingredients?.length ? product.ingredients.map((i) => i.name).join(', ') : product.description}
        </p>
        <p className="text-[13px] text-muted-foreground/80 line-clamp-1 hidden md:block mt-1.5 leading-relaxed">{product.description}</p>

        {/* Desktop bottom */}
        <div className="hidden md:block mt-auto pt-3">
          <div className="border-t border-border/50 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {product.preparationTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{product.preparationTime} min</span>
                </div>
              )}
              {pointsInfo && <span className="text-[11px] text-muted-foreground/70">{pointsInfo}</span>}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-primary tracking-tight">
                {product.price} {texts.common.currency}
              </span>
              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable || isAdded}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all shrink-0',
                  isAdded
                    ? 'bg-success text-success-foreground scale-95'
                    : 'bg-primary text-primary-foreground hover:bg-primary/85 active:scale-95',
                  (!product.isAvailable || isAdded) && 'opacity-70',
                )}
              >
                {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile bottom */}
        <div className="flex items-center justify-between mt-1.5 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">
              {product.price} {texts.common.currency}
            </span>
            {pointsInfo && <span className="text-[10px] text-muted-foreground">{pointsInfo}</span>}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0',
              isAdded ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90',
              (!product.isAvailable || isAdded) && 'opacity-70',
            )}
          >
            {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
