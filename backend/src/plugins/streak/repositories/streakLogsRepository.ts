/**
 * Repository for streak_logs (one row per user_campaign per calendar day)
 * V2: includes order_value for validation
 * Plugin: plugins/streak
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

const APP_TIMEZONE = 'Europe/Bucharest';

/**
 * Normalizează o dată la format YYYY-MM-DD în timezone-ul Bucharest.
 * Evită bug-ul unde toISOString() convertea la UTC, cauzând decalaj de o zi
 * față de orderDateStr (calculat cu getDateInBucharest).
 */
function normDate(v: string | Date): string {
  if (v instanceof Date) return v.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

export async function insertLog(
  userStreakCampaignId: string,
  orderId: string | null,
  orderDate: string,
  orderValue?: number
): Promise<boolean> {
  try {
    const id = uuidv4();
    await query(
      `INSERT INTO streak_logs (id, user_streak_campaign_id, order_id, order_date, order_value)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userStreakCampaignId, orderId, orderDate, orderValue ?? null]
    );
    return true;
  } catch {
    // Duplicate (user_streak_campaign_id, order_date) - day already counted
    return false;
  }
}

export async function getOrderDatesForEnrollment(userStreakCampaignId: string): Promise<string[]> {
  const rows = await query<{ order_date: string | Date }[]>(
    'SELECT order_date FROM streak_logs WHERE user_streak_campaign_id = ? ORDER BY order_date ASC',
    [userStreakCampaignId]
  );
  return rows.map((r) => normDate(r.order_date));
}

export async function getOrderDatesInRange(
  userStreakCampaignId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<string[]> {
  const rows = await query<{ order_date: string | Date }[]>(
    `SELECT DISTINCT order_date FROM streak_logs
     WHERE user_streak_campaign_id = ? AND order_date >= ? AND order_date <= ?
     ORDER BY order_date ASC`,
    [userStreakCampaignId, rangeStart, rangeEnd]
  );
  return rows.map((r) => normDate(r.order_date));
}

/** Alias for backward compat */
export const getOrderDatesInWeek = getOrderDatesInRange;

/** Get last order date for an enrollment */
export async function getLastOrderDate(userStreakCampaignId: string): Promise<string | null> {
  const row = await queryOne<{ order_date: string | Date }>(
    'SELECT order_date FROM streak_logs WHERE user_streak_campaign_id = ? ORDER BY order_date DESC LIMIT 1',
    [userStreakCampaignId]
  );
  return row ? normDate(row.order_date) : null;
}
