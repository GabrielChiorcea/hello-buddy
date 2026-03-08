/**
 * Controller analitice admin
 * Endpoint-uri pentru rapoarte avansate
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import { query } from '../../config/database.js';

/**
 * GET /admin/analytics
 * Returnează toate datele analitice
 */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { period = '30d' } = req.query;

    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    if (period === '90d') daysBack = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // 1) Top clienți fideli
    const topCustomers = await query<any[]>(
      `SELECT
         u.id,
         u.name,
         COUNT(o.id) AS orders_count,
         COALESCE(SUM(o.total), 0) AS total_spent,
         COALESCE(AVG(o.total), 0) AS avg_order,
         MAX(o.created_at) AS last_order_at
       FROM users u
       JOIN orders o ON o.user_id = u.id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY u.id
       ORDER BY total_spent DESC
       LIMIT 10`,
      [startDate]
    );

    // 2) Produse frecvent comandate împreună (perechi)
    const productPairs = await query<any[]>(
      `SELECT
         a.product_name AS product_a,
         b.product_name AS product_b,
         COUNT(*) AS pair_count
       FROM order_items a
       JOIN order_items b ON a.order_id = b.order_id AND a.id < b.id
       JOIN orders o ON o.id = a.order_id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY a.product_name, b.product_name
       ORDER BY pair_count DESC
       LIMIT 10`,
      [startDate]
    );

    // 3) Venituri pe categorie
    const revenueByCategory = await query<any[]>(
      `SELECT
         c.display_name AS category,
         COUNT(DISTINCT o.id) AS orders_count,
         SUM(oi.quantity) AS items_sold,
         COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS revenue
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY c.id, c.display_name
       ORDER BY revenue DESC`,
      [startDate]
    );

    // 4) Fulfillment split (livrare vs în locație) — trend pe săptămâni
    const fulfillmentSplit = await query<any[]>(
      `SELECT
         YEARWEEK(o.created_at, 1) AS week_key,
         MIN(DATE(o.created_at)) AS week_start,
         SUM(CASE WHEN COALESCE(o.fulfillment_type, 'delivery') = 'delivery' THEN 1 ELSE 0 END) AS delivery_count,
         SUM(CASE WHEN o.fulfillment_type = 'in_location' THEN 1 ELSE 0 END) AS in_location_count,
         COUNT(*) AS total_count
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY week_key
       ORDER BY week_key ASC`,
      [startDate]
    );

    // 4b) Fulfillment totals
    const fulfillmentTotals = await query<any[]>(
      `SELECT
         COALESCE(o.fulfillment_type, 'delivery') AS type,
         COUNT(*) AS count,
         COALESCE(SUM(o.total), 0) AS revenue
       FROM orders o
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY type`,
      [startDate]
    );

    res.json({
      period: `${daysBack}d`,
      topCustomers: topCustomers.map(c => ({
        id: c.id,
        name: c.name,
        ordersCount: c.orders_count,
        totalSpent: parseFloat(c.total_spent),
        avgOrder: parseFloat(c.avg_order),
        lastOrderAt: c.last_order_at,
      })),
      productPairs: productPairs.map(p => ({
        productA: p.product_a,
        productB: p.product_b,
        pairCount: p.pair_count,
      })),
      revenueByCategory: revenueByCategory.map(c => ({
        category: c.category,
        ordersCount: c.orders_count,
        itemsSold: c.items_sold,
        revenue: parseFloat(c.revenue),
      })),
      fulfillmentSplit: fulfillmentSplit.map(f => ({
        weekStart: f.week_start,
        delivery: f.delivery_count,
        inLocation: f.in_location_count,
        total: f.total_count,
      })),
      fulfillmentTotals: fulfillmentTotals.map(f => ({
        type: f.type,
        count: f.count,
        revenue: parseFloat(f.revenue),
      })),
    });
  } catch (error) {
    logError('analitice', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
