/**
 * Model Category - gestionare categorii produse
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database.js';

export interface Category {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null
  sortOrder: number;
  isActive: boolean;
  productsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryRow {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  products_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryInput {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  displayName?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    icon: row.icon,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    productsCount: row.products_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Găsește o categorie după ID
 */
export async function findById(id: string): Promise<Category | null> {
  const row = await queryOne<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
  return row ? mapRowToCategory(row) : null;
}

/**
 * Găsește o categorie după nume
 */
export async function findByName(name: string): Promise<Category | null> {
  const row = await queryOne<CategoryRow>(
    'SELECT * FROM categories WHERE name = ?',
    [name]
  );
  return row ? mapRowToCategory(row) : null;
}

/**
 * Listează toate categoriile
 */
export async function findAll(includeInactive = false): Promise<Category[]> {
  let sql = `
    SELECT c.*, COUNT(p.id) as products_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_available = TRUE
  `;
  
  if (!includeInactive) {
    sql += ' WHERE c.is_active = TRUE';
  }
  
  sql += ' GROUP BY c.id ORDER BY c.sort_order ASC, c.display_name ASC';
  
  const rows = await query<CategoryRow[]>(sql);
  return rows.map(mapRowToCategory);
}

/**
 * Creează o categorie nouă
 */
export async function create(input: CreateCategoryInput): Promise<Category> {
  const id = uuidv4();
  
  // Determină sort_order dacă nu este specificat
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const maxOrder = await queryOne<{ max_order: number }>(
      'SELECT MAX(sort_order) as max_order FROM categories'
    );
    sortOrder = (maxOrder?.max_order || 0) + 1;
  }
  
  await query(
    `INSERT INTO categories (id, name, display_name, description, icon, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.displayName, input.description  || null, input.icon || null, sortOrder]
  );
  
  const category = await findById(id);
  if (!category) throw new Error('Eroare la crearea categoriei');
  
  return category;
}

/**
 * Actualizează o categorie
 */
export async function update(id: string, input: UpdateCategoryInput): Promise<Category | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.displayName !== undefined) {
    updates.push('display_name = ?');
    values.push(input.displayName);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }
  if (input.icon !== undefined) {
    updates.push('icon = ?');
    values.push(input.icon);
  }
  if (input.sortOrder !== undefined) {
    updates.push('sort_order = ?');
    values.push(input.sortOrder);
  }
  if (input.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(input.isActive);
  }
  
  if (updates.length === 0) return findById(id);
  
  values.push(id);
  await query(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return findById(id);
}

/**
 * Reordonează categoriile
 */
export async function reorder(categoryIds: string[]): Promise<boolean> {
  for (let i = 0; i < categoryIds.length; i++) {
    await query(
      'UPDATE categories SET sort_order = ? WHERE id = ?',
      [i, categoryIds[i]]
    );
  }
  return true;
}

/**
 * Șterge o categorie
 */
export async function deleteCategory(id: string): Promise<boolean> {
  // Verifică dacă are produse
  const productsCount = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
    [id]
  );
  
  if (productsCount && productsCount.count > 0) {
    throw new Error('Nu se poate șterge categoria deoarece conține produse');
  }
  
  await query('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}
