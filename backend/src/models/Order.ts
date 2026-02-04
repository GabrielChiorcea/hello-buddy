/**
 * Model Order - gestionare comenzi
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, beginTransaction } from '../config/database.js';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card';

export interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  userId: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  estimatedDelivery: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface OrderRow {
  id: string;
  user_id: string;
  subtotal: string;
  delivery_fee: string;
  total: string;
  status: OrderStatus;
  delivery_address: string;
  delivery_city: string;
  phone: string;
  notes: string | null;
  payment_method: PaymentMethod;
  estimated_delivery: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface OrderItemRow {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price_at_order: string;
}

export interface CreateOrderInput {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

function mapRowToOrder(row: OrderRow, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    userId: row.user_id,
    subtotal: parseFloat(row.subtotal),
    deliveryFee: parseFloat(row.delivery_fee),
    total: parseFloat(row.total),
    status: row.status,
    deliveryAddress: row.delivery_address,
    deliveryCity: row.delivery_city,
    phone: row.phone,
    notes: row.notes,
    paymentMethod: row.payment_method,
    estimatedDelivery: row.estimated_delivery,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const rows = await query<OrderItemRow[]>(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orderId]
  );
  return rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productImage: r.product_image,
    quantity: r.quantity,
    priceAtOrder: parseFloat(r.price_at_order),
  }));
}

/**
 * Găsește o comandă după ID
 */
export async function findById(id: string): Promise<Order | null> {
  const row = await queryOne<OrderRow>(
    'SELECT * FROM orders WHERE id = ?',
    [id]
  );
  if (!row) return null;
  
  const items = await getOrderItems(id);
  return mapRowToOrder(row, items);
}

/**
 * Listează comenzile unui utilizator
 */
export async function findByUserId(userId: string): Promise<Order[]> {
  const rows = await query<OrderRow[]>(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  
  const orders: Order[] = [];
  for (const row of rows) {
    const items = await getOrderItems(row.id);
    orders.push(mapRowToOrder(row, items));
  }
  
  return orders;
}

/**
 * Listează toate comenzile cu filtre
 */
export async function findAll(options: {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
} = {}): Promise<{ orders: Order[]; total: number }> {
  const { status, dateFrom, dateTo, page = 1, limit = 20 } = options;
  
  const conditions: string[] = [];
  const params: unknown[] = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (dateFrom) {
    conditions.push('created_at >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('created_at <= ?');
    params.push(dateTo);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM orders ${whereClause}`,
    params
  );
  const total = countResult?.total || 0;
  
  const rows = await query<OrderRow[]>(
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  
  const orders: Order[] = [];
  for (const row of rows) {
    const items = await getOrderItems(row.id);
    orders.push(mapRowToOrder(row, items));
  }
  
  return { orders, total };
}

/**
 * Creează o comandă nouă
 */
export async function create(input: CreateOrderInput): Promise<Order> {
  const connection = await beginTransaction();
  
  try {
    const id = uuidv4();
    
    // Calculează subtotal și obține detalii produse
    let subtotal = 0;
    const itemDetails: Array<{
      productId: string;
      productName: string;
      productImage: string | null;
      quantity: number;
      price: number;
    }> = [];
    
    for (const item of input.items) {
      const [productRows] = await connection.execute<any[]>(
        'SELECT id, name, image, price, is_available FROM products WHERE id = ?',
        [item.productId]
      );
      
      if (productRows.length === 0) {
        throw new Error(`Produsul ${item.productId} nu a fost găsit`);
      }
      
      const product = productRows[0];
      if (!product.is_available) {
        throw new Error(`Produsul ${product.name} nu este disponibil`);
      }
      
      const price = parseFloat(product.price);
      subtotal += price * item.quantity;
      
      itemDetails.push({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        quantity: item.quantity,
        price,
      });
    }
    
    // Obține taxa de livrare din setări
    const [settingsRows] = await connection.execute<any[]>(
      'SELECT value FROM app_settings WHERE id = "delivery_fee"'
    );
    const deliveryFee = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 10;
    
    const total = subtotal + deliveryFee;
    
    // Inserează comanda
    await connection.execute(
      `INSERT INTO orders (id, user_id, subtotal, delivery_fee, total, delivery_address, delivery_city, phone, notes, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.userId, subtotal, deliveryFee, total, input.deliveryAddress, input.deliveryCity, input.phone, input.notes || null, input.paymentMethod]
    );
    
    // Inserează produsele comenzii
    for (const item of itemDetails) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price_at_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, item.productId, item.productName, item.productImage, item.quantity, item.price]
      );
    }
    
    // Adaugă în istoric status
    await connection.execute(
      `INSERT INTO order_status_history (order_id, status) VALUES (?, 'pending')`,
      [id]
    );
    
    await connection.commit();
    connection.release();
    
    const order = await findById(id);
    if (!order) throw new Error('Eroare la crearea comenzii');
    
    return order;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

/**
 * Actualizează statusul unei comenzi
 */
export async function updateStatus(
  id: string,
  status: OrderStatus,
  changedBy?: string,
  notes?: string
): Promise<Order | null> {
  const updates: string[] = ['status = ?'];
  const values: unknown[] = [status];
  
  if (status === 'delivered') {
    updates.push('delivered_at = NOW()');
  } else if (status === 'cancelled') {
    updates.push('cancelled_at = NOW()');
    if (notes) {
      updates.push('cancellation_reason = ?');
      values.push(notes);
    }
  }
  
  values.push(id);
  await query(
    `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  // Adaugă în istoric
  await query(
    `INSERT INTO order_status_history (order_id, status, changed_by, notes) VALUES (?, ?, ?, ?)`,
    [id, status, changedBy || null, notes || null]
  );
  
  return findById(id);
}

/**
 * Anulează o comandă
 */
export async function cancel(id: string, reason?: string): Promise<Order | null> {
  return updateStatus(id, 'cancelled', undefined, reason);
}

/**
 * Obține statistici comenzi
 */
export async function getStats(dateFrom?: Date, dateTo?: Date): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  
  if (dateFrom) {
    conditions.push('created_at >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('created_at <= ?');
    params.push(dateTo);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const statsResult = await queryOne<{
    total_orders: number;
    total_revenue: string;
    avg_order_value: string;
  }>(
    `SELECT 
       COUNT(*) as total_orders,
       COALESCE(SUM(total), 0) as total_revenue,
       COALESCE(AVG(total), 0) as avg_order_value
     FROM orders ${whereClause}`,
    params
  );
  
  const statusRows = await query<{ status: OrderStatus; count: number }[]>(
    `SELECT status, COUNT(*) as count FROM orders ${whereClause} GROUP BY status`,
    params
  );
  
  const ordersByStatus: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0,
  };
  
  for (const row of statusRows) {
    ordersByStatus[row.status] = row.count;
  }
  
  return {
    totalOrders: statsResult?.total_orders || 0,
    totalRevenue: parseFloat(statsResult?.total_revenue || '0'),
    averageOrderValue: parseFloat(statsResult?.avg_order_value || '0'),
    ordersByStatus,
  };
}
