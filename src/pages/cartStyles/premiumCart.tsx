/**
 * Cart — Premium
 * Glassmorphism, elegant, raffinat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Crown, Clock, Truck, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

export const PremiumCart: React.FC<{ data: CartDisplayData }> = ({ data }) => {
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
          <h1 className="text-3xl font-semibold mb-4 text-foreground tracking-tight">{texts.cart.title}</h1>
        </div>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-2xl bg-background/60 backdrop-blur-xl border border-border/20 p-8">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">{texts.cart.empty}</h2>
            <p className="text-muted-foreground mb-10 text-sm">{texts.cart.emptySubtitle}</p>
            <Button asChild className="rounded-xl px-8">
              <Link to={routes.catalog}>
                {texts.cart.continueShopping}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">{texts.cart.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 bg-background/60 backdrop-blur-xl border border-border/20 rounded-full px-3 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatCountdown(countdownSeconds)}</span>
          </div>
        </div>

        {/* Progress bars — premium glass style */}
        <div className="space-y-3 mb-8">
          <div className={cn(
            'rounded-xl border p-3.5 bg-background/60 backdrop-blur-xl transition-all',
            freeDeliveryProgress.unlocked ? 'border-success/20' : 'border-border/20'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Truck className={cn('h-3.5 w-3.5', freeDeliveryProgress.unlocked ? 'text-success' : 'text-muted-foreground')} />
              <span className="text-xs text-muted-foreground">
                {freeDeliveryProgress.unlocked
                  ? 'Livrare gratuită deblocată'
                  : `Mai adaugă ${freeDeliveryProgress.remaining.toFixed(0)} ${texts.common.currency} pentru livrare gratuită`}
              </span>
            </div>
            <Progress
              value={freeDeliveryProgress.percent}
              className={cn('h-1.5', freeDeliveryProgress.unlocked ? '[&>div]:bg-success' : '[&>div]:bg-primary')}
            />
          </div>

          {freeProductProgress && (
            <div className={cn(
              'rounded-xl border p-3.5 bg-background/60 backdrop-blur-xl transition-all',
              freeProductProgress.unlocked ? 'border-success/20' : 'border-border/20'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Gift className={cn('h-3.5 w-3.5', freeProductProgress.unlocked ? 'text-success' : 'text-muted-foreground')} />
                <span className="text-xs text-muted-foreground">
                  {freeProductProgress.unlocked
                    ? `${freeProductProgress.productNames.join(', ')} — gratis`
                    : `Mai adaugă ${freeProductProgress.remaining.toFixed(0)} ${texts.common.currency} — ${freeProductProgress.productNames[0] ?? 'produs'} gratis`}
                </span>
              </div>
              <Progress
                value={Math.min(100, (freeProductProgress.currentSubtotal / freeProductProgress.eligibilityThreshold) * 100)}
                className={cn('h-1.5', freeProductProgress.unlocked ? '[&>div]:bg-success' : '[&>div]:bg-primary')}
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <div className="space-y-4 max-h-[55vh] lg:max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {items.map(({ product, quantity, configuration, unitPriceWithConfiguration }) => (
                <Card
                  key={buildCartItemKey({ product, configuration, unitPriceWithConfiguration })}
                  className="border-border/20 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex gap-5">
                      <div className="shrink-0">
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          className="h-24 w-24 rounded-xl object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate tracking-tight">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
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
                        <p className="text-lg font-semibold text-primary mt-2">
                          {(unitPriceWithConfiguration ?? product.price)} {texts.common.currency}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground/50 hover:text-destructive h-8 w-8"
                          onClick={() => handleRemoveItem(product.id, product.name, configuration)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl border-border/30"
                            onClick={() => handleQuantityChange(product.id, quantity - 1, configuration)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-xl border-border/30"
                            onClick={() => handleQuantityChange(product.id, quantity + 1, configuration)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <CartAddonSectionWrapped />
            <div className="pt-4">
              <Button variant="ghost" className="rounded-xl text-muted-foreground" onClick={handleContinueShoppingWithToast}>
                {texts.cart.continueShopping}
              </Button>
            </div>
          </div>

          <div>
            <Card className="sticky top-24 border-border/20 bg-background/60 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 tracking-tight">
                  <Crown className="h-4 w-4 text-primary" />
                  Sumar comandă
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{texts.cart.subtotal}</span><span className="font-medium">{summarySubtotal} {texts.common.currency}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.cart.delivery}</span>
                  <span className="font-medium">{summaryDelivery === 0 ? <span className="text-primary">0 {texts.common.currency}</span> : `${summaryDelivery} ${texts.common.currency}`}</span>
                </div>
                {summaryDelivery > 0 && <p className="text-xs text-muted-foreground">Gratuit peste {orderPreview?.freeDeliveryThreshold ?? freeDeliveryProgress.threshold} {texts.common.currency}</p>}
                {summaryDiscountFreeProducts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary">{texts.freeProducts.cartDiscountLabel}</span>
                    <span className="text-primary font-medium">
                      -{summaryDiscountFreeProducts.toFixed(2)} {texts.common.currency}
                    </span>
                  </div>
                )}
                {summaryDiscountPoints > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary">Puncte aplicate</span>
                    <span className="text-primary font-medium">
                      -{summaryDiscountPoints.toFixed(2)} {texts.common.currency}
                    </span>
                  </div>
                )}
                {freeProductProgress && !freeProductProgress.unlocked && (
                  <p className="text-xs text-muted-foreground">
                    Mai adaugă {freeProductProgress.remaining.toFixed(2)} {texts.common.currency} pentru produse gratuite
                  </p>
                )}
                <Separator className="bg-border/30" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{texts.cart.total}</span>
                  <span className="text-primary">{summaryTotal} {texts.common.currency}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex items-center gap-2 text-xs text-primary/80">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Economisești {totalSavings.toFixed(2)} {texts.common.currency}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button className="w-full rounded-xl" size="lg" onClick={handleCheckout}>
                  {totalSavings > 0
                    ? `Finalizează — economisești ${totalSavings.toFixed(0)} ${texts.common.currency}`
                    : texts.cart.checkout}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-[11px] text-center text-muted-foreground/60">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Ofertele expiră în {formatCountdown(countdownSeconds)}
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};