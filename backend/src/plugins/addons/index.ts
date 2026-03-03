/**
 * Plugin Add-ons – controlat de app_settings (plugin_addons_enabled).
 * 
 * Mod basic: addonProducts (global) – toate produsele is_addon = true.
 * Mod avansat: suggestedAddonsForCart – add-on-uri per categorie, bazate pe conținutul coșului.
 */

import * as AddonRuleModel from '../../models/AddonRule.js';
import * as ProductModel from '../../models/Product.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';

// ============================================
// GraphQL schema extension
// ============================================

export const addonsSchemaExtension = `#graphql
  extend type Query {
    """
    Returnează add-on-uri sugerate pe baza produselor din coș.
    Folosește regulile per categorie din category_addon_rules.
    Fallback: dacă o categorie nu are reguli, returnează add-on-urile globale.
    """
    suggestedAddonsForCart(cartProductIds: [ID!]!): [Product!]!
  }
`;

// ============================================
// Resolvers
// ============================================

export const addonsResolvers = {
  Query: {
    async suggestedAddonsForCart(
      _: unknown,
      { cartProductIds }: { cartProductIds: string[] }
    ): Promise<ProductModel.Product[]> {
      // Verifică feature flag
      const enabled = await isPluginEnabled('addons');
      if (!enabled) return [];

      if (!cartProductIds || cartProductIds.length === 0) {
        // Fallback la global
        const { products } = await ProductModel.findAll({
          isAvailable: true,
          addonOnly: true,
          limit: 50,
        });
        return products;
      }

      // 1. Obține produsele din coș pentru a extrage category_id-urile
      const cartProducts: ProductModel.Product[] = [];
      for (const id of cartProductIds) {
        const p = await ProductModel.findById(id);
        if (p) cartProducts.push(p);
      }

      const categoryIds = [...new Set(cartProducts.map(p => p.categoryId))];

      // 2. Caută regulile per categorie
      const { ruleBasedIds, categoriesWithRules } =
        await AddonRuleModel.findAddonProductIdsForCategories(categoryIds);

      // 3. Fallback pentru categorii fără reguli: adaugă toate add-on-urile globale
      const categoriesWithoutRules = categoryIds.filter(
        c => !categoriesWithRules.includes(c)
      );

      let finalProductIds = new Set(ruleBasedIds);

      if (categoriesWithoutRules.length > 0) {
        // Fallback: include all global addon products
        const { products: globalAddons } = await ProductModel.findAll({
          isAvailable: true,
          addonOnly: true,
          limit: 100,
        });
        for (const p of globalAddons) {
          finalProductIds.add(p.id);
        }
      }

      // 4. Exclude produsele deja în coș
      for (const id of cartProductIds) {
        finalProductIds.delete(id);
      }

      if (finalProductIds.size === 0) return [];

      // 5. Încarcă produsele finale
      const results: ProductModel.Product[] = [];
      for (const pid of finalProductIds) {
        const p = await ProductModel.findById(pid);
        if (p && p.isAvailable && p.isAddon) {
          results.push(p);
        }
      }

      return results.slice(0, 50);
    },
  },
};

export const addonsPlugin = {
  schemaExtension: addonsSchemaExtension,
  resolvers: addonsResolvers,
};
