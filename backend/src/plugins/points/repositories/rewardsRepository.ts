/**
 * Repository pentru praguri puncte (points_rewards)
 * Plugin: plugins/points
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export interface PointsReward {
  id: string;
  pointsCost: number;
  discountAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RewardRow {
  id: string;
  points_cost: number;
  discount_amount: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(r: RewardRow): PointsReward {
  return {
    id: r.id,
    pointsCost: r.points_cost,
    discountAmount: parseFloat(r.discount_amount),
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getRewards(includeInactive = false): Promise<PointsReward[]> {
  const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
  const rows = await query<RewardRow[]>(
    `SELECT * FROM points_rewards ${whereClause} ORDER BY points_cost ASC`,
    []
  );
  return rows.map(mapRow);
}

export async function getRewardForPoints(points: number): Promise<PointsReward | null> {
  const row = await queryOne<RewardRow>(
    'SELECT * FROM points_rewards WHERE points_cost = ? AND is_active = TRUE',
    [points]
  );
  return row ? mapRow(row) : null;
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
  const reward = await queryOne<RewardRow>('SELECT * FROM points_rewards WHERE id = ?', [id]);
  if (!reward) throw new Error('Eroare la crearea pragului');
  return mapRow(reward);
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
  const row = await queryOne<RewardRow>('SELECT * FROM points_rewards WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function deleteReward(id: string): Promise<boolean> {
  await query('DELETE FROM points_rewards WHERE id = ?', [id]);
  return true;
}
