/**
 * Provider Netopia pentru plăți cu cardul (producție).
 * Stub: va fi implementat la integrarea Netopia; până atunci aruncă sau returnează mesaj.
 */

import type { Request } from 'express';
import type {
  IPaymentProvider,
  PaymentProviderName,
  CreatePaymentIntentParams,
  CreatePaymentIntentResult,
  HandleWebhookResult,
} from './types.js';

export const netopiaProvider: IPaymentProvider = {
  getProviderName(): PaymentProviderName {
    return 'netopia';
  },

  async createPaymentIntent(_params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    throw new Error(
      'Plata cu cardul via Netopia va fi disponibilă în curând. Folosiți momentan numerar sau Stripe (test).'
    );
  },

  async handleWebhook(_req: Request): Promise<HandleWebhookResult> {
    throw new Error('Netopia webhook not implemented');
  },

  async retrieveSessionForConfirmation(_sessionId: string): Promise<null> {
    return null;
  },
};
