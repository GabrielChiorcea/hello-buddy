/**
 * Model Product - operații CRUD pentru produse
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, beginTransaction } from '../config/database.js';
import { ProductOptionGroup, findGroupsByProductId } from './ProductOptionGroup.js';

// Tipuri
export interface ProductIngredient {
  id: number;
  name: string;
  isAllergen: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  isAddon: boolean;
  priorityDrain: boolean;
  preparationTime: number;
   /** Nivel minim de vizibilitate (tier) sau null dacă e vizibil pentru toți */
  minVisibilityTierId: string | null;
  /** Afișat în secțiunea "Recomandate pentru tine" pe home */
  isRecommended: boolean;
  /** Ordinea în secțiunea recomandate (1 = primul); null = la final */
  recommendedOrder: number | null;
  ingredients: ProductIngredient[];
  optionGroups?: ProductOptionGroup[];
  followsCategoryTemplate?: boolean;
  categoryTemplateId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  category_id: string;
  category_name?: string;
  is_available: boolean;
  is_addon?: boolean;
  priority_drain?: boolean;
  preparation_time: number;
  follows_category_template?: boolean;
  category_template_id?: number | null;
  min_visibility_tier_id?: string | null;
  is_recommended?: boolean;
  recommended_order?: number | null;
  created_at: Date;
  updated_at: Date;
}

interface IngredientRow {
  id: number;
  product_id: string;
  name: string;
  is_allergen: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  preparationTime?: number;
  isAddon?: boolean;
  priorityDrain?: boolean;
  minVisibilityTierId?: string | null;
  isRecommended?: boolean;
  recommendedOrder?: number | null;
  ingredients?: Array<{ name: string; isAllergen?: boolean }>;
  followsCategoryTemplate?: boolean;
  categoryTemplateId?: number | null;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isAddon?: boolean;
  priorityDrain?: boolean;
  preparationTime?: number;
  minVisibilityTierId?: string | null;
  isRecommended?: boolean;
  recommendedOrder?: number | null;
  ingredients?: Array<{ name: string; isAllergen?: boolean }>;
  followsCategoryTemplate?: boolean;
  categoryTemplateId?: number | null;
}

// Mapper
function mapRowToProduct(
  row: ProductRow,
  ingredients: ProductIngredient[] = [],
  optionGroups?: ProductOptionGroup[]
): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    image: row.image,
    categoryId: row.category_id,
    categoryName: row.category_name,
    isAvailable: row.is_available,
    isAddon: Boolean(row.is_addon),
    priorityDrain: Boolean(row.priority_drain),
    preparationTime: row.preparation_time,
    minVisibilityTierId: row.min_visibility_tier_id ?? null,
    isRecommended: Boolean(row.is_recommended),
    recommendedOrder: row.recommended_order ?? null,
    ingredients,
    optionGroups,
    followsCategoryTemplate: Boolean(row.follows_category_template),
    categoryTemplateId: row.category_template_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Obține ingredientele pentru un produs
 */
async function getIngredients(productId: string): Promise<ProductIngredient[]> {
  const rows = await query<IngredientRow[]>(
    'SELECT * FROM product_ingredients WHERE product_id = ?',
    [productId]
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    isAllergen: r.is_allergen,
  }));
}

/**
 * Găsește un produs după ID
 */
