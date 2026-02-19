/**
 * GraphQL resolvers for streak campaigns
 * Plugin: plugins/streak
 */

import { isPluginEnabled } from '../../../utils/pluginFlags.js';
import * as StreakService from '../service.js';
import * as CampaignsRepo from '../repositories/campaignsRepository.js';

function formatDate(d: Date): string {
  return d.toISOString();
}

export const streakResolvers = {
  Query: {
    async activeStreakCampaign(_: unknown, __: unknown, context: { userId?: string }) {
      const enabled = await isPluginEnabled('streak');
      if (!enabled) return null;
      return StreakService.getActiveCampaign();
    },
    async myStreakEnrollment(
      _: unknown,
      args: { campaignId?: string },
      context: { user?: { id: string } }
    ) {
      const enabled = await isPluginEnabled('streak');
      if (!enabled) return null;
      const userId = context.user?.id;
      if (!userId) return null;
      if (args.campaignId) {
        const enrollment = await StreakService.getEnrollment(userId, args.campaignId);
        if (!enrollment) return null;
        const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
        return {
          ...enrollment,
          joinedAt: formatDate(enrollment.joinedAt),
          completedAt: enrollment.completedAt ? formatDate(enrollment.completedAt) : null,
          bonusAwardedAt: enrollment.bonusAwardedAt ? formatDate(enrollment.bonusAwardedAt) : null,
          campaign: campaign ?? null,
        };
      }
      const enrollment = await StreakService.getEnrollmentByUserAndActive(userId);
      if (!enrollment) return null;
      const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
      return {
        ...enrollment,
        joinedAt: formatDate(enrollment.joinedAt),
        completedAt: enrollment.completedAt ? formatDate(enrollment.completedAt) : null,
        bonusAwardedAt: enrollment.bonusAwardedAt ? formatDate(enrollment.bonusAwardedAt) : null,
        campaign: campaign ?? null,
      };
    },
  },
  Mutation: {
    async joinStreakCampaign(
      _: unknown,
      args: { campaignId: string },
      context: { user?: { id: string } }
    ) {
      const enabled = await isPluginEnabled('streak');
      if (!enabled) throw new Error('Plugin streak este dezactivat');
      const userId = context.user?.id;
      if (!userId) throw new Error('Trebuie să fii autentificat');
      const enrollment = await StreakService.enrollUser(userId, args.campaignId);
      const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
      return {
        ...enrollment,
        joinedAt: formatDate(enrollment.joinedAt),
        completedAt: enrollment.completedAt ? formatDate(enrollment.completedAt) : null,
        bonusAwardedAt: enrollment.bonusAwardedAt ? formatDate(enrollment.bonusAwardedAt) : null,
        campaign: campaign ?? null,
      };
    },
  },
};
