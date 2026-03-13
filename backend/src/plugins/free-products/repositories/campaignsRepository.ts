/**
 * Repository pentru campanii de produse gratuite pe rank (tiers)
 * Plugin: plugins/free-products
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../config/database.js';

export interface FreeProductCampaignRow {
  id: string;
  name: string;
  tier_id: string;
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
  startDate: string;
  endDate: string;
  minOrderValue: number;
  customText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FreeProductCampaignWithProducts extends FreeProductCampaign {
  productIds: string[];
}

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

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function mapRow(row: FreeProductCampaignRow): FreeProductCampaign {
  return {
    id: row.id,
    name: row.name,
    tierId: row.tier_id,
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
  startDate: string;
  endDate: string;
  minOrderValue?: number;
  customText?: string | null;
}): Promise<FreeProductCampaign> {
  const id = uuidv4();

  await query(
    `INSERT INTO free_product_campaigns (
      id, name, tier_id, start_date, end_date, min_order_value, custom_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.tierId,
      data.startDate,
      data.endDate,
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
    startDate: string;
    endDate: string;
    minOrderValue: number;
    customText: string | null;
  }>
): Promise<FreeProductCampaign | null> {
  const fieldMap: Record<string, string> = {
    name: 'name',
    tierId: 'tier_id',
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
      values.push((data as any)[key]);
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

export async function setCampaignProducts(
  campaignId: string,
  productIds: string[]
): Promise<void> {
  await query('DELETE FROM free_product_campaign_products WHERE campaign_id = ?', [
    campaignId,
  ]);

  if (productIds.length === 0) {
    return;
  }

  for (const productId of productIds) {
    const id = uuidv4();
    await query(
      'INSERT INTO free_product_campaign_products (id, campaign_id, product_id) VALUES (?, ?, ?)',
      [id, campaignId, productId]
    );
  }
}

export async function getCampaignProducts(campaignId: string): Promise<string[]> {
  const rows = await query<{ product_id: string }[]>(
    'SELECT product_id FROM free_product_campaign_products WHERE campaign_id = ?',
    [campaignId]
  );
  return rows.map((r) => r.product_id);
}

export async function getCampaignsWithProducts(): Promise<FreeProductCampaignWithProducts[]> {
  const campaigns = await listCampaigns();
  if (campaigns.length === 0) return [];

  const ids = campaigns.map((c) => c.id);
  const placeholders = ids.map(() => '?').join(', ');

  const rows = await query<{ campaign_id: string; product_id: string }[]>(
    `SELECT campaign_id, product_id
     FROM free_product_campaign_products
     WHERE campaign_id IN (${placeholders})`,
    ids
  );

  const productsByCampaign = new Map<string, string[]>();
  for (const row of rows) {
    const arr = productsByCampaign.get(row.campaign_id) ?? [];
    arr.push(row.product_id);
    productsByCampaign.set(row.campaign_id, arr);
  }

  return campaigns.map((c) => ({
    ...c,
    productIds: productsByCampaign.get(c.id) ?? [],
  }));
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
     ORDER BY start_date ASC, created_at ASC`,
    [tierId, today, today]
  );
  return rows.map(mapRow);
}

export async function getActiveProductIdsForTier(
  tierId: string | null
): Promise<{ campaignId: string; productId: string; minOrderValue: number }[]> {
  if (!tierId) return [];

  const campaigns = await getActiveCampaignsForTier(tierId);
  if (campaigns.length === 0) return [];

  const ids = campaigns.map((c) => c.id);
  const placeholders = ids.map(() => '?').join(', ');

  const rows = await query<{ campaign_id: string; product_id: string; min_order_value: number | string }[]>(
    `SELECT fpp.campaign_id, fpp.product_id, fpc.min_order_value
     FROM free_product_campaign_products fpp
     JOIN free_product_campaigns fpc ON fpc.id = fpp.campaign_id
     WHERE fpp.campaign_id IN (${placeholders})`,
    ids
  );

  return rows.map((r) => ({
    campaignId: r.campaign_id,
    productId: r.product_id,
    minOrderValue: r.min_order_value != null ? Number(r.min_order_value) || 0 : 0,
  }));
}

