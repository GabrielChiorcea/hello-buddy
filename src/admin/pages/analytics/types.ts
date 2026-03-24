export interface SalesKpis {
  grossRevenue: number; totalOrders: number; aov: number;
  netProfitPerOrder: number; revenueGrowthRate: number;
  totalDeliveryFees: number; cancellationRate: number; cancelledOrders: number;
}

export interface PointsAnalytics {
  totalEarned: number; totalSpent: number; redemptionRate: number;
  redemptionsCount: number; uniqueEarners: number; uniqueRedeemers: number;
  aovWithPoints: number; aovWithoutPoints: number; totalDiscount: number;
  topEarners: { id: string; name: string; balance: number; earned: number; spent: number }[];
  trend: { day: string; earned: number; spent: number }[];
}

export interface StreakCampaign {
  id: string; name: string; ordersRequired: number; bonusPoints: number;
  startDate: string; endDate: string;
  enrolled: number; completed: number; active: number;
  avgStreak: number; pointsAwarded: number; completionRate: number;
}

export interface TierAnalytics {
  tierId: string; tierName: string; sortOrder: number; multiplier: number;
  userCount: number; revenue: number; ordersCount: number; avgOrder: number;
}

export interface AnalyticsData {
  period: string;
  salesKpis: SalesKpis;
  topCustomers: { id: string; name: string; ordersCount: number; totalSpent: number; avgOrder: number; lastOrderAt: string }[];
  revenueByCategory: { category: string; ordersCount: number; itemsSold: number; revenue: number }[];
  fulfillmentSplit: { weekStart: string; delivery: number; inLocation: number; total: number }[];
  fulfillmentTotals: { type: string; count: number; revenue: number }[];
  peakHours: { hour: number; orders: number; revenue: number }[];
  dailyRevenueTrend: { day: string; orders: number; revenue: number }[];
  pointsAnalytics: PointsAnalytics;
  streakAnalytics: StreakCampaign[];
  tierAnalytics: TierAnalytics[];
}

export type ProductPairRow = { productA: string; productB: string; pairCount: number };

export const analyticsPeriods = [
  { label: '7 zile', value: '7d' },
  { label: '30 zile', value: '30d' },
  { label: '90 zile', value: '90d' },
] as const;
