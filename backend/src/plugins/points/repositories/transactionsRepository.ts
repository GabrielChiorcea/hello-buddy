/**
 * Repository pentru tranzacții puncte (points_transactions + users.points_balance)
 * Plugin: plugins/points
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, beginTransaction } from '../../../config/database.js';

export type PointsTransactionType = 'earned' | 'spent';

/**
 * Obține balanța punctelor unui utilizator (FOR UPDATE pentru context tranzacțional)
 * NOTĂ: Pentru operații cu scădere/adăugare, folosește addPoints/spendPoints
 * care fac FOR UPDATE automat în tranzacție.
 */
export async function getUserBalance(userId: string): Promise<number> {
  const row = await queryOne<{ points_balance: number }>(
    'SELECT points_balance FROM users WHERE id = ?',
    [userId]
  );
  return row ? row.points_balance : 0;
}

/**
 * Adaugă puncte utilizatorului (tranzacție atomică)
 */
export async function addPoints(
  userId: string,
  amount: number,
  orderId: string | null,
  type: PointsTransactionType = 'earned'
): Promise<void> {
  const connection = await beginTransaction();
  try {
    const txId = uuidv4();
    await connection.execute(
      'UPDATE users SET points_balance = points_balance + ? WHERE id = ?',
      [amount, userId]
    );
    await connection.execute(
      `INSERT INTO points_transactions (id, user_id, order_id, amount, type)
       VALUES (?, ?, ?, ?, ?)`,
      [txId, userId, orderId, amount, type]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Scade puncte utilizatorului (tranzacție atomică cu FOR UPDATE)
 * Fix: folosește FOR UPDATE pentru a preveni race conditions
 */
export async function spendPoints(
  userId: string,
  amount: number,
  orderId: string
): Promise<void> {
  const connection = await beginTransaction();
  try {
    const [balanceRows] = await connection.execute(
      'SELECT points_balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    const balance = (balanceRows as { points_balance: number }[])?.[0]?.points_balance ?? 0;
    if (balance < amount) {
      throw new Error('Puncte insuficiente');
    }

    const txId = uuidv4();
    await connection.execute(
      'UPDATE users SET points_balance = points_balance - ? WHERE id = ?',
      [amount, userId]
    );
    await connection.execute(
      `INSERT INTO points_transactions (id, user_id, order_id, amount, type)
       VALUES (?, ?, ?, ?, ?)`,
      [txId, userId, orderId, -amount, 'spent']
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
