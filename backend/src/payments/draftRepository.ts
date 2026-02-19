/**
 * Repository pentru draft-uri de plată (card).
 * Salvează datele comenzii până la confirmarea plății prin webhook.
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, pool } from '../config/database.js';
import type { CreateOrderInput } from '../models/Order.js';

export type DraftStatus = 'pending' | 'completed' | 'expired';

export interface PaymentDraftPayload extends CreateOrderInput {
  amountRon?: number;
}

export interface PaymentDraft {
  id: string;
  userId: string;
  payload: PaymentDraftPayload;
  amountRon: number;
  gateway: string;
  gatewayPaymentId: string | null;
  status: DraftStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface DraftRow {
  id: string;
  user_id: string;
  payload: string;
  amount_ron: string;
  gateway: string;
  gateway_payment_id: string | null;
  status: DraftStatus;
  created_at: Date;
  updated_at: Date;
}

function mapRowToDraft(row: DraftRow): PaymentDraft {
  let payload: PaymentDraftPayload;
  try {
    payload = JSON.parse(row.payload) as PaymentDraftPayload;
  } catch {
    payload = {} as PaymentDraftPayload;
  }
  return {
    id: row.id,
    userId: row.user_id,
    payload,
    amountRon: parseFloat(row.amount_ron),
    gateway: row.gateway,
    gatewayPaymentId: row.gateway_payment_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDraft(
  userId: string,
  payload: PaymentDraftPayload,
  amountRon: number,
  gateway: string
): Promise<PaymentDraft> {
  const id = uuidv4();
  const payloadJson = JSON.stringify(payload);
  await query(
    `INSERT INTO payment_drafts (id, user_id, payload, amount_ron, gateway, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [id, userId, payloadJson, amountRon, gateway]
  );
  const draft = await findById(id);
  if (!draft) throw new Error('Failed to create payment draft');
  return draft;
}

export async function findById(id: string): Promise<PaymentDraft | null> {
  const row = await queryOne<DraftRow>('SELECT * FROM payment_drafts WHERE id = ?', [id]);
  return row ? mapRowToDraft(row) : null;
}

export async function findByGatewayPaymentId(gatewayPaymentId: string): Promise<PaymentDraft | null> {
  const row = await queryOne<DraftRow>(
    'SELECT * FROM payment_drafts WHERE gateway_payment_id = ?',
    [gatewayPaymentId]
  );
  return row ? mapRowToDraft(row) : null;
}

export async function updateGatewayPaymentId(id: string, gatewayPaymentId: string): Promise<void> {
  await query(
    'UPDATE payment_drafts SET gateway_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [gatewayPaymentId, id]
  );
}

export async function markCompleted(id: string): Promise<void> {
  await query(
    "UPDATE payment_drafts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );
}

/**
 * Marchează draft-ul completed doar dacă este încă 'pending' (atomic).
 * Returnează true dacă am actualizat (suntem singurii care creează comanda), false dacă era deja completed.
 * Folosit pentru a evita race între webhook și confirmPaymentSession.
 */
export async function markCompletedOnlyIfPending(id: string): Promise<boolean> {
  const [result] = await pool.execute<{ affectedRows: number }>(
    "UPDATE payment_drafts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'",
    [id]
  );
  const ok = result as { affectedRows?: number };
  return (ok?.affectedRows ?? 0) === 1;
}
