/**
 * Repository for streak_logs (one row per user_campaign per calendar day)
 * Plugin: plugins/streak
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export async function insertLog(
  userStreakCampaignId: string,
  orderId: string | null,
  orderDate: string
): Promise<boolean> {
  try {
    const id = uuidv4();
    await query(
      `INSERT INTO streak_logs (id, user_streak_campaign_id, order_id, order_date)
       VALUES (?, ?, ?, ?)`,
      [id, userStreakCampaignId, orderId, orderDate]
    );
    return true;
  } catch (err) {
    // Duplicate (user_streak_campaign_id, order_date) - day already counted
    return false;
  }
}

export async function getOrderDatesForEnrollment(
  userStreakCampaignId: string
): Promise<string[]> {
  const rows = await query<{ order_date: string | Date }[]>(
    'SELECT order_date FROM streak_logs WHERE user_streak_campaign_id = ? ORDER BY order_date ASC',
    [userStreakCampaignId]
  );
  return rows.map((r) => {
    const v = r.order_date;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
  });
}

/** Get distinct order_date values in the same ISO week as the given date (YYYY-MM-DD) */
export async function getOrderDatesInWeek(
  userStreakCampaignId: string,
  weekStart: string,
  weekEnd: string
): Promise<string[]> {
  const rows = await query<{ order_date: string | Date }[]>(
    `SELECT DISTINCT order_date FROM streak_logs
     WHERE user_streak_campaign_id = ? AND order_date >= ? AND order_date <= ?
     ORDER BY order_date ASC`,
    [userStreakCampaignId, weekStart, weekEnd]
  );
  return rows.map((r) => {
    const v = r.order_date;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
  });
}
