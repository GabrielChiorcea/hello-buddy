/**
 * Cart — Premium
 * Glassmorphism, elegant, raffinat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
import { CartAddonSectionWrapped } from '@/plugins/addons';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';
import type { CartDisplayData } from './shared';
import type { OrderItemConfigurationGroup } from '@/types';
import { FREE_DELIVERY_THRESHOLD } from '@/config/cart';

export const PremiumCart: React.FC<{ data: CartDisplayData }> = ({ data }) => {
  const { items, subtotal, deliveryFee, total, orderPreview, freeProductProgress, handleRemoveItem, handleQuantityChange, handleCheckout } = data;
  const summarySubtotal = orderPreview?.subtotal ?? subtotal;
  const summaryDelivery = orderPreview?.deliveryFee ?? deliveryFee;
  const summaryTotal = orderPreview?.total ?? total;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold mb-4 text-foreground tracking-tight">{texts.cart.title}</h1>
        </div>
        <TierProgressBar />
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
        <h1 className="text-3xl font-semibold mb-8 text-foreground tracking-tight">{texts.cart.title}</h1>
      </div>
      <TierProgressBar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {items.map(({ product, quantity, configuration }) => (
              <Card key={product.id} className="border-border/20 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex gap-5">
                    <div className="shrink-0">
                      <img src={getImageUrl(product.image)} alt={product.name} className="h-24 w-24 rounded-xl object-cover" />
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
                      <p className="text-lg font-semibold text-primary mt-2">{(unitPriceWithConfiguration ?? product.price)} {texts.common.currency}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button variant="ghost" size="icon" className="text-muted-foreground/50 hover:text-destructive h-8 w-8" onClick={() => handleRemoveItem(product.id, product.name, configuration)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border-border/30" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border-border/30" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <CartAddonSectionWrapped />
            <div className="pt-4">
              <Button variant="ghost" asChild className="rounded-xl text-muted-foreground">
                <Link to={routes.catalog}>{texts.cart.continueShopping}</Link>
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
                  <span className="font-medium">{summaryDelivery === 0 ? <span className="text-primary">{texts.cart.freeDelivery}</span> : `${summaryDelivery} ${texts.common.currency}`}</span>
                </div>
                {summaryDelivery > 0 && <p className="text-xs text-muted-foreground">Gratuit peste {orderPreview?.freeDeliveryThreshold ?? FREE_DELIVERY_THRESHOLD} {texts.common.currency}</p>}
                {freeProductProgress && (
                  <div className="flex justify-between text-sm">
                    <span className={orderPreview?.discountFromFreeProducts ? 'text-primary' : 'text-muted-foreground'}>{texts.freeProducts.cartDiscountLabel}</span>
                    <span className={orderPreview?.discountFromFreeProducts ? 'text-primary font-medium' : 'text-muted-foreground font-medium'}>
                      -{(orderPreview?.discountFromFreeProducts ?? 0).toFixed(2)} {texts.common.currency}
                    </span>
                  </div>
                )}
                {freeProductProgress && !freeProductProgress.unlocked && (
                  <p className="text-xs text-muted-foreground">Mai adaugă {freeProductProgress.remaining.toFixed(2)} {texts.common.currency} pentru produse gratuite</p>
                )}
                
                <Separator className="bg-border/30" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{texts.cart.total}</span>
                  <span className="text-primary">{summaryTotal} {texts.common.currency}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full rounded-xl" size="lg" onClick={handleCheckout}>
                  {texts.cart.checkout}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
