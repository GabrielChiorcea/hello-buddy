/**
 * Catalog page component with client-side pagination
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/common/ProductCard';
import { PageLoader, SkeletonLoader } from '@/components/common/Loader';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProducts,
  fetchCategories,
  setSelectedCategory,
  clearFilters,
} from '@/store/slices/productsSlice';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';
import { CategoryIconDisplay } from '@/config/categoryIcons';
const ITEMS_PER_PAGE = 12;

const catalogProductStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

const catalogProductItem = {
  hidden: {
    opacity: 0,
    y: 32,
    scale: 0.92,
    rotate: -2,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 24 },
  },
};

const Catalog: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    items,
    filteredItems,
    categories,
    selectedCategory,
    isLoading,
  } = useAppSelector((state) => state.products);
  
  const [currentPage, setCurrentPage] = useState(1);
  const reduceMotion = useReducedMotion();

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
  }, [selectedCategory]);

  const handleCategoryClick = useCallback(
    (categoryName: string | null) => {
      dispatch(setSelectedCategory(categoryName));
    },
    [dispatch]
  );

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {texts.catalog.title}
          </h1>
        </div>

        {/* Category Filters — exact ca prima dată (spring + icon ușor), fără confetti */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 items-center">
            <motion.div
              whileTap={reduceMotion ? {} : { scale: 0.9 }}
              animate={
                reduceMotion
                  ? {}
                  : selectedCategory === null
                    ? { scale: [1, 1.12, 1], rotate: [0, -6, 6, -3, 3, 0] }
                    : { scale: 1, rotate: 0 }
              }
              transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            >
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
            </motion.div>
            {categories.map((category) => {
              const active = selectedCategory === category.name;
              return (
                <motion.div
                  key={category.id}
                  whileTap={reduceMotion ? {} : { scale: 0.88 }}
                  animate={
                    reduceMotion
                      ? {}
                      : active
                        ? { scale: [1, 1.14, 1], rotate: [0, 8, -8, 5, -5, 0] }
                        : { scale: 1, rotate: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 480, damping: 13 }}
                >
                  <Badge
                    variant={active ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer px-4 py-2 text-sm transition-colors',
                      active && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    <span className="mr-1 inline-flex align-middle">
                      <motion.span
                        animate={
                          !reduceMotion && active
                            ? {
                                y: [0, -20, -5, 0],
                                scale: [1, 1.55, 1.12, 1],
                                rotate: [0, 16, -12, 0],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.62,
                          ease: [0.25, 0.46, 0.45, 0.94],
                          times: [0, 0.38, 0.72, 1],
                        }}
                        className="inline-flex items-center justify-center origin-center"
                      >
                        <CategoryIconDisplay categoryName={category.name} iconId={(category as any).icon} size={20} />
                      </motion.span>
                    </span>
                    {category.displayName}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'produs găsit' : 'produse găsite'}
            {selectedCategory && ` în categoria "${getCategoryDisplayName(selectedCategory)}"`}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedCategory ?? 'all'}-${currentPage}`}
                className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 2xl:gap-7"
                variants={
                  reduceMotion
                    ? { hidden: {}, show: { transition: { staggerChildren: 0.02 } } }
                    : catalogProductStagger
                }
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: reduceMotion ? 0.08 : 0.12 } }}
              >
                {paginatedItems.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={
                      reduceMotion
                        ? {
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { duration: 0.2 } },
                          }
                        : catalogProductItem
                    }
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

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