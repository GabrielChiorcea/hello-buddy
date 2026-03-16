/**
 * Admin controller pentru campanii de produse gratuite pe rank (tiers)
 * Plugin: plugins/free-products
 *
 * Campaniile se setează pe CATEGORIE, nu pe produse individuale.
 */

import { Request, Response } from 'express';
import { logError } from '../../../utils/safeErrorLogger.js';
import * as CampaignsRepo from '../repositories/campaignsRepository.js';

/**
 * GET /admin/free-products/campaigns
 * Listează toate campaniile
 */
export async function getCampaigns(req: Request, res: Response): Promise<void> {
  try {
    const campaigns = await CampaignsRepo.listCampaigns();
    res.json(campaigns);
  } catch (error) {
    logError('listare campanii produse gratuite', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/free-products/campaigns/:id
 * Returnează o campanie
 */
export async function getCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignsRepo.getCampaignById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campania nu a fost găsită' });
      return;
    }
    res.json(campaign);
  } catch (error) {
    logError('citire campanie produse gratuite', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/free-products/campaigns
 * Creează o campanie nouă cu o categorie
 */
export async function createCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { name, tierId, categoryId, startDate, endDate, minOrderValue, customText } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Numele campaniei este obligatoriu' });
      return;
    }
    if (!tierId || typeof tierId !== 'string') {
      res.status(400).json({ error: 'tierId este obligatoriu' });
      return;
    }
    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({ error: 'categoryId este obligatoriu' });
      return;
    }
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Datele de start și sfârșit sunt obligatorii' });
      return;
    }
    if (endDate < startDate) {
      res.status(400).json({ error: 'Data de sfârșit trebuie să fie după data de start' });
      return;
    }

    if (minOrderValue !== undefined) {
      const v = Number(minOrderValue);
      if (!Number.isFinite(v) || v < 0) {
        res.status(400).json({ error: 'minOrderValue trebuie să fie un număr >= 0' });
        return;
      }
    }

    const campaign = await CampaignsRepo.createCampaign({
      name: name.trim(),
      tierId,
      categoryId,
      startDate,
      endDate,
      minOrderValue: minOrderValue != null ? Number(minOrderValue) || 0 : 0,
      customText: customText ?? null,
    });

    res.status(201).json(campaign);
  } catch (error) {
    logError('creare campanie produse gratuite', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/free-products/campaigns/:id
 * Actualizează o campanie
 */
export async function updateCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await CampaignsRepo.getCampaignById(id);
    if (!existing) {
      res.status(404).json({ error: 'Campania nu a fost găsită' });
      return;
    }

    const { name, tierId, categoryId, startDate, endDate, customText } = req.body;

    const updates: Parameters<typeof CampaignsRepo.updateCampaign>[1] = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Numele campaniei este obligatoriu' });
        return;
      }
      (updates as any).name = name.trim();
    }
    if (tierId !== undefined) {
      if (typeof tierId !== 'string' || !tierId) {
        res.status(400).json({ error: 'tierId este obligatoriu' });
        return;
      }
      (updates as any).tierId = tierId;
    }
    if (categoryId !== undefined) {
      if (typeof categoryId !== 'string' || !categoryId) {
        res.status(400).json({ error: 'categoryId este obligatoriu' });
        return;
      }
      (updates as any).categoryId = categoryId;
    }
    if (startDate !== undefined) {
      (updates as any).startDate = startDate;
    }
    if (endDate !== undefined) {
      if (startDate && endDate < startDate) {
        res.status(400).json({ error: 'Data de sfârșit trebuie să fie după data de start' });
        return;
      }
      (updates as any).endDate = endDate;
    }
    if (req.body.minOrderValue !== undefined) {
      const v = Number(req.body.minOrderValue);
      if (!Number.isFinite(v) || v < 0) {
        res.status(400).json({ error: 'minOrderValue trebuie să fie un număr >= 0' });
        return;
      }
      (updates as any).minOrderValue = v;
    }
    if (customText !== undefined) {
      (updates as any).customText = customText;
    }

    const updated = await CampaignsRepo.updateCampaign(id, updates);
    res.json(updated);
  } catch (error) {
    logError('actualizare campanie produse gratuite', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * DELETE /admin/free-products/campaigns/:id
 */
export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await CampaignsRepo.getCampaignById(id);
    if (!existing) {
      res.status(404).json({ error: 'Campania nu a fost găsită' });
      return;
    }
    await CampaignsRepo.deleteCampaign(id);
    res.json({ success: true });
  } catch (error) {
    logError('ștergere campanie produse gratuite', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
