/**
 * Model Points - re-export din repositories
 * Plugin: plugins/points
 *
 * REFACTORED: Logica este acum în repositories/rewardsRepository.ts
 * și repositories/transactionsRepository.ts
 * Acest fișier re-exportează totul pentru compatibilitate cu importurile existente.
 */

export type { PointsReward } from './repositories/rewardsRepository.js';
export type { PointsTransactionType } from './repositories/transactionsRepository.js';

export {
  getRewards,
  getRewardForPoints,
  createReward,
  updateReward,
  getRewardById,
  deleteReward,
} from './repositories/rewardsRepository.js';

export {
  getUserBalance,
  addPoints,
  spendPoints,
} from './repositories/transactionsRepository.js';
