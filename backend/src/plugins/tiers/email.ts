/**
 * Email - notificare level up
 * Plugin: plugins/tiers
 * Conține template-ul local și delegă trimiterea către serviciul centralizat.
 */

import { sendEmail } from '../../services/emailService.js';

export function sendLevelUpEmail(
  userEmail: string,
  tierName: string,
  message: string
): void {
  const subject = `Nivel nou deblocat: ${tierName}!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>🏆 Nivel nou deblocat!</h2>
      <p style="font-size:20px;font-weight:700;color:#d97706;">${tierName}</p>
      <p>${message}</p>
      <p style="font-size:13px;color:#666;">Continuă să comanzi pentru a debloca și mai multe beneficii!</p>
    </div>
  `;

  // Fire-and-forget
  sendEmail({
    to: userEmail,
    subject,
    text: message,
    html,
  }).catch(() => {});
}
