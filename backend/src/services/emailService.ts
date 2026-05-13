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

export interface EmailOptions {
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

    return true;
  } catch (err) {
    logError('sendEmail', err);
    return false;
  }
}
