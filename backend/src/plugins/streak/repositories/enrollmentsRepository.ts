/**
 * Repository for user_streak_campaigns (enrollment + progress)
 * V2: supports current_level for soft decay
 * Plugin: plugins/streak
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';
import { getTodayBucharest } from './campaignsRepository.js';

export interface UserStreakCampaignRow {
  id: string;
  user_id: string;
  campaign_id: string;
  joined_at: Date;
  current_streak_count: number;
  current_level: number;
  completed_at: Date | null;
  bonus_awarded_at: Date | null;
}

export interface UserStreakCampaign {
  id: string;
  userId: string;
  campaignId: string;
  joinedAt: Date;
  currentStreakCount: number;
  currentLevel: number;
  completedAt: Date | null;
  bonusAwardedAt: Date | null;
}

function mapRow(r: UserStreakCampaignRow): UserStreakCampaign {
  return {
    id: r.id,
    userId: r.user_id,
    campaignId: r.campaign_id,
    joinedAt: r.joined_at,
    currentStreakCount: r.current_streak_count,
    currentLevel: r.current_level ?? 0,
    completedAt: r.completed_at,
    bonusAwardedAt: r.bonus_awarded_at,
  };
}

export async function getEnrollment(userId: string, campaignId: string): Promise<UserStreakCampaign | null> {
  const row = await queryOne<UserStreakCampaignRow>(
    'SELECT * FROM user_streak_campaigns WHERE user_id = ? AND campaign_id = ?',
    [userId, campaignId]
  );
  return row ? mapRow(row) : null;
}

export async function getEnrollmentByUserAndActive(userId: string): Promise<UserStreakCampaign | null> {
  const today = getTodayBucharest();
  const row = await queryOne<UserStreakCampaignRow>(
    `SELECT usc.* FROM user_streak_campaigns usc
     JOIN streak_campaigns sc ON sc.id = usc.campaign_id
     WHERE usc.user_id = ? AND sc.start_date <= ? AND sc.end_date >= ?
     ORDER BY usc.joined_at DESC
     LIMIT 1`,
    [userId, today, today]
  );
  return row ? mapRow(row) : null;
}

export async function enrollUser(userId: string, campaignId: string): Promise<UserStreakCampaign> {
  /**
   * Un user nu poate avea decât o înscriere „deschisă” (incompletă) odată.
   * La join la o campanie nouă, eliminăm orice alt enrollment incomplet (alt campaign_id),
   * ca să nu apară la două campanii în admin / să nu se acumuleze progres dublu.
   * streak_logs se șterge în cascadă cu enrollment-ul.
   */
  await query(
    `DELETE FROM user_streak_campaigns
     WHERE user_id = ? AND completed_at IS NULL AND campaign_id <> ?`,
    [userId, campaignId]
  );

  const existing = await getEnrollment(userId, campaignId);
  if (existing) return existing;

  const id = uuidv4();
  await query(
    `INSERT INTO user_streak_campaigns (id, user_id, campaign_id, current_streak_count, current_level)
     VALUES (?, ?, ?, 0, 0)`,
    [id, userId, campaignId]
  );
  const enrollment = await getEnrollment(userId, campaignId);
  if (!enrollment) throw new Error('Failed to create enrollment');
  return enrollment;
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  currentStreakCount: number,
  currentLevel: number,
  completedAt: Date | null,
  bonusAwardedAt: Date | null
): Promise<void> {
  await query(
    `UPDATE user_streak_campaigns
     SET current_streak_count = ?, current_level = ?, completed_at = ?, bonus_awarded_at = ?
     WHERE id = ?`,
    [currentStreakCount, currentLevel, completedAt, bonusAwardedAt, enrollmentId]
  );
}

export async function getEnrollmentById(id: string): Promise<UserStreakCampaign | null> {
  const row = await queryOne<UserStreakCampaignRow>('SELECT * FROM user_streak_campaigns WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function listEnrollmentsByCampaign(campaignId: string): Promise<UserStreakCampaign[]> {
  const rows = await query<UserStreakCampaignRow[]>(
    'SELECT * FROM user_streak_campaigns WHERE campaign_id = ? ORDER BY joined_at DESC',
    [campaignId]
  );
  return rows.map(mapRow);
}

export async function getActiveEnrollmentsForUser(userId: string): Promise<UserStreakCampaign[]> {
  const today = getTodayBucharest();
  /** O singură campanie activă procesată per user: ultima înscriere (join) dintre cele încă în interval. */
  const row = await queryOne<UserStreakCampaignRow>(
    `SELECT usc.* FROM user_streak_campaigns usc
     JOIN streak_campaigns sc ON sc.id = usc.campaign_id
     WHERE usc.user_id = ? AND sc.start_date <= ? AND sc.end_date >= ?
     AND usc.completed_at IS NULL
     ORDER BY usc.joined_at DESC
     LIMIT 1`,
    [userId, today, today]
  );
  return row ? [mapRow(row)] : [];
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  await query('DELETE FROM user_streak_campaigns WHERE id = ?', [enrollmentId]);
}
