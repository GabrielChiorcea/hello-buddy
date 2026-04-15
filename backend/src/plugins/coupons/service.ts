import { v4 as uuidv4 } from 'uuid';
import { beginTransaction } from '../../config/database.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import * as CouponsRepo from './repositories/couponsRepository.js';
import * as UserCouponsRepo from './repositories/userCouponsRepository.js';

export interface CheckoutAppliedCoupon {
  userCouponId: string;
  couponId: string;
  targetProductId: string;
  discountPercent: number;
  discountAmount: number;
}

interface CheckoutInput {
  userId: string;
  appliedUserCouponIds?: string[];
}

interface RawCheckoutCouponRow {
  user_coupon_id: string;
  user_id: string;
  status: 'active' | 'used' | 'expired';
  user_coupon_expires_at: Date | string | null;
  coupon_id: string;
  target_product_id: string;
  discount_percent: string | number;
  is_active: number | boolean;
  starts_at: Date | string | null;
  expires_at: Date | string | null;
}

async function userMeetsRequiredTier(
  connection: { execute: (sql: string, params?: unknown[]) => Promise<unknown> },
  userTierId: string | null,
  requiredTierId: string
): Promise<boolean> {
  if (!userTierId) return false;
  if (userTierId === requiredTierId) return true;

  const [thresholdRows] = (await connection.execute(
    `SELECT id, xp_threshold
     FROM loyalty_tiers
     WHERE id IN (?, ?)`,
    [userTierId, requiredTierId]
  )) as [Array<{ id: string; xp_threshold: number | string }>];

  const userTier = thresholdRows.find((row) => row.id === userTierId);
  const requiredTier = thresholdRows.find((row) => row.id === requiredTierId);
  if (!userTier || !requiredTier) return false;

  return Number(userTier.xp_threshold) >= Number(requiredTier.xp_threshold);
}

export async function listCatalogCoupons(): Promise<CouponsRepo.Coupon[]> {
  const enabled = await isPluginEnabled('coupons');
  if (!enabled) return [];
  return CouponsRepo.listCoupons(false);
}

export async function listMyCoupons(userId: string): Promise<UserCouponsRepo.UserCoupon[]> {
  const enabled = await isPluginEnabled('coupons');
  if (!enabled) return [];
  return UserCouponsRepo.listUserCoupons(userId);
}

