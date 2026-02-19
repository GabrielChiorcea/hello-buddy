/**
 * Admin controller for streak campaigns
 * Plugin: plugins/streak
 */

import { Request, Response } from 'express';
import { logError } from '../../../utils/safeErrorLogger.js';
import * as CampaignsRepo from '../repositories/campaignsRepository.js';
import * as EnrollmentsRepo from '../repositories/enrollmentsRepository.js';
import { query } from '../../../config/database.js';

/**
 * GET /admin/streak/campaigns
 */
export async function getCampaigns(req: Request, res: Response): Promise<void> {
  try {
    const campaigns = await CampaignsRepo.listCampaigns();
    res.json(campaigns);
  } catch (error) {
    logError('listare campanii streak', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/streak/campaigns/:id
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
    logError('citire campanie streak', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/streak/campaigns
 */
export async function createCampaign(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    const campaign = await CampaignsRepo.createCampaign({
      name: body.name,
      streakType: body.streakType,
      ordersRequired: body.ordersRequired,
      bonusPoints: body.bonusPoints ?? 0,
      customText: body.customText ?? null,
      startDate: body.startDate,
      endDate: body.endDate,
      resetOnMiss: body.resetOnMiss !== false,
      pointsExpireAfterCampaign: body.pointsExpireAfterCampaign === true,
    });
    res.status(201).json(campaign);
  } catch (error) {
    logError('creare campanie streak', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/streak/campaigns/:id - rejected if campaign is active
 */
export async function updateCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignsRepo.getCampaignById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campania nu a fost găsită' });
      return;
    }
    if (CampaignsRepo.isCampaignActive(campaign)) {
      res.status(400).json({ error: 'Nu poți edita o campanie activă' });
      return;
    }
    const body = req.body;
    const updates: Parameters<typeof CampaignsRepo.updateCampaign>[1] = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.streakType !== undefined) updates.streakType = body.streakType;
    if (body.ordersRequired !== undefined) updates.ordersRequired = body.ordersRequired;
    if (body.bonusPoints !== undefined) updates.bonusPoints = body.bonusPoints;
    if (body.customText !== undefined) updates.customText = body.customText;
    if (body.startDate !== undefined) updates.startDate = body.startDate;
    if (body.endDate !== undefined) updates.endDate = body.endDate;
    if (body.resetOnMiss !== undefined) updates.resetOnMiss = body.resetOnMiss;
    if (body.pointsExpireAfterCampaign !== undefined) updates.pointsExpireAfterCampaign = body.pointsExpireAfterCampaign;

    const updated = await CampaignsRepo.updateCampaign(id, updates);
    res.json(updated);
  } catch (error) {
    logError('actualizare campanie streak', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * DELETE /admin/streak/campaigns/:id
 */
export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignsRepo.getCampaignById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campania nu a fost găsită' });
      return;
    }
    if (CampaignsRepo.isCampaignActive(campaign)) {
      res.status(400).json({ error: 'Nu poți șterge o campanie activă' });
      return;
    }
    await CampaignsRepo.deleteCampaign(id);
    res.json({ success: true });
  } catch (error) {
    logError('ștergere campanie streak', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/streak/campaigns/:id/enrollments
 */
export async function getCampaignEnrollments(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await CampaignsRepo.getCampaignById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campania nu a fost găsită' });
      return;
    }
    const enrollments = await EnrollmentsRepo.listEnrollmentsByCampaign(id);
    const userIds = [...new Set(enrollments.map((e) => e.userId))];
    let usersMap: Map<string, { name: string; email: string }> = new Map();
    if (userIds.length > 0) {
      const users = await query<{ id: string; name: string; email: string }[]>(
        `SELECT id, name, email FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
        userIds
      );
      users.forEach((u) => usersMap.set(u.id, { name: u.name, email: u.email }));
    }
    const list = enrollments.map((e) => ({
      ...e,
      userName: usersMap.get(e.userId)?.name ?? '',
      userEmail: usersMap.get(e.userId)?.email ?? '',
    }));
    res.json(list);
  } catch (error) {
    logError('listare înscrieri campanie streak', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
