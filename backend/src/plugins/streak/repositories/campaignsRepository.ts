/**
 * Repository for streak_campaigns
 * Plugin: plugins/streak
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export type StreakType = 'consecutive_days' | 'days_per_week' | 'working_days';

/** Raw row from DB; date columns may come as Date or string depending on driver. */
export interface StreakCampaignRow {
  id: string;
  name: string;
  streak_type: string;
  orders_required: number;
  bonus_points: number;
  custom_text: string | null;
  start_date: Date | string;
  end_date: Date | string;
  reset_on_miss: boolean;
  points_expire_after_campaign: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface StreakCampaign {
  id: string;
  name: string;
  streakType: StreakType;
  ordersRequired: number;
  bonusPoints: number;
  customText: string | null;
  startDate: string;
  endDate: string;
  resetOnMiss: boolean;
  pointsExpireAfterCampaign: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Normalize date to YYYY-MM-DD for start/end, ISO for timestamps. */
function toDateString(v: Date | string): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}
function toISOString(v: Date | string): string {
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString();
}

function mapRow(r: StreakCampaignRow): StreakCampaign {
  return {
    id: r.id,
    name: r.name,
    streakType: r.streak_type as StreakType,
    ordersRequired: r.orders_required,
    bonusPoints: r.bonus_points,
    customText: r.custom_text,
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
    resetOnMiss: Boolean(r.reset_on_miss),
    pointsExpireAfterCampaign: Boolean(r.points_expire_after_campaign),
    createdAt: toISOString(r.created_at),
    updatedAt: toISOString(r.updated_at),
  };
}

/** First campaign that is currently active (start_date <= today <= end_date). */
export async function getActiveCampaign(): Promise<StreakCampaign | null> {
  const campaigns = await getActiveCampaigns();
  const today = getTodayLocal();
  const active = campaigns.find((c) => c.startDate <= today && c.endDate >= today);
  return active ?? null;
}

/** Data de azi în timezone-ul local (YYYY-MM-DD) pentru filtrarea campaniilor active. */
function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getActiveCampaigns(): Promise<StreakCampaign[]> {
  const today = getTodayLocal();
  /* Return all campaigns that have not ended yet (end_date >= today), so users see both
   * currently active and upcoming campaigns; they can only join when start_date <= today. */
  const rows = await query<StreakCampaignRow[]>(
    `SELECT * FROM streak_campaigns
     WHERE end_date >= ?
     ORDER BY start_date ASC`,
    [today]
  );
  return rows.map(mapRow);
}

export async function getCampaignById(id: string): Promise<StreakCampaign | null> {
  const row = await queryOne<StreakCampaignRow>('SELECT * FROM streak_campaigns WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function listCampaigns(): Promise<StreakCampaign[]> {
  const rows = await query<StreakCampaignRow[]>(
    'SELECT * FROM streak_campaigns ORDER BY start_date DESC',
    []
  );
  return rows.map(mapRow);
}

export async function createCampaign(data: {
  name: string;
  streakType: StreakType;
  ordersRequired: number;
  bonusPoints: number;
  customText: string | null;
  startDate: string;
  endDate: string;
  resetOnMiss: boolean;
  pointsExpireAfterCampaign: boolean;
}): Promise<StreakCampaign> {
  const id = uuidv4();
  await query(
    `INSERT INTO streak_campaigns (
      id, name, streak_type, orders_required, bonus_points, custom_text,
      start_date, end_date, reset_on_miss, points_expire_after_campaign
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.streakType,
      data.ordersRequired,
      data.bonusPoints,
      data.customText ?? null,
      data.startDate,
      data.endDate,
      data.resetOnMiss ? 1 : 0,
      data.pointsExpireAfterCampaign ? 1 : 0,
    ]
  );
  const campaign = await getCampaignById(id);
  if (!campaign) throw new Error('Failed to create campaign');
  return campaign;
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    name: string;
    streakType: StreakType;
    ordersRequired: number;
    bonusPoints: number;
    customText: string | null;
    startDate: string;
    endDate: string;
    resetOnMiss: boolean;
    pointsExpireAfterCampaign: boolean;
  }>
): Promise<StreakCampaign | null> {
  const setters: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) {
    setters.push('name = ?');
    values.push(data.name);
  }
  if (data.streakType !== undefined) {
    setters.push('streak_type = ?');
    values.push(data.streakType);
  }
  if (data.ordersRequired !== undefined) {
    setters.push('orders_required = ?');
    values.push(data.ordersRequired);
  }
  if (data.bonusPoints !== undefined) {
    setters.push('bonus_points = ?');
    values.push(data.bonusPoints);
  }
  if (data.customText !== undefined) {
    setters.push('custom_text = ?');
    values.push(data.customText);
  }
  if (data.startDate !== undefined) {
    setters.push('start_date = ?');
    values.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    setters.push('end_date = ?');
    values.push(data.endDate);
  }
  if (data.resetOnMiss !== undefined) {
    setters.push('reset_on_miss = ?');
    values.push(data.resetOnMiss ? 1 : 0);
  }
  if (data.pointsExpireAfterCampaign !== undefined) {
    setters.push('points_expire_after_campaign = ?');
    values.push(data.pointsExpireAfterCampaign ? 1 : 0);
  }
  if (setters.length === 0) return getCampaignById(id);
  values.push(id);
  await query(`UPDATE streak_campaigns SET ${setters.join(', ')} WHERE id = ?`, values);
  return getCampaignById(id);
}

/** Normalizează o dată (Date sau string) la YYYY-MM-DD pentru comparații sigure. */
function toDateOnly(v: Date | string): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

export function isCampaignActive(campaign: StreakCampaign): boolean {
  const today = getTodayLocal();
  const start = toDateOnly(campaign.startDate as Date | string);
  const end = toDateOnly(campaign.endDate as Date | string);
  return start <= today && end >= today;
}

export async function deleteCampaign(id: string): Promise<void> {
  await query('DELETE FROM streak_campaigns WHERE id = ?', [id]);
}
