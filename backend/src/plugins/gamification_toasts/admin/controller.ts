import { Request, Response } from 'express';
import { query } from '../../../config/database.js';
import { logError } from '../../../utils/safeErrorLogger.js';
import * as GamificationToastsService from '../service.js';

const TOASTS_KEY = 'gamification_toasts_items';

export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const items = await GamificationToastsService.getItems();
    const { items: sanitizedItems, changed } = GamificationToastsService.sanitizeItems(items);
    if (changed) {
      await query(
        `INSERT INTO app_settings (id, value, updated_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
        [TOASTS_KEY, JSON.stringify(sanitizedItems), req.user?.id || null],
      );
    }
    res.json({ items: sanitizedItems });
  } catch (error) {
    logError('citire gamification toasts', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function updateItems(req: Request, res: Response): Promise<void> {
  try {
    const { items } = req.body as { items?: unknown };
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'items trebuie să fie array' });
      return;
    }

    const { items: sanitizedItems } = GamificationToastsService.sanitizeItems(
      items as GamificationToastsService.GamificationToastItem[],
    );

    await query(
      `INSERT INTO app_settings (id, value, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
      [TOASTS_KEY, JSON.stringify(sanitizedItems), req.user?.id || null],
    );

    res.json({ items: sanitizedItems });
  } catch (error) {
    logError('actualizare gamification toasts', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
