/**
 * Controller niveluri loialitate - Admin
 * Plugin: plugins/tiers
 */

import { Request, Response } from 'express';
import { logError } from '../../../utils/safeErrorLogger.js';
import * as TiersRepo from '../repositories/tiersRepository.js';

/**
 * GET /admin/tiers
 * Listează toate nivelurile de loialitate
 */
export async function getTiers(req: Request, res: Response): Promise<void> {
  try {
    const tiers = await TiersRepo.getAll();
    res.json(tiers);
  } catch (error) {
    logError('listare tiers', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/tiers
 * Creează un nivel nou
 */
export async function createTier(req: Request, res: Response): Promise<void> {
  try {
    const { name, xpThreshold, pointsMultiplier, badgeIcon, sortOrder, benefitDescription } =
      req.body;

    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Numele nivelului este obligatoriu' });
      return;
    }
    if (typeof xpThreshold !== 'number' || xpThreshold < 0) {
      res
        .status(400)
        .json({ error: 'xpThreshold trebuie să fie un număr întreg >= 0' });
      return;
    }
    if (
      typeof pointsMultiplier !== 'number' ||
      pointsMultiplier < 1 ||
      !Number.isFinite(pointsMultiplier)
    ) {
      res.status(400).json({
        error:
          'pointsMultiplier trebuie să fie un număr >= 1 (ex: 1.15 pentru +15%)',
      });
      return;
    }

    // Validare: xpThreshold trebuie să fie unic
    const existingTiers = await TiersRepo.getAll();
    const duplicate = existingTiers.find(t => t.xpThreshold === xpThreshold);
    if (duplicate) {
      res.status(400).json({ error: `Există deja un nivel cu pragul XP ${xpThreshold} (${duplicate.name})` });
      return;
    }

    const tier = await TiersRepo.createTier({
      name: name.trim(),
      xpThreshold,
      pointsMultiplier,
      badgeIcon: badgeIcon ?? null,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
      benefitDescription: benefitDescription ?? null,
    });

    res.status(201).json(tier);
  } catch (error) {
    logError('creare tier', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/tiers/:id
 * Actualizează un nivel
 */
export async function updateTier(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, xpThreshold, pointsMultiplier, badgeIcon, sortOrder, benefitDescription } =
      req.body;

    const updates: TiersRepo.UpdateTierInput = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Numele nivelului este obligatoriu' });
        return;
      }
      updates.name = name.trim();
    }
    if (xpThreshold !== undefined) {
      if (typeof xpThreshold !== 'number' || xpThreshold < 0) {
        res
          .status(400)
          .json({ error: 'xpThreshold trebuie să fie un număr întreg >= 0' });
        return;
      }
      // Validare: xpThreshold trebuie să fie unic (exclusiv tier-ul curent)
      const existingTiers = await TiersRepo.getAll();
      const duplicate = existingTiers.find(t => t.xpThreshold === xpThreshold && t.id !== id);
      if (duplicate) {
        res.status(400).json({ error: `Există deja un nivel cu pragul XP ${xpThreshold} (${duplicate.name})` });
        return;
      }
      updates.xpThreshold = xpThreshold;
    }
    if (pointsMultiplier !== undefined) {
      if (
        typeof pointsMultiplier !== 'number' ||
        pointsMultiplier < 1 ||
        !Number.isFinite(pointsMultiplier)
      ) {
        res.status(400).json({
          error:
            'pointsMultiplier trebuie să fie un număr >= 1 (ex: 1.15 pentru +15%)',
        });
        return;
      }
      updates.pointsMultiplier = pointsMultiplier;
    }
    if (badgeIcon !== undefined) {
      updates.badgeIcon = badgeIcon ?? null;
    }
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number') {
        res
          .status(400)
          .json({ error: 'sortOrder trebuie să fie un număr întreg' });
        return;
      }
      updates.sortOrder = sortOrder;
    }
    if (benefitDescription !== undefined) {
      updates.benefitDescription = benefitDescription ?? null;
    }

    const tier = await TiersRepo.updateTier(id, updates);
    if (!tier) {
      res.status(404).json({ error: 'Nivelul nu a fost găsit' });
      return;
    }

    res.json(tier);
  } catch (error) {
    logError('actualizare tier', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * DELETE /admin/tiers/:id
 * Șterge definitiv un nivel
 */
export async function deleteTier(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await TiersRepo.getTierById(id);
    if (!existing) {
      res.status(404).json({ error: 'Nivelul nu a fost găsit' });
      return;
    }

    await TiersRepo.deleteTier(id);
    res.json({ success: true });
  } catch (error) {
    logError('ștergere tier', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

