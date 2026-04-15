import { Request, Response } from 'express';
import { logError } from '../../../utils/safeErrorLogger.js';
import { query } from '../../../config/database.js';
import * as CouponsRepo from '../repositories/couponsRepository.js';

type CouponUpdatePayload = Partial<{
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
}>;

function isValidDateInput(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  return !isNaN(new Date(value).getTime());
}

function sanitizeCouponUpdatePayload(raw: unknown): CouponUpdatePayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Payload invalid');
  }

  const allowedKeys = new Set([
    'title',
    'description',
    'imageUrl',
    'discountPercent',
    'pointsCost',
    'requiredTierId',
    'targetProductId',
    'isActive',
    'startsAt',
    'expiresAt',
  ]);
  const payload = raw as Record<string, unknown>;
  const updates: CouponUpdatePayload = {};

  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`Câmp nepermis pentru update: ${key}`);
    }
  }

  if (payload.title !== undefined) {
    if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw new Error('title invalid');
    }
    updates.title = payload.title.trim();
  }
  if (payload.description !== undefined) {
    if (payload.description !== null && typeof payload.description !== 'string') {
      throw new Error('description invalid');
    }
    updates.description = payload.description;
  }
  if (payload.imageUrl !== undefined) {
    if (payload.imageUrl !== null && typeof payload.imageUrl !== 'string') {
      throw new Error('imageUrl invalid');
    }
    updates.imageUrl = payload.imageUrl;
  }
  if (payload.discountPercent !== undefined) {
    if (typeof payload.discountPercent !== 'number' || payload.discountPercent <= 0 || payload.discountPercent > 100) {
      throw new Error('discountPercent trebuie să fie între 0 și 100');
    }
    updates.discountPercent = payload.discountPercent;
  }
  if (payload.pointsCost !== undefined) {
    if (typeof payload.pointsCost !== 'number' || payload.pointsCost < 0) {
      throw new Error('pointsCost invalid');
    }
    updates.pointsCost = payload.pointsCost;
  }
  if (payload.requiredTierId !== undefined) {
    if (payload.requiredTierId !== null && typeof payload.requiredTierId !== 'string') {
      throw new Error('requiredTierId invalid');
    }
    updates.requiredTierId = payload.requiredTierId;
  }
  if (payload.targetProductId !== undefined) {
    if (typeof payload.targetProductId !== 'string' || payload.targetProductId.trim().length === 0) {
      throw new Error('targetProductId invalid');
    }
    updates.targetProductId = payload.targetProductId.trim();
  }
  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') {
      throw new Error('isActive invalid');
    }
    updates.isActive = payload.isActive;
  }
  if (payload.startsAt !== undefined) {
    if (!isValidDateInput(payload.startsAt)) {
      throw new Error('startsAt invalid');
    }
    updates.startsAt = payload.startsAt as string | null;
  }
  if (payload.expiresAt !== undefined) {
    if (!isValidDateInput(payload.expiresAt)) {
      throw new Error('expiresAt invalid');
    }
    updates.expiresAt = payload.expiresAt as string | null;
  }

  if (
    updates.startsAt !== undefined &&
    updates.expiresAt !== undefined &&
    updates.startsAt !== null &&
    updates.expiresAt !== null
  ) {
    const startsAtMs = new Date(updates.startsAt).getTime();
    const expiresAtMs = new Date(updates.expiresAt).getTime();
    if (startsAtMs > expiresAtMs) {
      throw new Error('startsAt nu poate fi după expiresAt');
    }
  }

  return updates;
}

