/**
 * Cart — Gamified
 * Bold, energic, recompense vizibile, urgency bars & FOMO triggers.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Zap, Clock, Truck, Gift, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
// import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { CartAddonSectionWrapped } from '@/plugins/addons';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';
import { cn, formatDisplayNumber } from '@/lib/utils';
import { buildCartItemKey, type CartDisplayData } from './shared';
import type { OrderItemConfigurationGroup } from '@/types';

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const GamifiedCart: React.FC<{ data: CartDisplayData }> = ({ data }) => {
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
  const formatMoney = (value: number) =>
    `${formatDisplayNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${texts.common.currency}`;
  const formatInteger = (value: number) => formatDisplayNumber(value, { maximumFractionDigits: 0 });

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 w-full min-w-0">
          <h1 className="text-3xl font-extrabold mb-4 text-foreground flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary" />
            {texts.cart.title}
          </h1>
        </div>
        <div className="container mx-auto px-4 py-16 w-full min-w-0">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/20 p-6 shadow-lg shadow-primary/20">
                <ShoppingBag className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold mb-2 text-foreground">{texts.cart.empty}</h2>
            <p className="text-muted-foreground mb-8">{texts.cart.emptySubtitle}</p>
            <Button asChild size="lg" className="rounded-xl font-bold shadow-lg shadow-primary/25">
              <Link to={routes.catalog}>
                <Zap className="mr-2 h-4 w-4" />
                {texts.cart.continueShopping}
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const urgencyProgressCards = (
    <div className="space-y-3 mb-6">
      {/* Free delivery progress */}
      <div
        className={cn(
          'rounded-xl border p-3 transition-colors',
          freeDeliveryProgress.unlocked
            ? 'bg-success/10 border-success/30'
            : 'bg-card border-primary/15'
        )}
      >
        <div className="grid grid-cols-[auto,minmax(0,1fr),auto] items-start gap-x-2 gap-y-1 mb-1.5 max-[399px]:grid-cols-[auto,minmax(0,1fr)]">
          <span
            className={cn(
              'inline-flex shrink-0 h-8 w-8 items-center justify-center rounded-lg border',
              freeDeliveryProgress.unlocked
                ? 'bg-success/15 border-success/30 text-success'
                : 'bg-primary/10 border-primary/20 text-primary'
            )}
          >
            <Truck
              className={cn('h-4 w-4', freeDeliveryProgress.unlocked ? 'animate-bounce max-[399px]:animate-none' : '')}
              strokeWidth={2.5}
            />
          </span>
          <span className="min-w-0 text-sm font-bold leading-tight text-foreground">
            {freeDeliveryProgress.unlocked
              ? texts.cartProgress.freeDeliveryUnlocked
              : texts.cartProgress.addMoreFreeDeliveryGamified
                  .replace('{amount}', formatInteger(freeDeliveryProgress.remaining))
                  .replace('{currency}', texts.common.currency)}
          </span>
          {/* <Badge
            className={cn(
              'shrink-0 justify-self-end self-start border-0 bg-success text-xs text-success-foreground max-[399px]:col-start-2 max-[399px]:justify-self-start',
              freeDeliveryProgress.unlocked ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            aria-hidden={!freeDeliveryProgress.unlocked}
          >
            -{summaryDelivery || 10} {texts.common.currency}
          </Badge> */}
        </div>
        <Progress
          value={freeDeliveryProgress.percent}
          className={cn('h-2.5', freeDeliveryProgress.unlocked ? '[&>div]:bg-success' : '[&>div]:bg-primary')}
        />
      </div>

      {/* Free product progress */}
      {freeProductProgress && (
        <div className={cn(
          'rounded-xl border p-3 transition-colors',
          freeProductProgress.unlocked
            ? 'bg-success/10 border-success/30'
            : 'bg-card border-primary/15'
        )}>
          <div className="grid grid-cols-[auto,minmax(0,1fr)] items-start gap-x-2 gap-y-1 mb-1.5">
            <span
              className={cn(
                'inline-flex shrink-0 h-8 w-8 items-center justify-center rounded-lg border',
                freeProductProgress.unlocked
                  ? 'bg-success/15 border-success/30 text-success'
                  : 'bg-primary/10 border-primary/20 text-primary'
              )}
            >
              <Gift className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="min-w-0 text-sm font-bold leading-tight text-foreground">
              {(() => {
                const primaryProduct = freeProductProgress.productNames[0] ?? texts.cartProgress.product.toLowerCase();
                if (freeProductProgress.unlocked) {
                  return texts.cartProgress.freeProductsUnlockedGamified.replace(
                    '{products}',
                    freeProductProgress.productNames.join(', ')
                  );
                }
                if (freeProductProgress.remaining <= 0) {
                  return texts.cartProgress.freeProductUnlockedAddFromCatalog.replace('{product}', primaryProduct);
                }
                return texts.cartProgress.addMoreFreeProductGamified
                  .replace('{amount}', formatInteger(freeProductProgress.remaining))
                  .replace('{currency}', texts.common.currency)
                  .replace('{product}', primaryProduct);
              })()}
            </span>
          </div>
          <Progress
            value={Math.min(100, (freeProductProgress.currentSubtotal / freeProductProgress.eligibilityThreshold) * 100)}
            className={cn('h-2.5', freeProductProgress.unlocked ? '[&>div]:bg-success' : '[&>div]:bg-primary')}
          />
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 w-full min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary" />
            {texts.cart.title}
          </h1>
          {/* Countdown timer */}
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-full px-4 py-1.5 text-sm font-bold animate-pulse">
            <Clock className="h-4 w-4" />
            <span>Expiră în {formatCountdown(countdownSeconds)}</span>
          </div>
        </div>

        {/* Urgency progress bars */}
        {urgencyProgressCards}
      </div>

      <div className="container mx-auto px-4 pb-8 w-full min-w-0">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 min-w-0">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <div className="space-y-4 max-h-[55vh] lg:max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {items.map(({ product, quantity, configuration, unitPriceWithConfiguration }) => (
                <Card key={buildCartItemKey({ product, configuration, unitPriceWithConfiguration })} className="border-primary/10 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <img src={getImageUrl(product.image)} alt={product.name} className="h-24 w-24 rounded-xl object-cover ring-2 ring-primary/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
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
                        <p className="text-lg font-extrabold text-primary mt-2">
                          {formatMoney(
                            product.price +
                              (configuration?.reduce(
                                (sum, g) => sum + g.options.reduce((s, o) => s + (o.priceDelta || 0), 0),
                                0
                              ) ?? 0)
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(product.id, product.name, configuration)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-primary/30"
                            onClick={() => handleQuantityChange(product.id, quantity - 1, configuration)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-primary/30"
                            onClick={() => handleQuantityChange(product.id, quantity + 1, configuration)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <CartAddonSectionWrapped />
            {urgencyProgressCards}
            <div className="pt-4">
              <Button variant="outline" className="rounded-xl" onClick={handleContinueShoppingWithToast}>
                {texts.cart.continueShopping}
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <Card className="sticky top-24 border-primary/20 shadow-xl bg-gradient-to-b from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-extrabold">
                  <Zap className="h-5 w-5 text-primary" />
                  Sumar comandă
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><span className="text-muted-foreground">{texts.cart.subtotal}</span><span className="font-bold">{formatMoney(summarySubtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.cart.delivery}</span>
                  <span className="font-bold">{summaryDelivery === 0 ? <span className="text-success">{formatMoney(0)}</span> : formatMoney(summaryDelivery)}</span>
                </div>
                {summaryDelivery > 0 && <p className="text-xs text-muted-foreground">Livrare gratuită peste {formatMoney(orderPreview?.freeDeliveryThreshold ?? freeDeliveryProgress.threshold)}</p>}
                {summaryDiscountFreeProducts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-success">{texts.freeProducts.cartDiscountLabel}</span>
                    <span className="text-success font-bold">
                      -{formatMoney(summaryDiscountFreeProducts)}
                    </span>
                  </div>
                )}
                {freeProductProgress && !freeProductProgress.unlocked && freeProductProgress.remaining > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Mai adaugă {formatMoney(freeProductProgress.remaining)} pentru produse gratuite
                  </p>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-extrabold">
                  <span>{texts.cart.total}</span>
                  <span className="text-primary">{formatMoney(summaryTotal)}</span>
                </div>

                {/* Savings summary */}
                {totalSavings > 0 && (
                  <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg p-3 mt-2">
                    <Flame className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm font-bold text-success">
                      Economisești {formatMoney(totalSavings)} la această comandă!
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/25" size="lg" onClick={handleCheckout}>
                  {totalSavings > 0
                    ? `Finalizează — economisești ${formatInteger(totalSavings)} ${texts.common.currency}`
                    : texts.cart.checkout}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
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
