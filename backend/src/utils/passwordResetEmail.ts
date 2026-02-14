/**
 * Email pentru resetare parolă
 * Structură pregătită - loghează în consolă; poate fi înlocuit cu SMTP/SendGrid etc.
 */

/**
 * Trimite email cu link de resetare parolă.
 * În producție: înlocuiește cu serviciu real (SendGrid, Mailgun, AWS SES, SMTP).
 */
export function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string,
  expiresInHours: number
): void {
  const message = `[Email] Către ${userEmail}: Link resetare parolă: ${resetLink} (expiră în ${expiresInHours} ore)`;
  console.log(message);
}
