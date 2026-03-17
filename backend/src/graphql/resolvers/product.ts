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
    async products(
      _: unknown,
      __: unknown
    ) {
      const { products } = await ProductModel.findAll({
        isAvailable: true,
      });
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
    async productsByCategory(
      _: unknown,
      { category }: { category: string }
    ) {
      const cat = await CategoryModel.findByName(category);
      if (!cat) return [];
      const { products } = await ProductModel.findAll({
        categoryId: cat.id,
        isAvailable: true,
      });
      return products;
    },

    /**
     * Listează produsele marcate ca add-on la coș (disponibile pentru secțiunea "Adaugă la comandă")
     */
    async addonProducts(
      _: unknown,
      __: unknown
    ) {
      const { products } = await ProductModel.findAll({
        isAvailable: true,
        addonOnly: true,
        limit: 100,
      });
      return products;
    },

    /**
     * Caută produse
     */
    async searchProducts(
      _: unknown,
      { query }: { query: string }
    ) {
      const { products } = await ProductModel.findAll({
        search: query,
        isAvailable: true,
      });
      return products;
    },

    /**
     * Listează produsele recomandate (secțiunea "Recomandate pentru tine")
     */
    async recommendedProducts() {
      return ProductModel.findRecommended(12);
    },

    /**
     * Statistici aplicație (număr total produse etc.)
     */
    async appStats() {
      const totalProducts = await ProductModel.countTotal(true);
      return { totalProducts };
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
    optionGroups(product: ProductModel.Product) {
      return product.optionGroups || [];
    },
  },
};
