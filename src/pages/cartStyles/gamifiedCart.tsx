/**
 * Cart — Gamified
 * Bold, energic, recompense vizibile.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { FREE_DELIVERY_THRESHOLD } from './shared';

export const GamifiedCart: React.FC<{ data: CartDisplayData }> = ({ data }) => {
  const { items, subtotal, deliveryFee, total, orderPreview, freeProductIds, handleRemoveItem, handleQuantityChange, handleCheckout } = data;
  const summarySubtotal = orderPreview?.subtotal ?? subtotal;
  const summaryDelivery = orderPreview?.deliveryFee ?? deliveryFee;
  const summaryTotal = orderPreview?.total ?? total;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold mb-4 text-foreground flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary" />
            {texts.cart.title}
          </h1>
        </div>
        <TierProgressBar />
        <div className="container mx-auto px-4 py-16">
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold mb-4 text-foreground flex items-center gap-3">
          <Zap className="h-7 w-7 text-primary" />
          {texts.cart.title}
        </h1>
      </div>
      <TierProgressBar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {items.map(({ product, quantity }) => (
              <Card key={product.id} className="border-primary/10 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <img src={getImageUrl(product.image)} alt={product.name} className="h-24 w-24 rounded-xl object-cover ring-2 ring-primary/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                      <p className="text-lg font-extrabold text-primary mt-2">{product.price} {texts.common.currency}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(product.id, product.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/30" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/30" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <CartAddonSectionWrapped />
            <div className="pt-4">
              <Button variant="outline" asChild className="rounded-xl">
                <Link to={routes.catalog}>{texts.cart.continueShopping}</Link>
              </Button>
            </div>
          </div>

          <div>
            <Card className="sticky top-24 border-primary/20 shadow-xl bg-gradient-to-b from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-extrabold">
                  <Zap className="h-5 w-5 text-primary" />
                  Sumar comandă
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><span className="text-muted-foreground">{texts.cart.subtotal}</span><span className="font-bold">{summarySubtotal} {texts.common.currency}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.cart.delivery}</span>
                  <span className="font-bold">{summaryDelivery === 0 ? <span className="text-success">{texts.cart.freeDelivery}</span> : `${summaryDelivery} ${texts.common.currency}`}</span>
                </div>
                {summaryDelivery > 0 && <p className="text-xs text-muted-foreground">Livrare gratuită peste {FREE_DELIVERY_THRESHOLD} {texts.common.currency}</p>}
                {(orderPreview?.discountFromFreeProducts ?? 0) > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{texts.freeProducts.cartDiscountLabel}</span>
                    <span className="font-bold">-{orderPreview!.discountFromFreeProducts.toFixed(2)} {texts.common.currency}</span>
                  </div>
                )}
                {freeProductProgress && <FreeProductProgressBanner progress={freeProductProgress} />}
                <Separator />
                <div className="flex justify-between text-xl font-extrabold">
                  <span>{texts.cart.total}</span>
                  <span className="text-primary">{summaryTotal} {texts.common.currency}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/25" size="lg" onClick={handleCheckout}>
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
