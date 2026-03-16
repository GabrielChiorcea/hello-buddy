/**
 * Catalog page component with client-side pagination
 */

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { TierProgressBar } from '@/components/layout/TierProgressBar';
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
import { CategoryIconDisplay } from '@/config/categoryIcons';
import { StreakCampaignBlock } from '@/plugins/streak';

const ITEMS_PER_PAGE = 12;

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
  
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchProducts());
    }
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, items.length, categories.length]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (categoryName: string | null) => {
    dispatch(setSelectedCategory(categoryName));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      {/* Bara de progres nivel – aliniată cu contentul principal */}
      <section className="pt-4">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <TierProgressBar />
          </div>
        </div>
      </section>
      {/* Campanii active – full-width, ca înainte */}
      <StreakCampaignBlock />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {texts.catalog.title}
          </h1>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
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
            {totalItems} {totalItems === 1 ? 'produs găsit' : 'produse găsite'}
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
        ) : paginatedItems.length > 0 ? (
          <>
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 2xl:gap-7">
              {paginatedItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and neighbors
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={currentPage === item ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => {
                          setCurrentPage(item as number);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {item}
                      </Button>
                    )
                  )}
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
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