/**
 * Contract pentru provideri de plată (Stripe, Netopia).
 * Restul aplicației folosește doar aceste tipuri.
 */

import type { Request } from 'express';

export type PaymentProviderName = 'stripe' | 'netopia';

export interface CreatePaymentIntentParams {
  amountRon: number;
  currency?: string;
  draftId: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResult {
  clientSecret?: string;
  redirectUrl?: string;
  paymentId: string;
}

export interface HandleWebhookResult {
  success: boolean;
  paymentId: string;
  draftId?: string;
}

export interface IPaymentProvider {
  getProviderName(): PaymentProviderName;
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult>;
  handleWebhook(req: Request): Promise<HandleWebhookResult>;
}
