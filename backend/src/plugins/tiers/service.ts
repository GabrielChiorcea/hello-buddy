/**
 * TiersService - logică XP și niveluri de loialitate
 * Plugin: plugins/tiers
 */

import { query, queryOne } from '../../config/database.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { logError } from '../../utils/safeErrorLogger.js';
import * as TiersRepo from './repositories/tiersRepository.js';

interface OrderForXp {
  userId: string;
  total: number;
}

interface XpConfig {
  xpPerRon: number;
}

async function getXpConfig(): Promise<XpConfig> {
  const [perRonRow] = await query<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE id = 'tiers_xp_per_ron'"
  );

  const xpPerRon = perRonRow ? parseInt(perRonRow.value, 10) || 0 : 0;

  return {
    xpPerRon: Math.max(0, xpPerRon),
  };
}

/**
 * Acordă XP utilizatorului când comanda este marcată ca livrată
 */
export async function addXpOnOrderDelivered(
  orderId: string,
  order: OrderForXp
): Promise<void> {
  const enabled = await isPluginEnabled('tiers');
  if (!enabled) return;

  try {
    const { xpPerRon } = await getXpConfig();

    let xpGained = 0;
    if (xpPerRon > 0) {
      xpGained = Math.floor(order.total / xpPerRon);
    }

    if (xpGained <= 0) return;

    const userRow = await queryOne<{
      id: string;
      email: string | null;
      total_xp: number;
      tier_id: string | null;
    }>(
      'SELECT id, email, total_xp, tier_id FROM users WHERE id = ?',
      [order.userId]
    );
    if (!userRow) return;

    const prevTotalXp = userRow.total_xp ?? 0;
    const newTotalXp = prevTotalXp + xpGained;

    const previousTier =
      userRow.tier_id ? await TiersRepo.getTierById(userRow.tier_id) : null;
    const newTier = await TiersRepo.getTierForXp(newTotalXp);

    const levelUp =
      !!newTier && newTier.id !== (previousTier?.id ?? userRow.tier_id ?? null);

    await query(
      'UPDATE users SET total_xp = ?, tier_id = ? WHERE id = ?',
      [newTotalXp, newTier ? newTier.id : userRow.tier_id, userRow.id]
    );

    if (levelUp && userRow.email) {
      const notifyRow = await queryOne<{ value: string }>(
        "SELECT value FROM app_settings WHERE id = 'tiers_notify_on_level_up'"
      );
      const shouldNotify =
        !notifyRow ||
        notifyRow.value === 'true' ||
        notifyRow.value === '1';

      if (shouldNotify) {
        const templateRow = await queryOne<{ value: string }>(
          "SELECT value FROM app_settings WHERE id = 'tiers_notify_message'"
        );
        const template =
          templateRow?.value ??
          'Felicitări! Ai ajuns la nivelul [Nume Nivel]. De acum câștigi cu [X]% mai multe puncte!';

        const percent = ((newTier?.pointsMultiplier ?? 1) - 1) * 100;
        const message = template
          .replace('[Nume Nivel]', newTier?.name ?? '')
          .replace('[X]%', `${Math.round(percent)}`);

        const { sendLevelUpEmail } = await import('./email.js');
        sendLevelUpEmail(userRow.email, newTier?.name ?? '', message);
      }
    }
  } catch (err) {
    logError('tiers.addXpOnOrderDelivered', err);
  }
}

/**
 * Returnează multiplicatorul de puncte pentru un utilizator
 * (1.0 dacă plugin-ul este dezactivat sau nu există nivel configurat)
 */
export async function getPointsMultiplierForUser(userId: string): Promise<number> {
  const enabled = await isPluginEnabled('tiers');
  if (!enabled) return 1;

  try {
    const row = await queryOne<{ total_xp: number }>(
      'SELECT total_xp FROM users WHERE id = ?',
      [userId]
    );
    if (!row) return 1;

    const tier = await TiersRepo.getTierForXp(row.total_xp ?? 0);
    const multiplier = tier?.pointsMultiplier ?? 1;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5b30d7ea-62d4-4fc8-b8b7-5a517226527b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'd6a1bb',
      },
      body: JSON.stringify({
        sessionId: 'd6a1bb',
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'backend/src/plugins/tiers/service.ts:getPointsMultiplierForUser',
        message: 'Computed tier multiplier for user',
        data: {
          userId,
          totalXp: row.total_xp ?? 0,
          tierId: tier?.id ?? null,
          tierName: tier?.name ?? null,
          pointsMultiplier: multiplier,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return multiplier;
  } catch (err) {
    logError('tiers.getPointsMultiplierForUser', err);
    return 1;
  }
}

