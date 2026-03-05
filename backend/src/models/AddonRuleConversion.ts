/**
 * Model AddonRuleConversion – înregistrări analytics pentru add-to-cart din secțiunea Add-ons
 */

import { query } from '../config/database.js';

export interface AddonRuleConversionInput {
  productId: string;
  ruleId: number | null;
  origin: string;
  cartId?: string | null;
  cartValue?: number | null;
}

/**
 * Înregistrează un eveniment de conversie (produs adăugat din add-ons)
 */
export async function create(input: AddonRuleConversionInput): Promise<void> {
  await query(
    `INSERT INTO addon_rule_conversions (product_id, rule_id, origin, cart_id, cart_value)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.productId,
      input.ruleId ?? null,
      input.origin,
      input.cartId ?? null,
      input.cartValue ?? null,
    ]
  );
}
