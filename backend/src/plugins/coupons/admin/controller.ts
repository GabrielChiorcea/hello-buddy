import { Request, Response } from 'express';
import { logError } from '../../../utils/safeErrorLogger.js';
import { query } from '../../../config/database.js';
import * as CouponsRepo from '../repositories/couponsRepository.js';

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
    const updated = await CouponsRepo.updateCoupon(id, req.body ?? {});
    if (!updated) {
      res.status(404).json({ error: 'Cuponul nu a fost găsit' });
      return;
    }
    res.json(updated);
  } catch (error) {
    logError('actualizare cupon admin', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
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
         SUM(CASE WHEN uc.status = 'used' THEN 1 ELSE 0 END) as total_used
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

