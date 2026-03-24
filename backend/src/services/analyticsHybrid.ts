/**
 * Mix rollup (analytics_*) pentru zile complete până la ieri + live pentru azi.
 * Fereastra = N zile calendaristice incluzând azi: firstDay = CURDATE() - (daysBack - 1).
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

/**
 * Vânzări + anulări: istoric rollup (sau live dacă rollup lipsește / sub-numără), azi mereu live.
 */
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
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND report_date < CURDATE()`,
    [off]
  );

  const [liveToday] = await analyticsQuery<
    { gross_revenue: string | number; total_orders: string | number; total_delivery_fees: string | number }[]
  >(
    `SELECT
       COALESCE(SUM(o.total), 0) AS gross_revenue,
       COUNT(o.id) AS total_orders,
       COALESCE(SUM(o.delivery_fee), 0) AS total_delivery_fees
     FROM orders o
     WHERE o.status != 'cancelled' AND o.created_at >= CURDATE()`
  );

  const [liveHist] = await analyticsQuery<
    { gross_revenue: string | number; total_orders: string | number; total_delivery_fees: string | number }[]
  >(
    `SELECT
       COALESCE(SUM(o.total), 0) AS gross_revenue,
       COUNT(o.id) AS total_orders,
       COALESCE(SUM(o.delivery_fee), 0) AS total_delivery_fees
     FROM orders o
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       AND o.created_at < CURDATE()`,
    [off]
  );

  const [cancHist] = await analyticsQuery<{ total: string | number; cancelled: string | number }[]>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM orders
     WHERE created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       AND created_at < CURDATE()`,
    [off]
  );

  const rollupGross = num(rollup?.gross_revenue);
  const liveHistGross = num(liveHist?.gross_revenue);
  const useLiveHist =
    liveHistGross > 0 && (rollupGross < liveHistGross * 0.98 || rollupGross === 0);

  let histGross: number;
  let histOrders: number;
  let histFees: number;
  let histCancelled: number;

  if (useLiveHist) {
    histGross = liveHistGross;
    histOrders = int(liveHist?.total_orders);
    histFees = num(liveHist?.total_delivery_fees);
    histCancelled = int(cancHist?.cancelled);
  } else {
    histGross = rollupGross;
    histOrders = int(rollup?.total_orders);
    histFees = num(rollup?.total_delivery_fees);
    histCancelled = int(rollup?.cancelled_orders);
  }

  const todayGross = num(liveToday?.gross_revenue);
  const todayOrders = int(liveToday?.total_orders);
  const todayFees = num(liveToday?.total_delivery_fees);

  const [cancToday] = await analyticsQuery<{ total: string | number; cancelled: string | number }[]>(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM orders WHERE created_at >= CURDATE()`
  );

  const grossRevenue = histGross + todayGross;
  const totalOrders = histOrders + todayOrders;
  const totalDeliveryFees = histFees + todayFees;
  const aov = totalOrders > 0 ? grossRevenue / totalOrders : 0;
  const cancelledOrders = histCancelled + int(cancToday?.cancelled);
  const cancellationTotalAll =
    histOrders + histCancelled + int(cancToday?.total);

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
  let g = num(rollup?.g);
  const [liveCheck] = await analyticsQuery<{ g: string | number | null }[]>(
    `SELECT COALESCE(SUM(o.total), 0) AS g
     FROM orders o
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL 1 DAY), INTERVAL ? DAY), ' 00:00:00')
       AND o.created_at < CONCAT(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL ? DAY), INTERVAL 1 DAY), ' 23:59:59.999')`,
    [off, off, off]
  );
  const liveG = num(liveCheck?.g);
  if (liveG > 0 && (g < liveG * 0.98 || g === 0)) {
    g = liveG;
  }
  return g;
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
       AND report_date < CURDATE()
     GROUP BY hour_of_day`,
    [off]
  );

  if (rollupRows.length === 0) {
    return await analyticsQuery<{ hour_of_day: number; order_count: number; revenue: string | number }[]>(
      `SELECT HOUR(o.created_at) AS hour_of_day, COUNT(*) AS order_count,
         COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       GROUP BY HOUR(o.created_at) ORDER BY hour_of_day`,
      [off]
    ).then(rows =>
      rows.map(r => ({
        hour_of_day: r.hour_of_day,
        order_count: int(r.order_count),
        revenue: num(r.revenue),
      }))
    );
  }

  const liveRows = await analyticsQuery<{ h: number; c: string | number; r: string | number }[]>(
    `SELECT HOUR(o.created_at) AS h,
       COUNT(*) AS c,
       COALESCE(SUM(o.total), 0) AS r
     FROM orders o
     WHERE o.status != 'cancelled' AND o.created_at >= CURDATE()
     GROUP BY HOUR(o.created_at)`
  );

  const byHour = new Map<number, { c: number; r: number }>();
  for (const row of rollupRows) {
    byHour.set(row.h, { c: int(row.c), r: num(row.r) });
  }
  for (const row of liveRows) {
    const cur = byHour.get(row.h) ?? { c: 0, r: 0 };
    cur.c += int(row.c);
    cur.r += num(row.r);
    byHour.set(row.h, cur);
  }
  return Array.from(byHour.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour_of_day, v]) => ({
      hour_of_day,
      order_count: v.c,
      revenue: v.r,
    }));
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
       AND report_date < CURDATE()
     ORDER BY report_date ASC`,
    [off]
  );
  const [liveToday] = await analyticsQuery<{ orders: string | number; revenue: string | number }[]>(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o
     WHERE o.status != 'cancelled' AND o.created_at >= CURDATE()`
  );
  const [cur] = await analyticsQuery<{ d: Date | string }[]>(`SELECT CURDATE() AS d`);
  const todayStr = formatDate(cur?.d ?? new Date());

  if (rollupRows.length === 0) {
    return await analyticsQuery<{ day: Date | string; orders: string | number; revenue: string | number }[]>(
      `SELECT DATE(o.created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       GROUP BY DATE(o.created_at) ORDER BY day ASC`,
      [off]
    ).then(rows =>
      rows.map(r => ({
        day: formatDate(r.day),
        orders: int(r.orders),
        revenue: num(r.revenue),
      }))
    );
  }

  const rows = rollupRows.map(r => ({
    day: formatDate(r.day),
    orders: int(r.orders),
    revenue: num(r.revenue),
  }));
  rows.push({
    day: todayStr,
    orders: int(liveToday?.orders),
    revenue: num(liveToday?.revenue),
  });
  return rows;
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
       AND report_date < CURDATE()
     ORDER BY report_date ASC`,
    [off]
  );
  const [liveToday] = await analyticsQuery<{ earned: string | number; spent: string | number }[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
       COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent
     FROM points_transactions pt
     WHERE pt.created_at >= CURDATE()`
  );
  const [cur] = await analyticsQuery<{ d: Date | string }[]>(`SELECT CURDATE() AS d`);
  const todayStr = formatDate(cur?.d ?? new Date());

  if (rollupRows.length === 0) {
    return await analyticsQuery<
      { day: Date | string; earned: string | number; spent: string | number }[]
    >(
      `SELECT DATE(pt.created_at) AS day,
         COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
         COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent
       FROM points_transactions pt
       WHERE pt.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       GROUP BY DATE(pt.created_at) ORDER BY day ASC`,
      [off]
    ).then(rows =>
      rows.map(r => ({
        day: formatDate(r.day),
        earned: int(r.earned),
        spent: int(r.spent),
      }))
    );
  }

  const rows = rollupRows.map(r => ({
    day: formatDate(r.day),
    earned: int(r.earned),
    spent: int(r.spent),
  }));
  rows.push({
    day: todayStr,
    earned: int(liveToday?.earned),
    spent: int(liveToday?.spent),
  });
  return rows;
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
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND report_date < CURDATE()`,
    [off]
  );
  const [liveHist] = await analyticsQuery<
    { earned: string | number; spent: string | number; red: string | number }[]
  >(
    `SELECT
       COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
       COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent,
       COUNT(CASE WHEN pt.type = 'spent' THEN 1 END) AS red
     FROM points_transactions pt
     WHERE pt.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       AND pt.created_at < CURDATE()`,
    [off]
  );

  let histEarned = int(rollup?.earned);
  let histSpent = int(rollup?.spent);
  let histRed = int(rollup?.red);
  const liveHistEarned = int(liveHist?.earned);
  if (liveHistEarned > 0 && (histEarned < liveHistEarned * 0.98 || histEarned === 0)) {
    histEarned = liveHistEarned;
    histSpent = int(liveHist?.spent);
    histRed = int(liveHist?.red);
  }

  const [liveToday] = await analyticsQuery<
    { earned: string | number; spent: string | number; red: string | number }[]
  >(
    `SELECT
       COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
       COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent,
       COUNT(CASE WHEN pt.type = 'spent' THEN 1 END) AS red
     FROM points_transactions pt
     WHERE pt.created_at >= CURDATE()`
  );
  return {
    totalEarned: histEarned + int(liveToday?.earned),
    totalSpent: histSpent + int(liveToday?.spent),
    redemptionsCount: histRed + int(liveToday?.red),
  };
}

/** Venituri + count pe tip livrare: un singur query live pe fereastra calendar (consistent cu restul). */
export async function fetchFulfillmentTotalsForPeriod(daysBack: number): Promise<
  { type: string; count: string | number; revenue: string | number }[]
> {
  const off = firstDayIntervalDays(daysBack);
  return analyticsQuery(
    `SELECT COALESCE(o.fulfillment_type, 'delivery') AS type,
       COUNT(*) AS count,
       COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
     GROUP BY type`,
    [off]
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
       AND report_date < CURDATE()
     GROUP BY YEARWEEK(report_date, 1)
     ORDER BY week_key ASC`,
    [off]
  );

  if (rollupWeeks.length === 0) {
    return await analyticsQuery<
      {
        week_key: number;
        week_start: Date | string;
        delivery_count: string | number;
        in_location_count: string | number;
        total_count: string | number;
      }[]
    >(
      `SELECT YEARWEEK(o.created_at, 1) AS week_key, MIN(DATE(o.created_at)) AS week_start,
         SUM(CASE WHEN COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 ELSE 0 END) AS delivery_count,
         SUM(CASE WHEN o.fulfillment_type = 'in_location' THEN 1 ELSE 0 END) AS in_location_count,
         COUNT(*) AS total_count
       FROM orders o
       WHERE o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       GROUP BY week_key ORDER BY week_key ASC`,
      [off]
    ).then(rows =>
      rows.map(r => ({
        week_key: r.week_key,
        week_start: formatDate(r.week_start),
        delivery_count: int(r.delivery_count),
        in_location_count: int(r.in_location_count),
        total_count: int(r.total_count),
      }))
    );
  }

  const liveToday = await analyticsQuery<
    {
      week_key: number;
      week_start: Date | string;
      delivery_count: string | number;
      in_location_count: string | number;
      total_count: string | number;
    }[]
  >(
    `SELECT YEARWEEK(o.created_at, 1) AS week_key,
       MIN(DATE(o.created_at)) AS week_start,
       SUM(CASE WHEN COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 ELSE 0 END) AS delivery_count,
       SUM(CASE WHEN o.fulfillment_type = 'in_location' THEN 1 ELSE 0 END) AS in_location_count,
       COUNT(*) AS total_count
     FROM orders o
     WHERE o.status != 'cancelled' AND o.created_at >= CURDATE()
     GROUP BY YEARWEEK(o.created_at, 1)`
  );
  const byWeek = new Map<
    number,
    {
      week_key: number;
      week_start: string;
      delivery_count: number;
      in_location_count: number;
      total_count: number;
    }
  >();
  for (const r of rollupWeeks) {
    byWeek.set(r.week_key, {
      week_key: r.week_key,
      week_start: formatDate(r.week_start),
      delivery_count: int(r.delivery_count),
      in_location_count: int(r.in_location_count),
      total_count: int(r.total_count),
    });
  }
  for (const r of liveToday) {
    const cur = byWeek.get(r.week_key);
    if (cur) {
      cur.delivery_count += int(r.delivery_count);
      cur.in_location_count += int(r.in_location_count);
      cur.total_count += int(r.total_count);
    } else {
      byWeek.set(r.week_key, {
        week_key: r.week_key,
        week_start: formatDate(r.week_start),
        delivery_count: int(r.delivery_count),
        in_location_count: int(r.in_location_count),
        total_count: int(r.total_count),
      });
    }
  }
  return Array.from(byWeek.values()).sort((a, b) => a.week_key - b.week_key);
}

