/**
 * Controller dashboard admin
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import { query, queryOne } from '../../config/database.js';
import * as OrderModel from '../../models/Order.js';

/**
 * GET /admin/dashboard
 * Returnează datele pentru dashboard
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    // Statistici azi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await queryOne<{
      orders_count: number;
      revenue: string;
    }>(
      `SELECT 
         COUNT(*) as orders_count,
         COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE created_at >= ? AND status != 'cancelled'`,
      [today]
    );
    
    // Utilizatori noi azi
    const newUsersToday = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= ?',
      [today]
    );
    
    // Statistici săptămână
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekStats = await queryOne<{
      orders_count: number;
      revenue: string;
    }>(
      `SELECT 
         COUNT(*) as orders_count,
         COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE created_at >= ? AND status != 'cancelled'`,
      [weekAgo]
    );
    
    // Comenzi recente
    const recentOrders = await query<any[]>(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );
    
    // Top produse
    const topProducts = await query<any[]>(
      `SELECT 
         p.id, p.name, p.image, p.price,
         COUNT(oi.id) as orders_count,
         SUM(oi.quantity) as total_quantity
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled' AND o.created_at >= ?
       GROUP BY p.id
       ORDER BY orders_count DESC
       LIMIT 5`,
      [weekAgo]
    );
    
    // Comenzi pe status
    const ordersByStatus = await OrderModel.getStats();
    
    // Produse indisponibile
    const unavailableProducts = await query<any[]>(
      'SELECT id, name, image FROM products WHERE is_available = FALSE LIMIT 5'
    );
    
    // Statistici lună curentă
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthStats = await queryOne<{
      orders_count: number;
      revenue: string;
    }>(
      `SELECT 
         COUNT(*) as orders_count,
         COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE created_at >= ? AND status != 'cancelled'`,
      [monthStart]
    );
    
    // Date pentru grafic vânzări ultimele 7 zile
    const salesChart = await query<{ date: string; revenue: string; orders: number }[]>(
      `SELECT 
         DATE(created_at) as date,
         COALESCE(SUM(total), 0) as revenue,
         COUNT(*) as orders
       FROM orders
       WHERE created_at >= ? AND status != 'cancelled'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [weekAgo]
    );
    
    res.json({
      stats: {
        today: {
          orders: todayStats?.orders_count || 0,
          revenue: parseFloat(todayStats?.revenue || '0'),
          newUsers: newUsersToday?.count || 0,
        },
        thisWeek: {
          orders: weekStats?.orders_count || 0,
          revenue: parseFloat(weekStats?.revenue || '0'),
        },
        thisMonth: {
          orders: monthStats?.orders_count || 0,
          revenue: parseFloat(monthStats?.revenue || '0'),
        },
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customer: {
          id: o.user_id,
          name: o.customer_name,
        },
        total: parseFloat(o.total),
        status: o.status,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
      })),
      topProducts: topProducts.map(p => ({
        product: {
          id: p.id,
          name: p.name,
          image: p.image,
          price: parseFloat(p.price),
        },
        ordersCount: p.orders_count,
        totalQuantity: p.total_quantity,
      })),
      ordersByStatus: ordersByStatus.ordersByStatus,
      salesChart: salesChart.map(s => ({
        date: s.date,
        revenue: parseFloat(s.revenue),
        orders: s.orders,
      })),
      unavailableProducts,
    });
  } catch (error) {
    logError('dashboard', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/dashboard/stats
 * Statistici detaliate pentru grafice
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const { period = '7d' } = req.query;
    
    let daysBack = 7;
    if (period === '30d') daysBack = 30;
    if (period === '90d') daysBack = 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Vânzări pe zile
    const dailySales = await query<any[]>(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as orders,
         COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE created_at >= ? AND status != 'cancelled'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate]
    );
    
    // Comenzi pe oră (pentru azi)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hourlyOrders = await query<any[]>(
      `SELECT 
         HOUR(created_at) as hour,
         COUNT(*) as orders
       FROM orders
       WHERE created_at >= ?
       GROUP BY HOUR(created_at)
       ORDER BY hour ASC`,
      [today]
    );
    
    // Distribuție pe categorii
    const categoryDistribution = await query<any[]>(
      `SELECT 
         c.display_name as category,
         COUNT(oi.id) as orders_count,
         SUM(oi.quantity * oi.price_at_order) as revenue
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= ? AND o.status != 'cancelled'
       GROUP BY c.id
       ORDER BY revenue DESC`,
      [startDate]
    );
    
    res.json({
      dailySales: dailySales.map(d => ({
        date: d.date,
        orders: d.orders,
        revenue: parseFloat(d.revenue),
      })),
      hourlyOrders: hourlyOrders.map(h => ({
        hour: h.hour,
        orders: h.orders,
      })),
      categoryDistribution: categoryDistribution.map(c => ({
        category: c.category,
        ordersCount: c.orders_count,
        revenue: parseFloat(c.revenue || '0'),
      })),
    });
  } catch (error) {
    logError('statistici', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
