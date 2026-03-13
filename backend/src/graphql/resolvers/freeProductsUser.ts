/**
 * Field resolvers pentru câmpurile legate de produse gratuite pe User
 */

import type { User } from '../../models/User.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import {
  getActiveCampaignsForTier,
  getCampaignProducts,
} from '../../plugins/free-products/repositories/campaignsRepository.js';
import { query } from '../../config/database.js';

interface FreeProductCampaignSummary {
  id: string;
  name: string;
  customText: string | null;
  minOrderValue: number;
  products: string[];
}

export const freeProductsUserResolvers = {
  User: {
    async hasFreeProductBenefits(user: User): Promise<boolean> {
      const enabled = await isPluginEnabled('free_products');
      if (!enabled) return false;
      const tierId = user.tierId ?? null;
      if (!tierId) return false;
      const campaigns = await getActiveCampaignsForTier(tierId);
      return campaigns.length > 0;
    },

    async freeProductCampaignsSummary(user: User): Promise<FreeProductCampaignSummary[]> {
      const enabled = await isPluginEnabled('free_products');
      if (!enabled) return [];
      const tierId = user.tierId ?? null;
      if (!tierId) return [];

      const campaigns = await getActiveCampaignsForTier(tierId);
      if (campaigns.length === 0) return [];

      const summaries: FreeProductCampaignSummary[] = [];

      for (const campaign of campaigns) {
        const productIds = await getCampaignProducts(campaign.id);
        let productNames: string[] = [];
        if (productIds.length > 0) {
          const placeholders = productIds.map(() => '?').join(', ');
          const rows = await query<{ name: string }[]>(
            `SELECT name FROM products WHERE id IN (${placeholders})`,
            productIds
          );
          productNames = rows.map((r) => r.name);
        }

        summaries.push({
          id: campaign.id,
          name: campaign.name,
          customText: campaign.customText,
          minOrderValue: campaign.minOrderValue,
          products: productNames.slice(0, 5),
        });
      }

      return summaries;
    },
  },
};

