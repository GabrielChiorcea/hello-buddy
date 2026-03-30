/**
 * Field resolvers pentru câmpurile legate de produse gratuite pe User
 *
 * Campaniile se bazează pe CATEGORIE — toate produsele din categoria campaniei sunt gratuite.
 */

import type { User } from '../../models/User.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import {
  getActiveCampaignsForTier,
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
  /** Întotdeauna setate — free_product_campaigns.start_date / end_date sunt NOT NULL */
  startDate: string;
  endDate: string;
  categoryId: string | null;
  categoryName: string | null;
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
        if (!campaign.categoryId) continue;

        // Obținem numele categoriei
        const catRow = await query<{ display_name: string; icon: string | null }[]>(
          'SELECT display_name, icon FROM categories WHERE id = ?',
          [campaign.categoryId]
        );
        const categoryName = catRow[0]?.display_name ?? null;
        const categoryIcon = catRow[0]?.icon ?? null;

        // Obținem toate produsele din această categorie
        const products = await query<{ id: string; name: string }[]>(
          'SELECT id, name FROM products WHERE category_id = ? AND is_available = 1 ORDER BY name',
          [campaign.categoryId]
        );

        const productDetails: FreeProductItem[] = products.map((p) => ({
          id: p.id,
          name: p.name,
          categoryName: categoryName ?? '',
          categoryIcon,
        }));

        summaries.push({
          id: campaign.id,
          name: campaign.name,
          customText: campaign.customText,
          minOrderValue: campaign.minOrderValue,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          categoryId: campaign.categoryId,
          categoryName,
          products: products.map((p) => p.name).slice(0, 5),
          productDetails,
        });
      }

      return summaries;
    },
  },
};
