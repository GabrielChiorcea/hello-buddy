/**
 * Cart — Clean
 * Minimal, fără decorații, ultra-curat.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
import { CartAddonSectionWrapped } from '@/plugins/addons';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';
import type { CartDisplayData } from './shared';
import { FREE_DELIVERY_THRESHOLD } from './shared';

export const CleanCart: React.FC<{ data: CartDisplayData }> = ({ data }) => {
  const { items, subtotal, deliveryFee, total, orderPreview, freeProductIds, handleRemoveItem, handleQuantityChange, handleCheckout } = data;
  const summarySubtotal = orderPreview?.subtotal ?? subtotal;
  const summaryDelivery = orderPreview?.deliveryFee ?? deliveryFee;
  const summaryTotal = orderPreview?.total ?? total;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-medium mb-4 text-foreground">{texts.cart.title}</h1>
        </div>
        <TierProgressBar />
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
        <h1 className="text-2xl font-medium mb-8 text-foreground">{texts.cart.title}</h1>
      </div>
      <TierProgressBar />
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-0 min-w-0">
            {items.map(({ product, quantity }, i) => (
              <div key={product.id}>
                {i > 0 && <Separator className="my-0" />}
                <div className="flex gap-4 py-6">
                  <img src={getImageUrl(product.image)} alt={product.name} className="h-20 w-20 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground text-sm">{product.name}</h3>
                      {freeProductIds.has(product.id) && (
                        <Badge className="bg-primary/15 text-primary border-0 text-[10px] px-1.5 py-0">+1 gratis</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                    <p className="text-sm font-medium text-foreground mt-2">{product.price} {texts.common.currency}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button className="text-muted-foreground/50 hover:text-destructive transition-colors" onClick={() => handleRemoveItem(product.id, product.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-center gap-3">
                      <button className="h-7 w-7 flex items-center justify-center border border-border/50 rounded text-xs" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{quantity}</span>
                      <button className="h-7 w-7 flex items-center justify-center border border-border/50 rounded text-xs" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <CartAddonSectionWrapped />
            <div className="pt-6">
              <Button variant="ghost" asChild size="sm" className="text-muted-foreground">
                <Link to={routes.catalog}>{texts.cart.continueShopping}</Link>
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
                  <span>{summaryDelivery === 0 ? texts.cart.freeDelivery : `${summaryDelivery} ${texts.common.currency}`}</span>
                </div>
                {summaryDelivery > 0 && <p className="text-xs text-muted-foreground">Gratuit peste {FREE_DELIVERY_THRESHOLD} {texts.common.currency}</p>}
                {(orderPreview?.discountFromFreeProducts ?? 0) > 0 && (
                  <div className="flex justify-between text-success text-sm">
                    <span>{texts.freeProducts.cartDiscountLabel}</span>
                    <span>-{orderPreview!.discountFromFreeProducts.toFixed(2)} {texts.common.currency}</span>
                  </div>
                )}
                
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{texts.cart.total}</span>
                <span>{summaryTotal} {texts.common.currency}</span>
              </div>
              <Button className="w-full mt-4" size="default" onClick={handleCheckout}>
                {texts.cart.checkout}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
