/**
 * ProductCard — Gamified
 * Stil energic cu glow, gradient, puncte proeminente — ideal pentru fast-food.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, Plus, TrendingUp } from 'lucide-react';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { getProductUrl } from '@/config/routes';
import type { CardVariantProps } from './shared';
import { getProductCardMetaLine } from './shared';

export const GamifiedCard: React.FC<CardVariantProps> = ({ product, className, data, compactSubtitle }) => {
  const navigate = useNavigate();
  const { handleAddToCart, isAdded, pointsInfo, imageUrl, categoryLabel, showFreeRibbon, hasOptions } = data;
  const isRecommended = (product as any).isRecommended === true;

  return (
    <div
      className={cn(
        'flex flex-row items-center gap-3 rounded-xl bg-card overflow-hidden transition-all group p-3',
        'shadow-[0_2px_16px_-2px_hsl(var(--primary)/0.15)]',
        'hover:shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.25)]',
        'md:flex-col md:items-stretch md:gap-0 md:p-0 md:rounded-2xl',
        'md:border-2 md:border-primary/20 md:hover:border-primary/40',
        'md:hover:-translate-y-1 md:transition-all md:duration-300',
        !product.isAvailable && 'opacity-60',
        className,
      )}
    >
      {/* Imagine cu overlay gradient */}
      <div
        className={cn(
          'relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-xl',
          'md:w-full md:aspect-[4/3] md:h-auto md:rounded-none md:rounded-t-2xl',
        )}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
        {showFreeRibbon && (
          <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none hidden md:block">
            <div className="absolute top-[10px] right-[-28px] w-[120px] text-center rotate-45 bg-primary text-primary-foreground text-[10px] font-bold py-0.5 shadow-sm">
              GRATIS
            </div>
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <span className="text-xs font-semibold text-muted-foreground">Indisponibil</span>
          </div>
        )}
        {pointsInfo && (
          <Badge className="absolute right-2 top-2 bg-reward text-reward-foreground border-0 text-[10px] font-bold gap-1 hidden md:inline-flex">
            <Zap className="h-3 w-3" />
            {pointsInfo}
          </Badge>
        )}
        {isRecommended && (
          <Badge className="absolute left-2 bottom-2 bg-primary text-primary-foreground border-0 text-[10px] font-bold gap-1 hidden md:inline-flex animate-pulse">
            <TrendingUp className="h-3 w-3" />
            Popular
          </Badge>
        )}
        <Badge variant="secondary" className="absolute left-2 top-2 text-[10px] hidden md:inline-flex bg-card/90 backdrop-blur-md border-0">
          {categoryLabel}
        </Badge>
      </div>

      {/* Info */}
      <div className={cn('flex flex-1 min-w-0 flex-col justify-between gap-0.5', 'md:px-4 md:pt-3 md:pb-3.5 md:flex-1')}>
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-foreground text-sm md:text-[15px] truncate md:line-clamp-1">{product.name}</h3>
          {showFreeRibbon && (
            <span className="shrink-0 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded md:hidden">GRATIS</span>
          )}
        </div>
        {compactSubtitle ? (
          <p className="text-xs md:text-[13px] text-muted-foreground/80 line-clamp-2 break-words min-w-0 mt-1 leading-snug">
            {getProductCardMetaLine(product)}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground truncate md:hidden">
              {product.ingredients?.length ? product.ingredients.map((i) => i.name).join(', ') : product.description}
            </p>
            <p className="text-[13px] text-muted-foreground/80 line-clamp-1 hidden md:block mt-1">{product.description}</p>
          </>
        )}

        {/* Desktop bottom */}
        <div className="hidden md:flex items-center justify-between mt-auto pt-2.5">
          <span className="text-lg font-extrabold text-primary">
            {showFreeRibbon ? (
              <><span className="line-through text-muted-foreground text-sm mr-1">{product.price} {texts.common.currency}</span><span className="text-success">GRATIS</span></>
            ) : (
              <>{product.price} {texts.common.currency}</>
            )}
          </span>
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
                  'px-3 h-9 rounded-full text-xs font-semibold border border-primary/40 text-primary bg-primary/5',
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
                'flex items-center justify-center w-9 h-9 rounded-xl transition-all font-bold',
                isAdded
                  ? 'bg-success text-success-foreground scale-90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-[0_4px_12px_hsl(var(--primary)/0.3)]',
                (!product.isAvailable || isAdded) && 'opacity-70',
              )}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 stroke-[3]" />}
            </button>
          </div>
        </div>

        {/* Mobile bottom */}
        <div className="flex items-center justify-between mt-1.5 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-primary">
              {showFreeRibbon ? (
                <><span className="line-through text-muted-foreground text-xs mr-1">{product.price}</span><span className="text-success">GRATIS</span></>
              ) : (
                <>{product.price} {texts.common.currency}</>
              )}
            </span>
            {pointsInfo && (
              <span className="text-[10px] font-bold text-reward flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />
                {pointsInfo}
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
                  'px-2 h-8 rounded-full text-[11px] font-semibold border border-primary/40 text-primary bg-primary/5',
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
                'flex items-center justify-center w-8 h-8 rounded-full transition-all',
                isAdded
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_hsl(var(--primary)/0.3)]',
                (!product.isAvailable || isAdded) && 'opacity-70',
              )}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
