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

interface FreeProductItem {
  id: string;
  name: string;
  categoryName: string;
  categoryIcon: string | null;
}

interface FreeProductCampaignSummary {
  id: string;
  name: string;
  customText: string | null;
  minOrderValue: number;
  products: string[];
  productDetails: FreeProductItem[];
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
        const productDetails: FreeProductItem[] = [];

        if (productIds.length > 0) {
          const placeholders = productIds.map(() => '?').join(', ');
          const rows = await query<{ id: string; name: string; display_name: string; icon: string | null }[]>(
            `SELECT p.id, p.name, c.display_name, c.icon
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id IN (${placeholders})`,
            productIds
          );
          productNames = rows.map((r) => r.name);
          for (const r of rows) {
            productDetails.push({
              id: r.id,
              name: r.name,
              categoryName: r.display_name,
              categoryIcon: r.icon,
            });
          }
        }

        summaries.push({
          id: campaign.id,
          name: campaign.name,
          customText: campaign.customText,
          minOrderValue: campaign.minOrderValue,
          products: productNames.slice(0, 5),
          productDetails,
        });
      }

      return summaries;
    },
  },
};

