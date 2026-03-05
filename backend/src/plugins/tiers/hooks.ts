/**
 * Hooks pentru evenimente din core - XP și niveluri
 * Plugin: plugins/tiers
 */

import * as TiersService from './service.js';

/**
 * Invocat când o comandă este marcată ca livrată
 */
export async function onOrderDelivered(
  orderId: string,
  order: { userId: string; total: number }
): Promise<void> {
  await TiersService.addXpOnOrderDelivered(orderId, order);
}

