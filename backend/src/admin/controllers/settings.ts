/**
 * Controller setări aplicație
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import { query, queryOne } from '../../config/database.js';

interface AppSetting {
  id: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

/**
 * GET /admin/settings
 * Returnează toate setările
 */
export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await query<AppSetting[]>(
      'SELECT * FROM app_settings ORDER BY id'
    );
    
    // Transformă în obiect pentru acces ușor
    const settingsMap: Record<string, { value: string; description: string | null }> = {};
    settings.forEach(s => {
      settingsMap[s.id] = {
        value: s.value,
        description: s.description,
      };
    });
    
    res.json(settingsMap);
  } catch (error) {
    logError('citire setări', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/settings
 * Actualizează setările
 */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const updates = req.body;

    if (typeof updates !== 'object' || updates === null) {
      res.status(400).json({ error: 'Obiect cu setări necesar' });
      return;
    }
    
    // Validare setări specifice
    const validSettings = [
      'delivery_fee',
      'min_order_amount',
      'free_delivery_threshold',
      'opening_time',
      'closing_time',
      'preparation_time_default',
      'delivery_time_estimate',
      'max_items_per_order',
      'contact_phone',
      'contact_email',
      'points_per_order',
      'points_per_ron',
      'points_welcome_bonus',
      'tiers_xp_per_ron',
      'plugin_points_enabled',
      'plugin_streak_enabled',
      'plugin_welcome_bonus_enabled',
      'plugin_addons_enabled',
      'plugin_tiers_enabled',
      'tiers_notify_on_level_up',
      'tiers_notify_message',
      'has_tables',
      'component_style',
    ];
    
    for (const [key, value] of Object.entries(updates)) {
      if (!validSettings.includes(key)) {
        continue; // Ignoră setări necunoscute
      }
      
      // Validare valori numerice
      if (['delivery_fee', 'min_order_amount', 'free_delivery_threshold'].includes(key)) {
        const numValue = parseFloat(value as string);
        if (isNaN(numValue) || numValue < 0) {
          res.status(400).json({ error: `Valoare invalidă pentru ${key}` });
          return;
        }
      }
      if (['points_per_order', 'points_per_ron', 'points_welcome_bonus', 'tiers_xp_per_ron'].includes(key)) {
        const numValue = parseInt(value as string, 10);
        if (isNaN(numValue) || numValue < 0) {
          res.status(400).json({ error: `Valoare invalidă pentru ${key} (întreg >= 0)` });
          return;
        }
      }
      
      // Validare ore
      if (['opening_time', 'closing_time'].includes(key)) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value as string)) {
          res.status(400).json({ error: `Format oră invalid pentru ${key}` });
          return;
        }
      }
      if (['plugin_points_enabled', 'plugin_streak_enabled', 'plugin_welcome_bonus_enabled', 'plugin_addons_enabled', 'plugin_tiers_enabled', 'tiers_notify_on_level_up'].includes(key)) {
        const v = String(value).toLowerCase();
        if (!['true', 'false'].includes(v)) {
          res.status(400).json({ error: `${key} trebuie să fie true sau false` });
          return;
        }
      }
      if (key === 'has_tables') {
        const v = String(value).toLowerCase();
        if (!['true', 'false'].includes(v)) {
          res.status(400).json({ error: 'has_tables trebuie să fie true sau false' });
          return;
        }
      }
      
      // Actualizează setarea
      await query(
        `INSERT INTO app_settings (id, value, updated_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
        [key, String(value), req.user?.id || null]
      );
    }
    
    // Returnează setările actualizate
    const settings = await query<AppSetting[]>(
      'SELECT * FROM app_settings ORDER BY id'
    );
    
    const settingsMap: Record<string, { value: string; description: string | null }> = {};
    settings.forEach(s => {
      settingsMap[s.id] = {
        value: s.value,
        description: s.description,
      };
    });
    
    res.json(settingsMap);
  } catch (error) {
    logError('actualizare setări', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
