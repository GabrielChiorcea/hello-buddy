/**
 * Model Order - gestionare comenzi
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, beginTransaction } from '../config/database.js';
import { pointsPlugin } from '../plugins/points/index.js';
import { findById as findUserById } from './User.js';
import { getActiveProductIdsForTier } from '../plugins/free-products/repositories/campaignsRepository.js';
import { isPluginEnabled } from '../utils/pluginFlags.js';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card';
export type FulfillmentType = 'delivery' | 'in_location';

export interface OrderItem {
  id: number;
  productId: string | null; // null când produsul a fost șters (comenzi livrate/anulate)
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
  fulfillmentType: FulfillmentType;
  tableNumber: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  paymentId?: string | null;
  estimatedDelivery: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  pointsEarned: number;
  pointsUsed: number;
  discountFromPoints: number;
  discountFromFreeProducts?: number;
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
  fulfillment_type?: FulfillmentType;
  table_number?: string | null;
  delivery_address: string;
  delivery_city: string;
  phone: string;
  notes: string | null;
  payment_method: PaymentMethod;
  payment_id?: string | null;
  estimated_delivery: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  points_earned: number;
  points_used: number;
  discount_from_points: string;
  discount_from_free_products?: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItemRow {
  id: number;
  order_id: string;
  product_id: string | null;
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
  fulfillmentType?: FulfillmentType;
  tableNumber?: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  pointsToUse?: number;
  /** Set when order is created from card payment webhook */
  paymentId?: string | null;
}

