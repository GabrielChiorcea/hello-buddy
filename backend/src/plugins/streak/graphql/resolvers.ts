/**
 * GraphQL resolvers for streak campaigns V2
 * Plugin: plugins/streak
 */

import { isPluginEnabled } from '../../../utils/pluginFlags.js';
import * as StreakService from '../service.js';
import * as CampaignsRepo from '../repositories/campaignsRepository.js';

function formatDate(d: Date): string {
  return d.toISOString();
}

async function enrichCampaign(campaign: CampaignsRepo.StreakCampaign) {
  const rewardSteps = await CampaignsRepo.getRewardSteps(campaign.id);
  return { ...campaign, rewardSteps };
}

function formatEnrollment(enrollment: any, campaign: any) {
  return {
    ...enrollment,
    joinedAt: formatDate(enrollment.joinedAt),
    completedAt: enrollment.completedAt ? formatDate(enrollment.completedAt) : null,
    bonusAwardedAt: enrollment.bonusAwardedAt ? formatDate(enrollment.bonusAwardedAt) : null,
    campaign: campaign ?? null,
  };
}

export const streakResolvers = {
  Query: {
    async activeStreakCampaign() {
      const enabled = await isPluginEnabled('streak');
      if (!enabled) return null;
      const campaign = await StreakService.getActiveCampaign();
      return campaign ? enrichCampaign(campaign) : null;
    },
    async activeStreakCampaigns() {
      const enabled = await isPluginEnabled('streak');
      if (!enabled) return [];
      const campaigns = await StreakService.getActiveCampaigns();
      return Promise.all(campaigns.map(enrichCampaign));
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

      const enrollment = args.campaignId
        ? await StreakService.getEnrollment(userId, args.campaignId)
        : await StreakService.getEnrollmentByUserAndActive(userId);

      if (!enrollment) return null;
      const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
      const enriched = campaign ? await enrichCampaign(campaign) : null;
      return formatEnrollment(enrollment, enriched);
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
      const enriched = campaign ? await enrichCampaign(campaign) : null;
      return formatEnrollment(enrollment, enriched);
    },
  },
};
