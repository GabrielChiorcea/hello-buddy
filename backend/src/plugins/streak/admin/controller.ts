/**
 * Admin controller for streak campaigns V2
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
    // Enrich with reward steps
    const enriched = await Promise.all(
      campaigns.map(async (c) => ({
        ...c,
        rewardSteps: await CampaignsRepo.getRewardSteps(c.id),
        excludedProducts: await CampaignsRepo.getExcludedProducts(c.id),
      }))
    );
    res.json(enriched);
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
    const rewardSteps = await CampaignsRepo.getRewardSteps(id);
    const excludedProducts = await CampaignsRepo.getExcludedProducts(id);
    res.json({ ...campaign, rewardSteps, excludedProducts });
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

    // Validate
    if (body.recurrenceType === 'calendar_weekly' && body.ordersRequired > 7) {
      res.status(400).json({ error: 'Pentru "săptămânal calendaristic", maximum este 7 zile.' });
      return;
    }

    const campaign = await CampaignsRepo.createCampaign({
      name: body.name,
      recurrenceType: body.recurrenceType ?? 'consecutive',
      rollingWindowDays: body.rollingWindowDays ?? 7,
      ordersRequired: body.ordersRequired,
      bonusPoints: body.bonusPoints ?? 0,
      rewardType: body.rewardType ?? 'single',
      baseMultiplier: body.baseMultiplier ?? 1,
      multiplierIncrement: body.multiplierIncrement ?? 0,
      customText: body.customText ?? null,
      startDate: body.startDate,
      endDate: body.endDate,
      resetType: body.resetType ?? 'hard',
      minOrderValue: body.minOrderValue ?? 0,
      
    });

    // Set reward steps if provided
    if (body.rewardSteps && Array.isArray(body.rewardSteps)) {
      await CampaignsRepo.setRewardSteps(campaign.id, body.rewardSteps);
    }

    // Set excluded products if provided
    if (body.excludedProducts && Array.isArray(body.excludedProducts)) {
      await CampaignsRepo.setExcludedProducts(campaign.id, body.excludedProducts);
    }

    const rewardSteps = await CampaignsRepo.getRewardSteps(campaign.id);
    const excludedProducts = await CampaignsRepo.getExcludedProducts(campaign.id);
    res.status(201).json({ ...campaign, rewardSteps, excludedProducts });
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
    const recurrenceType = body.recurrenceType ?? campaign.recurrenceType;
    const ordersRequired = body.ordersRequired ?? campaign.ordersRequired;
    if (recurrenceType === 'calendar_weekly' && ordersRequired > 7) {
      res.status(400).json({ error: 'Pentru "săptămânal calendaristic", maximum este 7 zile.' });
      return;
    }

    const updates: Parameters<typeof CampaignsRepo.updateCampaign>[1] = {};
    const fields = [
      'name', 'recurrenceType', 'rollingWindowDays', 'ordersRequired', 'bonusPoints',
      'rewardType', 'baseMultiplier', 'multiplierIncrement', 'customText',
      'startDate', 'endDate', 'resetType', 'minOrderValue',
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) (updates as any)[f] = body[f];
    }

    const updated = await CampaignsRepo.updateCampaign(id, updates);

    // Update reward steps if provided
    if (body.rewardSteps && Array.isArray(body.rewardSteps)) {
      await CampaignsRepo.setRewardSteps(id, body.rewardSteps);
    }

    // Update excluded products if provided
    if (body.excludedProducts && Array.isArray(body.excludedProducts)) {
      await CampaignsRepo.setExcludedProducts(id, body.excludedProducts);
    }

    const rewardSteps = await CampaignsRepo.getRewardSteps(id);
    const excludedProducts = await CampaignsRepo.getExcludedProducts(id);
    res.json({ ...updated, rewardSteps, excludedProducts });
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
    let usersMap = new Map<string, { name: string; email: string }>();
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
