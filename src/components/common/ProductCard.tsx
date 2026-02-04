/**
 * ProductCard component for displaying products
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, Check } from 'lucide-react';
import { Product } from '@/types';
import { texts } from '@/config/texts';
import { getProductUrl } from '@/config/routes';
import { useAppDispatch } from '@/store';
import { addItem } from '@/store/slices/cartSlice';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Category display names mapping
const categoryNames: Record<string, string> = {
  pizza: 'Pizza',
  burger: 'Burgeri',
  paste: 'Paste',
  salate: 'Salate',
  desert: 'Deserturi',
  bauturi: 'Băuturi',
};

interface ProductCardProps {
  product: Product;
  className?: string;
  disableLink?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, disableLink = false }) => {
  const dispatch = useAppDispatch();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItem(product));
    setIsAdded(true);
    toast({
      title: texts.notifications.addedToCart,
      description: product.name,
    });
    
    setTimeout(() => setIsAdded(false), 2000);
  };

  const cardContent = (
    <Card className={cn('group overflow-hidden transition-all hover:shadow-lg', className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <Badge 
          variant="secondary" 
          className="absolute left-2 top-2"
        >
          {categoryNames[product.category] ?? product.category}
        </Badge>
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="font-semibold text-muted-foreground">
              Indisponibil
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {product.name}
          </h3>
        </div>
        
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        
        <div className="mb-3 flex items-center gap-3">
          {product.preparationTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{product.preparationTime} min</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {product.price} {texts.common.currency}
          </span>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAdded}
            className={cn(
              'transition-all',
              isAdded && 'bg-green-600 hover:bg-green-600'
            )}
          >
            {isAdded ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                {texts.catalog.added}
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1 h-4 w-4" />
                {texts.catalog.addToCart}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (disableLink) {
    return cardContent;
  }

  return (
    <Link to={getProductUrl(product.id)} className="block">
      {cardContent}
    </Link>
  );
};

export { ProductCard };
