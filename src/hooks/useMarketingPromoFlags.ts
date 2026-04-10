/**
 * Streak vs cupoane: disponibilitate pentru Home și navbar desktop.
 * Ambele cu conținut → promo-uri pe Home, fără linkuri în navbar.
 * Un singur tip → link în navbar (cupoanele folosesc același „emphasis” ca streak-ul singur).
 */

import { useQuery } from '@apollo/client';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { GET_COUPONS_CATALOG_IDS } from '@/graphql/queries';
import { ACTIVE_STREAK_CAMPAIGNS } from '@/plugins/streak/queries';

export function useMarketingPromoFlags(): {
  hasStreak: boolean;
  hasCoupons: boolean;
  loading: boolean;
} {
  const { enabled: streakEnabled, loading: streakPluginLoading } = usePluginEnabled('streak');
  const { enabled: couponsEnabled, loading: couponsPluginLoading } = usePluginEnabled('coupons');

  const { data: campaignsData, loading: campaignsLoading } = useQuery<{
    activeStreakCampaigns: { id: string }[];
  }>(ACTIVE_STREAK_CAMPAIGNS, {
    fetchPolicy: 'cache-and-network',
    skip: !streakEnabled,
  });

  const { data: couponsData, loading: couponsCatalogLoading } = useQuery<{
    couponsCatalog: { id: string }[];
  }>(GET_COUPONS_CATALOG_IDS, {
    fetchPolicy: 'cache-and-network',
    skip: !couponsEnabled,
  });

  const loading =
    streakPluginLoading ||
    couponsPluginLoading ||
    (streakEnabled && campaignsLoading) ||
    (couponsEnabled && couponsCatalogLoading);

  const hasStreak = streakEnabled && (campaignsData?.activeStreakCampaigns?.length ?? 0) > 0;
  const hasCoupons = couponsEnabled && (couponsData?.couponsCatalog?.length ?? 0) > 0;

  return { hasStreak, hasCoupons, loading };
}
