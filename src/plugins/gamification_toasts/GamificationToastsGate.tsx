import { useEffect, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { isAuthRoute, routes } from '@/config/routes';
import { GET_TIERS_ECONOMY_SETTINGS } from '@/graphql/queries';
import { GET_POINTS_REWARDS } from '@/plugins/points/queries';
import type { PointsReward } from '@/plugins/points/types';
import { GET_MY_COUPONS } from '@/graphql/queries';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '@/plugins/streak/queries';
import type { StreakCampaign, StreakEnrollment } from '@/plugins/streak/types';
import {
  calculateCampaignStreakReward,
  calculateCampaignTotalPoints,
  calculateMaxDiscountFromPoints,
  pickHeroCampaign,
} from '@/plugins/streak/components/campaignUtils';
import { showPointsToast } from './toasts/showPointsToast';
import { showCouponsActiveToast } from './toasts/showCouponsActiveToast';
import { showStreakToast } from './toasts/showStreakToast';
import { showTextSimpleToast } from './toasts/showTextSimpleToast';

const GET_GAMIFICATION_TOAST_POINTS_SETTINGS = gql`
  query GetGamificationToastPointsSettings {
    items: appSetting(key: "gamification_toasts_items")
    legacyPointsItems: appSetting(key: "gamification_toasts_points_items")
  }
`;

interface ToastPointsSettingsQuery {
  items: string | null;
  legacyPointsItems: string | null;
}

type ToastType = 'points' | 'coupons_active' | 'streak' | 'text_simple';

interface RuntimeToastItem {
  id: string;
  type: ToastType;
  text: string;
  couponsActiveTitle?: string;
  couponsInactiveTitle?: string;
  image?: string;
  streakInactiveText?: string;
  pointsLoggedOutText?: string;
  couponsLoggedOutText?: string;
  streakLoggedOutText?: string;
  textSimpleLoggedOutText?: string;
  intervalMs: number;
  durationMs: number;
  isActive: boolean;
}

interface MyCouponEntry {
  id: string;
  status: 'active' | 'used' | 'expired';
  expiresAt?: string | null;
  usedAt?: string | null;
  coupon: {
    title: string;
    discountPercent: number;
  };
}

const DEFAULT_TEXT = 'Ai {puncte_amount} foloseste si ia reduceri';
const DEFAULT_STREAK_ACTIVE_TEXT = 'Esti pe streak: {streak_current}/{streak_total}';
const DEFAULT_STREAK_INACTIVE_TEXT = 'Continua streak-ul si castiga bonusuri';
const DEFAULT_INTERVAL_MS = 120000;
const DEFAULT_DURATION_MS = 5000;

function parsePositiveInt(rawValue: string | null | undefined, fallbackValue: number): number {
  const parsed = Number.parseInt(String(rawValue ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallbackValue;
  return parsed;
}

function parseRuntimeItems(raw: string | null | undefined): RuntimeToastItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => ({
      id: typeof item?.id === 'string' ? item.id : `toast-${index}`,
      type: (item?.type as ToastType) ?? 'points',
      text: typeof item?.text === 'string' ? item.text : item?.type === 'streak' ? '' : DEFAULT_TEXT,
      couponsActiveTitle: typeof item?.couponsActiveTitle === 'string' ? item.couponsActiveTitle : '',
      couponsInactiveTitle: typeof item?.couponsInactiveTitle === 'string' ? item.couponsInactiveTitle : '',
      image: typeof item?.image === 'string' ? item.image : '',
      streakInactiveText: typeof item?.streakInactiveText === 'string' ? item.streakInactiveText : '',
      pointsLoggedOutText:
        typeof item?.pointsLoggedOutText === 'string' ? item.pointsLoggedOutText : '',
      couponsLoggedOutText:
        typeof item?.couponsLoggedOutText === 'string' ? item.couponsLoggedOutText : '',
      streakLoggedOutText:
        typeof item?.streakLoggedOutText === 'string' ? item.streakLoggedOutText : '',
      textSimpleLoggedOutText:
        typeof item?.textSimpleLoggedOutText === 'string' ? item.textSimpleLoggedOutText : '',
      intervalMs: parsePositiveInt(item?.intervalMs != null ? String(item.intervalMs) : null, DEFAULT_INTERVAL_MS),
      durationMs: parsePositiveInt(item?.durationMs != null ? String(item.durationMs) : null, DEFAULT_DURATION_MS),
      isActive: item?.isActive !== false,
    }));
  } catch {
    return [];
  }
}

function isExcludedRoute(pathname: string): boolean {
  if (isAuthRoute(pathname)) return true;
  if (pathname === routes.profile || pathname.startsWith(`${routes.profile}/`)) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}

