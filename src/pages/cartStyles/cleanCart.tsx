/**
 * Cart — Clean
 * Minimal, fără decorații, ultra-curat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Clock, Truck, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { CartAddonSectionWrapped } from '@/plugins/addons';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';
import { cn } from '@/lib/utils';
import { buildCartItemKey, type CartDisplayData } from './shared';
import type { OrderItemConfigurationGroup } from '@/types';

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const CleanCart: React.FC<{ data: CartDisplayData }> = ({ data }) => {
  const {
    items,
    orderPreview,
    freeProductProgress,
    freeDeliveryProgress,
    countdownSeconds,
    totalSavings,
    summarySubtotal,
    summaryDelivery,
    summaryDiscountFreeProducts,
    summaryDiscountPoints,
    summaryTotal,
    handleRemoveItem,
    handleQuantityChange,
    handleCheckout,
    handleContinueShoppingWithToast,
  } = data;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-medium mb-4 text-foreground">{texts.cart.title}</h1>
        </div>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-sm mx-auto text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-6" />
            <h2 className="text-xl font-medium mb-2 text-foreground">{texts.cart.empty}</h2>
            <p className="text-sm text-muted-foreground mb-8">{texts.cart.emptySubtitle}</p>
            <Button variant="outline" asChild size="sm">
              <Link to={routes.catalog}>{texts.cart.continueShopping}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-medium text-foreground">{texts.cart.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatCountdown(countdownSeconds)}</span>
          </div>
        </div>

        {/* Progress bars — minimal style */}
        <div className="space-y-3 mb-8">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                <span>
                  {freeDeliveryProgress.unlocked
                    ? 'Livrare gratuită'
                    : `Mai adaugă ${freeDeliveryProgress.remaining.toFixed(0)} ${texts.common.currency} — livrare gratuită`}
                </span>
              </div>
            </div>
            <Progress
              value={freeDeliveryProgress.percent}
              className={cn('h-1.5', freeDeliveryProgress.unlocked ? '[&>div]:bg-success' : '[&>div]:bg-foreground/30')}
            />
          </div>

          {freeProductProgress && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gift className="h-3.5 w-3.5" />
                  <span>
                    {freeProductProgress.unlocked
                      ? `${freeProductProgress.productNames[0] ?? 'Categorie'} gratis deblocat`
                      : `Mai adaugă ${freeProductProgress.remaining.toFixed(0)} ${texts.common.currency} — ${freeProductProgress.productNames[0] ?? 'categorie'} gratis`}
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(100, (freeProductProgress.currentSubtotal / freeProductProgress.eligibilityThreshold) * 100)}
                className={cn('h-1.5', freeProductProgress.unlocked ? '[&>div]:bg-success' : '[&>div]:bg-foreground/30')}
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-0 min-w-0">
            <div className="space-y-0 max-h-[55vh] lg:max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {items.map(({ product, quantity, configuration, unitPriceWithConfiguration }, i) => (
                <div key={buildCartItemKey({ product, configuration, unitPriceWithConfiguration })}>
                  {i > 0 && <Separator className="my-0" />}
                  <div className="flex gap-4 py-6">
                    <img src={getImageUrl(product.image)} alt={product.name} className="h-20 w-20 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                      {configuration && configuration.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {configuration
                            .map(
                              (g: OrderItemConfigurationGroup) =>
                                `${g.groupName}: ${g.options.map((o) => o.name).join(', ')}`
                            )
                            .join(' • ')}
                        </p>
                      )}
                      <p className="text-sm font-medium text-foreground mt-2">
                        {(product.price +
                          (configuration?.reduce(
                            (sum, g) => sum + g.options.reduce((s, o) => s + (o.priceDelta || 0), 0),
                            0
                          ) ?? 0))} {texts.common.currency}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        className="text-muted-foreground/50 hover:text-destructive transition-colors"
                        onClick={() => handleRemoveItem(product.id, product.name, configuration)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          className="h-7 w-7 flex items-center justify-center border border-border/50 rounded text-xs"
                          onClick={() => handleQuantityChange(product.id, quantity - 1, configuration)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{quantity}</span>
                        <button
                          className="h-7 w-7 flex items-center justify-center border border-border/50 rounded text-xs"
                          onClick={() => handleQuantityChange(product.id, quantity + 1, configuration)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <CartAddonSectionWrapped />
            <div className="pt-6">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleContinueShoppingWithToast}>
                {texts.cart.continueShopping}
              </Button>
            </div>
          </div>

          <div>
            <div className="sticky top-24 space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sumar</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{texts.cart.subtotal}</span><span>{summarySubtotal} {texts.common.currency}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.cart.delivery}</span>
                  <span>{summaryDelivery === 0 ? <span className="text-success">0 {texts.common.currency}</span> : `${summaryDelivery} ${texts.common.currency}`}</span>
                </div>
                {summaryDelivery > 0 && <p className="text-xs text-muted-foreground">Gratuit peste {orderPreview?.freeDeliveryThreshold ?? freeDeliveryProgress.threshold} {texts.common.currency}</p>}
                {summaryDiscountFreeProducts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">{texts.freeProducts.cartDiscountLabel}</span>
                    <span className="text-success">
                      -{summaryDiscountFreeProducts.toFixed(2)} {texts.common.currency}
                    </span>
                  </div>
                )}
                {summaryDiscountPoints > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">Puncte aplicate</span>
                    <span className="text-success">
                      -{summaryDiscountPoints.toFixed(2)} {texts.common.currency}
                    </span>
                  </div>
                )}
                {freeProductProgress && !freeProductProgress.unlocked && (
                  <p className="text-xs text-muted-foreground">
                    Mai adaugă {freeProductProgress.remaining.toFixed(2)} {texts.common.currency} pentru produse gratuite
                  </p>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{texts.cart.total}</span>
                <span>{summaryTotal} {texts.common.currency}</span>
              </div>

              {totalSavings > 0 && (
                <p className="text-xs text-success">
                  Economisești {totalSavings.toFixed(2)} {texts.common.currency}
                </p>
              )}

              <Button className="w-full mt-4" size="default" onClick={handleCheckout}>
                {totalSavings > 0
                  ? `Finalizează — economisești ${totalSavings.toFixed(0)} ${texts.common.currency}`
                  : texts.cart.checkout}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Ofertele expiră în {formatCountdown(countdownSeconds)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};