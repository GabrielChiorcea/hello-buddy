/**
 * Shared types & data hooks for all TierProgressBar variants
 */
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { getTierBadgeIcon } from '@/config/tierIcons';
import { GET_TIERS_ECONOMY_SETTINGS } from '@/graphql/queries';

export interface TierDisplayData {
  tierName: string;
  currentBadgeIcon: string;
  multiplier: number;
  currentXp: number;
  progressPercent: number;
  isMaxLevel: boolean;
  xpToNextLevel: number | null;
  nextTierThreshold: number | undefined;
  currentBenefit: string;
  xpFormulaText: string;
  nextTier: {
    name: string;
    badgeIcon?: string | null;
    pointsMultiplier: number;
    benefitDescription?: string | null;
  } | null;
  nextBenefitText: string | null;
  nextMultiplier: number;
   hasFreeProductBenefits: boolean;
   freeProductCampaignsSummary: {
     id: string;
     name: string;
     customText: string | null;
     minOrderValue: number;
     products: string[];
     productDetails?: { id: string; name: string; categoryName: string; categoryIcon?: string | null }[];
   }[];
}

export function useTierDisplayData(): TierDisplayData | null {
  const { isAuthenticated, user } = useAppSelector((s) => s.user);
  const { enabled: tiersEnabled } = usePluginEnabled('tiers');
  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const { enabled: freeProductsEnabled } = usePluginEnabled('free_products');

  const { data: economyData } = useQuery<{
    tiers_xp_per_ron: string | null;
    points_per_order: string | null;
    points_per_ron: string | null;
  }>(GET_TIERS_ECONOMY_SETTINGS, {
    skip: !tiersEnabled,
    fetchPolicy: 'cache-first',
  });

  const currentXp = user?.totalXp ?? 0;
  const nextTier = user?.nextTier ?? null;
  const nextTierThreshold = nextTier?.xpThreshold;
  const xpToNextLevel = user?.xpToNextLevel ?? null;
  const isMaxLevel = xpToNextLevel === null || xpToNextLevel === undefined;

  const hasTier = Boolean(user?.tier);
  const hasNextTier = nextTier != null;
  const canShow = tiersEnabled && isAuthenticated && (hasTier || hasNextTier);

  if (!canShow) {
    return null;
  }

  const currentTierThreshold = user?.tier?.xpThreshold ?? 0;
  let progressPercent = 100;
  if (!isMaxLevel && nextTierThreshold !== undefined && nextTierThreshold > currentTierThreshold) {
    const range = nextTierThreshold - currentTierThreshold;
    const gained = currentXp - currentTierThreshold;
    if (range > 0) progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
  }

  const tierName = user?.tier?.name ?? 'Începător';
  const currentBadgeIcon = getTierBadgeIcon(user?.tier?.badgeIcon);
  const multiplier = user?.tier?.pointsMultiplier ?? 1;
  const nextMultiplier = nextTier?.pointsMultiplier ?? 1;

  const currentBenefit =
    user?.tier?.benefitDescription?.trim() ||
    (pointsEnabled ? `Primești x${multiplier.toFixed(1)} puncte la fiecare comandă livrată` : 'Comandă pentru a câștiga XP și a avansa');

  const nextBenefitText =
    nextTier?.benefitDescription?.trim() ||
    (nextTier && pointsEnabled ? `Puncte x${nextMultiplier.toFixed(1)} la fiecare comandă` : null);

  const xpPerRon = Math.max(0, parseInt(economyData?.tiers_xp_per_ron ?? '0', 10) || 0);
  const xpFormulaText = xpPerRon > 0 ? `+1 XP la fiecare ${xpPerRon} RON cheltuiți` : 'XP se acumulează la fiecare comandă';

  return {
    tierName, currentBadgeIcon, multiplier, currentXp, progressPercent,
    isMaxLevel, xpToNextLevel, nextTierThreshold, currentBenefit,
    xpFormulaText, nextTier, nextBenefitText, nextMultiplier,
    hasFreeProductBenefits: !!(freeProductsEnabled && user?.hasFreeProductBenefits),
    freeProductCampaignsSummary: user?.freeProductCampaignsSummary ?? [],
  };
}
