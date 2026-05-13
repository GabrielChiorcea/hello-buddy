/**
 * Controller analitice admin — strictly din tabele pre-agregate (analytics_daily_* etc.)
 */

import { timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { analyticsQuery, pool } from '../../config/database.js';
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
  fetchTopCustomersHybrid,
  fetchPointsDistinctUsersHybrid,
  fetchTopPointsEarnersHybrid,
  fetchOrdersPointsInsightsHybrid,
  fetchStreakCampaignsRollup,
  fetchTierAnalyticsRollup,
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

function intFromDb(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseInt(v, 10) : Math.round(Number(v));
  return Number.isFinite(n) ? n : 0;
}

function formatAnalyticsDate(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

async function buildAnalyticsPayload(daysBack: number) {
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

  const topCustomersRows = await fetchTopCustomersHybrid(daysBack);

  const revenueByCategory = await fetchRevenueByCategoryHybrid(daysBack);

  const fulfillmentSplit = await fetchFulfillmentSplitHybrid(daysBack);
  const fulfillmentTotals = await fetchFulfillmentTotalsForPeriod(daysBack);
  const peakHours = await fetchPeakHoursHybrid(daysBack);
  const dailyRevenueTrend = await fetchDailyRevenueTrendHybrid(daysBack);

  const pointsTotals = await fetchPointsTotalsHybrid(daysBack);
  const totalEarned = pointsTotals.totalEarned;
  const totalSpent = pointsTotals.totalSpent;
  const redemptionRate = totalEarned > 0 ? (totalSpent / totalEarned) * 100 : 0;

  const distinctPointsUsers = await fetchPointsDistinctUsersHybrid(daysBack);

  const topPointsEarnersRows = await fetchTopPointsEarnersHybrid(daysBack);

  const ordersPointsInsights = await fetchOrdersPointsInsightsHybrid(daysBack);

  const pointsTrend = await fetchPointsTrendHybrid(daysBack);

  const streakCampaigns = await fetchStreakCampaignsRollup(daysBack);

  const tierDistribution = await fetchTierAnalyticsRollup(daysBack);

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
    topCustomers: topCustomersRows.map(c => ({
      id: c.id,
      name: c.name,
      ordersCount: intFromDb(c.orders_count),
      totalSpent: parseFloat(String(c.total_spent)),
      avgOrder: parseFloat(String(c.avg_order)),
      lastOrderAt: formatAnalyticsDate(c.last_day),
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
      uniqueEarners: distinctPointsUsers.uniqueEarners,
      uniqueRedeemers: distinctPointsUsers.uniqueRedeemers,
      aovWithPoints: parseFloat(ordersPointsInsights.aovWithPoints.toFixed(2)),
      aovWithoutPoints: parseFloat(ordersPointsInsights.aovWithoutPoints.toFixed(2)),
      totalDiscount: parseFloat(ordersPointsInsights.totalDiscount.toFixed(2)),
      topEarners: topPointsEarnersRows.map(e => ({
        id: e.id,
        name: e.name,
        balance: intFromDb(e.points_balance),
        earned: intFromDb(e.earned),
        spent: intFromDb(e.spent),
      })),
      trend: pointsTrend.map(d => ({
        day: d.day, earned: d.earned, spent: d.spent,
      })),
    },
    streakAnalytics: streakCampaigns.map(sc => ({
      id: sc.id,
      name: sc.name,
      ordersRequired: Number(sc.orders_required),
      bonusPoints: Number(sc.bonus_points),
      startDate: sc.start_date,
      endDate: sc.end_date,
      enrolled: intFromDb(sc.enrolled),
      completed: intFromDb(sc.completed),
      active: intFromDb(sc.active),
      avgStreak: parseFloat(parseFloat(String(sc.avg_streak)).toFixed(1)),
      pointsAwarded: intFromDb(sc.points_awarded),
      completionRate:
        intFromDb(sc.enrolled) > 0
          ? parseFloat(((intFromDb(sc.completed) / intFromDb(sc.enrolled)) * 100).toFixed(1))
          : 0,
    })),
    tierAnalytics: tierDistribution.map(t => ({
      tierId: t.tier_id,
      tierName: t.tier_name,
      sortOrder: intFromDb(t.sort_order),
      multiplier: parseFloat(String(t.multiplier)),
      userCount: intFromDb(t.user_count),
      revenue: parseFloat(String(t.revenue)),
      ordersCount: intFromDb(t.orders_count),
      avgOrder: parseFloat(String(t.avg_order)),
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
    const rows = await withTimeout(fetchProductPairs(daysBack), env.ANALYTICS_REQUEST_TIMEOUT_MS);
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
 * Verifică acoperirea rollup pe aceeași fereastră ca KPI-urile din analyticsHybrid.ts:
 * INTERVAL firstDayIntervalDays(daysBack); include și ziua curentă dacă cron a scris rând pentru azi.
 * `note` explică cazuri în care „lipsa” nu înseamnă neapărat cron defect.
 */
async function rollupDayCoverage(
  daysBack: number,
  table:
    | 'analytics_daily_sales'
    | 'analytics_daily_points'
    | 'analytics_daily_streaks'
    | 'analytics_daily_product_pairs',
  expectedDates: string[]
): Promise<{ missingDates: string[]; presentCount: number; lastPresentDate: string | null; note?: string }> {
  const off = firstDayIntervalDays(daysBack);
  const presentRows = await analyticsQuery<{ report_date: Date | string }[]>(
    `SELECT DISTINCT report_date
     FROM ${table}
     WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY report_date ASC`,
    [off]
  );

  const present = new Set(presentRows.map(r => formatHealthDate(r.report_date)));
  const missingDates = expectedDates.filter(d => !present.has(d));

  let lastPresentDate: string | null = null;
  if (presentRows.length > 0) {
    lastPresentDate = formatHealthDate(presentRows[presentRows.length - 1].report_date);
  }

  const base = { missingDates, presentCount: present.size, lastPresentDate };
  if (table === 'analytics_daily_product_pairs') {
    return {
      ...base,
      note:
        'O zi poate lipsi din tabel dacă nu s-au putut forma perechi de produse în comenzi; compară cu analytics_daily_sales pentru aceeași dată.',
    };
  }
  if (table === 'analytics_daily_streaks') {
    return {
      ...base,
      note:
        'Dacă nu există campanii streak în baza de date, snapshot-ul zilnic poate fi gol chiar cu cron corect.',
    };
  }
  return base;
}

/** Zile consecutive de la DATE_SUB(off) până la azi inclusiv — aceeași fereastră ca interogările rollup din hybrid. */
async function buildExpectedAnalyticsWindowDates(daysBack: number): Promise<string[]> {
  const off = firstDayIntervalDays(daysBack);
  const out: string[] = [];
  for (let k = off; k >= 0; k--) {
    const dr = await analyticsQuery<{ d: Date | string }[]>(
      `SELECT DATE_SUB(CURDATE(), INTERVAL ? DAY) AS d`,
      [k]
    );
    out.push(formatHealthDate(dr[0]?.d));
  }
  return out;
}

/**
 * GET /admin/analytics/rollup-health?days=7
 * Verifică acoperirea pe zile pentru tabelele rollup folosite de /admin/analytics.
 * Parametrul `days` folosește aceeași semantica ca `period` pe GET /admin/analytics (N zile încheiate cu azi inclusiv).
 * Câmpurile de nivel rădăcină (missingDates, presentCount, lastPresentDate) rămân cele pentru vânzări (compat).
 */
export async function getAnalyticsRollupHealth(req: Request, res: Response): Promise<void> {
  try {
    const days = Math.min(Math.max(parseInt(String(req.query.days || '7'), 10) || 7, 1), 90);

    const expectedDates = await buildExpectedAnalyticsWindowDates(days);

    const [sales, points, streaks, productPairs] = await Promise.all([
      rollupDayCoverage(days, 'analytics_daily_sales', expectedDates),
      rollupDayCoverage(days, 'analytics_daily_points', expectedDates),
      rollupDayCoverage(days, 'analytics_daily_streaks', expectedDates),
      rollupDayCoverage(days, 'analytics_daily_product_pairs', expectedDates),
    ]);

    res.json({
      daysChecked: days,
      expectedCount: days,
      missingDates: sales.missingDates,
      presentCount: sales.presentCount,
      lastPresentDate: sales.lastPresentDate,
      rollups: {
        analytics_daily_sales: sales,
        analytics_daily_points: points,
        analytics_daily_streaks: streaks,
        analytics_daily_product_pairs: productPairs,
      },
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
 * GET /admin/analytics/run-daily-rollup?days=1
 * Secret: header `X-Cron-Secret`, sau `Authorization: Bearer <secret>`, sau `?secret=` (ultimul poate apărea în loguri).
 */
export async function getRunDailyAnalyticsRollup(req: Request, res: Response): Promise<void> {
  const cronSecret = env.ANALYTICS_CRON_SECRET;
  if (!cronSecret) {
    res.status(503).json({ error: 'Agregarea programată este dezactivată (lipsește ANALYTICS_CRON_SECRET).' });
    return;
  }

  const fromHeader =
    typeof req.headers['x-cron-secret'] === 'string' ? req.headers['x-cron-secret'].trim() : '';
  const auth = typeof req.headers.authorization === 'string' ? req.headers.authorization.trim() : '';
  const bearer = /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '').trim() : '';
  const fromQuery = typeof req.query.secret === 'string' ? req.query.secret.trim() : '';
  const provided = fromHeader || bearer || fromQuery;

  const safeEquals = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
      return false;
    }
  };

  if (!provided || !safeEquals(provided, cronSecret)) {
    res.status(401).json({ error: 'Neautorizat' });
    return;
  }

  const parsed = parseInt(String(req.query.days ?? '1'), 10);
  const days = Math.min(365, Math.max(1, Number.isFinite(parsed) ? parsed : 1));

  const t0 = Date.now();
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('CALL sp_backfill_analytics(?)', [days]);
    } finally {
      conn.release();
    }
    const ms = Date.now() - t0;
    logger.info({ msg: 'analytics_run_daily_rollup', durationMs: ms, days });
    res.json({ ok: true, days, durationMs: ms });
  } catch (error) {
    logError('analytics-run-daily-rollup', error);
    res.status(500).json({ error: 'Eroare la rularea agregărilor' });
  }
}
