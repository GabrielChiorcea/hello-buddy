/**
 * Serviciu centralizat de email
 * 
 * În development: loghează în consolă
 * În producție: folosește SMTP (nodemailer) dacă variabilele SMTP_* sunt setate
 * 
 * Pentru a activa trimiterea reală de email, setează în .env:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@email.com
 *   SMTP_PASS=your-app-password
 *   SMTP_FROM=noreply@yourdomain.com
 */

import { logError } from '../utils/safeErrorLogger.js';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return {
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM || SMTP_USER,
  };
}

/**
 * Trimite un email. Loghează în consolă dacă SMTP nu e configurat.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const smtp = getSmtpConfig();

  if (!smtp) {
    // Dev mode - doar log
    console.log(`[Email][DEV] Către: ${options.to}`);
    console.log(`[Email][DEV] Subiect: ${options.subject}`);
    console.log(`[Email][DEV] Text: ${options.text}`);
    if (options.html) {
      console.log(`[Email][DEV] HTML: ${options.html.substring(0, 200)}...`);
    }
    return true;
  }

  try {
    // Dynamic import nodemailer doar când e necesar
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    await transporter.sendMail({
      from: smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`[Email] Trimis cu succes către ${options.to}: ${options.subject}`);
    return true;
  } catch (err) {
    logError('sendEmail', err);
    return false;
  }
}

// ============================================================================
// Template-uri email predefinite
// ============================================================================

/**
 * Email resetare parolă
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string,
  expiresInHours: number
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: 'Resetare parolă',
    text: `Folosește acest link pentru a-ți reseta parola: ${resetLink}\nLink-ul expiră în ${expiresInHours} ore.`,
    html: `
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
    `,
  });
}

/**
 * Email puncte câștigate
 */
export async function sendPointsEarnedEmail(
  userEmail: string,
  pointsEarned: number,
  totalPoints: number
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `Ai câștigat ${pointsEarned} puncte!`,
    text: `Felicitări! Ai primit ${pointsEarned} puncte. Total puncte: ${totalPoints}.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>🎉 Ai câștigat puncte!</h2>
        <p>Felicitări! Ai primit <strong>${pointsEarned} puncte</strong> pentru comanda ta.</p>
        <p style="font-size:24px;font-weight:700;color:#2563eb;">Total: ${totalPoints} puncte</p>
        <p style="font-size:13px;color:#666;">Folosește-le la următoarea comandă pentru reduceri!</p>
      </div>
    `,
  });
}

/**
 * Email level-up (tiers)
 */
export async function sendLevelUpEmail(
  userEmail: string,
  tierName: string,
  message: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    subject: `Nivel nou deblocat: ${tierName}!`,
    text: message,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>🏆 Nivel nou deblocat!</h2>
        <p style="font-size:20px;font-weight:700;color:#d97706;">${tierName}</p>
        <p>${message}</p>
        <p style="font-size:13px;color:#666;">Continuă să comanzi pentru a debloca și mai multe beneficii!</p>
      </div>
    `,
  });
}
