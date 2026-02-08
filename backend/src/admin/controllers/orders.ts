/**
 * Controller comenzi admin
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import * as OrderModel from '../../models/Order.js';
import { query } from '../../config/database.js';
import { pointsPlugin } from '../../plugins/points/index.js';

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
      dateFrom,
      dateTo,
    } = req.query;
    
    const { orders, total } = await OrderModel.findAll({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as OrderModel.OrderStatus,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });
    
    // Obține informații despre utilizatori
    const userIds = [...new Set(orders.map(o => o.userId))];
    let usersMap: Map<string, { name: string; email: string }> = new Map();
    
    if (userIds.length > 0) {
      const users = await query<{ id: string; name: string; email: string }[]>(
        `SELECT id, name, email FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
        userIds
      );
      users.forEach(u => usersMap.set(u.id, { name: u.name, email: u.email }));
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
    
    // Obține informații utilizator
    const users = await query<{ id: string; name: string; email: string; phone: string }[]>(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
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

    if (status === 'delivered' && order.pointsEarned === 0) {
      await pointsPlugin.hooks.onOrderDelivered(id, {
        userId: order.userId,
        total: order.total,
        pointsEarned: order.pointsEarned,
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
      'Status', 'Adresa', 'Oraș', 'Telefon', 'Plată'
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