export async function getCoupons(req: Request, res: Response): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const coupons = await CouponsRepo.listCoupons(includeInactive);
    res.json(coupons);
  } catch (error) {
    logError('listare cupoane admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function createCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, imageUrl, discountPercent, pointsCost, requiredTierId, targetProductId, isActive, startsAt, expiresAt } = req.body ?? {};
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Titlul este obligatoriu' });
      return;
    }
    if (typeof discountPercent !== 'number' || discountPercent <= 0 || discountPercent > 100) {
      res.status(400).json({ error: 'discountPercent trebuie să fie între 0 și 100' });
      return;
    }
    if (typeof pointsCost !== 'number' || pointsCost < 0) {
      res.status(400).json({ error: 'pointsCost invalid' });
      return;
    }
    if (!targetProductId || typeof targetProductId !== 'string') {
      res.status(400).json({ error: 'targetProductId este obligatoriu' });
      return;
    }
    const created = await CouponsRepo.createCoupon({
      title,
      description,
      imageUrl,
      discountPercent,
      pointsCost,
      requiredTierId,
      targetProductId,
      isActive,
      startsAt,
      expiresAt,
    });
    res.status(201).json(created);
  } catch (error) {
    logError('creare cupon admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function updateCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await CouponsRepo.getCouponById(id);
    if (!existing) {
      res.status(404).json({ error: 'Cuponul nu a fost găsit' });
      return;
    }

    let updates: CouponUpdatePayload;
    try {
      updates = sanitizeCouponUpdatePayload(req.body ?? {});
    } catch (validationError) {
      res.status(400).json({ error: (validationError as Error).message });
      return;
    }

    const mergedStartsAt = updates.startsAt !== undefined ? updates.startsAt : existing.startsAt;
    const mergedExpiresAt = updates.expiresAt !== undefined ? updates.expiresAt : existing.expiresAt;
    if (mergedStartsAt && mergedExpiresAt) {
      const startsAtMs = new Date(mergedStartsAt).getTime();
      const expiresAtMs = new Date(mergedExpiresAt).getTime();
      if (startsAtMs > expiresAtMs) {
        res.status(400).json({ error: 'startsAt nu poate fi după expiresAt' });
        return;
      }
    }

    const updated = await CouponsRepo.updateCoupon(id, updates);
    if (!updated) throw new Error('Nu s-a putut actualiza cuponul');
    res.json(updated);
  } catch (error) {
    logError('actualizare cupon admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const coupon = await CouponsRepo.getCouponById(id);
    if (!coupon) {
      res.status(404).json({ error: 'Cuponul nu a fost găsit' });
      return;
    }

    const activeRows = await query<Array<{ active_count: number }>>(
      `SELECT COUNT(*) as active_count
       FROM user_coupons
       WHERE coupon_id = ? AND status = 'active'`,
      [id]
    );
    const activeCount = Number(activeRows[0]?.active_count ?? 0);
    if (activeCount > 0) {
      res.status(409).json({
        error: 'Cuponul are activări active și nu poate fi șters',
        activeUserCoupons: activeCount,
      });
      return;
    }

    await CouponsRepo.deleteCoupon(id);
    res.json({ success: true });
  } catch (error) {
    logError('ștergere cupon admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function getCouponsAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;
    const params: unknown[] = [];
    const where: string[] = [];
    if (from && !isNaN(from.getTime())) {
      where.push('uc.activated_at >= ?');
      params.push(from);
    }
    if (to && !isNaN(to.getTime())) {
      where.push('uc.activated_at <= ?');
      params.push(to);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const topActivated = await query<any[]>(
      `SELECT c.id, c.title, COUNT(*) as activations
       FROM user_coupons uc
       INNER JOIN coupons c ON c.id = uc.coupon_id
       ${whereSql}
       GROUP BY c.id, c.title
       ORDER BY activations DESC
       LIMIT 10`,
      params
    );
    const totals = await query<any[]>(
      `SELECT
         COALESCE(SUM(ocr.discount_amount), 0) as total_discount,
         COUNT(DISTINCT uc.id) as total_activated,
         COUNT(DISTINCT CASE WHEN uc.status = 'used' THEN uc.id ELSE NULL END) as total_used
       FROM user_coupons uc
       LEFT JOIN order_coupon_redemptions ocr ON ocr.user_coupon_id = uc.id
       ${whereSql}`,
      params
    );
    const row = totals[0] || { total_discount: 0, total_activated: 0, total_used: 0 };
    const activated = Number(row.total_activated) || 0;
    const used = Number(row.total_used) || 0;
    res.json({
      topActivated,
      totalDiscount: Number(row.total_discount) || 0,
      totalActivated: activated,
      totalUsed: used,
      usageRate: activated > 0 ? used / activated : 0,
    });
  } catch (error) {
    logError('analytics cupoane admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

