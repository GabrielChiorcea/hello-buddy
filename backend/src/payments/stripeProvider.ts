/**
 * Provider Stripe pentru plăți cu cardul (test / dev).
 * Folosește Checkout Session pentru redirect simplu.
 */

import Stripe from 'stripe';
import type { Request } from 'express';
import type {
  IPaymentProvider,
  PaymentProviderName,
  CreatePaymentIntentParams,
  CreatePaymentIntentResult,
  HandleWebhookResult,
} from './types.js';

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}

export function getStripePublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY ?? null;
}

export const stripeProvider: IPaymentProvider = {
  getProviderName(): PaymentProviderName {
    return 'stripe';
  },

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const amountCents = Math.round(params.amountRon * 100);
    if (amountCents < 1) {
      throw new Error('Amount must be at least 0.01 RON');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'ron',
            unit_amount: amountCents,
            product_data: {
              name: 'Comandă',
              description: 'Plată comandă',
            },
          },
        },
      ],
      metadata: {
        draftId: params.draftId,
        ...params.metadata,
      },
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout`,
    });

    const paymentId = session.id ?? '';
    const redirectUrl = session.url ?? null;

    return {
      paymentId,
      redirectUrl: redirectUrl ?? undefined,
    };
  },

  async handleWebhook(req: Request): Promise<HandleWebhookResult> {
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
      return { success: false, paymentId: '' };
    }
    let event: Stripe.Event;
    try {
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? req.body;
      const body = Buffer.isBuffer(rawBody) ? rawBody : (typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.from(JSON.stringify(rawBody)));
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown'}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.id ?? '';
      const draftId = session.metadata?.draftId ?? undefined;
      return { success: true, paymentId, draftId };
    }

    return { success: false, paymentId: '' };
  },
};

/** Preluare sesiune Stripe Checkout (pentru fallback la redirect, fără webhook). */
export async function retrieveCheckoutSession(sessionId: string): Promise<{ draftId: string; paymentId: string } | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid') return null;
  const draftId = session.metadata?.draftId;
  if (!draftId || typeof draftId !== 'string') return null;
  return { draftId, paymentId: session.id ?? sessionId };
}
