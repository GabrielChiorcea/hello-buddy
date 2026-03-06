/**
 * Plugin Add-ons – controlat de app_settings (plugin_addons_enabled).
 * 
 * Mod basic: addonProducts (global) – toate produsele is_addon = true.
 * Mod avansat: suggestedAddonsForCart – add-on-uri per categorie, bazate pe conținutul coșului.
 */

import * as AddonRuleModel from '../../models/AddonRule.js';
import * as ProductModel from '../../models/Product.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { queryOne } from '../../config/database.js';

interface AddonSuggestion {
  product: ProductModel.Product;
  ruleId: number | null;
}

// ============================================
// GraphQL schema extension
// ============================================

export const addonsSchemaExtension = `#graphql
  type AddonSuggestion {
    product: Product!
    ruleId: Int
  }

  extend type Query {
    """
    Returnează add-on-uri sugerate pe baza produselor din coș.
    Folosește regulile per categorie din category_addon_rules.
    Fallback: dacă o categorie nu are reguli, returnează add-on-urile globale.
    """
    suggestedAddonsForCart(cartProductIds: [ID!]!): [AddonSuggestion!]!
  }
`;

function timeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const parts = time.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function isRuleActiveNow(
  rule: Pick<AddonRuleModel.AddonRule, 'timeStart' | 'timeEnd'>,
  now: Date
): boolean {
  const startMinutes = timeToMinutes(rule.timeStart);
  const endMinutes = timeToMinutes(rule.timeEnd);

  // Fără interval orar – regula este mereu activă
  if (startMinutes === null || endMinutes === null) {
    return true;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (startMinutes <= endMinutes) {
    // Interval normal (ex: 08:00 - 12:00)
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  // Interval peste miezul nopții (ex: 22:00 - 02:00)
  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

async function getFreeDeliveryThreshold(): Promise<number> {
  const row = await queryOne<{ value: string }>(
    'SELECT value FROM app_settings WHERE id = ?',
    ['free_delivery_threshold']
  );
  if (!row) return 75;
  const value = parseFloat(row.value);
  return Number.isFinite(value) && value > 0 ? value : 75;
}

// ============================================
// Resolvers
// ============================================

export const addonsResolvers = {
  Query: {
    async suggestedAddonsForCart(
      _: unknown,
      { cartProductIds }: { cartProductIds: string[] }
    ): Promise<AddonSuggestion[]> {
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
        return products.map(p => ({ product: p, ruleId: null }));
      }

      // 1. Obține produsele din coș pentru a extrage category_id-urile și subtotalul (fără N+1)
      const quantityById = new Map<string, number>();
      for (const id of cartProductIds) {
        quantityById.set(id, (quantityById.get(id) ?? 0) + 1);
      }
      const uniqueCartProductIds = [...quantityById.keys()];

      const cartProducts = await ProductModel.findByIds(uniqueCartProductIds);

      if (cartProducts.length === 0) {
        return [];
      }

      let cartSubtotal = 0;
      for (const p of cartProducts) {
        const qty = quantityById.get(p.id) ?? 1;
        cartSubtotal += p.price * qty;
      }

      const categoryIds = [...new Set(cartProducts.map(p => p.categoryId))];

      // 2. Încarcă regulile pentru categoriile din coș
      const allRules = await AddonRuleModel.findRulesForCategories(categoryIds);
      const freeDeliveryThreshold = await getFreeDeliveryThreshold();
      const gap = freeDeliveryThreshold - cartSubtotal;
      const isInGapWindow =
        gap > 0 && gap <= freeDeliveryThreshold * 0.15;

      const now = new Date();

      // 3. Filtrare pe timp
      const activeRules = allRules.filter(rule => isRuleActiveNow(rule, now));

      if (activeRules.length === 0) {
        // Fallback: add-on-uri globale dacă nu există reguli active
        const { products } = await ProductModel.findAll({
          isAvailable: true,
          addonOnly: true,
          limit: 50,
        });
        return products.map(p => ({ product: p, ruleId: null }));
      }

      // 4. Construiește candidații (produs + regulă) cu un singur query de produse
      const candidates: { product: ProductModel.Product; rule: AddonRuleModel.AddonRule }[] = [];
      const addonProductIds = [
        ...new Set(activeRules.map(rule => rule.addonProductId)),
      ];
      const addonProducts = await ProductModel.findByIds(addonProductIds);
      const productById = new Map<string, ProductModel.Product>(
        addonProducts.map(p => [p.id, p])
      );

      for (const rule of activeRules) {
        const product = productById.get(rule.addonProductId);
        if (!product) continue;
        if (!product.isAvailable || !product.isAddon) continue;

        // Nu mai excludem pe categorie — utilizatorul poate adăuga mai multe din aceeași categorie (ex: 2 sucuri)
        candidates.push({ product, rule });
      }

      if (candidates.length === 0) {
        return [];
      }

      // 5. Ordonare după priority_drain, apoi priority, apoi „gap to free delivery”, apoi preț
      candidates.sort((a, b) => {
        // priority_drain DESC
        if (a.product.priorityDrain !== b.product.priorityDrain) {
          return a.product.priorityDrain ? -1 : 1;
        }

        // rule.priority DESC
        if (a.rule.priority !== b.rule.priority) {
          return b.rule.priority - a.rule.priority;
        }

        // Gap livrare gratuită – cât de aproape de gap este prețul
        if (isInGapWindow) {
          const aDiff = Math.abs(a.product.price - gap);
          const bDiff = Math.abs(b.product.price - gap);
          if (aDiff !== bDiff) {
            return aDiff - bDiff;
          }
        }

        // Fallback: preț ASC
        return a.product.price - b.product.price;
      });

      // 6. Deduplicare pe produs, păstrând instanța cu prioritatea cea mai bună
      const seenProductIds = new Set<string>();
      const suggestions: AddonSuggestion[] = [];

      for (const { product, rule } of candidates) {
        if (seenProductIds.has(product.id)) continue;
        seenProductIds.add(product.id);
        suggestions.push({
          product,
          ruleId: rule.id,
        });
        if (suggestions.length >= 50) break;
      }

      return suggestions;
    },
  },
};

export const addonsPlugin = {
  schemaExtension: addonsSchemaExtension,
  resolvers: addonsResolvers,
};
