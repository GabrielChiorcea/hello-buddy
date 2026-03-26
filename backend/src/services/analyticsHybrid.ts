/**
 * Analytics strict din tabelele dedicate (analytics_*), fără fallback live.
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

export async function fetchProductPairs(off: number): Promise<
  { product_a: string; product_b: string; pair_count: number }[]
> {
  const rows = await analyticsQuery<
    { product_a: string; product_b: string; pair_count: string | number }[]
  >(
    `SELECT a.product_name AS product_a, b.product_name AS product_b, COUNT(*) AS pair_count
     FROM order_items a
     JOIN order_items b ON a.order_id = b.order_id AND a.id < b.id
     JOIN orders o ON o.id = a.order_id
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
     GROUP BY a.product_name, b.product_name ORDER BY pair_count DESC LIMIT 10`,
    [off]
  );
  return rows.map(r => ({
    product_a: r.product_a,
    product_b: r.product_b,
    pair_count: int(r.pair_count),
  }));
}
