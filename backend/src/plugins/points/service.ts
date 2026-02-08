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
  input: ApplyAtCheckoutInput
): Promise<ApplyAtCheckoutResult> {
  let pointsUsed = 0;
  let discountFromPoints = 0;

  if (input.pointsToUse && input.pointsToUse > 0) {
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
    discountFromPoints = reward.discountAmount;
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

    if (pointsEarned > 0) {
      await OrderModel.setPointsEarned(orderId, pointsEarned);
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
