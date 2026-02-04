/**
 * Rezolvere pentru produse
 */

import * as ProductModel from '../../models/Product.js';
import * as CategoryModel from '../../models/Category.js';

export const productResolvers = {
  Query: {
    /**
     * Listează toate produsele disponibile
     */
    async products() {
      const { products } = await ProductModel.findAll({ isAvailable: true });
      return products;
    },

    /**
     * Găsește un produs după ID
     */
    async product(_: unknown, { id }: { id: string }) {
      return ProductModel.findById(id);
    },

    /**
     * Listează produsele dintr-o categorie
     */
    async productsByCategory(_: unknown, { category }: { category: string }) {
      // Găsește categoria după nume
      const cat = await CategoryModel.findByName(category);
      if (!cat) return [];
      
      const { products } = await ProductModel.findAll({
        categoryId: cat.id,
        isAvailable: true,
      });
      return products;
    },

    /**
     * Caută produse
     */
    async searchProducts(_: unknown, { query }: { query: string }) {
      const { products } = await ProductModel.findAll({
        search: query,
        isAvailable: true,
      });
      return products;
    },

    /**
     * Listează toate categoriile
     */
    async categories() {
      return CategoryModel.findAll();
    },
  },

  // Rezolvere pentru câmpuri de pe Product
  Product: {
    /**
     * Returnează numele categoriei
     */
    category(product: ProductModel.Product) {
      return product.categoryName || '';
    },
  },
};
