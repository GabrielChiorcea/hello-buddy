/**
 * Handler pentru webhook-uri plăți (Stripe / Netopia).
 * La succes: încarcă draft-ul, creează comanda, marchează draft completed.
 */

import type { Request, Response } from 'express';
import type { IPaymentProvider } from './types.js';
import * as DraftRepo from './draftRepository.js';
import { fulfillOrderFromDraft } from './fulfillFromDraft.js';
import { logError } from '../utils/safeErrorLogger.js';

export function createWebhookHandler(provider: IPaymentProvider) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await provider.handleWebhook(req);
      if (!result.success || !result.draftId) {
        res.status(200).send();
        return;
      }

      const draft = await DraftRepo.findById(result.draftId);
      if (!draft) {
        res.status(200).send();
        return;
      }
      if (draft.status !== 'pending') {
        res.status(200).send();
        return;
      }

      await fulfillOrderFromDraft(result.draftId, result.paymentId);
      res.status(200).send();
    } catch (err) {
      logError('payment webhook', err);
      res.status(500).send();
    }
  };
}
