/**
 * Home — shared hook & types
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector, store } from '@/store';
import type { AppDispatch } from '@/store';
import {
  fetchProducts,
  fetchCategories,
  fetchRecommendedProducts,
  fetchAppStats,
  setSearchQuery,
  setSelectedCategory,
} from '@/store/slices/productsSlice';

import type { Easing } from 'framer-motion';
import type { Category } from '@/types';
import { CATEGORY_ICON_ID_COMBO } from '@/config/categoryIcons';

/** Evită dublarea celor 4 request-uri dacă Welcome și Home pornesc încărcarea aproape simultan */
let homeCatalogBundleInFlight = false;

/**
 * Încarcă în Redux aceleași date folosite pe Home (produse, categorii, recomandate, stats).
 * - `welcome`: prefetch doar dacă încă nu avem catalog în store (evită dublu fetch după ce userul așteaptă pe Welcome).
 * - `home`: ca înainte, pornește încărcarea la fiecare mount pe Home (dacă nu rulează deja același bundle).
 */
export function prefetchHomeCatalogData(
  dispatch: AppDispatch,
  mode: 'welcome' | 'home' = 'home'
): void {
  if (homeCatalogBundleInFlight) return;
  if (mode === 'welcome') {
    const p = store.getState().products;
    if (p.items.length > 0 && p.categories.length > 0) return;
  }
  homeCatalogBundleInFlight = true;
  Promise.all([
    dispatch(fetchProducts()).unwrap(),
    dispatch(fetchCategories()).unwrap(),
    dispatch(fetchRecommendedProducts()).unwrap(),
    dispatch(fetchAppStats()).unwrap(),
  ]).finally(() => {
    homeCatalogBundleInFlight = false;
  });
}

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
  categories: Category[];
  comboCategory: Category | null;
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
    prefetchHomeCatalogData(dispatch);
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

  const comboCategory =
    categories.find(
      (c) => c.icon === CATEGORY_ICON_ID_COMBO && (c.productsCount ?? 0) > 0
    ) ?? null;
  const homeCategories = comboCategory
    ? categories.filter((c) => c.id !== comboCategory.id)
    : categories;

  return {
    items,
    filteredItems,
    categories: homeCategories,
    comboCategory,
    searchQuery,
    isLoading,
    recommendedProducts,
    totalProducts,
    handleSearch,
    handleCategoryClick,
  };
}
