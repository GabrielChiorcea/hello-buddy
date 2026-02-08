/**
 * Rezolvere pentru comenzi
 * SECURITY: Include rate limiting și logging pentru comenzi
 */

import { GraphQLContext, requireAuth } from '../context.js';
import * as OrderModel from '../../models/Order.js';
import { logOrderPlaced, logOrderRateLimited } from '../../utils/securityLogger.js';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  items: OrderItemInput[];
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: 'cash' | 'card';
  pointsToUse?: number;
}

interface ReviewInput {
  rating: number;
  comment?: string;
}

// Rate limiting în memorie pentru GraphQL (simplu, per-user)
const orderRateLimits = new Map<string, { count: number; resetAt: number }>();
const ORDER_LIMIT = 10; // max 10 comenzi
const ORDER_WINDOW = 60 * 60 * 1000; // per oră

function checkOrderRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = orderRateLimits.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    // Resetare sau prima cerere
    orderRateLimits.set(userId, { count: 1, resetAt: now + ORDER_WINDOW });
    return true;
  }
  
  if (userLimit.count >= ORDER_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

/** Serializează Date la ISO string pentru GraphQL */
function toISOString(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  try {
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export const orderResolvers = {
  Order: {
    createdAt: (parent: { createdAt?: Date | string | null }) =>
      toISOString(parent.createdAt) ?? '',
    deliveredAt: (parent: { deliveredAt?: Date | string | null }) =>
      toISOString(parent.deliveredAt),
    estimatedDelivery: (parent: { estimatedDelivery?: Date | string | null }) =>
      toISOString(parent.estimatedDelivery),
  },
  Query: {
    /**
     * Listează comenzile utilizatorului autentificat
     */
    async orders(_: unknown, __: unknown, context: GraphQLContext) {
      const user = requireAuth(context);
      return OrderModel.findByUserId(user.id);
    },

    /**
     * Găsește o comandă după ID
     */
    async order(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      const user = requireAuth(context);
      const order = await OrderModel.findById(id);
      
      // Verifică dacă comanda aparține utilizatorului
      if (!order || order.userId !== user.id) {
        return null;
      }
      
      return order;
    },
  },

  Mutation: {
    /**
     * Creează o comandă nouă
     * Include rate limiting și security logging
     */
    async createOrder(
      _: unknown,
      { input }: { input: CreateOrderInput },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      
      // Rate limiting pentru comenzi
      if (!checkOrderRateLimit(user.id)) {
        logOrderRateLimited(context.req, user.id);
        throw new Error('Ați atins limita de comenzi. Încercați din nou mai târziu.');
      }
      
      // Validare
      if (!input.items || input.items.length === 0) {
        throw new Error('Comanda trebuie să conțină cel puțin un produs');
      }
      
      // Validare suplimentară
      if (input.items.length > 50) {
        throw new Error('Comanda nu poate conține mai mult de 50 de produse');
      }
      
      for (const item of input.items) {
        if (item.quantity < 1 || item.quantity > 100) {
          throw new Error('Cantitatea trebuie să fie între 1 și 100');
        }
      }
      
      if (!input.deliveryAddress || input.deliveryAddress.length < 5) {
        throw new Error('Adresa de livrare este invalidă');
      }
      
      if (!input.phone || input.phone.length < 9) {
        throw new Error('Numărul de telefon este invalid');
      }
      
      const order = await OrderModel.create({
        userId: user.id,
        items: input.items,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        phone: input.phone,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        pointsToUse: input.pointsToUse,
      });
      
      // Log order placed
      logOrderPlaced(context.req, user.id, order.id, order.total);
      
      return order;
    },

    /**
     * Anulează o comandă
     */
    async cancelOrder(
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      
      // Verifică dacă comanda aparține utilizatorului
      const order = await OrderModel.findById(id);
      if (!order || order.userId !== user.id) {
        throw new Error('Comanda nu a fost găsită');
      }
      
      // Verifică dacă comanda poate fi anulată
      if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error('Această comandă nu mai poate fi anulată');
      }
      
      const cancelledOrder = await OrderModel.cancel(id, 'Anulată de client');
      if (!cancelledOrder) {
        throw new Error('Eroare la anularea comenzii');
      }
      
      return cancelledOrder;
    },

  },
};
