/**
 * Controller analitice admin — mix rollup + live, limite, cache, timeout
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { query, analyticsQuery } from '../../config/database.js';
import {
  fetchDailyRevenueTrendHybrid,
  fetchFulfillmentSplitHybrid,
  fetchFulfillmentTotalsForPeriod,
  fetchPeakHoursHybrid,
  fetchPointsTotalsHybrid,
  fetchPointsTrendHybrid,
  fetchPrevPeriodGrossRevenue,
  fetchProductPairs,
  fetchRevenueByCategoryHybrid,
  fetchSalesKpisHybrid,
  firstDayIntervalDays,
} from '../../services/analyticsHybrid.js';
import { getAnalyticsCacheJson, setAnalyticsCacheJson } from '../../services/analyticsCache.js';

function resolveAnalyticsDays(period: unknown): number {
  const p = typeof period === 'string' ? period : '30d';
  let d: number;
  if (p === '7d') d = 7;
  else if (p === '30d') d = 30;
  else if (p === '90d') d = 90;
  else throw Object.assign(new Error('Perioadă analitică invalidă (folosiți 7d, 30d sau 90d).'), { status: 400 });
  return Math.min(d, env.ANALYTICS_MAX_PERIOD_DAYS);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(Object.assign(new Error('Timeout analitice'), { code: 'ANALYTICS_TIMEOUT' })),
      ms
    );
    promise.then(
      v => {
        clearTimeout(t);
        resolve(v);
      },
      e => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function buildAnalyticsPayload(daysBack: number) {
  const off = firstDayIntervalDays(daysBack);

  const salesMix = await fetchSalesKpisHybrid(daysBack);
  const previousGross = await fetchPrevPeriodGrossRevenue(daysBack);

  const currentGross = salesMix.grossRevenue;
  const revenueGrowthRate = previousGross > 0
    ? ((currentGross - previousGross) / previousGross) * 100
    : currentGross > 0 ? 100 : 0;

  const totalOrders = salesMix.totalOrders;
  const totalDeliveryFees = salesMix.totalDeliveryFees;
  const aov = salesMix.aov;
  const netProfitPerOrder = totalOrders > 0
    ? (currentGross - totalDeliveryFees) / totalOrders
    : 0;

  const totalAll = salesMix.cancellationTotalAll;
  const cancelledCount = salesMix.cancelledOrders;
  const cancellationRate = totalAll > 0 ? (cancelledCount / totalAll) * 100 : 0;

  const topCustomers = await analyticsQuery<any[]>(
    `SELECT
       u.id, u.name,
       COUNT(o.id) AS orders_count,
       COALESCE(SUM(o.total), 0) AS total_spent,
       COALESCE(AVG(o.total), 0) AS avg_order,
       MAX(o.created_at) AS last_order_at
     FROM users u
     JOIN orders o ON o.user_id = u.id
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
     GROUP BY u.id ORDER BY total_spent DESC LIMIT 10`,
    [off]
  );

  const revenueByCategory = await fetchRevenueByCategoryHybrid(daysBack);

  const fulfillmentSplit = await fetchFulfillmentSplitHybrid(daysBack);
  const fulfillmentTotals = await fetchFulfillmentTotalsForPeriod(daysBack);
  const peakHours = await fetchPeakHoursHybrid(daysBack);
  const dailyRevenueTrend = await fetchDailyRevenueTrendHybrid(daysBack);

  const pointsTotals = await fetchPointsTotalsHybrid(daysBack);
  const totalEarned = pointsTotals.totalEarned;
  const totalSpent = pointsTotals.totalSpent;
  const redemptionRate = totalEarned > 0 ? (totalSpent / totalEarned) * 100 : 0;

  const pointsStatsExtras = await analyticsQuery<any[]>(
    `SELECT
       COUNT(DISTINCT CASE WHEN pt.type = 'earned' THEN pt.user_id END) AS unique_earners,
       COUNT(DISTINCT CASE WHEN pt.type = 'spent' THEN pt.user_id END) AS unique_redeemers
     FROM points_transactions pt
     WHERE pt.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')`,
    [off]
  );

  const topPointsEarners = await analyticsQuery<any[]>(
    `SELECT u.id, u.name, u.points_balance,
       COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
       COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent
     FROM users u
     JOIN points_transactions pt ON pt.user_id = u.id
     WHERE pt.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')
     GROUP BY u.id ORDER BY earned DESC LIMIT 10`,
    [off]
  );

  const aovWithPoints = await analyticsQuery<any[]>(
    `SELECT
       COALESCE(AVG(CASE WHEN o.points_used > 0 THEN o.total END), 0) AS aov_with_points,
       COALESCE(AVG(CASE WHEN o.points_used = 0 THEN o.total END), 0) AS aov_without_points,
       COALESCE(SUM(o.discount_from_points), 0) AS total_discount
     FROM orders o
     WHERE o.status != 'cancelled'
       AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00')`,
    [off]
  );

  const pointsTrend = await fetchPointsTrendHybrid(daysBack);

  const streakCampaigns = await analyticsQuery<any[]>(
    `SELECT
       sc.id, sc.name, sc.orders_required, sc.bonus_points,
       sc.start_date, sc.end_date,
       COUNT(DISTINCT usc.id) AS enrolled,
       COUNT(DISTINCT CASE WHEN usc.completed_at IS NOT NULL THEN usc.id END) AS completed,
       COUNT(DISTINCT CASE WHEN usc.completed_at IS NULL AND usc.current_streak_count > 0 THEN usc.id END) AS active,
       COALESCE(AVG(usc.current_streak_count), 0) AS avg_streak,
       COALESCE(SUM(CASE WHEN usc.bonus_awarded_at IS NOT NULL THEN sc.bonus_points ELSE 0 END), 0) AS points_awarded
     FROM streak_campaigns sc
     LEFT JOIN user_streak_campaigns usc ON usc.campaign_id = sc.id
     GROUP BY sc.id
     ORDER BY sc.start_date DESC LIMIT 10`
  );

  const tierDistribution = await analyticsQuery<any[]>(
    `SELECT
       COALESCE(lt.id, 'none') AS tier_id,
       COALESCE(lt.name, 'Fără nivel') AS tier_name,
       COALESCE(lt.sort_order, 0) AS sort_order,
       COALESCE(lt.points_multiplier, 1) AS multiplier,
       COUNT(DISTINCT u.id) AS user_count,
       COALESCE(SUM(CASE WHEN o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00') THEN o.total ELSE 0 END), 0) AS revenue,
       COUNT(CASE WHEN o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00') THEN o.id END) AS orders_count,
       COALESCE(AVG(CASE WHEN o.status != 'cancelled'
         AND o.created_at >= CONCAT(DATE_SUB(CURDATE(), INTERVAL ? DAY), ' 00:00:00') THEN o.total END), 0) AS avg_order
     FROM users u
     LEFT JOIN loyalty_tiers lt ON u.tier_id = lt.id
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY lt.id, lt.name, lt.sort_order, lt.points_multiplier
     ORDER BY sort_order ASC`,
    [off, off, off]
  );

  return {
    period: `${daysBack}d`,
    salesKpis: {
      grossRevenue: currentGross,
      totalOrders,
      aov,
      netProfitPerOrder,
      revenueGrowthRate: parseFloat(revenueGrowthRate.toFixed(1)),
      totalDeliveryFees,
      cancellationRate: parseFloat(cancellationRate.toFixed(1)),
      cancelledOrders: cancelledCount,
    },
    topCustomers: topCustomers.map(c => ({
      id: c.id, name: c.name, ordersCount: c.orders_count,
      totalSpent: parseFloat(c.total_spent), avgOrder: parseFloat(c.avg_order),
      lastOrderAt: c.last_order_at,
    })),
    revenueByCategory: revenueByCategory.map(c => ({
      category: c.category, ordersCount: c.ordersCount, itemsSold: c.itemsSold,
      revenue: c.revenue,
    })),
    fulfillmentSplit: fulfillmentSplit.map(f => ({
      weekStart: f.week_start, delivery: f.delivery_count,
      inLocation: f.in_location_count, total: f.total_count,
    })),
    fulfillmentTotals: fulfillmentTotals.map(f => ({
      type: f.type,
      count: parseInt(String(f.count), 10),
      revenue: parseFloat(String(f.revenue)),
    })),
    peakHours: peakHours.map(h => ({
      hour: h.hour_of_day, orders: h.order_count, revenue: h.revenue,
    })),
    dailyRevenueTrend: dailyRevenueTrend.map(d => ({
      day: d.day, orders: d.orders, revenue: d.revenue,
    })),
    pointsAnalytics: {
      totalEarned,
      totalSpent,
      redemptionRate: parseFloat(redemptionRate.toFixed(1)),
      redemptionsCount: pointsTotals.redemptionsCount,
      uniqueEarners: parseInt(pointsStatsExtras[0]?.unique_earners || '0', 10),
      uniqueRedeemers: parseInt(pointsStatsExtras[0]?.unique_redeemers || '0', 10),
      aovWithPoints: parseFloat(aovWithPoints[0]?.aov_with_points || '0'),
      aovWithoutPoints: parseFloat(aovWithPoints[0]?.aov_without_points || '0'),
      totalDiscount: parseFloat(aovWithPoints[0]?.total_discount || '0'),
      topEarners: topPointsEarners.map(e => ({
        id: e.id, name: e.name, balance: e.points_balance,
        earned: parseInt(String(e.earned), 10), spent: parseInt(String(e.spent), 10),
      })),
      trend: pointsTrend.map(d => ({
        day: d.day, earned: d.earned, spent: d.spent,
      })),
    },
    streakAnalytics: streakCampaigns.map(sc => ({
      id: sc.id, name: sc.name, ordersRequired: sc.orders_required,
      bonusPoints: sc.bonus_points, startDate: sc.start_date, endDate: sc.end_date,
      enrolled: sc.enrolled, completed: sc.completed, active: sc.active,
      avgStreak: parseFloat(parseFloat(sc.avg_streak).toFixed(1)),
      pointsAwarded: sc.points_awarded,
      completionRate: sc.enrolled > 0 ? parseFloat(((sc.completed / sc.enrolled) * 100).toFixed(1)) : 0,
    })),
    tierAnalytics: tierDistribution.map(t => ({
      tierId: t.tier_id, tierName: t.tier_name, sortOrder: t.sort_order,
      multiplier: parseFloat(t.multiplier),
      userCount: parseInt(t.user_count, 10),
      revenue: parseFloat(t.revenue), ordersCount: parseInt(t.orders_count, 10),
      avgOrder: parseFloat(t.avg_order),
    })),
  };
}

/**
 * GET /admin/analytics
 */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const t0 = Date.now();
  let cacheHit = false;
  try {
    let daysBack: number;
    try {
      daysBack = resolveAnalyticsDays(req.query.period);
    } catch (e) {
      const err = e as { status?: number };
      res.status(typeof err.status === 'number' ? err.status : 400).json({ error: (e as Error).message });
      return;
    }

    const cacheKey = `v1:${daysBack}`;
    if (env.ANALYTICS_CACHE_TTL_SECONDS > 0) {
      const cached = await getAnalyticsCacheJson(cacheKey);
      if (cached) {
        cacheHit = true;
        const ms = Date.now() - t0;
        logger.info({ msg: 'analytics_request', durationMs: ms, period: `${daysBack}d`, cacheHit: true });
        res.json(cached);
        return;
      }
    }

    const payload = await withTimeout(buildAnalyticsPayload(daysBack), env.ANALYTICS_REQUEST_TIMEOUT_MS);
    if (env.ANALYTICS_CACHE_TTL_SECONDS > 0) {
      await setAnalyticsCacheJson(cacheKey, payload);
    }
    const ms = Date.now() - t0;
    logger.info({ msg: 'analytics_request', durationMs: ms, period: `${daysBack}d`, cacheHit: false });
    res.json(payload);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'ANALYTICS_TIMEOUT') {
      const ms = Date.now() - t0;
      logger.warn({ msg: 'analytics_timeout', durationMs: ms, cacheHit });
      res.status(503).json({ error: 'Raportul analitic a depășit timpul limită. Încercați o perioadă mai scurtă.' });
      return;
    }
    logError('analitice', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/analytics/product-pairs
 */
export async function getAnalyticsProductPairs(req: Request, res: Response): Promise<void> {
  const t0 = Date.now();
  try {
    let daysBack: number;
    try {
      daysBack = resolveAnalyticsDays(req.query.period);
    } catch (e) {
      const err = e as { status?: number };
      res.status(typeof err.status === 'number' ? err.status : 400).json({ error: (e as Error).message });
      return;
    }
    const off = firstDayIntervalDays(daysBack);
    const rows = await withTimeout(fetchProductPairs(off), env.ANALYTICS_REQUEST_TIMEOUT_MS);
    const ms = Date.now() - t0;
    logger.info({ msg: 'analytics_product_pairs', durationMs: ms, period: `${daysBack}d` });
    res.json({
      productPairs: rows.map(p => ({
        productA: p.product_a,
        productB: p.product_b,
        pairCount: p.pair_count,
      })),
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'ANALYTICS_TIMEOUT') {
      res.status(503).json({ error: 'Timeout la încărcarea perechilor de produse.' });
      return;
    }
    logError('analytics-product-pairs', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/analytics/rollup-health?days=7
 */
export async function getAnalyticsRollupHealth(req: Request, res: Response): Promise<void> {
  try {
    const days = Math.min(Math.max(parseInt(String(req.query.days || '7'), 10) || 7, 1), 90);

    const presentRows = await analyticsQuery<{ report_date: Date | string }[]>(
      `SELECT DISTINCT report_date
       FROM analytics_daily_sales
       WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND report_date < CURDATE()
       ORDER BY report_date ASC`,
      [days]
    );

    const present = new Set(presentRows.map(r => formatHealthDate(r.report_date)));
    const missingDates: string[] = [];
    for (let i = days; i >= 1; i--) {
      const dr = await analyticsQuery<{ d: Date | string }[]>(
        `SELECT DATE_SUB(CURDATE(), INTERVAL ? DAY) AS d`,
        [i]
      );
      const ds = formatHealthDate(dr[0]?.d);
      if (!present.has(ds)) missingDates.push(ds);
    }

    let lastPresentDate: string | null = null;
    if (presentRows.length > 0) {
      lastPresentDate = formatHealthDate(presentRows[presentRows.length - 1].report_date);
    }

    res.json({
      daysChecked: days,
      presentCount: present.size,
      expectedCount: days,
      missingDates,
      lastPresentDate,
    });
  } catch (error) {
    logError('analytics-rollup-health', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

function formatHealthDate(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * GET /admin/analytics/backfill
 */
export async function backfillAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const maxDays = Math.min(parseInt(req.query.days as string) || 90, 365);

    for (let i = maxDays; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      await query(
        `INSERT INTO analytics_daily_sales (
          report_date, total_orders, cancelled_orders, gross_revenue, net_revenue,
          total_delivery_fees, avg_order_value, unique_customers, new_customers,
          delivery_count, in_location_count
        )
        SELECT
          ?, COUNT(CASE WHEN o.status != 'cancelled' THEN 1 END),
          COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END),
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total - o.delivery_fee ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.delivery_fee ELSE 0 END), 0),
          COALESCE(AVG(CASE WHEN o.status != 'cancelled' THEN o.total END), 0),
          COUNT(DISTINCT CASE WHEN o.status != 'cancelled' THEN o.user_id END),
          (SELECT COUNT(*) FROM users u2 WHERE DATE(u2.created_at) = ?),
          COUNT(CASE WHEN o.status != 'cancelled' AND COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 END),
          COUNT(CASE WHEN o.status != 'cancelled' AND o.fulfillment_type = 'in_location' THEN 1 END)
        FROM orders o WHERE DATE(o.created_at) = ?
        ON DUPLICATE KEY UPDATE
          total_orders = VALUES(total_orders), gross_revenue = VALUES(gross_revenue)`,
        [dateStr, dateStr, dateStr]
      );

      await query(
        `DELETE FROM analytics_daily_category WHERE report_date = ?`,
        [dateStr]
      );
      await query(
        `INSERT INTO analytics_daily_category (
          report_date, category_id, category_name, orders_count, items_sold, revenue
        )
        SELECT
          ?, c.id, c.display_name,
          COUNT(DISTINCT o.id),
          COALESCE(SUM(oi.quantity), 0),
          COALESCE(SUM(oi.quantity * oi.price_at_order), 0)
        FROM categories c
        INNER JOIN products p ON c.id = p.category_id
        INNER JOIN order_items oi ON p.id = oi.product_id
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled' AND DATE(o.created_at) = ?
        GROUP BY c.id, c.display_name`,
        [dateStr, dateStr]
      );
    }

    res.json({ message: `Backfill complet pentru ${maxDays} zile` });
  } catch (error) {
    logError('analytics-backfill', error);
    res.status(500).json({ error: 'Eroare la backfill' });
  }
}