function mapRowToOrder(row: OrderRow, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    userId: row.user_id,
    subtotal: parseFloat(row.subtotal),
    deliveryFee: parseFloat(row.delivery_fee),
    total: parseFloat(row.total),
    status: row.status,
    fulfillmentType: row.fulfillment_type ?? 'delivery',
    tableNumber: row.table_number ?? null,
    deliveryAddress: row.delivery_address,
    deliveryCity: row.delivery_city,
    phone: row.phone,
    notes: row.notes,
    paymentMethod: row.payment_method,
    paymentId: row.payment_id ?? null,
    estimatedDelivery: row.estimated_delivery,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    pointsEarned: row.points_earned ?? 0,
    pointsUsed: row.points_used ?? 0,
    discountFromPoints: parseFloat(row.discount_from_points ?? '0'),
    discountFromFreeProducts: row.discount_from_free_products
      ? parseFloat(row.discount_from_free_products)
      : 0,
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
 * Găsește o comandă după payment_id (Stripe session id etc.)
 */
export async function findByPaymentId(paymentId: string): Promise<Order | null> {
  const row = await queryOne<OrderRow>(
    'SELECT * FROM orders WHERE payment_id = ?',
    [paymentId]
  );
  if (!row) return null;
  const items = await getOrderItems(row.id);
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
  
  if (rows.length === 0) return [];

  // Batch: încarcă toate order_items într-o singură interogare
  const orderIds = rows.map(r => r.id);
  const placeholders = orderIds.map(() => '?').join(',');
  const allItems = await query<OrderItemRow[]>(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
    orderIds
  );

  const itemsMap = new Map<string, OrderItem[]>();
  for (const r of allItems) {
    if (!itemsMap.has(r.order_id)) itemsMap.set(r.order_id, []);
    itemsMap.get(r.order_id)!.push({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      productImage: r.product_image,
      quantity: r.quantity,
      priceAtOrder: parseFloat(r.price_at_order),
    });
  }

  return rows.map(row => mapRowToOrder(row, itemsMap.get(row.id) || []));
}

/**
 * Listează toate comenzile cu filtre
 */
export async function findAll(options: {
  status?: OrderStatus;
  fulfillmentType?: FulfillmentType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
} = {}): Promise<{ orders: Order[]; total: number }> {
  const { status, fulfillmentType, dateFrom, dateTo, page = 1, limit = 20 } = options;
  
  const conditions: string[] = [];
  const params: unknown[] = [];
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (fulfillmentType) {
    conditions.push('fulfillment_type = ?');
    params.push(fulfillmentType);
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
  
  if (rows.length === 0) return { orders: [], total };

  // Batch: încarcă toate order_items într-o singură interogare
  const orderIds = rows.map(r => r.id);
  const ph = orderIds.map(() => '?').join(',');
  const allItems = await query<OrderItemRow[]>(
    `SELECT * FROM order_items WHERE order_id IN (${ph})`,
    orderIds
  );

  const itemsMap = new Map<string, OrderItem[]>();
  for (const r of allItems) {
    if (!itemsMap.has(r.order_id)) itemsMap.set(r.order_id, []);
    itemsMap.get(r.order_id)!.push({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      productImage: r.product_image,
      quantity: r.quantity,
      priceAtOrder: parseFloat(r.price_at_order),
    });
  }

  const orders = rows.map(row => mapRowToOrder(row, itemsMap.get(row.id) || []));
  
  return { orders, total };
}

export interface OrderItemDetail {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: number;
}

export interface OrderTotals {
  itemDetails: OrderItemDetail[];
  subtotal: number;
  deliveryFee: number;
  pointsUsed: number;
  discountFromPoints: number;
  discountFromFreeProducts: number;
  total: number;
}

type PoolConnection = Awaited<ReturnType<typeof beginTransaction>>;

/**
 * Calculează subtotal, livrare, discount puncte și total fără a crea comanda.
 * Folosit la createPaymentSession pentru validare amountRon și la create() pentru itemDetails.
 */
export async function computeOrderTotal(
  connection: PoolConnection,
  input: CreateOrderInput
): Promise<OrderTotals> {
  // Primul pas: calculăm subtotalul de bază (fără gratuități) și colectăm produsele.
  let baseSubtotal = 0;
  const rawItems: Array<{
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
    baseSubtotal += price * item.quantity;
    rawItems.push({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      quantity: item.quantity,
      price,
    });
  }

  // Al doilea pas: aplicăm regulile de produse gratuite (max 1 buc. per produs, cu prag comandă).
  // IMPORTANT: pragul se verifică pe subtotalul produselor PLĂTITE (fără cele gratuite).
  let discountFromFreeProducts = 0;
  const itemDetails: OrderItemDetail[] = [];

  const freeProductsPluginEnabled = await isPluginEnabled('free_products');
  const user = freeProductsPluginEnabled ? await findUserById(input.userId) : null;
  const tierId = user?.tierId ?? null;

  let minOrderByProduct = new Map<string, number>();
  if (freeProductsPluginEnabled) {
    const mappings = await getActiveProductIdsForTier(tierId);
    for (const m of mappings) {
      const existing = minOrderByProduct.get(m.productId);
      const v = m.minOrderValue ?? 0;
      if (existing == null || v < existing) {
        minOrderByProduct.set(m.productId, v);
      }
    }
  }

  // Calculăm subtotalul plătit (excluzând produsele care ar fi gratuite)
  let paidSubtotal = 0;
  for (const item of rawItems) {
    if (!minOrderByProduct.has(item.productId)) {
      paidSubtotal += item.price * item.quantity;
    } else {
      // Produsele gratuite contribuie cu quantity - 1 (max 1 gratuit)
      const paidQty = item.quantity > 1 ? item.quantity - 1 : 0;
      paidSubtotal += item.price * paidQty;
    }
  }

  const grantedFreeForProduct = new Set<string>();

  for (const item of rawItems) {
    const threshold = minOrderByProduct.get(item.productId);
    let freeQty = 0;

    if (
      freeProductsPluginEnabled &&
      threshold !== undefined &&
      paidSubtotal >= threshold &&
      !grantedFreeForProduct.has(item.productId) &&
      item.quantity > 0
    ) {
      freeQty = 1;
      grantedFreeForProduct.add(item.productId);
      discountFromFreeProducts += item.price * freeQty;
    }

    itemDetails.push({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      price: item.price,
    });
  }

  const fulfillmentType = input.fulfillmentType ?? 'delivery';
  const isInLocation = fulfillmentType === 'in_location';
  let deliveryFee = 0;
  if (!isInLocation) {
    const [settingsRows] = await connection.execute<any[]>(
      'SELECT value FROM app_settings WHERE id = "delivery_fee"'
    );
    deliveryFee = settingsRows.length > 0 ? parseFloat(settingsRows[0].value) : 10;
  }
  const { pointsUsed, discountFromPoints } = await pointsPlugin.service.applyAtCheckout(connection, {
    userId: input.userId,
    pointsToUse: input.pointsToUse,
  });
  const subtotal = baseSubtotal;
  const total = Math.max(0, subtotal + deliveryFee - discountFromPoints - discountFromFreeProducts);
  return {
    itemDetails,
    subtotal,
    deliveryFee,
    pointsUsed,
    discountFromPoints,
    discountFromFreeProducts,
    total,
  };
}

/**
 * Creează o comandă nouă
 */
export async function create(input: CreateOrderInput): Promise<Order> {
  const connection = await beginTransaction();
  
  try {
    const id = uuidv4();
    const totals = await computeOrderTotal(connection, input);
    const {
      itemDetails,
      subtotal,
      deliveryFee,
      pointsUsed,
      discountFromPoints,
      discountFromFreeProducts,
      total,
    } = totals;
    
    const fulfillmentType = input.fulfillmentType ?? 'delivery';
    const isInLocation = fulfillmentType === 'in_location';
    const deliveryAddress = isInLocation ? 'În locație' : input.deliveryAddress;
    const deliveryCity = isInLocation ? 'În locație' : input.deliveryCity;

    // Inserează comanda (payment_id opțional - setat la plată card)
    const paymentId = input.paymentId ?? null;

    await connection.execute(
      `INSERT INTO orders (
        id, user_id, subtotal, delivery_fee, total, fulfillment_type,
        table_number, delivery_address, delivery_city, phone, notes,
        payment_method, payment_id, points_used, discount_from_points,
        discount_from_free_products
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, input.userId, subtotal, deliveryFee, total, fulfillmentType,
        input.tableNumber ?? null, deliveryAddress, deliveryCity,
        input.phone, input.notes || null, input.paymentMethod, paymentId,
        pointsUsed, discountFromPoints, discountFromFreeProducts,
      ]
    );

    if (pointsUsed > 0) {
      await pointsPlugin.service.deductPointsInTransaction(
        connection,
        input.userId,
        id,
        pointsUsed
      );
    }
    
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5b30d7ea-62d4-4fc8-b8b7-5a517226527b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '19f6dc',
      },
      body: JSON.stringify({
        sessionId: '19f6dc',
        runId: 'pre-fix-1',
        hypothesisId: 'H1',
        location: 'backend/src/models/Order.ts:create:catch',
        message: 'create order error',
        data: {
          name: (error as any)?.name,
          message: (error as any)?.message,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
  // Dacă anulăm comanda, verificăm dacă trebuie să returnăm punctele
  if (status === 'cancelled') {
    const orderBeforeCancel = await findById(id);
    if (orderBeforeCancel && orderBeforeCancel.pointsUsed > 0) {
      // Returnăm punctele utilizatorului
      await pointsPlugin.service.refundPointsOnCancellation(id, {
        userId: orderBeforeCancel.userId,
        pointsUsed: orderBeforeCancel.pointsUsed,
      });
    }
  }

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
 * Actualizează punctele câștigate pentru o comandă livrată.
 * Face update doar dacă points_earned e încă 0 (protecție idempotență la dublu-click / race).
 * Returnează true dacă s-a făcut update, false dacă punctele erau deja acordate.
 */
export async function setPointsEarned(id: string, pointsEarned: number): Promise<boolean> {
  const res = await query<{ affectedRows: number }>(
    'UPDATE orders SET points_earned = ? WHERE id = ? AND COALESCE(points_earned, 0) = 0',
    [pointsEarned, id]
  );
  return (res?.affectedRows ?? 0) > 0;
}

/**
 * Actualizează numărul mesei pentru o comandă în locație
 */
export async function updateTableNumber(id: string, tableNumber: string | null): Promise<Order | null> {
  await query(
    'UPDATE orders SET table_number = ? WHERE id = ?',
    [tableNumber, id]
  );
  return findById(id);
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