export async function findById(id: string): Promise<Product | null> {
  const row = await queryOne<ProductRow>(
    `SELECT p.*, c.display_name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id]
  );
  if (!row) return null;
  
  const ingredients = await getIngredients(id);
  return mapRowToProduct(row, ingredients);
}

/**
 * Găsește mai multe produse după ID (folosit pentru a evita N+1 queries).
 */
export async function findByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  const rows = await query<ProductRow[]>(
    `SELECT p.id, p.name, p.description, p.price, p.image, p.category_id, p.is_available,
            COALESCE(p.is_addon, FALSE) as is_addon,
            COALESCE(p.priority_drain, FALSE) as priority_drain,
            p.preparation_time, p.min_visibility_tier_id,
            COALESCE(p.is_recommended, FALSE) as is_recommended, p.recommended_order,
            p.created_at, p.updated_at,
            c.display_name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id IN (${placeholders})`,
    ids
  );

  const productIds = rows.map(r => r.id);
  const ingredientsMap: Map<string, ProductIngredient[]> = new Map();

  if (productIds.length > 0) {
    const allIngredients = await query<IngredientRow[]>(
      `SELECT * FROM product_ingredients WHERE product_id IN (${productIds
        .map(() => '?')
        .join(',')})`,
      productIds
    );

    for (const ing of allIngredients) {
      if (!ingredientsMap.has(ing.product_id)) {
        ingredientsMap.set(ing.product_id, []);
      }
      ingredientsMap.get(ing.product_id)!.push({
        id: ing.id,
        name: ing.name,
        isAllergen: ing.is_allergen,
      });
    }
  }

  return rows.map(row => mapRowToProduct(row, ingredientsMap.get(row.id) || []));
}

/**
 * Listează toate produsele
 */
export async function findAll(options: {
  categoryId?: string;
  isAvailable?: boolean;
  addonOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
  /** XP utilizatorului pentru filtrarea vizibilității pe nivel (tiers). Dacă e omis, nu se aplică filtrul. */
  minVisibilityXp?: number;
  /** Doar produsele marcate ca recomandate (pentru secțiunea "Recomandate pentru tine") */
  recommendedOnly?: boolean;
} = {}): Promise<{ products: Product[]; total: number }> {
  const {
    categoryId,
    isAvailable,
    addonOnly,
    search,
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    minVisibilityXp,
    recommendedOnly,
  } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (isAvailable !== undefined) {
    conditions.push('p.is_available = ?');
    params.push(isAvailable);
  }
  if (addonOnly === true) {
    conditions.push('p.is_addon = TRUE');
  }
  if (search) {
    // Escape LIKE wildcards pentru a preveni wildcard injection
    const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
    conditions.push('MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE)');
    params.push(escaped);
  }
  if (typeof minVisibilityXp === 'number') {
    conditions.push(
      `(p.min_visibility_tier_id IS NULL OR EXISTS (
         SELECT 1 FROM loyalty_tiers lt
         WHERE lt.id = p.min_visibility_tier_id
           AND lt.xp_threshold <= ?
       ))`
    );
    params.push(minVisibilityXp);
  }
  if (recommendedOnly === true) {
    conditions.push('COALESCE(p.is_recommended, FALSE) = TRUE');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM products p ${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  // Get products
  const allowedSorts = ['name', 'price', 'rating', 'created_at'];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const orderClause = recommendedOnly
    ? 'ORDER BY p.recommended_order IS NULL, p.recommended_order ASC, p.name ASC'
    : `ORDER BY p.${safeSortBy} ${safeSortOrder}`;

  const selectColumns =
    'p.id, p.name, p.description, p.price, p.image, p.category_id, p.is_available, ' +
    'COALESCE(p.is_addon, FALSE) as is_addon, COALESCE(p.priority_drain, FALSE) as priority_drain, ' +
    'p.preparation_time, p.min_visibility_tier_id, COALESCE(p.is_recommended, FALSE) as is_recommended, p.recommended_order, ' +
    'p.created_at, p.updated_at, c.display_name as category_name';
  const rows = await query<ProductRow[]>(
    `SELECT ${selectColumns}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  // Get ingredients for all products
  const productIds = rows.map(r => r.id);
  let ingredientsMap: Map<string, ProductIngredient[]> = new Map();
  
  if (productIds.length > 0) {
    const allIngredients = await query<IngredientRow[]>(
      `SELECT * FROM product_ingredients WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );
    
    for (const ing of allIngredients) {
      if (!ingredientsMap.has(ing.product_id)) {
        ingredientsMap.set(ing.product_id, []);
      }
      ingredientsMap.get(ing.product_id)!.push({
        id: ing.id,
        name: ing.name,
        isAllergen: ing.is_allergen,
      });
    }
  }

  const products = rows.map(row => 
    mapRowToProduct(row, ingredientsMap.get(row.id) || [])
  );

  return { products, total };
}

/**
 * Listează produsele marcate ca recomandate (secțiunea "Recomandate pentru tine"), ordonate după recommended_order.
 */
export async function findRecommended(limit = 12): Promise<Product[]> {
  const { products } = await findAll({
    isAvailable: true,
    recommendedOnly: true,
    limit,
    page: 1,
  });
  return products;
}

/**
 * Număr total de produse (disponibile). Pentru statistici / app stats.
 */
export async function countTotal(onlyAvailable = false): Promise<number> {
  const where = onlyAvailable ? 'WHERE is_available = TRUE' : '';
  const r = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM products ${where}`,
    []
  );
  return r?.total ?? 0;
}

/**
 * Găsește produse după categorie
 */
export async function findByCategory(categoryName: string): Promise<Product[]> {
  const category = await queryOne<{ id: string }>(
    'SELECT id FROM categories WHERE name = ?',
    [categoryName]
  );
  if (!category) return [];
  
  const { products } = await findAll({
    categoryId: category.id,
    isAvailable: true,
  });
  return products;
}

/**
 * Creează un produs nou
 */
export async function create(input: CreateProductInput): Promise<Product> {
  const connection = await beginTransaction();
  
  try {
    const id = uuidv4();
    
    await connection.execute(
      `INSERT INTO products (
        id,
        name,
        description,
        price,
        image,
        category_id,
        preparation_time,
        follows_category_template,
        category_template_id,
        is_addon,
        priority_drain,
        min_visibility_tier_id,
        is_recommended,
        recommended_order
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description || null,
        input.price,
        input.image || null,
        input.categoryId,
        input.preparationTime || 30,
        input.followsCategoryTemplate ? 1 : 0,
        input.categoryTemplateId ?? null,
        input.isAddon ? 1 : 0,
        input.priorityDrain ? 1 : 0,
        input.minVisibilityTierId ?? null,
        input.isRecommended ? 1 : 0,
        input.recommendedOrder ?? null,
      ]
    );
    
    // Adaugă ingredientele
    if (input.ingredients && input.ingredients.length > 0) {
      for (const ing of input.ingredients) {
        await connection.execute(
          'INSERT INTO product_ingredients (product_id, name, is_allergen) VALUES (?, ?, ?)',
          [id, ing.name, ing.isAllergen || false]
        );
      }
    }
    
    await connection.commit();
    connection.release();
    
    const product = await findById(id);
    if (!product) throw new Error('Eroare la crearea produsului');
    
    return product;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

/**
 * Actualizează un produs
 */
export async function update(id: string, input: UpdateProductInput): Promise<Product | null> {
  const connection = await beginTransaction();
  
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    
    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.price !== undefined) {
      updates.push('price = ?');
      values.push(input.price);
    }
    if (input.image !== undefined) {
      updates.push('image = ?');
      values.push(input.image);
    }
    if (input.categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(input.categoryId);
    }
    if (input.isAvailable !== undefined) {
      updates.push('is_available = ?');
      values.push(input.isAvailable);
    }
    if (input.preparationTime !== undefined) {
      updates.push('preparation_time = ?');
      values.push(input.preparationTime);
    }
    if (input.followsCategoryTemplate !== undefined) {
      updates.push('follows_category_template = ?');
      values.push(input.followsCategoryTemplate ? 1 : 0);
    }
    if (input.categoryTemplateId !== undefined) {
      updates.push('category_template_id = ?');
      values.push(input.categoryTemplateId ?? null);
    }
    if (input.isAddon !== undefined) {
      updates.push('is_addon = ?');
      values.push(input.isAddon ? 1 : 0);
    }
    if (input.priorityDrain !== undefined) {
      updates.push('priority_drain = ?');
      values.push(input.priorityDrain ? 1 : 0);
    }
    if (input.minVisibilityTierId !== undefined) {
      updates.push('min_visibility_tier_id = ?');
      values.push(input.minVisibilityTierId ?? null);
    }
    if (input.isRecommended !== undefined) {
      updates.push('is_recommended = ?');
      values.push(input.isRecommended ? 1 : 0);
    }
    if (input.recommendedOrder !== undefined) {
      updates.push('recommended_order = ?');
      values.push(input.recommendedOrder ?? null);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    // Actualizează ingredientele dacă sunt specificate
    if (input.ingredients !== undefined) {
      await connection.execute('DELETE FROM product_ingredients WHERE product_id = ?', [id]);
      
      for (const ing of input.ingredients) {
        await connection.execute(
          'INSERT INTO product_ingredients (product_id, name, is_allergen) VALUES (?, ?, ?)',
          [id, ing.name, ing.isAllergen || false]
        );
      }
    }
    
    await connection.commit();
    connection.release();
    
    return findById(id);
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

/**
 * Șterge un produs (soft delete - marchează ca indisponibil)
 */
export async function softDelete(id: string): Promise<boolean> {
  await query('UPDATE products SET is_available = FALSE WHERE id = ?', [id]);
  return true;
}

/**
 * Șterge definitiv un produs.
 * Blochează doar dacă produsul apare în comenzi active (în curs) - nu în delivered/cancelled.
 * product_ingredients se șterg automat (ON DELETE CASCADE).
 */
export async function hardDelete(id: string): Promise<boolean> {
  const hasActiveOrders = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.product_id = ? AND o.status NOT IN ('delivered', 'cancelled')`,
    [id]
  );
  if (hasActiveOrders && hasActiveOrders.count > 0) {
    throw new Error('PRODUCT_HAS_ORDERS');
  }
  await query('DELETE FROM products WHERE id = ?', [id]);
  return true;
}

// ============================================================================
// Template helpers (used by admin/controllers/optionTemplates)
// ============================================================================

import type { CategoryOptionTemplate } from './CategoryOptionTemplate.js';

/**
 * Aplică un template de opțiuni pe un singur produs: șterge grupurile/opțiunile
 * existente și le recreează din template.
 */
export async function applyTemplateToProduct(
  connection: any,
  productId: string,
  template: CategoryOptionTemplate,
  setFollowsTemplate: boolean
): Promise<boolean> {
  // Verifică dacă produsul există
  const [rows]: any[] = await connection.execute(
    'SELECT id FROM products WHERE id = ?',
    [productId]
  );
  if (!rows.length) return false;

  // Șterge opțiunile existente
  const [existingGroups]: any[] = await connection.execute(
    'SELECT id FROM product_option_groups WHERE product_id = ?',
    [productId]
  );
  const groupIds: number[] = existingGroups.map((g: any) => g.id);
  if (groupIds.length > 0) {
    const ph = groupIds.map(() => '?').join(',');
    await connection.execute(
      `DELETE FROM product_options WHERE group_id IN (${ph})`,
      groupIds
    );
    await connection.execute(
      'DELETE FROM product_option_groups WHERE product_id = ?',
      [productId]
    );
  }

  // Recreează din template
  for (const g of template.groups) {
    const [gResult]: any = await connection.execute(
      `INSERT INTO product_option_groups (product_id, name, min_selected, max_selected, is_required)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, g.name, g.minSelected, g.maxSelected, g.isRequired ? 1 : 0]
    );
    const newGroupId: number = gResult.insertId;
    for (const o of g.options) {
      await connection.execute(
        `INSERT INTO product_options (group_id, name, price_delta, is_default, is_multiple, priority)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newGroupId, o.name, o.priceDelta, o.isDefault ? 1 : 0, o.isMultiple ? 1 : 0, o.priority]
      );
    }
  }

  // Actualizează flag-urile de template
  await connection.execute(
    'UPDATE products SET follows_category_template = ?, category_template_id = ? WHERE id = ?',
    [setFollowsTemplate ? 1 : 0, template.id, productId]
  );

  return true;
}

/**
 * Sincronizează toate produsele care urmăresc un template (follows_category_template = true).
 * Returnează numărul de produse actualizate.
 */
export async function syncProductsForTemplate(
  connection: any,
  templateId: number,
  template: CategoryOptionTemplate
): Promise<number> {
  const [rows]: any[] = await connection.execute(
    'SELECT id FROM products WHERE category_template_id = ? AND follows_category_template = TRUE',
    [templateId]
  );
  let affected = 0;
  for (const row of rows) {
    const ok = await applyTemplateToProduct(connection, row.id, template, true);
    if (ok) affected++;
  }
  return affected;
}

/**
 * Detach: setează follows_category_template = false, category_template_id = NULL
 * dar păstrează opțiunile locale.
 */
export async function detachProductsFromTemplate(templateId: number): Promise<void> {
  await query(
    'UPDATE products SET follows_category_template = FALSE, category_template_id = NULL WHERE category_template_id = ?',
    [templateId]
  );
}
