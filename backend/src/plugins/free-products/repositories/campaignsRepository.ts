/**
 * Repository pentru campanii de produse gratuite pe rank (tiers)
 * Plugin: plugins/free-products
 *
 * Campaniile se setează pe CATEGORIE (category_id), nu pe produse individuale.
 * Toate produsele din categoria respectivă devin gratuite.
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export interface FreeProductCampaignRow {
  id: string;
  name: string;
  tier_id: string;
  category_id: string | null;
  start_date: Date | string;
  end_date: Date | string;
  min_order_value?: number | string;
  custom_text: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface FreeProductCampaign {
  id: string;
  name: string;
  tierId: string;
  categoryId: string | null;
  startDate: string;
  endDate: string;
  minOrderValue: number;
  customText: string | null;
  createdAt: string;
  updatedAt: string;
}

const APP_TIMEZONE = 'Europe/Bucharest';

function toDateString(v: Date | string): string {
  if (v instanceof Date) {
    // DATE-only values may be materialized as Date objects with implicit timezone shifts.
    // Normalize using the app timezone to avoid off-by-one-day issues.
    return v.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function toISOString(v: Date | string): string {
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString();
}

function getTodayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function mapRow(row: FreeProductCampaignRow): FreeProductCampaign {
  return {
    id: row.id,
    name: row.name,
    tierId: row.tier_id,
    categoryId: row.category_id,
    startDate: toDateString(row.start_date),
    endDate: toDateString(row.end_date),
    minOrderValue: row.min_order_value != null ? Number(row.min_order_value) || 0 : 0,
    customText: row.custom_text,
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  };
}

export async function listCampaigns(): Promise<FreeProductCampaign[]> {
  const rows = await query<FreeProductCampaignRow[]>(
    'SELECT * FROM free_product_campaigns ORDER BY start_date DESC, created_at DESC',
    []
  );
  return rows.map(mapRow);
}

export async function getCampaignById(id: string): Promise<FreeProductCampaign | null> {
  const row = await queryOne<FreeProductCampaignRow>(
    'SELECT * FROM free_product_campaigns WHERE id = ?',
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function createCampaign(data: {
  name: string;
  tierId: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  minOrderValue?: number;
  customText?: string | null;
}): Promise<FreeProductCampaign> {
  const id = uuidv4();

  await query(
    `INSERT INTO free_product_campaigns (
      id, name, tier_id, category_id, start_date, end_date, min_order_value, custom_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.tierId,
      data.categoryId,
      toDateString(data.startDate),
      toDateString(data.endDate),
      data.minOrderValue ?? 0,
      data.customText ?? null,
    ]
  );

  const campaign = await getCampaignById(id);
  if (!campaign) {
    throw new Error('Nu s-a putut crea campania de produse gratuite');
  }
  return campaign;
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    name: string;
    tierId: string;
    categoryId: string;
    startDate: string;
    endDate: string;
    minOrderValue: number;
    customText: string | null;
  }>
): Promise<FreeProductCampaign | null> {
  const fieldMap: Record<string, string> = {
    name: 'name',
    tierId: 'tier_id',
    categoryId: 'category_id',
    startDate: 'start_date',
    endDate: 'end_date',
    minOrderValue: 'min_order_value',
    customText: 'custom_text',
  };

  const setters: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(fieldMap)) {
    if ((data as any)[key] !== undefined) {
      setters.push(`${column} = ?`);
      const rawValue = (data as any)[key];
      // Normalize DATE-only values to avoid implicit timezone shifts.
      if (key === 'startDate' || key === 'endDate') values.push(toDateString(rawValue));
      else values.push(rawValue);
    }
  }

  if (setters.length === 0) {
    return getCampaignById(id);
  }

  values.push(id);
  await query(
    `UPDATE free_product_campaigns SET ${setters.join(', ')} WHERE id = ?`,
    values
  );

  return getCampaignById(id);
}

export async function deleteCampaign(id: string): Promise<void> {
  await query('DELETE FROM free_product_campaigns WHERE id = ?', [id]);
}

export async function getActiveCampaignsForTier(
  tierId: string | null
): Promise<FreeProductCampaign[]> {
  if (!tierId) return [];
  const today = getTodayLocal();
  const rows = await query<FreeProductCampaignRow[]>(
    `SELECT *
     FROM free_product_campaigns
     WHERE tier_id = ?
       AND start_date <= ?
       AND end_date >= ?
       AND category_id IS NOT NULL
     ORDER BY start_date ASC, created_at ASC`,
    [tierId, today, today]
  );
  return rows.map(mapRow);
}

/**
 * Returnează toate produsele eligibile pentru gratuit pe baza categoriei campaniei.
 * Fiecare produs din categoria campaniei devine eligibil.
 */
export async function getActiveProductIdsForTier(
  tierId: string | null
): Promise<{ campaignId: string; productId: string; minOrderValue: number }[]> {
  if (!tierId) return [];

  const campaigns = await getActiveCampaignsForTier(tierId);
  if (campaigns.length === 0) return [];

  const results: { campaignId: string; productId: string; minOrderValue: number }[] = [];

  for (const campaign of campaigns) {
    if (!campaign.categoryId) continue;

    const products = await query<{ id: string }[]>(
      `SELECT id FROM products WHERE category_id = ? AND is_available = 1`,
      [campaign.categoryId]
    );

    for (const p of products) {
      results.push({
        campaignId: campaign.id,
        productId: p.id,
        minOrderValue: campaign.minOrderValue,
      });
    }
  }

  return results;
}
