/**
 * Email generic pentru actualizări de status comandă.
 * Folosește un template unic, cu conținut dinamic în funcție de status.
 */

import { sendEmail } from '../services/emailService.js';
import type { OrderStatus } from '../models/Order.js';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'În așteptare',
  confirmed: 'Confirmată',
  preparing: 'În pregătire',
  delivering: 'În livrare',
  delivered: 'Livrată',
  cancelled: 'Anulată',
};

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: 'Comanda ta a fost înregistrată și urmează să fie procesată.',
  confirmed: 'Comanda ta a fost confirmată de restaurant.',
  preparing: 'Comanda ta este în pregătire.',
  delivering: 'Comanda ta este pe drum către tine.',
  delivered: 'Comanda ta a fost livrată. Poftă bună!',
  cancelled: 'Comanda ta a fost anulată.',
};

export function sendOrderStatusEmail(
  userEmail: string,
  orderId: string,
  status: OrderStatus,
  notes?: string
): void {
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusMessage = STATUS_MESSAGES[status] ?? 'Statusul comenzii a fost actualizat.';
  const cancellationReason = status === 'cancelled' && notes ? notes.trim() : '';

  const subject = `Comanda #${orderId.slice(0, 8)}: ${statusLabel}`;
  const text = [
    `Status comandă: ${statusLabel}`,
    statusMessage,
    cancellationReason ? `Motiv: ${cancellationReason}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Actualizare comandă</h2>
      <p><strong>Comanda:</strong> #${escapeHtml(orderId.slice(0, 8))}</p>
      <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
      <p>${escapeHtml(statusMessage)}</p>
      ${cancellationReason ? `<p><strong>Motiv:</strong> ${escapeHtml(cancellationReason)}</p>` : ''}
      <p style="font-size:13px;color:#666;">Îți mulțumim că ai comandat la noi.</p>
    </div>
  `;

  // Fire-and-forget: nu blocăm fluxul de actualizare status.
  sendEmail({
    to: userEmail,
    subject,
    text,
    html,
  }).catch(() => {});
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