export type RevenueCategoryRow = {
  category: string;
  ordersCount: number;
  itemsSold: number;
  revenue: number;
};

/** Rollup categorii (ieri și în urmă) + live pentru azi. */
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
       AND report_date < CURDATE()
     GROUP BY category_id`,
    [off]
  );

  const liveFull = () =>
    analyticsQuery<
      {
        category_id: string;
        category: string;
        orders_count: string | number;
        items_sold: string | number;
        revenue: string | number;
      }[]
    >(
      `SELECT c.id AS category_id, c.display_name AS category,
         COUNT(DISTINCT o.id) AS orders_count,
         SUM(oi.quantity) AS items_sold,
         COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS revenue
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       GROUP BY c.id, c.display_name ORDER BY revenue DESC`,
      [off]
    );

  if (rollupRows.length === 0) {
    const rows = await liveFull();
    return rows.map(r => ({
      category: r.category,
      ordersCount: int(r.orders_count),
      itemsSold: int(r.items_sold),
      revenue: num(r.revenue),
    }));
  }

  const rollupRev = rollupRows.reduce((s, r) => s + num(r.revenue), 0);
  const [liveHistCheck] = await analyticsQuery<{ rev: string | number }[]>(
    `SELECT COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS rev
     FROM categories c
     JOIN products p ON c.id = p.category_id
     JOIN order_items oi ON p.id = oi.product_id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
       AND o.created_at < CURDATE()`,
    [off]
  );
  const liveHistRev = num(liveHistCheck?.rev);
  if (liveHistRev > 0 && (rollupRev < liveHistRev * 0.98 || rollupRev === 0)) {
    const rows = await liveFull();
    return rows.map(r => ({
      category: r.category,
      ordersCount: int(r.orders_count),
      itemsSold: int(r.items_sold),
      revenue: num(r.revenue),
    }));
  }

  const liveToday = await analyticsQuery<
    {
      category_id: string;
      category_name: string;
      orders_count: string | number;
      items_sold: string | number;
      revenue: string | number;
    }[]
  >(
    `SELECT c.id AS category_id, c.display_name AS category_name,
       COUNT(DISTINCT o.id) AS orders_count,
       SUM(oi.quantity) AS items_sold,
       COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS revenue
     FROM categories c
     JOIN products p ON c.id = p.category_id
     JOIN order_items oi ON p.id = oi.product_id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status != 'cancelled' AND o.created_at >= CURDATE()
     GROUP BY c.id, c.display_name`
  );

  const byId = new Map<string, RevenueCategoryRow>();
  for (const r of rollupRows) {
    byId.set(r.category_id, {
      category: r.category_name,
      ordersCount: int(r.orders_count),
      itemsSold: int(r.items_sold),
      revenue: num(r.revenue),
    });
  }
  for (const r of liveToday) {
    const cur = byId.get(r.category_id);
    if (cur) {
      cur.ordersCount += int(r.orders_count);
      cur.itemsSold += int(r.items_sold);
      cur.revenue += num(r.revenue);
    } else {
      byId.set(r.category_id, {
        category: r.category_name,
        ordersCount: int(r.orders_count),
        itemsSold: int(r.items_sold),
        revenue: num(r.revenue),
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.revenue - a.revenue);
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
