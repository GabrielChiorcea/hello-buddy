/**
 * Product Details page - shows full product info, ingredients, reviews, similar products
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  ShoppingCart, 
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';

// Category display names mapping
const categoryNames: Record<string, string> = {
  pizza: 'Pizza',
  burger: 'Burgeri',
  paste: 'Paste',
  salate: 'Salate',
  desert: 'Deserturi',
  bauturi: 'Băuturi',
};
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';
import { Loader } from '@/components/common/Loader';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { items: products, isLoading } = useAppSelector((state) => state.products);
  const [isAdded, setIsAdded] = useState(false);

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [products, id]);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    const cat = (product.category || '').trim().toLowerCase();
    return products
      .filter((p) => (p.category || '').trim().toLowerCase() === cat && p.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addItem(product));
    setIsAdded(true);
    toast({
      title: texts.notifications.addedToCart,
      description: product.name,
    });
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Loader text="Se încarcă..." />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Produsul nu a fost găsit
          </h1>
          <Button onClick={() => navigate('/catalog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {texts.productDetails.backToCatalog}
          </Button>
        </div>
      </Layout>
    );
  }

  const allergens = product.ingredients?.filter((i) => i.isAllergen) || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {texts.productDetails.backToCatalog}
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <Badge 
              variant="secondary" 
              className="absolute left-4 top-4 text-sm"
            >
              {categoryNames[product.category] ?? product.category}
            </Badge>
            {!product.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <span className="text-xl font-semibold text-muted-foreground">
                  {texts.productDetails.outOfStock}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h1>

            {/* Prep Time */}
            <div className="flex items-center gap-4 mb-4">
              {product.preparationTime && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{product.preparationTime} {texts.productDetails.minutes}</span>
                </div>
              )}
            </div>

            <p className="text-lg text-muted-foreground mb-6">
              {product.description}
            </p>

            {/* Price & Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-bold text-primary">
                {product.price} {texts.common.currency}
              </span>
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.isAvailable || isAdded}
                className={cn(
                  'flex-1 max-w-xs transition-all',
                  isAdded && 'bg-green-600 hover:bg-green-600'
                )}
              >
                {isAdded ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    {texts.catalog.added}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {texts.productDetails.addToCart}
                  </>
                )}
              </Button>
            </div>

            <Separator className="mb-6" />

            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {texts.productDetails.ingredients}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ingredient, index) => (
                    <Badge
                      key={index}
                      variant={ingredient.isAllergen ? 'destructive' : 'outline'}
                      className="text-sm"
                    >
                      {ingredient.name}
                      {ingredient.isAllergen && (
                        <AlertTriangle className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens Warning */}
            {allergens.length > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-6">
                <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{texts.productDetails.allergens}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {allergens.map((a) => a.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {texts.productDetails.similarProducts}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetails;
