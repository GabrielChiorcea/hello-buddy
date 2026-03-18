/**
 * Controller comenzi admin
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import * as OrderModel from '../../models/Order.js';
import { query } from '../../config/database.js';
import { pointsPlugin } from '../../plugins/points/index.js';
import { streakPlugin } from '../../plugins/streak/index.js';
import { tiersPlugin } from '../../plugins/tiers/index.js';

/**
 * GET /admin/orders
 * Listează comenzile cu filtre
 */
export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      fulfillmentType,
      dateFrom,
      dateTo,
    } = req.query;
    
    const { orders, total } = await OrderModel.findAll({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as OrderModel.OrderStatus,
      fulfillmentType: fulfillmentType as OrderModel.FulfillmentType | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });
    
    // Obține informații despre utilizatori (inclusiv tier/rank)
    const userIds = [...new Set(orders.map(o => o.userId))];
    let usersMap: Map<string, { name: string; email: string; tierName: string | null }> = new Map();
    
    if (userIds.length > 0) {
      const users = await query<{ id: string; name: string; email: string; tier_name: string | null }[]>(
        `SELECT u.id, u.name, u.email, lt.name as tier_name
         FROM users u
         LEFT JOIN loyalty_tiers lt ON u.tier_id = lt.id
         WHERE u.id IN (${userIds.map(() => '?').join(',')})`,
        userIds
      );
      users.forEach(u => usersMap.set(u.id, { name: u.name, email: u.email, tierName: u.tier_name }));
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    res.json({
      orders: orders.map(o => ({
        ...o,
        customer: {
          id: o.userId,
          ...usersMap.get(o.userId),
        },
        itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logError('listare comenzi', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/orders/:id
 * Detalii comandă
 */
export async function getOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);
    
    if (!order) {
      res.status(404).json({ error: 'Comanda nu a fost găsită' });
      return;
    }
    
    // Obține informații utilizator (inclusiv tier/rank)
    const users = await query<{ id: string; name: string; email: string; phone: string; tier_name: string | null }[]>(
      `SELECT u.id, u.name, u.email, u.phone, lt.name as tier_name
       FROM users u
       LEFT JOIN loyalty_tiers lt ON u.tier_id = lt.id
       WHERE u.id = ?`,
      [order.userId]
    );
    const user = users[0];
    
    // Obține istoricul statusurilor
    const statusHistory = await query<any[]>(
      `SELECT osh.*, u.name as changed_by_name
       FROM order_status_history osh
       LEFT JOIN users u ON osh.changed_by = u.id
       WHERE osh.order_id = ?
       ORDER BY osh.created_at ASC`,
      [id]
    );
    
    res.json({
      ...order,
      customer: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        tierName: user.tier_name,
      } : null,
      statusHistory: statusHistory.map(sh => ({
        status: sh.status,
        changedBy: sh.changed_by_name,
        notes: sh.notes,
        createdAt: sh.created_at,
      })),
    });
  } catch (error) {
    logError('detalii comandă', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/orders/:id/status
 * Actualizează statusul comenzii
 */
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses: OrderModel.OrderStatus[] = [
      'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Status invalid' });
      return;
    }
    
    const order = await OrderModel.updateStatus(
      id,
      status,
      req.user?.id,
      notes
    );

    if (!order) {
      res.status(404).json({ error: 'Comanda nu a fost găsită' });
      return;
    }

    if (status === 'delivered') {
      // 1) XP & niveluri (tiers)
      await tiersPlugin.hooks.onOrderDelivered(id, {
        userId: order.userId,
        total: order.total,
      });
      // 2) Puncte loialitate
      await pointsPlugin.hooks.onOrderDelivered(id, {
        userId: order.userId,
        total: order.total,
        pointsEarned: order.pointsEarned,
      });
      // 3) Campanii streak (folosim deliveredAt pentru ziua care contează la streak)
      await streakPlugin.hooks.onOrderDelivered(id, {
        userId: order.userId,
        total: order.total,
        pointsEarned: order.pointsEarned,
        deliveredAt: order.deliveredAt ?? undefined,
      });
    }

    const updatedOrder = await OrderModel.findById(id);
    res.json(updatedOrder ?? order);
  } catch (error) {
    logError('actualizare status comandă', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/orders/:id
 * Actualizează detalii comandă (ex: număr masă pentru comenzi în locație)
 */
export async function updateOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { tableNumber } = req.body;
    
    const order = await OrderModel.findById(id);
    if (!order) {
      res.status(404).json({ error: 'Comanda nu a fost găsită' });
      return;
    }
    
    if (order.fulfillmentType !== 'in_location') {
      res.status(400).json({ error: 'Numărul mesei se poate actualiza doar pentru comenzi în locație' });
      return;
    }
    
    const value = tableNumber === undefined || tableNumber === null || tableNumber === ''
      ? null
      : String(tableNumber).trim().slice(0, 20);
    
    const updatedOrder = await OrderModel.updateTableNumber(id, value);
    res.json(updatedOrder);
  } catch (error) {
    logError('actualizare comandă', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/orders/export
 * Exportă comenzile în format CSV
 */
export async function exportOrders(req: Request, res: Response): Promise<void> {
  try {
    const { status, dateFrom, dateTo } = req.query;
    
    const { orders } = await OrderModel.findAll({
      page: 1,
      limit: 10000, // Limită mare pentru export
      status: status as OrderModel.OrderStatus,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });
    
    // Generează CSV
    const headers = [
      'ID', 'Data', 'Client', 'Produse', 'Subtotal', 'Livrare', 'Total',
      'Status', 'Tip', 'Masa', 'Adresa', 'Oraș', 'Telefon', 'Plată'
    ];
    
    const rows = orders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleString('ro-RO'),
      o.userId,
      o.items.map(i => `${i.productName} x${i.quantity}`).join('; '),
      o.subtotal.toFixed(2),
      o.deliveryFee.toFixed(2),
      o.total.toFixed(2),
      o.status,
      o.fulfillmentType === 'in_location' ? 'În locație' : 'Livrare',
      o.tableNumber ?? '',
      o.deliveryAddress,
      o.deliveryCity,
      o.phone,
      o.paymentMethod,
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=comenzi-${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\uFEFF' + csv); // BOM pentru Excel
  } catch (error) {
    logError('export comenzi', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
