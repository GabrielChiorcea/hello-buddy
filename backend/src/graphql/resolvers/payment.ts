/**
 * Rezolvere pentru sesiune plată cu card (Stripe/Netopia)
 */

import { GraphQLContext, requireAuth } from '../context.js';
import * as OrderModel from '../../models/Order.js';
import { pool } from '../../config/database.js';
import { paymentProvider } from '../../payments/index.js';
import * as DraftRepo from '../../payments/draftRepository.js';
import { fulfillOrderFromDraft } from '../../payments/fulfillFromDraft.js';
import { checkOrderRateLimit } from './order.js';

interface OrderItemInput {
  productId: string;
  quantity: number;
  configuration?: Array<{
    groupId: number;
    groupName: string;
    options: Array<{ optionId: number; name: string; priceDelta: number }>;
  }>;
  unitPriceWithConfiguration?: number;
}

interface CreateOrderInput {
  items: OrderItemInput[];
  fulfillmentType?: 'delivery' | 'in_location';
  tableNumber?: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: 'cash' | 'card';
  pointsToUse?: number;
}

export const paymentResolvers = {
  Mutation: {
    async createPaymentSession(
      _: unknown,
      { input, amountRon }: { input: CreateOrderInput; amountRon: number },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);

      if (!checkOrderRateLimit(user.id)) {
        throw new Error('Ați atins limita de comenzi. Încercați din nou mai târziu.');
      }

      if (input.paymentMethod !== 'card') {
        throw new Error('createPaymentSession este doar pentru plată cu cardul');
      }

      if (!input.items || input.items.length === 0) {
        throw new Error('Comanda trebuie să conțină cel puțin un produs');
      }
      if (input.items.length > 50) {
        throw new Error('Comanda nu poate conține mai mult de 50 de produse');
      }
      for (const item of input.items) {
        if (item.quantity < 1 || item.quantity > 100) {
          throw new Error('Cantitatea trebuie să fie între 1 și 100');
        }
      }

      const isInLocation = input.fulfillmentType === 'in_location';
      if (!isInLocation) {
        if (!input.deliveryAddress || input.deliveryAddress.length < 5) {
          throw new Error('Adresa de livrare este invalidă');
        }
        if (!input.deliveryCity || input.deliveryCity.length < 2) {
          throw new Error('Orașul este invalid');
        }
      }
      if (!input.phone || input.phone.length < 9) {
        throw new Error('Numărul de telefon este invalid');
      }

      if (typeof amountRon !== 'number' || amountRon < 0) {
        throw new Error('Suma este invalidă');
      }

      const orderInput = {
        userId: user.id,
        items: input.items,
        fulfillmentType: input.fulfillmentType,
        tableNumber: input.tableNumber,
        deliveryAddress: isInLocation ? 'În locație' : input.deliveryAddress,
        deliveryCity: isInLocation ? 'În locație' : input.deliveryCity,
        phone: input.phone,
        notes: input.notes,
        paymentMethod: 'card' as const,
        pointsToUse: input.pointsToUse,
      };

      let serverTotal: number;
      const connection = await pool.getConnection();
      try {
        const totals = await OrderModel.computeOrderTotal(connection, orderInput);
        serverTotal = totals.total;
        if (Math.abs(serverTotal - amountRon) > 0.02) {
          throw new Error(
            `Suma nu corespunde (așteptat ${serverTotal.toFixed(2)} RON, primit ${amountRon.toFixed(2)} RON)`
          );
        }
      } finally {
        connection.release();
      }

      const gateway = paymentProvider.getProviderName();
      const payload: DraftRepo.PaymentDraftPayload = {
        ...orderInput,
        amountRon: serverTotal,
      };
      const draft = await DraftRepo.createDraft(user.id, payload, serverTotal, gateway);

      const result = await paymentProvider.createPaymentIntent({
        amountRon: serverTotal,
        draftId: draft.id,
      });

      await DraftRepo.updateGatewayPaymentId(draft.id, result.paymentId);

      return {
        clientSecret: result.clientSecret ?? null,
        redirectUrl: result.redirectUrl ?? null,
        paymentId: result.paymentId,
        draftId: draft.id,
      };
    },

    /** Fallback: creează comanda din sesiune la redirect pe /checkout/success (când webhook nu a fost primit). */
    async confirmPaymentSession(
      _: unknown,
      { sessionId }: { sessionId: string },
      context: GraphQLContext
    ) {
      const user = requireAuth(context);
      const result = await paymentProvider.retrieveSessionForConfirmation(sessionId);
      if (!result) {
        throw new Error('Sesiune invalidă, plată nefinalizată sau confirmarea nu este disponibilă pentru acest provider.');
      }
      const draft = await DraftRepo.findById(result.draftId);
      if (!draft || draft.userId !== user.id) {
        throw new Error('Nu aveți permisiunea de a confirma această plată');
      }
      let order = await fulfillOrderFromDraft(result.draftId, result.paymentId);
      if (!order) {
        order = await OrderModel.findByPaymentId(result.paymentId) ?? null;
        if (!order) throw new Error('Comanda nu a putut fi găsită');
      }
      return order;
    },
  },
};
