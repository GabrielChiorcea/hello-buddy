import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export interface CouponRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_percent: string;
  points_cost: number;
  required_tier_id: string | null;
  target_product_id: string;
  target_product_name?: string | null;
  is_active: number | boolean;
  starts_at: Date | string | null;
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Coupon {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discountPercent: number;
  pointsCost: number;
  requiredTierId: string | null;
  requiredTierName?: string | null;
  targetProductId: string;
  targetProductName?: string | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function toIso(v: Date | string | null): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function mapRow(row: CouponRow): Coupon {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    discountPercent: parseFloat(row.discount_percent),
    pointsCost: row.points_cost,
    requiredTierId: row.required_tier_id,
    targetProductId: row.target_product_id,
    targetProductName: row.target_product_name ?? null,
    isActive: Boolean(row.is_active),
    startsAt: toIso(row.starts_at),
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

export async function listCoupons(includeInactive = false): Promise<Coupon[]> {
  const rows = await query<CouponRow[]>(
    `SELECT c.*, p.name as target_product_name
     FROM coupons c
     LEFT JOIN products p ON p.id = c.target_product_id
     ${includeInactive ? '' : 'WHERE c.is_active = 1'}
     ORDER BY c.created_at DESC`,
    []
  );
  return rows.map(mapRow);
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const row = await queryOne<CouponRow>(
    `SELECT c.*, p.name as target_product_name
     FROM coupons c
     LEFT JOIN products p ON p.id = c.target_product_id
     WHERE c.id = ?`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function createCoupon(input: {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountPercent: number;
  pointsCost: number;
  requiredTierId?: string | null;
  targetProductId: string;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}): Promise<Coupon> {
  const id = uuidv4();
  await query(
    `INSERT INTO coupons (
      id, title, description, image_url, discount_percent, points_cost,
      required_tier_id, target_product_id, is_active, starts_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.description ?? null,
      input.imageUrl ?? null,
      input.discountPercent,
      input.pointsCost,
      input.requiredTierId ?? null,
      input.targetProductId,
      input.isActive ?? true,
      input.startsAt ?? null,
      input.expiresAt ?? null,
    ]
  );
  const created = await getCouponById(id);
  if (!created) throw new Error('Nu s-a putut crea cuponul');
  return created;
}

export async function updateCoupon(
  id: string,
  updates: Partial<{
    title: string;
    description: string | null;
    imageUrl: string | null;
    discountPercent: number;
    pointsCost: number;
    requiredTierId: string | null;
    targetProductId: string;
    isActive: boolean;
    startsAt: string | null;
    expiresAt: string | null;
  }>
): Promise<Coupon | null> {
  const setters: string[] = [];
  const values: unknown[] = [];
  const map: Record<string, string> = {
    title: 'title',
    description: 'description',
    imageUrl: 'image_url',
    discountPercent: 'discount_percent',
    pointsCost: 'points_cost',
    requiredTierId: 'required_tier_id',
    targetProductId: 'target_product_id',
    isActive: 'is_active',
    startsAt: 'starts_at',
    expiresAt: 'expires_at',
  };
  for (const [k, column] of Object.entries(map)) {
    if ((updates as Record<string, unknown>)[k] !== undefined) {
      setters.push(`${column} = ?`);
      values.push((updates as Record<string, unknown>)[k]);
    }
  }
  if (setters.length === 0) return getCouponById(id);
  values.push(id);
  await query(`UPDATE coupons SET ${setters.join(', ')} WHERE id = ?`, values);
  return getCouponById(id);
}

export async function deleteCoupon(id: string): Promise<void> {
  await query('DELETE FROM coupons WHERE id = ?', [id]);
}

