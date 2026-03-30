import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export type UserCouponStatus = 'active' | 'used' | 'expired';

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  status: UserCouponStatus;
  activatedAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedOrderId: string | null;
  coupon: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    discountPercent: number;
    pointsCost: number;
    requiredTierId: string | null;
    requiredTierName?: string | null;
    targetProductId: string;
    targetProductName: string | null;
    isActive?: boolean;
    startsAt?: string | null;
    expiresAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
}

interface UserCouponRow {
  id: string;
  user_id: string;
  coupon_id: string;
  status: UserCouponStatus;
  activated_at: Date | string;
  expires_at: Date | string | null;
  used_at: Date | string | null;
  used_order_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_percent: string;
  points_cost: number;
  required_tier_id: string | null;
  required_tier_name: string | null;
  target_product_id: string;
  target_product_name: string | null;
  is_active: number | boolean;
  starts_at: Date | string | null;
  coupon_expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(v: Date | string | null): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function mapRow(row: UserCouponRow): UserCoupon {
  return {
    id: row.id,
    userId: row.user_id,
    couponId: row.coupon_id,
    status: row.status,
    activatedAt: toIso(row.activated_at)!,
    expiresAt: toIso(row.expires_at),
    usedAt: toIso(row.used_at),
    usedOrderId: row.used_order_id,
    coupon: {
      id: row.coupon_id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      discountPercent: parseFloat(row.discount_percent),
      pointsCost: row.points_cost,
      requiredTierId: row.required_tier_id,
      requiredTierName: row.required_tier_name,
      targetProductId: row.target_product_id,
      targetProductName: row.target_product_name,
      isActive: Boolean(row.is_active),
      startsAt: toIso(row.starts_at),
      expiresAt: toIso(row.coupon_expires_at),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    },
  };
}

export async function listUserCoupons(userId: string): Promise<UserCoupon[]> {
  const rows = await query<UserCouponRow[]>(
    `SELECT uc.*, c.title, c.description, c.image_url, c.discount_percent, c.points_cost,
            c.required_tier_id, lt.name as required_tier_name, c.target_product_id, p.name as target_product_name,
            c.is_active, c.starts_at, c.expires_at as coupon_expires_at, c.created_at, c.updated_at
     FROM user_coupons uc
     INNER JOIN coupons c ON c.id = uc.coupon_id
     LEFT JOIN loyalty_tiers lt ON lt.id = c.required_tier_id
     LEFT JOIN products p ON p.id = c.target_product_id
     WHERE uc.user_id = ?
     ORDER BY uc.activated_at DESC`,
    [userId]
  );
  return rows.map(mapRow);
}

export async function createUserCoupon(input: {
  userId: string;
  couponId: string;
  expiresAt?: string | null;
}): Promise<UserCoupon> {
  const id = uuidv4();
  await query(
    `INSERT INTO user_coupons (id, user_id, coupon_id, status, expires_at)
     VALUES (?, ?, ?, 'active', ?)`,
    [id, input.userId, input.couponId, input.expiresAt ?? null]
  );
  const created = await getUserCouponById(id);
  if (!created) throw new Error('Nu s-a putut activa cuponul');
  return created;
}

export async function getUserCouponById(id: string): Promise<UserCoupon | null> {
  const row = await queryOne<UserCouponRow>(
    `SELECT uc.*, c.title, c.description, c.image_url, c.discount_percent, c.points_cost,
            c.required_tier_id, lt.name as required_tier_name, c.target_product_id, p.name as target_product_name,
            c.is_active, c.starts_at, c.expires_at as coupon_expires_at, c.created_at, c.updated_at
     FROM user_coupons uc
     INNER JOIN coupons c ON c.id = uc.coupon_id
     LEFT JOIN loyalty_tiers lt ON lt.id = c.required_tier_id
     LEFT JOIN products p ON p.id = c.target_product_id
     WHERE uc.id = ?`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function markUserCouponUsed(id: string, orderId: string): Promise<void> {
  await query(
    `UPDATE user_coupons
     SET status = 'used', used_at = NOW(), used_order_id = ?
     WHERE id = ?`,
    [orderId, id]
  );
}

