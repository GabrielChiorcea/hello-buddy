/**
 * ProductCard — Friendly / Casual
 * Stil cald, rotunjit, umbre moi — ideal pentru bistro, italian.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, Plus } from 'lucide-react';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { getProductUrl } from '@/config/routes';
import type { CardVariantProps } from './shared';
import { getProductCardMetaLine } from './shared';

export const FriendlyCard: React.FC<CardVariantProps> = ({ product, className, data, compactSubtitle }) => {
  const navigate = useNavigate();
  const { handleAddToCart, isAdded, pointsInfo, imageUrl, categoryLabel, showFreeRibbon, hasOptions, activeCouponDiscount } = data;

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
        {activeCouponDiscount > 0 && (
          <span className="absolute right-2 top-2 z-10 hidden h-10 min-w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-extrabold px-2 shadow-md md:inline-flex">
            -{activeCouponDiscount}%
          </span>
        )}
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
        {showFreeRibbon && (
          <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none hidden md:block">
            <div className="absolute top-[10px] right-[-28px] w-[120px] text-center rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-0.5 shadow-sm">
              GRATIS
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('flex flex-1 min-w-0 flex-col justify-between gap-0.5', 'md:px-4 md:pt-3.5 md:pb-4 md:gap-0 md:flex-1')}>
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-foreground text-sm md:text-[15px] md:leading-snug truncate md:whitespace-normal md:line-clamp-1">
            {product.name}
          </h3>
          {showFreeRibbon && (
            <span className="shrink-0 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded md:hidden">GRATIS</span>
          )}
        </div>
        {compactSubtitle ? (
          <p className="text-xs md:text-[13px] text-muted-foreground/80 line-clamp-2 break-words min-w-0 mt-1.5 leading-relaxed">
            {getProductCardMetaLine(product)}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground truncate md:hidden">
              {product.ingredients?.length ? product.ingredients.map((i) => i.name).join(', ') : product.description}
            </p>
            <p className="text-[13px] text-muted-foreground/80 line-clamp-1 hidden md:block mt-1.5 leading-relaxed">
              {product.description}
            </p>
          </>
        )}

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
                      'px-2.5 h-8 rounded-full text-xs font-medium border border-primary/40 text-primary bg-primary/5',
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
        </div>

        {/* Mobile bottom */}
        <div className="flex items-center justify-between mt-1.5 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">
              {product.price} {texts.common.currency}
            </span>
            {activeCouponDiscount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5">
                -{activeCouponDiscount}%
              </span>
            )}
            {pointsInfo && <span className="text-[10px] text-muted-foreground">{pointsInfo}</span>}
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
                  'px-2 h-8 rounded-full text-[11px] font-medium border border-primary/40 text-primary bg-primary/5',
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
    </div>
  );
};
