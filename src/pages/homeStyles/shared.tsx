/**
 * Home — shared hook & types
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProducts,
  fetchCategories,
  fetchRecommendedProducts,
  fetchAppStats,
  setSearchQuery,
  setSelectedCategory,
} from '@/store/slices/productsSlice';

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
  totalProducts: number;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCategoryClick: (name: string) => void;
}

export function useHomeData(): HomeDisplayData {
  const dispatch = useAppDispatch();
  const {
    items,
    filteredItems,
    categories,
    searchQuery,
    isLoading,
    recommendedProducts: recommendedFromApi,
    totalProducts,
  } = useAppSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchRecommendedProducts());
    dispatch(fetchAppStats());
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleCategoryClick = (categoryName: string) => {
    dispatch(setSelectedCategory(categoryName));
  };

  // Dacă adminul nu a setat recomandate, afișăm primele 4 produse din listă
  const recommendedProducts =
    recommendedFromApi.length > 0 ? recommendedFromApi : [...items].slice(0, 4);

  return {
    items,
    filteredItems,
    categories,
    searchQuery,
    isLoading,
    recommendedProducts,
    totalProducts,
    handleSearch,
    handleCategoryClick,
  };
}
