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

/**
 * PUT /admin/addon-rules
 * Body: { rules: { [categoryId]: string[] } }
 * Actualizează batch regulile pentru categoriile trimise
 */
export async function updateAddonRules(req: Request, res: Response) {
  try {
    const { rules } = req.body;
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
