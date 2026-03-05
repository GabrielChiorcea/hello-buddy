/**
 * Model Product - operații CRUD pentru produse
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, beginTransaction } from '../config/database.js';

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
  ingredients: ProductIngredient[];
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
  ingredients?: Array<{ name: string; isAllergen?: boolean }>;
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
  ingredients?: Array<{ name: string; isAllergen?: boolean }>;
}

// Mapper
function mapRowToProduct(row: ProductRow, ingredients: ProductIngredient[] = []): Product {
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
    ingredients,
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
            p.preparation_time, p.created_at, p.updated_at,
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
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
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

  const selectColumns =
    'p.id, p.name, p.description, p.price, p.image, p.category_id, p.is_available, ' +
    'COALESCE(p.is_addon, FALSE) as is_addon, COALESCE(p.priority_drain, FALSE) as priority_drain, ' +
    'p.preparation_time, p.created_at, p.updated_at, c.display_name as category_name';
  const rows = await query<ProductRow[]>(
    `SELECT ${selectColumns}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ORDER BY p.${safeSortBy} ${safeSortOrder}
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
 * Găsește produse după categorie
 */
export async function findByCategory(categoryName: string): Promise<Product[]> {
  const { products } = await findAll({ isAvailable: true });
  // Filtrăm după numele categoriei
  const category = await queryOne<{ id: string }>(
    'SELECT id FROM categories WHERE name = ?',
    [categoryName]
  );
  if (!category) return products;
  
  return products.filter(p => p.categoryId === category.id);
}

/**
 * Creează un produs nou
 */
export async function create(input: CreateProductInput): Promise<Product> {
  const connection = await beginTransaction();
  
  try {
    const id = uuidv4();
    
    await connection.execute(
      `INSERT INTO products (id, name, description, price, image, category_id, preparation_time, is_addon, priority_drain)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description || null,
        input.price,
        input.image || null,
        input.categoryId,
        input.preparationTime || 30,
        input.isAddon ? 1 : 0,
        input.priorityDrain ? 1 : 0,
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
    if (input.isAddon !== undefined) {
      updates.push('is_addon = ?');
      values.push(input.isAddon ? 1 : 0);
    }
    if (input.priorityDrain !== undefined) {
      updates.push('priority_drain = ?');
      values.push(input.priorityDrain ? 1 : 0);
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
