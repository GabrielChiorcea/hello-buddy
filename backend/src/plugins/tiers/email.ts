/**
 * Email - notificare level up
 * Plugin: plugins/tiers
 * Delegă către serviciul centralizat de email.
 */

import { sendLevelUpEmail as sendEmail } from '../../services/emailService.js';

export function sendLevelUpEmail(
  userEmail: string,
  tierName: string,
  message: string
): void {
  // Fire-and-forget
  sendEmail(userEmail, tierName, message).catch(() => {});
}
