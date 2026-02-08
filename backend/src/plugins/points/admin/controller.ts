/**
 * Controller puncte loialitate - Admin
 * Plugin: plugins/points
 */

import { Request, Response } from 'express';
import { logError } from '../../../utils/safeErrorLogger.js';
import * as PointsModel from '../model.js';

/**
 * GET /admin/points/rewards
 * Listează toate pragmatic de puncte
 */
export async function getRewards(req: Request, res: Response): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const rewards = await PointsModel.getRewards(includeInactive);
    res.json(rewards);
  } catch (error) {
    logError('listare pragmatic puncte', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/points/rewards
 * Creează un prag nou
 */
export async function createReward(req: Request, res: Response): Promise<void> {
  try {
    const { pointsCost, discountAmount } = req.body;

    if (typeof pointsCost !== 'number' || pointsCost < 1) {
      res.status(400).json({ error: 'pointsCost trebuie să fie un număr pozitiv' });
      return;
    }
    if (typeof discountAmount !== 'number' || discountAmount < 0) {
      res.status(400).json({ error: 'discountAmount trebuie să fie un număr nenegativ' });
      return;
    }

    const reward = await PointsModel.createReward(pointsCost, discountAmount);
    res.status(201).json(reward);
  } catch (error) {
    logError('creare prag puncte', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/points/rewards/:id
 * Actualizează un prag
 */
export async function updateReward(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { pointsCost, discountAmount, isActive } = req.body;

    const updates: { pointsCost?: number; discountAmount?: number; isActive?: boolean } = {};
    if (typeof pointsCost === 'number' && pointsCost >= 1) updates.pointsCost = pointsCost;
    if (typeof discountAmount === 'number' && discountAmount >= 0) updates.discountAmount = discountAmount;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const reward = await PointsModel.updateReward(id, updates);
    if (!reward) {
      res.status(404).json({ error: 'Pragul nu a fost găsit' });
      return;
    }
    res.json(reward);
  } catch (error) {
    logError('actualizare prag puncte', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * DELETE /admin/points/rewards/:id
 * Dezactivează un prag
 */
export async function deleteReward(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await PointsModel.getRewardById(id);
    if (!existing) {
      res.status(404).json({ error: 'Pragul nu a fost găsit' });
      return;
    }
    await PointsModel.deleteReward(id);
    res.json({ success: true });
  } catch (error) {
    logError('ștergere prag puncte', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
