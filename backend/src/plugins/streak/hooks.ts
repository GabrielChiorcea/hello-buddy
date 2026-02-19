/**
 * Hooks for core events - streak progress on order delivered
 * Plugin: plugins/streak
 */

import * as StreakService from './service.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';

/**
 * Invoked when an order is marked as delivered. Updates streak logs and progress; awards bonus if streak completed.
 */
export async function onOrderDelivered(
  orderId: string,
  order: { userId: string; total: number; pointsEarned: number }
): Promise<void> {
  const enabled = await isPluginEnabled('streak');
  if (!enabled) return;
  await StreakService.recordOrderDelivered(order.userId, orderId, new Date());
}
