/**
 * Hooks pentru evenimente din core - puncte la livrare
 * Plugin: plugins/points
 */

import * as PointsService from './service.js';

/**
 * Invocat când o comandă este marcată ca livrată
 */
export async function onOrderDelivered(orderId: string, order: { userId: string; total: number; pointsEarned: number }): Promise<void> {
  await PointsService.awardOnDelivery(orderId, order);
}
