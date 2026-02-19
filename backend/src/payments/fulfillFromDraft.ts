/**
 * Creează comanda din draft și marchează draft-ul completed.
 * Folosit de webhook și de confirmPaymentSession (fallback la redirect).
 * Folosește markCompletedOnlyIfPending pentru a evita dublarea comenzii (race webhook vs redirect).
 */

import * as DraftRepo from './draftRepository.js';
import * as OrderModel from '../models/Order.js';

const DRAFT_EXPIRY_MINUTES = 30;

export async function fulfillOrderFromDraft(
  draftId: string,
  paymentId: string
): Promise<OrderModel.Order | null> {
  const draft = await DraftRepo.findById(draftId);
  if (!draft) return null;
  if (draft.status !== 'pending') {
    return OrderModel.findByPaymentId(paymentId) ?? null;
  }

  const createdAt = draft.createdAt instanceof Date ? draft.createdAt.getTime() : new Date(draft.createdAt).getTime();
  const expiryMs = DRAFT_EXPIRY_MINUTES * 60 * 1000;
  if (Date.now() - createdAt > expiryMs) {
    return null;
  }

  const claimed = await DraftRepo.markCompletedOnlyIfPending(draft.id);
  if (!claimed) {
    return OrderModel.findByPaymentId(paymentId) ?? null;
  }

  const payload = draft.payload;
  const order = await OrderModel.create({
    userId: draft.userId,
    items: payload.items,
    fulfillmentType: payload.fulfillmentType,
    tableNumber: payload.tableNumber,
    deliveryAddress: payload.deliveryAddress,
    deliveryCity: payload.deliveryCity,
    phone: payload.phone,
    notes: payload.notes,
    paymentMethod: 'card',
    pointsToUse: payload.pointsToUse,
    paymentId,
  });
  return order;
}
