/**
 * Analytics /admin/analytics – citire exclusiv din tabele pre-agregate (analytics_daily_* etc.).
 */

import { analyticsQuery } from '../config/database.js';

export function firstDayIntervalDays(daysBack: number): number {
  return Math.max(0, daysBack - 1);
}

type SalesRollupAgg = {
  gross_revenue: string | number | null;
  total_orders: string | number | null;
  total_delivery_fees: string | number | null;
  cancelled_orders: string | number | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function int(v: string | number | null | undefined): number {
  return Math.round(num(v));
}

function formatDate(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export async function fetchSalesKpisHybrid(daysBack: number): Promise<{
  grossRevenue: number;
  totalOrders: number;
  totalDeliveryFees: number;
  aov: number;
  cancelledOrders: number;
  cancellationTotalAll: number;
}> {
  const off = firstDayIntervalDays(daysBack);

  const [rollup] = await analyticsQuery<SalesRollupAgg[]>(
    `SELECT
       COALESCE(SUM(gross_revenue), 0) AS gross_revenue,
       COALESCE(SUM(total_orders), 0) AS total_orders,
       COALESCE(SUM(total_delivery_fees), 0) AS total_delivery_fees,
       COALESCE(SUM(cancelled_orders), 0) AS cancelled_orders
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [off]
  );
  const grossRevenue = num(rollup?.gross_revenue);
  const totalOrders = int(rollup?.total_orders);
  const totalDeliveryFees = num(rollup?.total_delivery_fees);
  const aov = totalOrders > 0 ? grossRevenue / totalOrders : 0;
  const cancelledOrders = int(rollup?.cancelled_orders);
  const cancellationTotalAll = totalOrders + cancelledOrders;

  return {
    grossRevenue,
    totalOrders,
    totalDeliveryFees,
    aov,
    cancelledOrders,
    cancellationTotalAll,
  };
}

export async function fetchPrevPeriodGrossRevenue(daysBack: number): Promise<number> {
  const off = firstDayIntervalDays(daysBack);
  const [rollup] = await analyticsQuery<{ g: string | number | null }[]>(
    `SELECT COALESCE(SUM(gross_revenue), 0) AS g
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL 1 DAY), INTERVAL ? DAY)
       AND report_date <= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL 1 DAY)`,
    [off, off, off]
  );
  return num(rollup?.g);
}

export async function fetchPeakHoursHybrid(daysBack: number): Promise<
  { hour_of_day: number; order_count: number; revenue: number }[]
> {
  const off = firstDayIntervalDays(daysBack);
  const rollupRows = await analyticsQuery<{ h: number; c: string | number; r: string | number }[]>(
    `SELECT hour_of_day AS h,
       SUM(order_count) AS c,
       COALESCE(SUM(revenue), 0) AS r
     FROM analytics_hourly_orders
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY hour_of_day`,
    [off]
  );
  return rollupRows
    .map(r => ({
      hour_of_day: r.h,
      order_count: int(r.c),
      revenue: num(r.r),
    }))
    .sort((a, b) => a.hour_of_day - b.hour_of_day);
}

export async function fetchDailyRevenueTrendHybrid(daysBack: number): Promise<
  { day: string; orders: number; revenue: number }[]
> {
  const off = firstDayIntervalDays(daysBack);
  const rollupRows = await analyticsQuery<
    { day: Date | string; orders: string | number; revenue: string | number }[]
  >(
    `SELECT report_date AS day, total_orders AS orders, gross_revenue AS revenue
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY report_date ASC`,
    [off]
  );
  return rollupRows.map(r => ({
    day: formatDate(r.day),
    orders: int(r.orders),
    revenue: num(r.revenue),
  }));
}

export async function fetchPointsTrendHybrid(daysBack: number): Promise<
  { day: string; earned: number; spent: number }[]
> {
  const off = firstDayIntervalDays(daysBack);
  const rollupRows = await analyticsQuery<
    { day: Date | string; earned: string | number; spent: string | number }[]
  >(
    `SELECT report_date AS day, points_earned AS earned, points_spent AS spent
     FROM analytics_daily_points
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY report_date ASC`,
    [off]
  );
  return rollupRows.map(r => ({
    day: formatDate(r.day),
    earned: int(r.earned),
    spent: int(r.spent),
  }));
}

export async function fetchPointsTotalsHybrid(daysBack: number): Promise<{
  totalEarned: number;
  totalSpent: number;
  redemptionsCount: number;
}> {
  const off = firstDayIntervalDays(daysBack);
  const [rollup] = await analyticsQuery<
    { earned: string | number; spent: string | number; red: string | number }[]
  >(
    `SELECT
       COALESCE(SUM(points_earned), 0) AS earned,
       COALESCE(SUM(points_spent), 0) AS spent,
       COALESCE(SUM(redemptions_count), 0) AS red
     FROM analytics_daily_points
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [off]
  );
  return {
    totalEarned: int(rollup?.earned),
    totalSpent: int(rollup?.spent),
    redemptionsCount: int(rollup?.red),
  };
}

