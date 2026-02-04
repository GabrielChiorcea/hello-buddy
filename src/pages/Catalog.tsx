/**
 * Catalog page component
 */

import React, { useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader, SkeletonLoader } from '@/components/common/Loader';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProducts,
  fetchCategories,
  setSearchQuery,
  setSelectedCategory,
  clearFilters,
} from '@/store/slices/productsSlice';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/config/categoryIcons';

const Catalog: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    items,
    filteredItems,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
  } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchProducts());
    }
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, items.length, categories.length]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleCategoryClick = (categoryName: string | null) => {
    dispatch(setSelectedCategory(categoryName));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const hasActiveFilters = selectedCategory || searchQuery;

  // Get category display name
  const getCategoryDisplayName = (categoryName: string): string => {
    const cat = categories.find(c => c.name === categoryName);
    return cat?.displayName || categoryName;
  };

  if (isLoading && items.length === 0) {
    return (
      <Layout>
        <PageLoader />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {texts.catalog.title}
          </h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={texts.home.searchPlaceholder}
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="shrink-0"
              >
                <X className="mr-2 h-4 w-4" />
                Șterge filtrele
              </Button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{texts.catalog.filterBy}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer px-4 py-2 text-sm transition-colors',
                selectedCategory === null && 'bg-primary text-primary-foreground'
              )}
              onClick={() => handleCategoryClick(null)}
            >
              {texts.catalog.allCategories}
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer px-4 py-2 text-sm transition-colors',
                  selectedCategory === category.name && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleCategoryClick(category.name)}
              >
                <span className="mr-1">{getCategoryIcon(category.name, (category as any).icon)}</span>
                {category.displayName}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'produs găsit' : 'produse găsite'}
            {selectedCategory && ` în categoria "${getCategoryDisplayName(selectedCategory)}"`}
            {searchQuery && ` pentru "${searchQuery}"`}
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <SkeletonLoader className="aspect-[4/3] w-full" />
                <SkeletonLoader className="h-6 w-3/4" />
                <SkeletonLoader className="h-4 w-full" />
                <SkeletonLoader className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              {texts.catalog.noProducts}
            </p>
            <Button onClick={handleClearFilters}>
              Șterge filtrele și vezi toate produsele
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Catalog;
