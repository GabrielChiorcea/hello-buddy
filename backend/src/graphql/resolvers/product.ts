/**
 * Rezolvere pentru produse
 */

import * as ProductModel from '../../models/Product.js';
import * as CategoryModel from '../../models/Category.js';
import { GraphQLContext } from '../context.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { queryOne } from '../../config/database.js';

async function getMinVisibilityXp(context: GraphQLContext): Promise<number | undefined> {
  const user = context.user;
  if (!user) return undefined;

  const tiersEnabled = await isPluginEnabled('tiers');
  if (!tiersEnabled) return undefined;

  const row = await queryOne<{ value: string }>(
    "SELECT value FROM app_settings WHERE id = 'tiers_secret_addons_enabled'"
  );
  const secretEnabled = !row || row.value === 'true' || row.value === '1';
  if (!secretEnabled) return undefined;

  return user.totalXp ?? 0;
}

export const productResolvers = {
  Query: {
    /**
     * Listează toate produsele disponibile
     */
    async products(
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) {
      const minVisibilityXp = await getMinVisibilityXp(context);
      const { products } = await ProductModel.findAll({
        isAvailable: true,
        minVisibilityXp,
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
      { category }: { category: string },
      context: GraphQLContext
    ) {
      // Găsește categoria după nume
      const cat = await CategoryModel.findByName(category);
      if (!cat) return [];
      
      const minVisibilityXp = await getMinVisibilityXp(context);
      const { products } = await ProductModel.findAll({
        categoryId: cat.id,
        isAvailable: true,
        minVisibilityXp,
      });
      return products;
    },

    /**
     * Listează produsele marcate ca add-on la coș (disponibile pentru secțiunea "Adaugă la comandă")
     */
    async addonProducts(
      _: unknown,
      __: unknown,
      context: GraphQLContext
    ) {
      const minVisibilityXp = await getMinVisibilityXp(context);
      const { products } = await ProductModel.findAll({
        isAvailable: true,
        addonOnly: true,
        limit: 100,
        minVisibilityXp,
      });
      return products;
    },

    /**
     * Caută produse
     */
    async searchProducts(
      _: unknown,
      { query }: { query: string },
      context: GraphQLContext
    ) {
      const minVisibilityXp = await getMinVisibilityXp(context);
      const { products } = await ProductModel.findAll({
        search: query,
        isAvailable: true,
        minVisibilityXp,
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
