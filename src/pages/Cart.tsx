/**
 * Cart page component
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeItem, changeQuantity } from '@/store/slices/cartSlice';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';
import { toast } from '@/hooks/use-toast';
import { CartAddonSectionWrapped } from '@/plugins/addons';
import { FREE_DELIVERY_THRESHOLD } from '@/config/cart';

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, total } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.user);

  const handleRemoveItem = (productId: string, productName: string) => {
    dispatch(removeItem(productId));
    toast({
      title: texts.notifications.removedFromCart,
      description: productName,
    });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    dispatch(changeQuantity({ productId, quantity: newQuantity }));
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Autentificare necesară',
        description: 'Trebuie să te conectezi pentru a finaliza comanda.',
        variant: 'destructive',
      });
      navigate(routes.login, { state: { from: { pathname: routes.checkout } } });
      return;
    }
    navigate(routes.checkout);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-muted p-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">{texts.cart.empty}</h1>
            <p className="text-muted-foreground mb-8">{texts.cart.emptySubtitle}</p>
            <Button asChild>
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
        <h1 className="text-3xl font-bold mb-8 text-foreground">{texts.cart.title}</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="shrink-0">
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        {product.price} {texts.common.currency}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(product.id, product.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(product.id, quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(product.id, quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <CartAddonSectionWrapped />

            {/* Continue Shopping Link */}
            <div className="pt-4">
              <Button variant="outline" asChild>
                <Link to={routes.catalog}>
                  {texts.cart.continueShopping}
                </Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Sumar comandă</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.cart.subtotal}</span>
                  <span className="font-medium">{subtotal} {texts.common.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.cart.delivery}</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">{texts.cart.freeDelivery}</span>
                    ) : (
                      `${deliveryFee} ${texts.common.currency}`
                    )}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Livrare gratuită pentru comenzi de peste {FREE_DELIVERY_THRESHOLD}{' '}
                    {texts.common.currency}
                  </p>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{texts.cart.total}</span>
                  <span className="text-primary">{total} {texts.common.currency}</span>
                </div>
                <div className="pt-2">
                  <CartAddonSectionWrapped />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleCheckout}>
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

export default Cart;
