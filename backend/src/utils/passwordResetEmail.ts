/**
 * Email pentru resetare parolă
 * Conține template-ul și delegă trimiterea către serviciul centralizat.
 */

import { sendEmail } from '../services/emailService.js';

export function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string,
  expiresInHours: number
): void {
  const subject = 'Resetare parolă';
  const text = `Folosește acest link pentru a-ți reseta parola: ${resetLink}\nLink-ul expiră în ${expiresInHours} ore.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>Resetare parolă</h2>
      <p>Ai solicitat resetarea parolei. Click pe butonul de mai jos:</p>
      <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        Resetează parola
      </a>
      <p style="margin-top:16px;font-size:13px;color:#666;">
        Link-ul expiră în ${expiresInHours} ore. Dacă nu ai solicitat această resetare, ignoră acest email.
      </p>
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
