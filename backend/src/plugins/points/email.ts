/**
 * Email - puncte câștigate
 * Plugin: plugins/points
 * Conține template-ul local și delegă trimiterea către serviciul centralizat.
 */

import { sendEmail } from '../../services/emailService.js';

export function sendPointsEarnedEmail(
  userEmail: string,
  pointsEarned: number,
  totalPoints: number
): void {
  const subject = `Ai câștigat ${pointsEarned} puncte!`;
  const text = `Felicitări! Comanada a fost livrate si ai primit ${pointsEarned} puncte. Total puncte: ${totalPoints}.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>🎉 Ai câștigat puncte!</h2>
      <p>Felicitări! Ai primit <strong>${pointsEarned} puncte</strong> pentru comanda ta.</p>
      <p style="font-size:24px;font-weight:700;color:#2563eb;">Total: ${totalPoints} puncte</p>
      <p style="font-size:13px;color:#666;">Folosește-le la următoarea comandă pentru reduceri!</p>
    </div>
  `;

  // Fire-and-forget
  sendEmail({
    to: userEmail,
    subject,
    text,
    html,
  }).catch(() => {});
}
