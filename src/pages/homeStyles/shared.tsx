/**
 * Home — shared hook & types
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts, fetchCategories, setSearchQuery, setSelectedCategory } from '@/store/slices/productsSlice';

import type { Easing } from 'framer-motion';

export const easeOut: Easing = [0.16, 1, 0.3, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: easeOut },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export interface HomeDisplayData {
  items: any[];
  filteredItems: any[];
  categories: any[];
  searchQuery: string;
  isLoading: boolean;
  recommendedProducts: any[];
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCategoryClick: (name: string) => void;
}

export function useHomeData(): HomeDisplayData {
  const dispatch = useAppDispatch();
  const { items, filteredItems, categories, searchQuery, isLoading } = useAppSelector(
    (state) => state.products
  );

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleCategoryClick = (categoryName: string) => {
    dispatch(setSelectedCategory(categoryName));
  };

  const recommendedProducts = [...items].slice(0, 4);

  return {
    items,
    filteredItems,
    categories,
    searchQuery,
    isLoading,
    recommendedProducts,
    handleSearch,
    handleCategoryClick,
  };
}