export async function activateCoupon(userId: string, couponId: string): Promise<UserCouponsRepo.UserCoupon> {
  const enabled = await isPluginEnabled('coupons');
  if (!enabled) throw new Error('Modulul de cupoane este dezactivat');

  const connection = await beginTransaction();
  try {
    const [couponRowsRaw] = await connection.execute(
      `SELECT id, is_active, starts_at, expires_at, points_cost, required_tier_id
       FROM coupons
       WHERE id = ?
       FOR UPDATE`,
      [couponId]
    );
    const couponRows = couponRowsRaw as Array<{
      id: string;
      is_active: number | boolean;
      starts_at: Date | string | null;
      expires_at: Date | string | null;
      points_cost: number;
      required_tier_id: string | null;
    }>;

    const coupon = couponRows[0];
    if (!coupon || !coupon.is_active) throw new Error('Cupon indisponibil');

    const now = Date.now();
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
      throw new Error('Cuponul nu este activ încă');
    }
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
      throw new Error('Cuponul a expirat');
    }

    // Blochează și verifică dacă utilizatorul are deja cuponul activ.
    const [activeRowsRaw] = await connection.execute(
      `SELECT id
       FROM user_coupons
       WHERE user_id = ? AND coupon_id = ? AND status = 'active'
       FOR UPDATE`,
      [userId, couponId]
    );
    const activeRows = activeRowsRaw as Array<{ id: string }>;
    if (activeRows.length > 0) {
      throw new Error('Cuponul este deja activ în portofel');
    }

    const [userRowsRaw] = await connection.execute(
      'SELECT points_balance, tier_id FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    const userRows = userRowsRaw as Array<{ points_balance: number; tier_id: string | null }>;
    const user = userRows[0];
    if (!user) throw new Error('Utilizator inexistent');
    if ((user.points_balance ?? 0) < coupon.points_cost) throw new Error('Puncte insuficiente');
    if (coupon.required_tier_id) {
      const hasRequiredTier = await userMeetsRequiredTier(
        connection,
        user.tier_id,
        coupon.required_tier_id
      );
      if (!hasRequiredTier) {
        throw new Error('Nu ai rank-ul necesar pentru acest cupon');
      }
    }

    await connection.execute('UPDATE users SET points_balance = points_balance - ? WHERE id = ?', [coupon.points_cost, userId]);
    await connection.execute(
      `INSERT INTO points_transactions (id, user_id, amount, type)
       VALUES (?, ?, ?, 'spent')`,
      [uuidv4(), userId, -coupon.points_cost]
    );

    const userCouponId = uuidv4();
    await connection.execute(
      `INSERT INTO user_coupons (id, user_id, coupon_id, status, expires_at)
       VALUES (?, ?, ?, 'active', ?)`,
      // Snapshot expiry at activation time:
      // subsequent catalog coupon expiry changes do not mutate already-activated user coupons.
      [userCouponId, userId, couponId, coupon.expires_at ?? null]
    );

    await connection.commit();
    connection.release();

    const created = await UserCouponsRepo.getUserCouponById(userCouponId);
    if (!created) throw new Error('Nu s-a putut activa cuponul');
    return created;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

export async function resolveAppliedCouponsAtCheckout(
  connection: { execute: (sql: string, params?: unknown[]) => Promise<unknown> },
  input: CheckoutInput,
  lineTotalsByProduct: Map<string, number>
): Promise<CheckoutAppliedCoupon[]> {
  const enabled = await isPluginEnabled('coupons');
  if (!enabled) return [];
  const ids = (input.appliedUserCouponIds ?? []).filter(Boolean);
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  const [rowsRawUnknown] = (await connection.execute(
    `SELECT uc.id as user_coupon_id, uc.user_id, uc.status, uc.expires_at as user_coupon_expires_at,
            c.id as coupon_id, c.target_product_id, c.discount_percent, c.is_active,
            c.starts_at, c.expires_at
     FROM user_coupons uc
     INNER JOIN coupons c ON c.id = uc.coupon_id
     WHERE uc.id IN (${placeholders}) AND uc.user_id = ?
     FOR UPDATE`,
    [...ids, input.userId]
  )) as [unknown[]];
  const rowsRaw = rowsRawUnknown as RawCheckoutCouponRow[];

  const now = Date.now();
  const byProductUsed = new Map<string, number>();
  const applied: CheckoutAppliedCoupon[] = [];

  for (const row of rowsRaw) {
    if (row.status !== 'active') continue;
    if (!row.is_active) continue;
    if (row.starts_at && new Date(row.starts_at).getTime() > now) continue;
    if (row.expires_at && new Date(row.expires_at).getTime() < now) continue;
    if (row.user_coupon_expires_at && new Date(row.user_coupon_expires_at).getTime() < now) continue;

    const productId = String(row.target_product_id);
    const lineTotal = lineTotalsByProduct.get(productId) ?? 0;
    if (lineTotal <= 0) continue;

    const alreadyUsed = byProductUsed.get(productId) ?? 0;
    const available = Math.max(0, lineTotal - alreadyUsed);
    if (available <= 0) continue;
    const percent = Number(row.discount_percent) || 0;
    if (percent <= 0) continue;

    const rawDiscount = available * (percent / 100);
    const discountAmount = Math.min(available, rawDiscount);
    if (discountAmount <= 0) continue;

    byProductUsed.set(productId, alreadyUsed + discountAmount);
    applied.push({
      userCouponId: String(row.user_coupon_id),
      couponId: String(row.coupon_id),
      targetProductId: productId,
      discountPercent: percent,
      discountAmount,
    });
  }

  return applied;
}

