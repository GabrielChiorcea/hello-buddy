/**
 * Controller Admin – Reguli Add-on per categorie
 */

import { Request, Response } from 'express';
import * as AddonRuleModel from '../../models/AddonRule.js';

/**
 * GET /admin/addon-rules
 * Returnează mapping-ul { categoryId: [addonProductId, ...] }
 */
export async function getAddonRules(_req: Request, res: Response) {
  try {
    const grouped = await AddonRuleModel.findAllGrouped();
    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error('Error fetching addon rules:', error);
    res.status(500).json({ success: false, error: 'Eroare internă' });
  }
}

export interface AddonRuleDto {
  id: number;
  categoryId: string;
  addonProductId: string;
  priority: number;
  timeStart: string | null;
  timeEnd: string | null;
}

/**
 * GET /admin/addon-rules/full
 * Returnează toate regulile cu metadate complete (priority, time_start, time_end).
 */
export async function getAddonRulesFull(_req: Request, res: Response) {
  try {
    const rules = await AddonRuleModel.findAll();
    const data: AddonRuleDto[] = rules.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      addonProductId: r.addonProductId,
      priority: r.priority,
      timeStart: r.timeStart,
      timeEnd: r.timeEnd,
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching addon rules full:', error);
    res.status(500).json({ success: false, error: 'Eroare internă' });
  }
}

/**
 * PUT /admin/addon-rules
 * Body: { rules?: { [categoryId]: string[] }, rulesFull?: AddonRuleInput[] }
 * - rules: format vechi, actualizează doar regulile pentru categoriile trimise.
 * - rulesFull: listă completă de reguli (cu priority, time_start, time_end); înlocuiește toate regulile.
 */
export async function updateAddonRules(req: Request, res: Response) {
  try {
    const { rules, rulesFull } = req.body;

    if (rulesFull && Array.isArray(rulesFull)) {
      const input = rulesFull.map((r: { categoryId: string; addonProductId: string; priority?: number; timeStart?: string | null; timeEnd?: string | null }) => ({
        categoryId: r.categoryId,
        addonProductId: r.addonProductId,
        priority: r.priority ?? 0,
        timeStart: r.timeStart ?? null,
        timeEnd: r.timeEnd ?? null,
      }));
      await AddonRuleModel.replaceRulesBatchFull(input);
      const full = await AddonRuleModel.findAll();
      const data = full.map((r) => ({
        id: r.id,
        categoryId: r.categoryId,
        addonProductId: r.addonProductId,
        priority: r.priority,
        timeStart: r.timeStart,
        timeEnd: r.timeEnd,
      }));
      return res.json({ success: true, data, dataFull: data });
    }

    if (!rules || typeof rules !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload invalid' });
    }
    await AddonRuleModel.replaceRulesBatch(rules);
    const grouped = await AddonRuleModel.findAllGrouped();
    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error('Error updating addon rules:', error);
    res.status(500).json({ success: false, error: 'Eroare internă' });
  }
}
