import { query, queryOne } from '../config/database.js';

export interface ProductOption {
  id: number;
  groupId: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isMultiple: boolean;
  priority: number;
}

export interface ProductOptionGroup {
  id: number;
  productId: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  options: ProductOption[];
}

interface ProductOptionGroupRow {
  id: number;
  product_id: string;
  name: string;
  min_selected: number;
  max_selected: number;
  is_required: boolean;
}

interface ProductOptionRow {
  id: number;
  group_id: number;
  name: string;
  price_delta: string;
  is_default: boolean;
  is_multiple: boolean;
  priority: number;
}

export async function findGroupsByProductId(productId: string): Promise<ProductOptionGroup[]> {
  const groups = await query<ProductOptionGroupRow[]>(
    'SELECT * FROM product_option_groups WHERE product_id = ? ORDER BY id ASC',
    [productId]
  );

  if (groups.length === 0) {
    return [];
  }

  const groupIds = groups.map(g => g.id);
  const placeholders = groupIds.map(() => '?').join(',');

  const options = await query<ProductOptionRow[]>(
    `SELECT * FROM product_options WHERE group_id IN (${placeholders}) ORDER BY priority ASC, id ASC`,
    groupIds
  );

  const optionsByGroup = new Map<number, ProductOption[]>();

  for (const opt of options) {
    if (!optionsByGroup.has(opt.group_id)) {
      optionsByGroup.set(opt.group_id, []);
    }
    optionsByGroup.get(opt.group_id)!.push({
      id: opt.id,
      groupId: opt.group_id,
      name: opt.name,
      priceDelta: parseFloat(opt.price_delta),
      isDefault: Boolean(opt.is_default),
      isMultiple: Boolean(opt.is_multiple),
      priority: opt.priority,
    });
  }

  return groups.map(g => ({
    id: g.id,
    productId: g.product_id,
    name: g.name,
    minSelected: g.min_selected,
    maxSelected: g.max_selected,
    isRequired: Boolean(g.is_required),
    options: optionsByGroup.get(g.id) || [],
  }));
}

export async function findGroupById(id: number): Promise<ProductOptionGroup | null> {
  const group = await queryOne<ProductOptionGroupRow>(
    'SELECT * FROM product_option_groups WHERE id = ?',
    [id]
  );

  if (!group) {
    return null;
  }

  const options = await query<ProductOptionRow[]>(
    'SELECT * FROM product_options WHERE group_id = ? ORDER BY priority ASC, id ASC',
    [group.id]
  );

  return {
    id: group.id,
    productId: group.product_id,
    name: group.name,
    minSelected: group.min_selected,
    maxSelected: group.max_selected,
    isRequired: Boolean(group.is_required),
    options: options.map(opt => ({
      id: opt.id,
      groupId: opt.group_id,
      name: opt.name,
      priceDelta: parseFloat(opt.price_delta),
      isDefault: Boolean(opt.is_default),
      isMultiple: Boolean(opt.is_multiple),
      priority: opt.priority,
    })),
  };
}

