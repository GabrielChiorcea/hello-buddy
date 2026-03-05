/**
 * Email pentru resetare parolă
 * Delegă către serviciul centralizat de email.
 */

import { sendPasswordResetEmail as sendEmail } from '../services/emailService.js';

export function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string,
  expiresInHours: number
): void {
  // Fire-and-forget
  sendEmail(userEmail, resetLink, expiresInHours).catch(() => {});
}
