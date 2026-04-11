/**
 * Shared types & data hooks for all TierProgressBar variants
 */
import React from 'react';
import { useQuery } from '@apollo/client';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { TierIcon } from '@/config/tierIcons';
import { GET_LOYALTY_TIERS, GET_TIERS_ECONOMY_SETTINGS } from '@/graphql/queries';

export interface TierDisplayData {
  tierName: string;
  currentBadgeIcon: React.ReactNode;
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
     startDate: string;
     endDate: string;
     categoryId: string | null;
     categoryName: string | null;
     products: string[];
     productDetails?: { id: string; name: string; categoryName: string; categoryIcon?: string | null }[];
   }[];
  /** Rangul după următorul (din lista de tier-uri), pentru preview pe desktop */
  tierAfterNext: {
    name: string;
    pointsMultiplier: number;
    badgeIcon?: string | null;
  } | null;
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

  const { data: tiersListData } = useQuery<{
    loyaltyTiers: Array<{
      id: string;
      name: string;
      xpThreshold: number;
      pointsMultiplier: number;
      badgeIcon?: string | null;
      sortOrder: number;
    }>;
  }>(GET_LOYALTY_TIERS, {
    skip: !tiersEnabled || !isAuthenticated,
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

  const tierAfterNext = React.useMemo(() => {
    if (!nextTier || !tiersListData?.loyaltyTiers?.length) return null;
    const sorted = [...tiersListData.loyaltyTiers].sort((a, b) => {
      const ao = a.sortOrder ?? a.xpThreshold;
      const bo = b.sortOrder ?? b.xpThreshold;
      return ao - bo;
    });
    const idx = sorted.findIndex((t) => t.id === nextTier.id);
    if (idx < 0 || idx + 1 >= sorted.length) return null;
    const t = sorted[idx + 1];
    return {
      name: t.name,
      pointsMultiplier: t.pointsMultiplier,
      badgeIcon: t.badgeIcon ?? null,
    };
  }, [nextTier, tiersListData?.loyaltyTiers]);

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
  const currentBadgeIcon = (
    <TierIcon badgeIcon={user?.tier?.badgeIcon} tierLabel={tierName} size={26} />
  );
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
    tierAfterNext,
  };
}
