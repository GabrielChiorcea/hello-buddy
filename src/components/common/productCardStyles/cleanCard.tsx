/**
 * ProductCard — Clean / Minimal
 * Fără umbre, flat, simplu — ideal pentru healthy brands, salad bars.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { texts } from '@/config/texts';
import { cn, formatDisplayNumber } from '@/lib/utils';
import { getProductUrl } from '@/config/routes';
import type { CardVariantProps } from './shared';
import { getProductCardMetaLine } from './shared';

export const CleanCard: React.FC<CardVariantProps> = ({ product, className, data, compactSubtitle }) => {
  const navigate = useNavigate();
  const { handleAddToCart, isAdded, imageUrl, showFreeRibbon, hasOptions, activeCouponDiscount } = data;
  const formatMoney = (value: number) =>
    `${formatDisplayNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${texts.common.currency}`;

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
        {activeCouponDiscount > 0 && (
          <span className="absolute right-2 top-2 z-10 hidden h-9 min-w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold px-2 shadow-sm md:inline-flex">
            -{activeCouponDiscount}%
          </span>
        )}
        {showFreeRibbon && (
          <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none hidden md:block">
            <div className="absolute top-[10px] right-[-28px] w-[120px] text-center rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-0.5 shadow-sm">
              GRATIS
            </div>
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="text-xs text-muted-foreground">Indisponibil</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex flex-1 min-w-0 flex-col gap-0.5', 'md:p-3 md:flex-1')}>
        <div className="flex items-center gap-1.5">
          <h3 className="font-medium text-foreground text-sm truncate">{product.name}</h3>
          {showFreeRibbon && (
            <span className="shrink-0 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded md:hidden">GRATIS</span>
          )}
        </div>
        {compactSubtitle ? (
          <p className="text-xs md:text-[13px] text-muted-foreground/70 line-clamp-2 break-words min-w-0 mt-0.5 leading-snug">
            {getProductCardMetaLine(product)}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground truncate md:hidden">{product.description}</p>
            <p className="text-[13px] text-muted-foreground/70 line-clamp-1 hidden md:block">{product.description}</p>
          </>
        )}

        {/* Desktop bottom */}
        <div className="hidden md:flex items-center justify-between mt-auto pt-2">
          <span className="text-sm font-semibold text-foreground">
            {formatMoney(product.price)}
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
                  'px-2.5 h-7 rounded-full text-[11px] font-medium border border-primary/40 text-primary bg-primary/5',
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
                'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                isAdded ? 'bg-success/10 text-success' : 'bg-secondary text-foreground hover:bg-secondary/80',
                (!product.isAvailable || isAdded) && 'opacity-50',
              )}
            >
              {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Mobile bottom */}
        <div className="flex items-center justify-between mt-1 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatMoney(product.price)}
            </span>
            {activeCouponDiscount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1.5">
                -{activeCouponDiscount}%
              </span>
            )}
          </div>
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
                  'px-2 h-7 rounded-full text-[11px] font-medium border border-primary/40 text-primary bg-primary/5',
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
    </div>
  );
};