export const GamificationToastsGate: React.FC = () => {
  const { enabled: pluginEnabled, loading: pluginLoading } = usePluginEnabled('gamification_toasts');
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const location = useLocation();
  const routeExcluded = isExcludedRoute(location.pathname);

  const { data, loading } = useQuery<ToastPointsSettingsQuery>(GET_GAMIFICATION_TOAST_POINTS_SETTINGS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !pluginEnabled,
  });
  const { data: couponsData } = useQuery<{ myCoupons: MyCouponEntry[] }>(GET_MY_COUPONS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !pluginEnabled || !isAuthenticated,
  });
  const { data: campaignsData } = useQuery<{ activeStreakCampaigns: StreakCampaign[] }>(ACTIVE_STREAK_CAMPAIGNS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !pluginEnabled,
  });
  const { data: enrollmentData } = useQuery<{ myStreakEnrollment: StreakEnrollment | null }>(MY_STREAK_ENROLLMENT, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !pluginEnabled || !isAuthenticated,
  });
  const { data: pointsRewardsData } = useQuery<{ pointsRewards: PointsReward[] }>(GET_POINTS_REWARDS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !pluginEnabled,
  });
  const { data: economyData } = useQuery<{ points_per_order: string | null }>(GET_TIERS_ECONOMY_SETTINGS, {
    fetchPolicy: 'cache-first',
    skip: !pluginEnabled,
  });

  const pointsAmount = user?.pointsBalance ?? 0;
  const activeCoupons = useMemo(
    () =>
      (couponsData?.myCoupons ?? []).filter((entry) => {
        if (entry.status !== 'active') return false;
        if (entry.usedAt) return false;
        if (!entry.expiresAt) return true;
        return new Date(entry.expiresAt).getTime() > Date.now();
      }),
    [couponsData],
  );
  const activeCampaigns = useMemo(() => campaignsData?.activeStreakCampaigns ?? [], [campaignsData]);
  const enrollment = enrollmentData?.myStreakEnrollment ?? null;
  const pointsRewards = pointsRewardsData?.pointsRewards ?? [];
  const pointsPerOrder = Math.max(0, parseInt(economyData?.points_per_order ?? '0', 10) || 0);

  const runtimeConfig = useMemo(() => {
    const parsedItems =
      parseRuntimeItems(data?.items).length > 0
        ? parseRuntimeItems(data?.items)
        : parseRuntimeItems(data?.legacyPointsItems).map((item) => ({ ...item, type: 'points' as const }));
    const activeItems = parsedItems.filter((item) => item.isActive);
    return { activeItems };
  }, [data]);

  useEffect(() => {
    if (pluginLoading || loading) return;
    if (!pluginEnabled || runtimeConfig.activeItems.length === 0) return;
    if (routeExcluded) return;

    let activeIndex = 0;
    let timeoutId: number | null = null;
    let cancelled = false;

    const buildToastPayload = (item: RuntimeToastItem) => {
      if (item.type === 'points') {
        if (!isAuthenticated) {
          const fallback = item.pointsLoggedOutText?.trim();
          if (!fallback) return null;
          return {
            variant: 'points' as const,
            text: fallback,
            image: item.image || '',
            pointsAmount: 0,
            durationMs: item.durationMs,
          };
        }
        if (Number(pointsAmount) < 1) return null;
        return {
          variant: 'points' as const,
          text: item.text,
          image: item.image || '',
          pointsAmount: Number(pointsAmount),
          durationMs: item.durationMs,
        };
      }

      if (item.type === 'coupons_active') {
        if (!isAuthenticated) {
          const fallback = item.couponsLoggedOutText?.trim();
          if (!fallback) return null;
          return {
            variant: 'coupons_active' as const,
            title: fallback,
            image: item.image || '',
            coupons: [] as { id: string; title: string; discountPercent: number }[],
            durationMs: item.durationMs,
          };
        }
        const hasActiveCoupons = activeCoupons.length > 0;
        return {
          variant: 'coupons_active' as const,
          title:
            (hasActiveCoupons ? item.couponsActiveTitle : item.couponsInactiveTitle)?.trim() ||
            (hasActiveCoupons ? 'Cupoanele tale active' : 'Activeaza primul tau cupon'),
          image: item.image || '',
          coupons: activeCoupons.map((entry) => ({
            id: entry.id,
            title: entry.coupon.title,
            discountPercent: entry.coupon.discountPercent,
          })),
          durationMs: item.durationMs,
        };
      }

      if (item.type === 'streak') {
        // Separare intenționată:
        //   • `rewardPoints` (afișat ca „+N puncte") = recompensa SPECIFICĂ streak-ului
        //     (bonus + praguri), FĂRĂ `points_per_order` — userul ar primi acelea oricum.
        //   • `estimatedSavingsRon` = calculat pe TOTALUL real (cu `points_per_order`),
        //     fiindcă reducerea în RON se aplică pe toate punctele acumulate.
        // `{streak_max_bonus}` din texte primește recompensa streak-ului (consistent cu cardul Home).
        if (!isAuthenticated) {
          const fallback = item.streakLoggedOutText?.trim();
          if (!fallback) return null;
          const heroLoggedOut = pickHeroCampaign(activeCampaigns, pointsPerOrder);
          const heroStreakReward = heroLoggedOut
            ? calculateCampaignStreakReward(heroLoggedOut)
            : 0;
          return {
            variant: 'streak' as const,
            title: 'Incepe streak-ul',
            text: fallback.replace(/\{streak_max_bonus\}/g, String(heroStreakReward)),
            image: item.image || '',
            streak: {
              current: 0,
              total: 1,
              rewardPoints: heroStreakReward,
              remainingOrders: 1,
              isEncourage: true,
            },
            durationMs: item.durationMs,
          };
        }
        if (activeCampaigns.length === 0) return null;
        const enrolledCampaign =
          enrollment?.campaign ?? activeCampaigns.find((c) => c.id === enrollment?.campaignId) ?? null;
        if (enrollment && enrolledCampaign && !enrollment.completedAt) {
          const ordersRequired = enrolledCampaign.ordersRequired;
          const remainingOrders = Math.max(0, ordersRequired - enrollment.currentStreakCount);
          const streakReward = calculateCampaignStreakReward(enrolledCampaign);
          const totalCampaignPoints = calculateCampaignTotalPoints(enrolledCampaign, pointsPerOrder);
          const estimatedSavingsRon = calculateMaxDiscountFromPoints(
            totalCampaignPoints,
            pointsRewards,
            ordersRequired
          );
          return {
            variant: 'streak' as const,
            title: 'Streak activ',
            text: DEFAULT_STREAK_ACTIVE_TEXT
              .replace(/\{streak_current\}/g, String(enrollment.currentStreakCount))
              .replace(/\{streak_total\}/g, String(ordersRequired)),
            image: item.image || '',
            streak: {
              current: enrollment.currentStreakCount,
              total: ordersRequired,
              rewardPoints: streakReward,
              remainingOrders,
              estimatedSavingsRon,
              isEncourage: false,
            },
            durationMs: item.durationMs,
          };
        }

        // Neînrolat + multi-campanii: alegem campania „erou" prin strategia hibridă (urgență apoi
        // valoare). Sortarea în `pickHeroCampaign` folosește totalul cu `points_per_order` ca
        // să compare corect campanii cu lungimi diferite, dar afișăm doar recompensa streak.
        const hero = pickHeroCampaign(activeCampaigns, pointsPerOrder);
        const heroStreakReward = hero ? calculateCampaignStreakReward(hero) : 0;
        return {
          variant: 'streak' as const,
          title: 'Incepe streak-ul',
          text: (item.streakInactiveText || DEFAULT_STREAK_INACTIVE_TEXT).replace(
            /\{streak_max_bonus\}/g,
            String(heroStreakReward)
          ),
          image: item.image || '',
          streak: {
            current: 0,
            total: 1,
            rewardPoints: heroStreakReward,
            remainingOrders: 1,
            isEncourage: true,
          },
          durationMs: item.durationMs,
        };
      }

      const simpleText = (item.text || item.textSimpleLoggedOutText || '').trim();
      if (!simpleText) return null;
      return {
        variant: 'text_simple' as const,
        text: simpleText,
        image: item.image || '',
        durationMs: item.durationMs,
      };
    };

    const showToast = (item: RuntimeToastItem) => {
      if (cancelled) return;
      const payload = buildToastPayload(item);
      if (!payload) {
        timeoutId = window.setTimeout(() => {
          const nextItem = runtimeConfig.activeItems[activeIndex % runtimeConfig.activeItems.length];
          activeIndex += 1;
          showToast(nextItem);
        }, item.intervalMs);
        return;
      }
      if (payload.variant === 'points') {
        showPointsToast({
          text: payload.text,
          image: payload.image,
          pointsAmount: payload.pointsAmount,
          durationMs: payload.durationMs,
        });
      } else if (payload.variant === 'coupons_active') {
        showCouponsActiveToast({
          title: payload.title,
          text: '',
          image: payload.image,
          coupons: payload.coupons,
          durationMs: payload.durationMs,
        });
      } else if (payload.variant === 'streak') {
        showStreakToast({
          title: payload.title,
          text: payload.text,
          image: payload.image,
          current: payload.streak.current,
          total: payload.streak.total,
          rewardPoints: payload.streak.rewardPoints,
          remainingOrders: payload.streak.remainingOrders,
          ...(typeof payload.streak.estimatedSavingsRon === 'number'
            ? { estimatedSavingsRon: payload.streak.estimatedSavingsRon }
            : {}),
          isEncourage: payload.streak.isEncourage,
          durationMs: payload.durationMs,
        });
      } else {
        showTextSimpleToast({
          text: payload.text,
          image: payload.image,
          durationMs: payload.durationMs,
        });
      }

      // Următoarea apariție începe DUPĂ ce toast-ul curent dispare + pauza configurată.
      timeoutId = window.setTimeout(() => {
        const nextItem = runtimeConfig.activeItems[activeIndex % runtimeConfig.activeItems.length];
        activeIndex += 1;
        showToast(nextItem);
      }, item.durationMs + item.intervalMs);
    };

    const firstItem = runtimeConfig.activeItems[0];
    timeoutId = window.setTimeout(() => {
      showToast(firstItem);
    }, firstItem.intervalMs);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [
    pluginLoading,
    loading,
    pluginEnabled,
    runtimeConfig,
    routeExcluded,
    isAuthenticated,
    pointsAmount,
    activeCoupons,
    activeCampaigns,
    enrollment,
  ]);

  return null;
};
