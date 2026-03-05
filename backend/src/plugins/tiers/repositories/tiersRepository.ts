/**
 * Repository pentru niveluri de loialitate (loyalty_tiers)
 * Plugin: plugins/tiers
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export interface LoyaltyTier {
  id: string;
  name: string;
  xpThreshold: number;
  pointsMultiplier: number;
  badgeIcon: string | null;
  sortOrder: number;
  benefitDescription: string | null;
}

interface LoyaltyTierRow {
  id: string;
  name: string;
  xp_threshold: number;
  points_multiplier: string;
  badge_icon: string | null;
  sort_order: number;
  benefit_description: string | null;
}

function mapRow(row: LoyaltyTierRow): LoyaltyTier {
  return {
    id: row.id,
    name: row.name,
    xpThreshold: row.xp_threshold,
    pointsMultiplier: parseFloat(row.points_multiplier),
    badgeIcon: row.badge_icon,
    sortOrder: row.sort_order,
    benefitDescription: row.benefit_description,
  };
}

export async function getAll(): Promise<LoyaltyTier[]> {
  const rows = await query<LoyaltyTierRow[]>(
    'SELECT * FROM loyalty_tiers ORDER BY sort_order ASC, xp_threshold ASC'
  );
  return rows.map(mapRow);
}

export async function getTierById(id: string): Promise<LoyaltyTier | null> {
  const row = await queryOne<LoyaltyTierRow>(
    'SELECT * FROM loyalty_tiers WHERE id = ?',
    [id]
  );
  return row ? mapRow(row) : null;
}

/**
 * Returnează nivelul corespunzător pentru un total de XP.
 * Alege nivelul cu xp_threshold <= totalXp, cu pragul cel mai mare.
 */
export async function getTierForXp(totalXp: number): Promise<LoyaltyTier | null> {
  const row = await queryOne<LoyaltyTierRow>(
    `SELECT * FROM loyalty_tiers
     WHERE xp_threshold <= ?
     ORDER BY xp_threshold DESC
     LIMIT 1`,
    [totalXp]
  );
  return row ? mapRow(row) : null;
}

/**
 * Returnează următorul nivel pentru un total de XP (xp_threshold > totalXp, cel mai mic prag).
 */
export async function getNextTierForXp(totalXp: number): Promise<LoyaltyTier | null> {
  const row = await queryOne<LoyaltyTierRow>(
    `SELECT * FROM loyalty_tiers
     WHERE xp_threshold > ?
     ORDER BY xp_threshold ASC
     LIMIT 1`,
    [totalXp]
  );
  return row ? mapRow(row) : null;
}

export interface CreateTierInput {
  name: string;
  xpThreshold: number;
  pointsMultiplier: number;
  badgeIcon?: string | null;
  sortOrder?: number;
  benefitDescription?: string | null;
}

export interface UpdateTierInput {
  name?: string;
  xpThreshold?: number;
  pointsMultiplier?: number;
  badgeIcon?: string | null;
  sortOrder?: number;
  benefitDescription?: string | null;
}

export async function createTier(data: CreateTierInput): Promise<LoyaltyTier> {
  const id = uuidv4();
  const sortOrder = data.sortOrder ?? data.xpThreshold;

  await query(
    `INSERT INTO loyalty_tiers (id, name, xp_threshold, points_multiplier, badge_icon, sort_order, benefit_description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.xpThreshold,
      data.pointsMultiplier,
      data.badgeIcon ?? null,
      sortOrder,
      data.benefitDescription ?? null,
    ]
  );

  const row = await queryOne<LoyaltyTierRow>(
    'SELECT * FROM loyalty_tiers WHERE id = ?',
    [id]
  );
  if (!row) {
    throw new Error('Nu s-a putut crea nivelul de loialitate');
  }
  return mapRow(row);
}

export async function updateTier(
  id: string,
  updates: UpdateTierInput
): Promise<LoyaltyTier | null> {
  const setters: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    setters.push('name = ?');
    values.push(updates.name);
  }
  if (updates.xpThreshold !== undefined) {
    setters.push('xp_threshold = ?');
    values.push(updates.xpThreshold);
  }
  if (updates.pointsMultiplier !== undefined) {
    setters.push('points_multiplier = ?');
    values.push(updates.pointsMultiplier);
  }
  if (updates.badgeIcon !== undefined) {
    setters.push('badge_icon = ?');
    values.push(updates.badgeIcon);
  }
  if (updates.sortOrder !== undefined) {
    setters.push('sort_order = ?');
    values.push(updates.sortOrder);
  }
  if (updates.benefitDescription !== undefined) {
    setters.push('benefit_description = ?');
    values.push(updates.benefitDescription);
  }

  if (setters.length === 0) {
    const row = await queryOne<LoyaltyTierRow>(
      'SELECT * FROM loyalty_tiers WHERE id = ?',
      [id]
    );
    return row ? mapRow(row) : null;
  }

  values.push(id);
  await query(
    `UPDATE loyalty_tiers SET ${setters.join(', ')} WHERE id = ?`,
    values
  );

  const row = await queryOne<LoyaltyTierRow>(
    'SELECT * FROM loyalty_tiers WHERE id = ?',
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function deleteTier(id: string): Promise<void> {
  await query('DELETE FROM loyalty_tiers WHERE id = ?', [id]);
}