export async function fetchFulfillmentTotalsForPeriod(daysBack: number): Promise<
  { type: string; count: string | number; revenue: string | number }[]
> {
  const off = firstDayIntervalDays(daysBack);
  return analyticsQuery(
    `SELECT 'delivery' AS type,
       COALESCE(SUM(delivery_count), 0) AS count,
       0 AS revenue
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     UNION ALL
     SELECT 'in_location' AS type,
       COALESCE(SUM(in_location_count), 0) AS count,
       0 AS revenue
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [off, off]
  );
}

export async function fetchFulfillmentSplitHybrid(daysBack: number): Promise<
  {
    week_key: number;
    week_start: string;
    delivery_count: number;
    in_location_count: number;
    total_count: number;
  }[]
> {
  const off = firstDayIntervalDays(daysBack);
  const rollupWeeks = await analyticsQuery<
    {
      week_key: number;
      week_start: Date | string;
      delivery_count: string | number;
      in_location_count: string | number;
      total_count: string | number;
    }[]
  >(
    `SELECT YEARWEEK(report_date, 1) AS week_key,
       MIN(report_date) AS week_start,
       SUM(delivery_count) AS delivery_count,
       SUM(in_location_count) AS in_location_count,
       SUM(total_orders) AS total_count
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY YEARWEEK(report_date, 1)
     ORDER BY week_key ASC`,
    [off]
  );
  return rollupWeeks.map(r => ({
    week_key: r.week_key,
    week_start: formatDate(r.week_start),
    delivery_count: int(r.delivery_count),
    in_location_count: int(r.in_location_count),
    total_count: int(r.total_count),
  }));
}

export type RevenueCategoryRow = {
  category: string;
  ordersCount: number;
  itemsSold: number;
  revenue: number;
};

export async function fetchRevenueByCategoryHybrid(daysBack: number): Promise<RevenueCategoryRow[]> {
  const off = firstDayIntervalDays(daysBack);

  const rollupRows = await analyticsQuery<
    {
      category_id: string;
      category_name: string;
      orders_count: string | number;
      items_sold: string | number;
      revenue: string | number;
    }[]
  >(
    `SELECT category_id, MAX(category_name) AS category_name,
       SUM(orders_count) AS orders_count,
       SUM(items_sold) AS items_sold,
       SUM(revenue) AS revenue
     FROM analytics_daily_category
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY category_id`,
    [off]
  );
  return rollupRows
    .map(r => ({
      category: r.category_name,
      ordersCount: int(r.orders_count),
      itemsSold: int(r.items_sold),
      revenue: num(r.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function fetchTopCustomersHybrid(daysBack: number): Promise<
  {
    id: string;
    name: string;
    orders_count: string | number;
    total_spent: string | number;
    avg_order: string | number;
    last_day: Date | string | null;
  }[]
> {
  const off = firstDayIntervalDays(daysBack);
  return analyticsQuery<
    {
      id: string;
      name: string;
      orders_count: string | number;
      total_spent: string | number;
      avg_order: string | number;
      last_day: Date | string | null;
    }[]
  >(
    `SELECT
       u.id,
       u.name,
       COALESCE(SUM(d.order_count), 0) AS orders_count,
       COALESCE(SUM(d.total_spent), 0) AS total_spent,
       COALESCE(SUM(d.total_spent) / NULLIF(SUM(d.order_count), 0), 0) AS avg_order,
       MAX(d.report_date) AS last_day
     FROM analytics_daily_user_sales d
     INNER JOIN users u ON u.id = d.user_id
     WHERE d.report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY u.id, u.name
     ORDER BY total_spent DESC
     LIMIT 10`,
    [off]
  );
}

export async function fetchPointsDistinctUsersHybrid(daysBack: number): Promise<{
  uniqueEarners: number;
  uniqueRedeemers: number;
}> {
  const off = firstDayIntervalDays(daysBack);
  const [earners] = await analyticsQuery<{ c: string | number }[]>(
    `SELECT COUNT(DISTINCT user_id) AS c
     FROM analytics_daily_user_points
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND points_earned > 0`,
    [off]
  );
  const [redeemers] = await analyticsQuery<{ c: string | number }[]>(
    `SELECT COUNT(DISTINCT user_id) AS c
     FROM analytics_daily_user_points
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND points_spent > 0`,
    [off]
  );
  return {
    uniqueEarners: int(earners?.c),
    uniqueRedeemers: int(redeemers?.c),
  };
}

export async function fetchTopPointsEarnersHybrid(daysBack: number): Promise<
  {
    id: string;
    name: string;
    points_balance: string | number;
    earned: string | number;
    spent: string | number;
  }[]
> {
  const off = firstDayIntervalDays(daysBack);
  return analyticsQuery(
    `SELECT
       u.id,
       u.name,
       u.points_balance,
       COALESCE(SUM(p.points_earned), 0) AS earned,
       COALESCE(SUM(p.points_spent), 0) AS spent
     FROM analytics_daily_user_points p
     INNER JOIN users u ON u.id = p.user_id
     WHERE p.report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY u.id, u.name, u.points_balance
     ORDER BY earned DESC
     LIMIT 10`,
    [off]
  );
}

export async function fetchOrdersPointsInsightsHybrid(daysBack: number): Promise<{
  aovWithPoints: number;
  aovWithoutPoints: number;
  totalDiscount: number;
}> {
  const off = firstDayIntervalDays(daysBack);
  const [sales] = await analyticsQuery<
    {
      ow: string | number;
      rw: string | number;
      onp: string | number;
      rnp: string | number;
    }[]
  >(
    `SELECT
       COALESCE(SUM(orders_with_points), 0) AS ow,
       COALESCE(SUM(revenue_with_points), 0) AS rw,
       COALESCE(SUM(orders_without_points), 0) AS onp,
       COALESCE(SUM(revenue_without_points), 0) AS rnp
     FROM analytics_daily_sales
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [off]
  );
  const [disc] = await analyticsQuery<{ d: string | number }[]>(
    `SELECT COALESCE(SUM(discount_total), 0) AS d
     FROM analytics_daily_points
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [off]
  );
  const ow = int(sales?.ow);
  const onp = int(sales?.onp);
  return {
    aovWithPoints: ow > 0 ? num(sales?.rw) / ow : 0,
    aovWithoutPoints: onp > 0 ? num(sales?.rnp) / onp : 0,
    totalDiscount: num(disc?.d),
  };
}

export async function fetchStreakCampaignsRollup(daysBack: number): Promise<
  {
    id: string;
    name: string;
    orders_required: number;
    bonus_points: number;
    start_date: Date | string;
    end_date: Date | string;
    enrolled: string | number;
    completed: string | number;
    active: string | number;
    avg_streak: string | number;
    points_awarded: string | number;
  }[]
> {
  const off = firstDayIntervalDays(daysBack);
  return analyticsQuery(
    `SELECT
       sc.id,
       sc.name,
       sc.orders_required,
       sc.bonus_points,
       sc.start_date,
       sc.end_date,
       COALESCE(sts.enrolled_count, 0) AS enrolled,
       COALESCE(sts.completed_count, 0) AS completed,
       COALESCE(sts.active_count, 0) AS active,
       COALESCE(sts.avg_streak, 0) AS avg_streak,
       COALESCE(sts.points_awarded, 0) AS points_awarded
     FROM streak_campaigns sc
     LEFT JOIN (
       SELECT ads.*
       FROM analytics_daily_streaks ads
       INNER JOIN (
         SELECT campaign_id, MAX(report_date) AS mx
         FROM analytics_daily_streaks
         WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY campaign_id
       ) lx ON lx.campaign_id = ads.campaign_id AND lx.mx = ads.report_date
     ) sts ON sts.campaign_id = sc.id
     ORDER BY sc.start_date DESC
     LIMIT 10`,
    [off]
  );
}

export async function fetchTierAnalyticsRollup(daysBack: number): Promise<
  {
    tier_id: string;
    tier_name: string;
    sort_order: string | number;
    multiplier: string | number;
    user_count: string | number;
    revenue: string | number;
    orders_count: string | number;
    avg_order: string | number;
  }[]
> {
  const off = firstDayIntervalDays(daysBack);
  return analyticsQuery(
    `SELECT
       lm.tier_id,
       lm.tier_name,
       COALESCE(lt.sort_order, 999) AS sort_order,
       COALESCE(lt.points_multiplier, 1) AS multiplier,
       lm.user_count,
       agg.rev AS revenue,
       agg.oc AS orders_count,
       COALESCE(agg.rev / NULLIF(agg.oc, 0), 0) AS avg_order
     FROM (
       SELECT tier_id, MAX(report_date) AS md
       FROM analytics_daily_tiers
       WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY tier_id
     ) x
     JOIN analytics_daily_tiers lm ON lm.tier_id = x.tier_id AND lm.report_date = x.md
     LEFT JOIN loyalty_tiers lt ON lt.id = lm.tier_id AND lm.tier_id <> 'none'
     JOIN (
       SELECT tier_id, SUM(total_revenue) AS rev, SUM(total_orders) AS oc
       FROM analytics_daily_tiers
       WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY tier_id
     ) agg ON agg.tier_id = lm.tier_id
     ORDER BY COALESCE(lt.sort_order, 999) ASC`,
    [off, off]
  );
}
export async function fetchProductPairs(daysBack: number): Promise<
  { product_a: string; product_b: string; pair_count: number }[]
> {
  const off = firstDayIntervalDays(daysBack);
  const rows = await analyticsQuery<
    { product_a: string; product_b: string; pair_count: string | number }[]
  >(
    `SELECT product_a, product_b, SUM(pair_count) AS pair_count
     FROM analytics_daily_product_pairs
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY product_a, product_b
     ORDER BY pair_count DESC
     LIMIT 10`,
    [off]
  );
  return rows.map(r => ({
    product_a: r.product_a,
    product_b: r.product_b,
    pair_count: int(r.pair_count),
  }));
}

export async function fetchCouponsAnalyticsRollup(opts: {
  daysBack?: number;
  from?: Date;
  to?: Date;
}): Promise<{
  totalDiscount: number;
  totalActivated: number;
  totalUsed: number;
  usageRate: number;
  topActivated: { id: string; title: string; activations: number }[];
}> {
  const params: unknown[] = [];
  const where: string[] = [];

  if (opts.from && !isNaN(opts.from.getTime())) {
    where.push('report_date >= ?');
    params.push(formatDate(opts.from));
  } else if (opts.daysBack != null) {
    where.push('report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
    params.push(firstDayIntervalDays(opts.daysBack));
  }

  if (opts.to && !isNaN(opts.to.getTime())) {
    where.push('report_date <= ?');
    params.push(formatDate(opts.to));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [totals] = await analyticsQuery<
    { activated: string | number; used: string | number; discount: string | number }[]
  >(
    `SELECT
       COALESCE(SUM(activations_count), 0) AS activated,
       COALESCE(SUM(redemptions_count), 0) AS used,
       COALESCE(SUM(discount_total), 0) AS discount
     FROM analytics_daily_coupons
     ${whereSql}`,
    params
  );

  const topRows = await analyticsQuery<
    { id: string; title: string; activations: string | number }[]
  >(
    `SELECT
       coupon_id AS id,
       coupon_title AS title,
       COALESCE(SUM(activations_count), 0) AS activations
     FROM analytics_daily_coupon_activations
     ${whereSql}
     GROUP BY coupon_id, coupon_title
     ORDER BY activations DESC
     LIMIT 10`,
    params
  );

  const activated = int(totals?.activated);
  const used = int(totals?.used);

  return {
    totalDiscount: num(totals?.discount),
    totalActivated: activated,
    totalUsed: used,
    usageRate: activated > 0 ? used / activated : 0,
    topActivated: topRows.map(r => ({
      id: r.id,
      title: r.title,
      activations: int(r.activations),
    })),
  };
}
