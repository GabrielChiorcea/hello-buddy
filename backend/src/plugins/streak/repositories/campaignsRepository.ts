/**
 * Repository for streak_campaigns (V2 - motor de reguli complet)
 * Plugin: plugins/streak
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

/* ─── Types ────────────────────────────────────────────────── */

export type RecurrenceType = 'calendar_weekly' | 'rolling' | 'consecutive';
export type RewardType = 'single' | 'steps' | 'multiplier';
export type ResetType = 'hard' | 'soft_decay';

export interface StreakCampaignRow {
  id: string;
  name: string;
  streak_type: string;
  rolling_window_days: number;
  orders_required: number;
  bonus_points: number;
  reward_type: string;
  base_multiplier: number;
  multiplier_increment: number;
  custom_text: string | null;
  start_date: Date | string;
  end_date: Date | string;
  reset_type: string;
  min_order_value: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface StreakCampaign {
  id: string;
  name: string;
  recurrenceType: RecurrenceType;
  rollingWindowDays: number;
  ordersRequired: number;
  bonusPoints: number;
  rewardType: RewardType;
  baseMultiplier: number;
  multiplierIncrement: number;
  customText: string | null;
  startDate: string;
  endDate: string;
  resetType: ResetType;
  minOrderValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardStep {
  id: string;
  campaignId: string;
  stepNumber: number;
  pointsAwarded: number;
  label: string | null;
}

/* ─── Helpers ──────────────────────────────────────────────── */

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

function getTodayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mapRow(r: StreakCampaignRow): StreakCampaign {
  return {
    id: r.id,
    name: r.name,
    recurrenceType: r.streak_type as RecurrenceType,
    rollingWindowDays: r.rolling_window_days,
    ordersRequired: r.orders_required,
    bonusPoints: r.bonus_points,
    rewardType: (r.reward_type || 'single') as RewardType,
    baseMultiplier: Number(r.base_multiplier) || 1,
    multiplierIncrement: Number(r.multiplier_increment) || 0,
    customText: r.custom_text,
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
    resetType: (r.reset_type || 'hard') as ResetType,
    minOrderValue: Number(r.min_order_value) || 0,
    createdAt: toISOString(r.created_at),
    updatedAt: toISOString(r.updated_at),
  };
}

/* ─── Queries ──────────────────────────────────────────────── */

export async function getActiveCampaign(): Promise<StreakCampaign | null> {
  const campaigns = await getActiveCampaigns();
  const today = getTodayLocal();
  return campaigns.find((c) => c.startDate <= today && c.endDate >= today) ?? null;
}

export async function getActiveCampaigns(): Promise<StreakCampaign[]> {
  const today = getTodayBucharest();
  const rows = await query<StreakCampaignRow[]>(
    `SELECT * FROM streak_campaigns ORDER BY start_date ASC`,
    []
  );
  return rows.filter((r) => toDateString(r.end_date) >= today).map(mapRow);
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

export function isCampaignActive(campaign: StreakCampaign): boolean {
  const today = getTodayLocal();
  return campaign.startDate <= today && campaign.endDate >= today;
}

/* ─── Create / Update / Delete ─────────────────────────────── */

export async function createCampaign(data: {
  name: string;
  recurrenceType: RecurrenceType;
  rollingWindowDays?: number;
  ordersRequired: number;
  bonusPoints: number;
  rewardType?: RewardType;
  baseMultiplier?: number;
  multiplierIncrement?: number;
  customText: string | null;
  startDate: string;
  endDate: string;
  resetType?: ResetType;
  minOrderValue?: number;
}): Promise<StreakCampaign> {
  const id = uuidv4();
  await query(
    `INSERT INTO streak_campaigns (
      id, name, streak_type, rolling_window_days, orders_required, bonus_points,
      reward_type, base_multiplier, multiplier_increment,
      custom_text, start_date, end_date,
      reset_type, min_order_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.recurrenceType,
      data.rollingWindowDays ?? 7,
      data.ordersRequired,
      data.bonusPoints,
      data.rewardType ?? 'single',
      data.baseMultiplier ?? 1,
      data.multiplierIncrement ?? 0,
      data.customText ?? null,
      data.startDate,
      data.endDate,
      data.resetType ?? 'hard',
      data.minOrderValue ?? 0,
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
    recurrenceType: RecurrenceType;
    rollingWindowDays: number;
    ordersRequired: number;
    bonusPoints: number;
    rewardType: RewardType;
    baseMultiplier: number;
    multiplierIncrement: number;
    customText: string | null;
    startDate: string;
    endDate: string;
    resetType: ResetType;
    minOrderValue: number;
  }>
): Promise<StreakCampaign | null> {
  const fieldMap: Record<string, string> = {
    name: 'name',
    recurrenceType: 'streak_type',
    rollingWindowDays: 'rolling_window_days',
    ordersRequired: 'orders_required',
    bonusPoints: 'bonus_points',
    rewardType: 'reward_type',
    baseMultiplier: 'base_multiplier',
    multiplierIncrement: 'multiplier_increment',
    customText: 'custom_text',
    startDate: 'start_date',
    endDate: 'end_date',
    resetType: 'reset_type',
    minOrderValue: 'min_order_value',
  };
  const setters: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if ((data as any)[key] !== undefined) {
      setters.push(`${col} = ?`);
      values.push((data as any)[key]);
    }
  }
  if (setters.length === 0) return getCampaignById(id);
  values.push(id);
  await query(`UPDATE streak_campaigns SET ${setters.join(', ')} WHERE id = ?`, values);
  return getCampaignById(id);
}

export async function deleteCampaign(id: string): Promise<void> {
  await query('DELETE FROM streak_campaigns WHERE id = ?', [id]);
}

/* ─── Reward Steps ─────────────────────────────────────────── */

export async function getRewardSteps(campaignId: string): Promise<RewardStep[]> {
  const rows = await query<{ id: string; campaign_id: string; step_number: number; points_awarded: number; label: string | null }[]>(
    'SELECT * FROM streak_reward_steps WHERE campaign_id = ? ORDER BY step_number ASC',
    [campaignId]
  );
  return rows.map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    stepNumber: r.step_number,
    pointsAwarded: r.points_awarded,
    label: r.label,
  }));
}

export async function setRewardSteps(campaignId: string, steps: { stepNumber: number; pointsAwarded: number; label?: string | null }[]): Promise<RewardStep[]> {
  await query('DELETE FROM streak_reward_steps WHERE campaign_id = ?', [campaignId]);
  for (const step of steps) {
    const id = uuidv4();
    await query(
      'INSERT INTO streak_reward_steps (id, campaign_id, step_number, points_awarded, label) VALUES (?, ?, ?, ?, ?)',
      [id, campaignId, step.stepNumber, step.pointsAwarded, step.label ?? null]
    );
  }
  return getRewardSteps(campaignId);
}

/* ─── Excluded Products ────────────────────────────────────── */

export async function getExcludedProducts(campaignId: string): Promise<string[]> {
  const rows = await query<{ product_id: string }[]>(
    'SELECT product_id FROM streak_excluded_products WHERE campaign_id = ?',
    [campaignId]
  );
  return rows.map((r) => r.product_id);
}

export async function setExcludedProducts(campaignId: string, productIds: string[]): Promise<void> {
  await query('DELETE FROM streak_excluded_products WHERE campaign_id = ?', [campaignId]);
  for (const pid of productIds) {
    await query(
      'INSERT INTO streak_excluded_products (campaign_id, product_id) VALUES (?, ?)',
      [campaignId, pid]
    );
  }
}
