/**
 * Modul plăți: selector provider din env, expunere interfață comună.
 */

import type { IPaymentProvider } from './types.js';
import { stripeProvider } from './stripeProvider.js';
import { netopiaProvider } from './netopiaProvider.js';

const providerName = (process.env.PAYMENT_PROVIDER ?? 'stripe').toLowerCase();

function getProvider(): IPaymentProvider {
  if (providerName === 'netopia') {
    return netopiaProvider;
  }
  return stripeProvider;
}

export const paymentProvider: IPaymentProvider = getProvider();
export type { IPaymentProvider, CreatePaymentIntentParams, CreatePaymentIntentResult, HandleWebhookResult, PaymentProviderName } from './types.js';
export { getStripePublishableKey } from './stripeProvider.js';
