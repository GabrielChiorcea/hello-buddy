import { beginTransaction, query, queryOne } from '../config/database.js';

export interface CategoryOptionTemplateOption {
  id: number;
  groupId: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isMultiple: boolean;
  priority: number;
}

export interface CategoryOptionTemplateGroup {
  id: number;
  templateId: number;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  position: number;
  options: CategoryOptionTemplateOption[];
}

export interface CategoryOptionTemplate {
  id: number;
  categoryId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  groups: CategoryOptionTemplateGroup[];
}

interface CategoryOptionTemplateRow {
  id: number;
  category_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface CategoryOptionTemplateGroupRow {
  id: number;
  template_id: number;
  name: string;
  min_selected: number;
  max_selected: number;
  is_required: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface CategoryOptionTemplateOptionRow {
  id: number;
  group_id: number;
  name: string;
  price_delta: string;
  is_default: boolean;
  is_multiple: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export async function findById(id: number): Promise<CategoryOptionTemplate | null> {
  const row = await queryOne<CategoryOptionTemplateRow>(
    'SELECT * FROM category_option_templates WHERE id = ?',
    [id]
  );
  if (!row) return null;
  const groups = await loadGroupsForTemplate(row.id);
  return mapRowToTemplate(row, groups);
}

export async function findByCategoryId(categoryId: string): Promise<CategoryOptionTemplate[]> {
  const rows = await query<CategoryOptionTemplateRow[]>(
    'SELECT * FROM category_option_templates WHERE category_id = ? ORDER BY id ASC',
    [categoryId]
  );
  if (!rows.length) return [];
  const templateIds = rows.map(r => r.id);
  const groupsByTemplate = await loadGroupsForTemplates(templateIds);
  return rows.map(r => mapRowToTemplate(r, groupsByTemplate.get(r.id) || []));
}

function mapRowToTemplate(
  row: CategoryOptionTemplateRow,
  groups: CategoryOptionTemplateGroup[]
): CategoryOptionTemplate {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    groups,
  };
}

async function loadGroupsForTemplate(
  templateId: number
): Promise<CategoryOptionTemplateGroup[]> {
  const groups = await query<CategoryOptionTemplateGroupRow[]>(
    'SELECT * FROM category_option_template_groups WHERE template_id = ? ORDER BY position ASC, id ASC',
    [templateId]
  );
  if (!groups.length) return [];
  const groupIds = groups.map(g => g.id);
  const opts = await loadOptionsForGroups(groupIds);
  return groups.map(g => ({
    id: g.id,
    templateId: g.template_id,
    name: g.name,
    minSelected: g.min_selected,
    maxSelected: g.max_selected,
    isRequired: Boolean(g.is_required),
    position: g.position,
    options: opts.get(g.id) || [],
  }));
}

async function loadGroupsForTemplates(
  templateIds: number[]
): Promise<Map<number, CategoryOptionTemplateGroup[]>> {
  const result = new Map<number, CategoryOptionTemplateGroup[]>();
  if (!templateIds.length) return result;

  const placeholders = templateIds.map(() => '?').join(',');
  const groups = await query<CategoryOptionTemplateGroupRow[]>(
    `SELECT * FROM category_option_template_groups WHERE template_id IN (${placeholders}) ORDER BY template_id ASC, position ASC, id ASC`,
    templateIds
  );
  if (!groups.length) return result;

  const groupIds = groups.map(g => g.id);
  const opts = await loadOptionsForGroups(groupIds);

  for (const g of groups) {
    if (!result.has(g.template_id)) {
      result.set(g.template_id, []);
    }
    result.get(g.template_id)!.push({
      id: g.id,
      templateId: g.template_id,
      name: g.name,
      minSelected: g.min_selected,
      maxSelected: g.max_selected,
      isRequired: Boolean(g.is_required),
      position: g.position,
      options: opts.get(g.id) || [],
    });
  }
  return result;
}

async function loadOptionsForGroups(
  groupIds: number[]
): Promise<Map<number, CategoryOptionTemplateOption[]>> {
  const result = new Map<number, CategoryOptionTemplateOption[]>();
  if (!groupIds.length) return result;
  const placeholders = groupIds.map(() => '?').join(',');
  const rows = await query<CategoryOptionTemplateOptionRow[]>(
    `SELECT * FROM category_option_template_options WHERE group_id IN (${placeholders}) ORDER BY priority ASC, id ASC`,
    groupIds
  );
  for (const r of rows) {
    if (!result.has(r.group_id)) result.set(r.group_id, []);
    result.get(r.group_id)!.push({
      id: r.id,
      groupId: r.group_id,
      name: r.name,
      priceDelta: parseFloat(r.price_delta),
      isDefault: Boolean(r.is_default),
      isMultiple: Boolean(r.is_multiple),
      priority: r.priority,
    });
  }
  return result;
}

export interface CategoryOptionTemplateInput {
  categoryId: string;
  name: string;
  groups: Array<{
    id?: number;
    name: string;
    minSelected?: number;
    maxSelected?: number;
    isRequired?: boolean;
    position?: number;
    options: Array<{
      id?: number;
      name: string;
      priceDelta?: number;
      isDefault?: boolean;
      isMultiple?: boolean;
      priority?: number;
    }>;
  }>;
}

export async function create(input: CategoryOptionTemplateInput): Promise<CategoryOptionTemplate> {
  const connection = await beginTransaction();
  try {
    const [templateResult]: any = await connection.execute(
      'INSERT INTO category_option_templates (category_id, name) VALUES (?, ?)',
      [input.categoryId, input.name]
    );
    const templateId: number = templateResult.insertId;

    const groups: CategoryOptionTemplateGroup[] = [];

    for (const [index, g] of input.groups.entries()) {
      const [groupResult]: any = await connection.execute(
        `INSERT INTO category_option_template_groups 
         (template_id, name, min_selected, max_selected, is_required, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          g.name,
          g.minSelected ?? 0,
          g.maxSelected ?? 1,
          g.isRequired ?? false,
          g.position ?? index,
        ]
      );
      const groupId: number = groupResult.insertId;

      const options: CategoryOptionTemplateOption[] = [];
      for (const [optIndex, o] of g.options.entries()) {
        const [optResult]: any = await connection.execute(
          `INSERT INTO category_option_template_options 
           (group_id, name, price_delta, is_default, is_multiple, priority)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            groupId,
            o.name,
            o.priceDelta ?? 0,
            o.isDefault ?? false,
            o.isMultiple ?? false,
            o.priority ?? optIndex,
          ]
        );
        const optId: number = optResult.insertId;
        options.push({
          id: optId,
          groupId,
          name: o.name,
          priceDelta: o.priceDelta ?? 0,
          isDefault: o.isDefault ?? false,
          isMultiple: o.isMultiple ?? false,
          priority: o.priority ?? optIndex,
        });
      }

      groups.push({
        id: groupId,
        templateId,
        name: g.name,
        minSelected: g.minSelected ?? 0,
        maxSelected: g.maxSelected ?? 1,
        isRequired: g.isRequired ?? false,
        position: g.position ?? index,
        options,
      });
    }

    await connection.commit();
    connection.release();

    const row = await queryOne<CategoryOptionTemplateRow>(
      'SELECT * FROM category_option_templates WHERE id = ?',
      [templateId]
    );
    if (!row) {
      throw new Error('TEMPLATE_NOT_FOUND_AFTER_CREATE');
    }
    return mapRowToTemplate(row, groups);
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

export async function updateTemplate(
  id: number,
  input: Omit<CategoryOptionTemplateInput, 'categoryId'>
): Promise<CategoryOptionTemplate | null> {
  const existing = await queryOne<CategoryOptionTemplateRow>(
    'SELECT * FROM category_option_templates WHERE id = ?',
    [id]
  );
  if (!existing) return null;

  const connection = await beginTransaction();
  try {
    await connection.execute(
      'UPDATE category_option_templates SET name = ? WHERE id = ?',
      [input.name, id]
    );

    // Simplest approach: delete all groups/options then recreate from input
    const [groupRows]: any[] = await connection.execute(
      'SELECT id FROM category_option_template_groups WHERE template_id = ?',
      [id]
    );
    const groupIds: number[] = groupRows.map((g: any) => g.id);
    if (groupIds.length > 0) {
      const placeholders = groupIds.map(() => '?').join(',');
      await connection.execute(
        `DELETE FROM category_option_template_options WHERE group_id IN (${placeholders})`,
        groupIds
      );
      await connection.execute(
        'DELETE FROM category_option_template_groups WHERE template_id = ?',
        [id]
      );
    }

    const groups: CategoryOptionTemplateGroup[] = [];
    for (const [index, g] of input.groups.entries()) {
      const [groupResult]: any = await connection.execute(
        `INSERT INTO category_option_template_groups 
         (template_id, name, min_selected, max_selected, is_required, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          g.name,
          g.minSelected ?? 0,
          g.maxSelected ?? 1,
          g.isRequired ?? false,
          g.position ?? index,
        ]
      );
      const groupId: number = groupResult.insertId;

      const options: CategoryOptionTemplateOption[] = [];
      for (const [optIndex, o] of g.options.entries()) {
        const [optResult]: any = await connection.execute(
          `INSERT INTO category_option_template_options 
           (group_id, name, price_delta, is_default, is_multiple, priority)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            groupId,
            o.name,
            o.priceDelta ?? 0,
            o.isDefault ?? false,
            o.isMultiple ?? false,
            o.priority ?? optIndex,
          ]
        );
        const optId: number = optResult.insertId;
        options.push({
          id: optId,
          groupId,
          name: o.name,
          priceDelta: o.priceDelta ?? 0,
          isDefault: o.isDefault ?? false,
          isMultiple: o.isMultiple ?? false,
          priority: o.priority ?? optIndex,
        });
      }

      groups.push({
        id: groupId,
        templateId: id,
        name: g.name,
        minSelected: g.minSelected ?? 0,
        maxSelected: g.maxSelected ?? 1,
        isRequired: g.isRequired ?? false,
        position: g.position ?? index,
        options,
      });
    }

    await connection.commit();
    connection.release();

    const row = await queryOne<CategoryOptionTemplateRow>(
      'SELECT * FROM category_option_templates WHERE id = ?',
      [id]
    );
    if (!row) return null;
    return mapRowToTemplate(row, groups);
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

export async function remove(id: number): Promise<void> {
  await query('DELETE FROM category_option_templates WHERE id = ?', [id]);
}

