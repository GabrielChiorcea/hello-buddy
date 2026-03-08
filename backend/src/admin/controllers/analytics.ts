/**
 * Controller analitice admin
 * Endpoint-uri pentru rapoarte avansate — citește din tabele pre-agregate
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import { query } from '../../config/database.js';

/**
 * GET /admin/analytics
 * Returnează toate datele analitice (mix live + pre-agregate)
 */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { period = '30d' } = req.query;

    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    if (period === '90d') daysBack = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - daysBack);

    // ===== SALES KPIs (live) =====
    const salesKpis = await query<any[]>(
      `SELECT
         COALESCE(SUM(o.total), 0) AS gross_revenue,
         COUNT(o.id) AS total_orders,
         COALESCE(AVG(o.total), 0) AS aov,
         COALESCE(SUM(o.delivery_fee), 0) AS total_delivery_fees
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ?`,
      [startDate]
    );

    const prevRevenue = await query<any[]>(
      `SELECT COALESCE(SUM(o.total), 0) AS gross_revenue
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ? AND o.created_at < ?`,
      [prevStart, startDate]
    );

    const currentGross = parseFloat(salesKpis[0]?.gross_revenue || '0');
    const previousGross = parseFloat(prevRevenue[0]?.gross_revenue || '0');
    const revenueGrowthRate = previousGross > 0
      ? ((currentGross - previousGross) / previousGross) * 100
      : currentGross > 0 ? 100 : 0;

    const totalOrders = parseInt(salesKpis[0]?.total_orders || '0', 10);
    const totalDeliveryFees = parseFloat(salesKpis[0]?.total_delivery_fees || '0');
    const aov = parseFloat(salesKpis[0]?.aov || '0');
    const netProfitPerOrder = totalOrders > 0
      ? (currentGross - totalDeliveryFees) / totalOrders
      : 0;

    // ===== CANCELLATION RATE =====
    const cancellationData = await query<any[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM orders WHERE created_at >= ?`,
      [startDate]
    );
    const totalAll = parseInt(cancellationData[0]?.total || '0', 10);
    const cancelledCount = parseInt(cancellationData[0]?.cancelled || '0', 10);
    const cancellationRate = totalAll > 0 ? (cancelledCount / totalAll) * 100 : 0;

    // ===== TOP CLIENȚI =====
    const topCustomers = await query<any[]>(
      `SELECT
         u.id, u.name,
         COUNT(o.id) AS orders_count,
         COALESCE(SUM(o.total), 0) AS total_spent,
         COALESCE(AVG(o.total), 0) AS avg_order,
         MAX(o.created_at) AS last_order_at
       FROM users u
       JOIN orders o ON o.user_id = u.id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY u.id ORDER BY total_spent DESC LIMIT 10`,
      [startDate]
    );

    // ===== PERECHI PRODUSE =====
    const productPairs = await query<any[]>(
      `SELECT a.product_name AS product_a, b.product_name AS product_b, COUNT(*) AS pair_count
       FROM order_items a
       JOIN order_items b ON a.order_id = b.order_id AND a.id < b.id
       JOIN orders o ON o.id = a.order_id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY a.product_name, b.product_name ORDER BY pair_count DESC LIMIT 10`,
      [startDate]
    );

    // ===== VENITURI PE CATEGORIE =====
    const revenueByCategory = await query<any[]>(
      `SELECT c.display_name AS category, COUNT(DISTINCT o.id) AS orders_count,
         SUM(oi.quantity) AS items_sold,
         COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS revenue
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY c.id, c.display_name ORDER BY revenue DESC`,
      [startDate]
    );

    // ===== FULFILLMENT =====
    const fulfillmentSplit = await query<any[]>(
      `SELECT YEARWEEK(o.created_at, 1) AS week_key, MIN(DATE(o.created_at)) AS week_start,
         SUM(CASE WHEN COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 ELSE 0 END) AS delivery_count,
         SUM(CASE WHEN o.fulfillment_type = 'in_location' THEN 1 ELSE 0 END) AS in_location_count,
         COUNT(*) AS total_count
       FROM orders o WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY week_key ORDER BY week_key ASC`,
      [startDate]
    );

    const fulfillmentTotals = await query<any[]>(
      `SELECT COALESCE(o.fulfillment_type, 'delivery') AS type, COUNT(*) AS count,
         COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY type`,
      [startDate]
    );

    // ===== ORARE DE VÂRF (live fallback) =====
    const peakHours = await query<any[]>(
      `SELECT HOUR(o.created_at) AS hour_of_day, COUNT(*) AS order_count,
         COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY HOUR(o.created_at) ORDER BY hour_of_day`,
      [startDate]
    );

    // ===== TREND VENITURI ZILNICE =====
    const dailyRevenueTrend = await query<any[]>(
      `SELECT DATE(o.created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY DATE(o.created_at) ORDER BY day ASC`,
      [startDate]
    );

    // ===== PUNCTE LOIALITATE =====
    const pointsStats = await query<any[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS total_earned,
         COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS total_spent,
         COUNT(CASE WHEN pt.type = 'spent' THEN 1 END) AS redemptions_count,
         COUNT(DISTINCT CASE WHEN pt.type = 'earned' THEN pt.user_id END) AS unique_earners,
         COUNT(DISTINCT CASE WHEN pt.type = 'spent' THEN pt.user_id END) AS unique_redeemers
       FROM points_transactions pt
       WHERE pt.created_at >= ?`,
      [startDate]
    );

    const totalEarned = parseInt(pointsStats[0]?.total_earned || '0', 10);
    const totalSpent = parseInt(pointsStats[0]?.total_spent || '0', 10);
    const redemptionRate = totalEarned > 0 ? (totalSpent / totalEarned) * 100 : 0;

    // Top earners
    const topPointsEarners = await query<any[]>(
      `SELECT u.id, u.name, u.points_balance,
         COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
         COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent
       FROM users u
       JOIN points_transactions pt ON pt.user_id = u.id
       WHERE pt.created_at >= ?
       GROUP BY u.id ORDER BY earned DESC LIMIT 10`,
      [startDate]
    );

    // AOV with vs without points
    const aovWithPoints = await query<any[]>(
      `SELECT
         COALESCE(AVG(CASE WHEN o.points_used > 0 THEN o.total END), 0) AS aov_with_points,
         COALESCE(AVG(CASE WHEN o.points_used = 0 THEN o.total END), 0) AS aov_without_points,
         COALESCE(SUM(o.discount_from_points), 0) AS total_discount
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ?`,
      [startDate]
    );

    // Points trend daily
    const pointsTrend = await query<any[]>(
      `SELECT DATE(pt.created_at) AS day,
         COALESCE(SUM(CASE WHEN pt.type = 'earned' THEN pt.amount ELSE 0 END), 0) AS earned,
         COALESCE(SUM(CASE WHEN pt.type = 'spent' THEN ABS(pt.amount) ELSE 0 END), 0) AS spent
       FROM points_transactions pt
       WHERE pt.created_at >= ?
       GROUP BY DATE(pt.created_at) ORDER BY day ASC`,
      [startDate]
    );

    // ===== CAMPANII STREAK =====
    const streakCampaigns = await query<any[]>(
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

    // ===== TIERS / RANGURI =====
    const tierDistribution = await query<any[]>(
      `SELECT
         COALESCE(lt.id, 'none') AS tier_id,
         COALESCE(lt.name, 'Fără nivel') AS tier_name,
         COALESCE(lt.sort_order, 0) AS sort_order,
         COALESCE(lt.points_multiplier, 1) AS multiplier,
         COUNT(DISTINCT u.id) AS user_count,
         COALESCE(SUM(CASE WHEN o.status != 'cancelled' AND o.created_at >= ? THEN o.total ELSE 0 END), 0) AS revenue,
         COUNT(CASE WHEN o.status != 'cancelled' AND o.created_at >= ? THEN o.id END) AS orders_count,
         COALESCE(AVG(CASE WHEN o.status != 'cancelled' AND o.created_at >= ? THEN o.total END), 0) AS avg_order
       FROM users u
       LEFT JOIN loyalty_tiers lt ON u.tier_id = lt.id
       LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY lt.id, lt.name, lt.sort_order, lt.points_multiplier
       ORDER BY sort_order ASC`,
      [startDate, startDate, startDate]
    );

    res.json({
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
      productPairs: productPairs.map(p => ({
        productA: p.product_a, productB: p.product_b, pairCount: p.pair_count,
      })),
      revenueByCategory: revenueByCategory.map(c => ({
        category: c.category, ordersCount: c.orders_count, itemsSold: c.items_sold,
        revenue: parseFloat(c.revenue),
      })),
      fulfillmentSplit: fulfillmentSplit.map(f => ({
        weekStart: f.week_start, delivery: f.delivery_count,
        inLocation: f.in_location_count, total: f.total_count,
      })),
      fulfillmentTotals: fulfillmentTotals.map(f => ({
        type: f.type, count: f.count, revenue: parseFloat(f.revenue),
      })),
      peakHours: peakHours.map(h => ({
        hour: h.hour_of_day, orders: h.order_count, revenue: parseFloat(h.revenue),
      })),
      dailyRevenueTrend: dailyRevenueTrend.map(d => ({
        day: d.day, orders: d.orders, revenue: parseFloat(d.revenue),
      })),
      // Points analytics
      pointsAnalytics: {
        totalEarned,
        totalSpent,
        redemptionRate: parseFloat(redemptionRate.toFixed(1)),
        redemptionsCount: parseInt(pointsStats[0]?.redemptions_count || '0', 10),
        uniqueEarners: parseInt(pointsStats[0]?.unique_earners || '0', 10),
        uniqueRedeemers: parseInt(pointsStats[0]?.unique_redeemers || '0', 10),
        aovWithPoints: parseFloat(aovWithPoints[0]?.aov_with_points || '0'),
        aovWithoutPoints: parseFloat(aovWithPoints[0]?.aov_without_points || '0'),
        totalDiscount: parseFloat(aovWithPoints[0]?.total_discount || '0'),
        topEarners: topPointsEarners.map(e => ({
          id: e.id, name: e.name, balance: e.points_balance,
          earned: parseInt(e.earned, 10), spent: parseInt(e.spent, 10),
        })),
        trend: pointsTrend.map(d => ({
          day: d.day, earned: parseInt(d.earned, 10), spent: parseInt(d.spent, 10),
        })),
      },
      // Streak analytics
      streakAnalytics: streakCampaigns.map(sc => ({
        id: sc.id, name: sc.name, ordersRequired: sc.orders_required,
        bonusPoints: sc.bonus_points, startDate: sc.start_date, endDate: sc.end_date,
        enrolled: sc.enrolled, completed: sc.completed, active: sc.active,
        avgStreak: parseFloat(parseFloat(sc.avg_streak).toFixed(1)),
        pointsAwarded: sc.points_awarded,
        completionRate: sc.enrolled > 0 ? parseFloat(((sc.completed / sc.enrolled) * 100).toFixed(1)) : 0,
      })),
      // Tier analytics
      tierAnalytics: tierDistribution.map(t => ({
        tierId: t.tier_id, tierName: t.tier_name, sortOrder: t.sort_order,
        multiplier: parseFloat(t.multiplier),
        userCount: parseInt(t.user_count, 10),
        revenue: parseFloat(t.revenue), ordersCount: parseInt(t.orders_count, 10),
        avgOrder: parseFloat(t.avg_order),
      })),
    });
  } catch (error) {
    logError('analitice', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/analytics/backfill
 * Populează tabelele pre-agregate pentru ultimele N zile (pentru prima dată)
 */
export async function backfillAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 90, 365);

    for (let i = days; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Daily sales
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
    }

    res.json({ message: `Backfill complet pentru ${days} zile` });
  } catch (error) {
    logError('analytics-backfill', error);
    res.status(500).json({ error: 'Eroare la backfill' });
  }
}
