/**
 * Rezolvere GraphQL pentru niveluri de loialitate (tiers)
 * Plugin: plugins/tiers
 */

import type { User } from '../../../models/User.js';
import { isPluginEnabled } from '../../../utils/pluginFlags.js';
import * as TiersRepo from '../repositories/tiersRepository.js';

export const tiersResolvers = {
  Query: {
    /**
     * Listează toate nivelurile de loialitate.
     * Returnează [] dacă plugin-ul este dezactivat.
     */
    async loyaltyTiers(): Promise<TiersRepo.LoyaltyTier[]> {
      const enabled = await isPluginEnabled('tiers');
      if (!enabled) return [];
      return TiersRepo.getAll();
    },
  },

  User: {
    totalXp(user: User): number {
      return user.totalXp ?? 0;
    },

    async tier(user: User): Promise<TiersRepo.LoyaltyTier | null> {
      const enabled = await isPluginEnabled('tiers');
      if (!enabled) return null;
      const totalXp = user.totalXp ?? 0;
      return TiersRepo.getTierForXp(totalXp);
    },

    async nextTier(user: User): Promise<TiersRepo.LoyaltyTier | null> {
      const enabled = await isPluginEnabled('tiers');
      if (!enabled) return null;
      const totalXp = user.totalXp ?? 0;
      return TiersRepo.getNextTierForXp(totalXp);
    },

    async xpToNextLevel(user: User): Promise<number | null> {
      const enabled = await isPluginEnabled('tiers');
      if (!enabled) return null;
      const totalXp = user.totalXp ?? 0;
      const nextTier = await TiersRepo.getNextTierForXp(totalXp);
      if (!nextTier) return null;
      const diff = nextTier.xpThreshold - totalXp;
      return diff > 0 ? diff : 0;
    },
  },
};

