/**
 * Creează comanda din draft și marchează draft-ul completed.
 * Folosit de webhook și de confirmPaymentSession (fallback la redirect).
 */

import * as DraftRepo from './draftRepository.js';
import * as OrderModel from '../models/Order.js';

export async function fulfillOrderFromDraft(
  draftId: string,
  paymentId: string
): Promise<OrderModel.Order | null> {
  const draft = await DraftRepo.findById(draftId);
  if (!draft || draft.status !== 'pending') return null;

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

  await DraftRepo.markCompleted(draft.id);
  return order;
}
