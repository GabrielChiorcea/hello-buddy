/**
 * PointsService - logică puncte la checkout și la livrare
 * Plugin: plugins/points
 */

import type { Connection } from 'mysql2/promise';
import * as PointsModel from './model.js';
import * as OrderModel from '../../models/Order.js';
import * as UserModel from '../../models/User.js';
import { query } from '../../config/database.js';
import { sendPointsEarnedEmail } from './email.js';
import { logError } from '../../utils/safeErrorLogger.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { tiersPlugin } from '../tiers/index.js';

export interface ApplyAtCheckoutResult {
  pointsUsed: number;
  discountFromPoints: number;
}

export interface ApplyAtCheckoutInput {
  userId: string;
  pointsToUse?: number;
}

/**
 * Aplică reducerea din puncte la checkout (în contextul unei tranzacții)
 */
export async function applyAtCheckout(
  connection: Connection,
  input: ApplyAtCheckoutInput,
  /** Totalul plătibil ÎNAINTE de reducerea din puncte (subtotal + deliveryFee - discountFromFreeProducts) */
  payableTotal?: number
): Promise<ApplyAtCheckoutResult> {
  let pointsUsed = 0;
  let discountFromPoints = 0;

  // Verifică dacă plugin-ul este activat înainte de a aplica puncte
  if (input.pointsToUse && input.pointsToUse > 0) {
    const enabled = await isPluginEnabled('points');
    if (!enabled) {
      return { pointsUsed: 0, discountFromPoints: 0 };
    }
    const reward = await PointsModel.getRewardForPoints(input.pointsToUse);
    if (!reward) {
      throw new Error('Prag invalid pentru puncte. Verifică opțiunile disponibile.');
    }
    const [balanceRows] = await connection.execute(
      'SELECT points_balance FROM users WHERE id = ? FOR UPDATE',
      [input.userId]
    );
    const balance = (balanceRows as { points_balance: number }[])?.[0]?.points_balance ?? 0;
    if (balance < input.pointsToUse) {
      throw new Error('Puncte insuficiente');
    }
    // Bug fix: Cap reducerea la totalul plătibil pentru a nu irosi puncte
    discountFromPoints = payableTotal != null
      ? Math.min(reward.discountAmount, payableTotal)
      : reward.discountAmount;
    pointsUsed = input.pointsToUse;
  }

  return { pointsUsed, discountFromPoints };
}

/**
 * Execută scăderea punctelor și inserarea tranzacției (în aceeași connection)
 */
export async function deductPointsInTransaction(
  connection: Connection,
  userId: string,
  orderId: string,
  pointsUsed: number
): Promise<void> {
  if (pointsUsed <= 0) return;
  await connection.execute(
    'UPDATE users SET points_balance = points_balance - ? WHERE id = ?',
    [pointsUsed, userId]
  );
  const { v4: uuidv4 } = await import('uuid');
  const txId = uuidv4();
  await connection.execute(
    `INSERT INTO points_transactions (id, user_id, order_id, amount, type)
     VALUES (?, ?, ?, ?, 'spent')`,
    [txId, userId, orderId, -pointsUsed]
  );
}

/**
 * Acordă puncte când comanda este marcată ca livrată
 */
export async function awardOnDelivery(orderId: string, order: { userId: string; total: number; pointsEarned: number }): Promise<void> {
  if (order.pointsEarned > 0) return; // deja acordate

  // Verifică dacă plugin-ul este activat
  const enabled = await isPluginEnabled('points');
  if (!enabled) return;

  try {
    const [pointsPerOrderRow] = await query<{ value: string }[]>(
      "SELECT value FROM app_settings WHERE id = 'points_per_order'"
    );
    const [pointsPerRonRow] = await query<{ value: string }[]>(
      "SELECT value FROM app_settings WHERE id = 'points_per_ron'"
    );
    const pointsPerOrder = pointsPerOrderRow ? parseInt(pointsPerOrderRow.value, 10) : 5;
    const pointsPerRon = pointsPerRonRow ? parseInt(pointsPerRonRow.value, 10) : 0;

    let pointsEarned = pointsPerOrder;
    if (pointsPerRon > 0) {
      pointsEarned += Math.floor(order.total / pointsPerRon);
    }

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
        hypothesisId: 'H1',
        location: 'backend/src/plugins/points/service.ts:awardOnDelivery:init',
        message: 'Base points before tier multiplier',
        data: {
          orderId,
          userId: order.userId,
          total: order.total,
          pointsPerOrder,
          pointsPerRon,
          basePointsEarned: pointsEarned,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // Aplică multiplicatorul de nivel (tiers), dacă este activ
    try {
      const multiplier = await tiersPlugin.service.getPointsMultiplierForUser(order.userId);

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
          hypothesisId: 'H2',
          location: 'backend/src/plugins/points/service.ts:awardOnDelivery:multiplier',
          message: 'Tier multiplier result',
          data: {
            orderId,
            userId: order.userId,
            multiplier,
            pointsBeforeMultiplier: pointsEarned,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (multiplier && multiplier > 0) {
        // Păstrăm zecimale (ex. 5.25 la x1.05) ca să nu pierdem fracția
        pointsEarned = Number((pointsEarned * multiplier).toFixed(2));
      }
    } catch (e) {
      logError('calcul multiplicator puncte (tiers)', e);
    }

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
        hypothesisId: 'H3',
        location: 'backend/src/plugins/points/service.ts:awardOnDelivery:final',
        message: 'Final pointsEarned after multiplier',
        data: {
          orderId,
          userId: order.userId,
          total: order.total,
          finalPointsEarned: pointsEarned,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (pointsEarned > 0) {
      const updated = await OrderModel.setPointsEarned(orderId, pointsEarned);
      if (!updated) return; // deja acordate (guard la DB: WHERE points_earned = 0)
      await PointsModel.addPoints(order.userId, pointsEarned, orderId, 'earned');
      const user = await UserModel.findById(order.userId);
      const totalPoints = user ? user.pointsBalance + pointsEarned : pointsEarned;
      if (user?.email) {
        sendPointsEarnedEmail(user.email, pointsEarned, totalPoints);
      }
    }
  } catch (err) {
    logError('acordare puncte la livrare', err);
  }
}

/**
 * Returnează punctele utilizatorului când o comandă este anulată
 * Se apelează automat când o comandă cu points_used > 0 este anulată
 */
export async function refundPointsOnCancellation(orderId: string, order: { userId: string; pointsUsed: number }): Promise<void> {
  // Nu face nimic dacă nu au fost folosite puncte
  if (!order.pointsUsed || order.pointsUsed <= 0) return;

  // Verifică dacă plugin-ul este activat
  const enabled = await isPluginEnabled('points');
  if (!enabled) return;

  try {
    // Returnează punctele utilizatorului cu type 'refunded'
    await PointsModel.addPoints(order.userId, order.pointsUsed, orderId, 'refunded');
    
    // Log pentru debugging (opțional - poate fi eliminat în producție)
    console.log(`[Points] Returnate ${order.pointsUsed} puncte utilizatorului ${order.userId} pentru comanda anulată ${orderId}`);
  } catch (err) {
    logError('returnare puncte la anulare comandă', err);
    // Nu aruncăm eroarea pentru a nu bloca anularea comenzii
    // Logăm eroarea pentru debugging
  }
}
