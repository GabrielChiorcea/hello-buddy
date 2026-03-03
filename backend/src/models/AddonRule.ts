/**
 * Model AddonRule – reguli de add-on per categorie
 */

import { query } from '../config/database.js';

export interface AddonRule {
  id: number;
  categoryId: string;
  addonProductId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AddonRuleRow {
  id: number;
  category_id: string;
  addon_product_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Returnează toate regulile, opțional filtrate pe categorie
 */
export async function findAll(categoryId?: string): Promise<AddonRule[]> {
  let sql = 'SELECT * FROM category_addon_rules';
  const params: unknown[] = [];
  if (categoryId) {
    sql += ' WHERE category_id = ?';
    params.push(categoryId);
  }
  sql += ' ORDER BY category_id, addon_product_id';
  const rows = await query<AddonRuleRow[]>(sql, params);
  return rows.map(r => ({
    id: r.id,
    categoryId: r.category_id,
    addonProductId: r.addon_product_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Returnează toate regulile grupate: { categoryId -> addonProductId[] }
 */
export async function findAllGrouped(): Promise<Record<string, string[]>> {
  const rules = await findAll();
  const grouped: Record<string, string[]> = {};
  for (const r of rules) {
    if (!grouped[r.categoryId]) grouped[r.categoryId] = [];
    grouped[r.categoryId].push(r.addonProductId);
  }
  return grouped;
}

/**
 * Returnează ID-urile distincte de produse add-on pentru o listă de categoryId-uri.
 * Dacă o categorie nu are reguli, se poate folosi fallback pe global.
 */
export async function findAddonProductIdsForCategories(
  categoryIds: string[]
): Promise<{ ruleBasedIds: string[]; categoriesWithRules: string[] }> {
  if (categoryIds.length === 0) return { ruleBasedIds: [], categoriesWithRules: [] };

  const placeholders = categoryIds.map(() => '?').join(',');
  const rows = await query<{ addon_product_id: string; category_id: string }[]>(
    `SELECT DISTINCT addon_product_id, category_id
     FROM category_addon_rules
     WHERE category_id IN (${placeholders})`,
    categoryIds
  );

  const ruleBasedIds = [...new Set(rows.map(r => r.addon_product_id))];
  const categoriesWithRules = [...new Set(rows.map(r => r.category_id))];
  return { ruleBasedIds, categoriesWithRules };
}

/**
 * Înlocuiește regulile pentru o categorie (delete + insert batch)
 */
export async function replaceRulesForCategory(
  categoryId: string,
  addonProductIds: string[]
): Promise<void> {
  await query('DELETE FROM category_addon_rules WHERE category_id = ?', [categoryId]);
  for (const pid of addonProductIds) {
    await query(
      'INSERT INTO category_addon_rules (category_id, addon_product_id) VALUES (?, ?)',
      [categoryId, pid]
    );
  }
}

/**
 * Înlocuiește batch regulile pentru mai multe categorii
 */
export async function replaceRulesBatch(
  mapping: Record<string, string[]>
): Promise<void> {
  const categoryIds = Object.keys(mapping);
  if (categoryIds.length === 0) return;

  // Șterge regulile vechi doar pentru categoriile trimise
  const placeholders = categoryIds.map(() => '?').join(',');
  await query(
    `DELETE FROM category_addon_rules WHERE category_id IN (${placeholders})`,
    categoryIds
  );

  // Inserează noile reguli
  for (const [categoryId, productIds] of Object.entries(mapping)) {
    for (const pid of productIds) {
      await query(
        'INSERT INTO category_addon_rules (category_id, addon_product_id) VALUES (?, ?)',
        [categoryId, pid]
      );
    }
  }
}
