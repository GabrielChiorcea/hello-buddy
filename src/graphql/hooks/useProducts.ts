/**
 * =============================================================================
 * HOOK-URI APOLLO PENTRU PRODUSE
 * =============================================================================
 * 
 * Acest fișier conține hook-urile React pentru gestionarea produselor.
 * 
 * Hook-uri disponibile:
 * - useProducts: obține toate produsele
 * - useProduct: obține un singur produs după ID
 * - useProductsByCategory: filtrează produsele după categorie
 * - useSearchProducts: caută produse după text
 * - useCategories: obține lista categoriilor
 * 
 * Toate hook-urile gestionează automat:
 * - Starea de loading
 * - Erorile
 * - Cache-ul Apollo
 * =============================================================================
 */

import { useQuery, useLazyQuery } from '@apollo/client';
import { 
  GET_PRODUCTS, 
  GET_PRODUCT_BY_ID, 
  GET_PRODUCTS_BY_CATEGORY,
  SEARCH_PRODUCTS,
  GET_CATEGORIES 
} from '../queries';
import { Product, ProductCategory } from '@/types';

// ============================================================================
// INTERFEȚE PENTRU RĂSPUNSURI
// ============================================================================

/** Structura răspunsului pentru lista de produse */
interface ProductsData {
  products: Product[];
}

/** Structura răspunsului pentru un singur produs */
interface ProductData {
  product: Product | null;
}

/** Structura răspunsului pentru categorii */
interface CategoriesData {
  categories: ProductCategory[];
}

/** Structura răspunsului pentru căutare */
interface SearchData {
  searchProducts: Product[];
}

// ============================================================================
// HOOK-URI
// ============================================================================

/**
 * Hook pentru obținerea tuturor produselor
 * 
 * @returns {Object} Obiect cu:
 *   - products: lista de produse
 *   - loading: true în timpul încărcării
 *   - error: mesajul de eroare sau null
 *   - refetch: funcție pentru reîncărcare manuală
 * 
 * @example
 * const { products, loading, error } = useProducts();
 */
export const useProducts = () => {
  const { data, loading, error, refetch } = useQuery<ProductsData>(GET_PRODUCTS);
  
  return {
    products: data?.products || [],
    loading,
    error: error?.message || null,
    refetch,
  };
};

/**
 * Hook pentru obținerea unui produs după ID
 * 
 * @param {string} id - ID-ul produsului de obținut
 * @returns {Object} Obiect cu produsul, loading și error
 * 
 * Notă: Query-ul este skip-uit dacă id-ul este gol
 * 
 * @example
 * const { product, loading } = useProduct('prod-123');
 */
export const useProduct = (id: string) => {
  const { data, loading, error } = useQuery<ProductData>(GET_PRODUCT_BY_ID, {
    variables: { id },
    skip: !id, // Nu executa query-ul dacă nu avem ID
  });
  
  return {
    product: data?.product || null,
    loading,
    error: error?.message || null,
  };
};

/**
 * Hook pentru obținerea produselor dintr-o categorie
 * 
 * @param {ProductCategory | null} category - Categoria de filtrat
 * @returns {Object} Obiect cu produsele filtrate, loading și error
 * 
 * Notă: Query-ul este skip-uit dacă categoria este null
 * 
 * @example
 * const { products } = useProductsByCategory('Pizza');
 */
export const useProductsByCategory = (category: ProductCategory | null) => {
  const { data, loading, error } = useQuery<{ productsByCategory: Product[] }>(
    GET_PRODUCTS_BY_CATEGORY,
    {
      variables: { category },
      skip: !category, // Nu executa query-ul fără categorie
    }
  );
  
  return {
    products: data?.productsByCategory || [],
    loading,
    error: error?.message || null,
  };
};

/**
 * Hook pentru căutare produse
 * Folosește useLazyQuery pentru a permite căutarea la cerere
 * 
 * @returns {Object} Obiect cu:
 *   - searchProducts: funcție pentru executarea căutării
 *   - results: rezultatele căutării
 *   - loading: true în timpul căutării
 *   - error: mesajul de eroare sau null
 * 
 * @example
 * const { searchProducts, results } = useSearchProducts();
 * searchProducts('pizza margherita');
 */
export const useSearchProducts = () => {
  // useLazyQuery permite executarea manuală a query-ului
  const [search, { data, loading, error }] = useLazyQuery<SearchData>(SEARCH_PRODUCTS);
  
  /**
   * Funcție pentru executarea căutării
   * Ignoră căutările cu text gol
   */
  const searchProducts = (query: string) => {
    if (query.trim()) {
      search({ variables: { query } });
    }
  };
  
  return {
    searchProducts,
    results: data?.searchProducts || [],
    loading,
    error: error?.message || null,
  };
};

/**
 * Hook pentru obținerea listei de categorii
 * 
 * @returns {Object} Obiect cu categoriile, loading și error
 * 
 * @example
 * const { categories } = useCategories();
 * // categories = ['Pizza', 'Paste', 'Salate', ...]
 */
export const useCategories = () => {
  const { data, loading, error } = useQuery<CategoriesData>(GET_CATEGORIES);
  
  return {
    categories: data?.categories || [],
    loading,
    error: error?.message || null,
  };
};
