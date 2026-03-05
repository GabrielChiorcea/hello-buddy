/**
 * Email - puncte câștigate
 * Plugin: plugins/points
 * Delegă către serviciul centralizat de email.
 */

import { sendPointsEarnedEmail as sendEmail } from '../../services/emailService.js';

export function sendPointsEarnedEmail(
  userEmail: string,
  pointsEarned: number,
  totalPoints: number
): void {
  // Fire-and-forget
  sendEmail(userEmail, pointsEarned, totalPoints).catch(() => {});
}
