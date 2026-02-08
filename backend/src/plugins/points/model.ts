/**
 * Model Points - gestionare puncte loialitate
 * Plugin: plugins/points
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, beginTransaction } from '../../config/database.js';

export interface PointsReward {
  id: string;
  pointsCost: number;
  discountAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PointsTransactionType = 'earned' | 'spent';

export async function getUserBalance(userId: string): Promise<number> {
  const row = await queryOne<{ points_balance: number }>(
    'SELECT points_balance FROM users WHERE id = ?',
    [userId]
  );
  return row ? row.points_balance : 0;
}

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

export async function getRewards(includeInactive = false): Promise<PointsReward[]> {
  const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
  const rows = await query<{
    id: string;
    points_cost: number;
    discount_amount: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }[]>(
    `SELECT * FROM points_rewards ${whereClause} ORDER BY points_cost ASC`,
    []
  );
  return rows.map((r) => ({
    id: r.id,
    pointsCost: r.points_cost,
    discountAmount: parseFloat(r.discount_amount),
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getRewardForPoints(points: number): Promise<PointsReward | null> {
  const row = await queryOne<{
    id: string;
    points_cost: number;
    discount_amount: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }>(
    'SELECT * FROM points_rewards WHERE points_cost = ? AND is_active = TRUE',
    [points]
  );
  return row
    ? {
        id: row.id,
        pointsCost: row.points_cost,
        discountAmount: parseFloat(row.discount_amount),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}

export async function createReward(
  pointsCost: number,
  discountAmount: number
): Promise<PointsReward> {
  const id = uuidv4();
  await query(
    `INSERT INTO points_rewards (id, points_cost, discount_amount, is_active)
     VALUES (?, ?, ?, TRUE)`,
    [id, pointsCost, discountAmount]
  );
  const reward = await queryOne<{
    id: string;
    points_cost: number;
    discount_amount: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM points_rewards WHERE id = ?', [id]);
  if (!reward) throw new Error('Eroare la crearea pragului');
  return {
    id: reward.id,
    pointsCost: reward.points_cost,
    discountAmount: parseFloat(reward.discount_amount),
    isActive: reward.is_active,
    createdAt: reward.created_at,
    updatedAt: reward.updated_at,
  };
}

export async function updateReward(
  id: string,
  updates: { pointsCost?: number; discountAmount?: number; isActive?: boolean }
): Promise<PointsReward | null> {
  const setters: string[] = [];
  const values: unknown[] = [];
  if (updates.pointsCost !== undefined) {
    setters.push('points_cost = ?');
    values.push(updates.pointsCost);
  }
  if (updates.discountAmount !== undefined) {
    setters.push('discount_amount = ?');
    values.push(updates.discountAmount);
  }
  if (updates.isActive !== undefined) {
    setters.push('is_active = ?');
    values.push(updates.isActive);
  }
  if (setters.length === 0) return getRewardById(id);
  values.push(id);
  await query(
    `UPDATE points_rewards SET ${setters.join(', ')} WHERE id = ?`,
    values
  );
  return getRewardById(id);
}

export async function getRewardById(id: string): Promise<PointsReward | null> {
  const row = await queryOne<{
    id: string;
    points_cost: number;
    discount_amount: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM points_rewards WHERE id = ?', [id]);
  return row
    ? {
        id: row.id,
        pointsCost: row.points_cost,
        discountAmount: parseFloat(row.discount_amount),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}

export async function deleteReward(id: string): Promise<boolean> {
  await query('UPDATE points_rewards SET is_active = FALSE WHERE id = ?', [id]);
  return true;
}
