/**
 * ProductCard — Premium
 * Imagini mari, tipografie elegantă, umbre subtile — ideal pentru restaurante upscale.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Clock } from 'lucide-react';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { getProductUrl } from '@/config/routes';
import type { CardVariantProps } from './shared';

export const PremiumCard: React.FC<CardVariantProps> = ({ product, className, data }) => {
  const navigate = useNavigate();
  const { handleAddToCart, isAdded, pointsInfo, imageUrl, categoryLabel, showFreeRibbon, hasOptions } = data;

  return (
    <div
      className={cn(
        'flex flex-row items-center gap-4 bg-card overflow-hidden transition-all group p-3',
        'rounded-none border-b border-border/30',
        'md:flex-col md:items-stretch md:gap-0 md:p-0',
        'md:rounded-xl md:border md:border-border/30 md:border-b',
        'md:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]',
        'md:hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.1)]',
        'md:transition-shadow md:duration-500',
        !product.isAvailable && 'opacity-50',
        className,
      )}
    >
      {/* Imagine */}
      <div
        className={cn(
          'relative w-[80px] h-[80px] shrink-0 overflow-hidden rounded-lg',
          'md:w-full md:aspect-[3/2] md:h-auto md:rounded-none md:rounded-t-xl',
        )}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="text-xs font-light tracking-wider text-muted-foreground uppercase">Indisponibil</span>
          </div>
        )}
        <span className="absolute left-3 bottom-3 text-[10px] font-light tracking-widest uppercase text-card bg-foreground/70 backdrop-blur-sm px-2.5 py-1 hidden md:inline-block">
          {categoryLabel}
        </span>
        {showFreeRibbon && (
          <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none hidden md:block">
            <div className="absolute top-[10px] right-[-28px] w-[120px] text-center rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-0.5 shadow-sm">
              GRATIS
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex flex-1 min-w-0 flex-col justify-between gap-1', 'md:px-5 md:pt-4 md:pb-5 md:flex-1')}>
        <div className="flex items-center gap-1.5">
          <h3 className="font-light text-foreground text-sm md:text-base tracking-wide truncate md:whitespace-normal md:line-clamp-1">
            {product.name}
          </h3>
          {showFreeRibbon && (
            <span className="shrink-0 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded md:hidden">GRATIS</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate md:hidden">
          {product.ingredients?.length ? product.ingredients.map((i) => i.name).join(', ') : product.description}
        </p>
        <p className="text-[13px] text-muted-foreground/70 line-clamp-2 hidden md:block mt-1 font-light leading-relaxed">
          {product.description}
        </p>

        {/* Desktop bottom */}
        <div className="hidden md:flex items-end justify-between mt-auto pt-4">
          <div>
            <span className="text-xl font-light tracking-tight text-foreground">
              {product.price} {texts.common.currency}
            </span>
            {product.preparationTime && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mt-1">
                <Clock className="h-3 w-3" />
                <span>{product.preparationTime} min</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasOptions && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(getProductUrl(product.id));
                }}
                className={cn(
                  'px-3 h-10 rounded-full text-xs font-medium border border-primary/40 text-primary bg-primary/5',
                  'hover:bg-primary/10 transition-colors'
                )}
              >
                Alege extra
              </button>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable || isAdded}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full transition-all border',
                isAdded
                  ? 'border-success text-success bg-success/5'
                  : 'border-foreground/20 text-foreground hover:border-foreground/50 hover:bg-foreground/5',
                (!product.isAvailable || isAdded) && 'opacity-50',
              )}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile bottom */}
        <div className="flex items-center justify-between mt-1 md:hidden">
          <span className="text-sm font-light text-foreground">
            {product.price} {texts.common.currency}
          </span>
          <div className="flex items-center gap-1.5">
            {hasOptions && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(getProductUrl(product.id));
                }}
                className={cn(
                  'px-2.5 h-8 rounded-full text-[11px] font-medium border border-primary/40 text-primary bg-primary/5',
                  'hover:bg-primary/10 transition-colors'
                )}
              >
                Alege extra
              </button>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable || isAdded}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-all border',
                isAdded ? 'border-success text-success' : 'border-foreground/20 text-foreground hover:border-foreground/40',
                (!product.isAvailable || isAdded) && 'opacity-50',
              )}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
