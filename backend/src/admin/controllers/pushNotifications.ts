/**
 * Controller pentru push notifications (admin + public)
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../config/database.js';

// ============ PUBLIC: Subscription management ============

/** Salvează / actualizează subscripția unui utilizator */
export async function subscribe(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Autentificare necesară' });
      return;
    }

    const { subscription, preferences } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: 'Subscripție invalidă' });
      return;
    }

    const notifyOrderStatus = preferences?.notifyOrderStatus ?? true;
    const notifyPromotions = preferences?.notifyPromotions ?? false;
    const notifyStreakReminders = preferences?.notifyStreakReminders ?? false;

    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, notify_order_status, notify_promotions, notify_streak_reminders)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = $1,
         p256dh = $3,
         auth = $4,
         notify_order_status = $5,
         notify_promotions = $6,
         notify_streak_reminders = $7,
         updated_at = NOW()`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, notifyOrderStatus, notifyPromotions, notifyStreakReminders]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Eroare la salvarea subscripției' });
  }
}

/** Dezabonare */
export async function unsubscribe(req: Request, res: Response) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint lipsă' });
      return;
    }

    await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Eroare la dezabonare' });
  }
}

/** Obține preferințele de notificare ale utilizatorului curent */
export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Autentificare necesară' });
      return;
    }

    const sub = await queryOne(
      'SELECT notify_order_status, notify_promotions, notify_streak_reminders FROM push_subscriptions WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (!sub) {
      res.json({ subscribed: false, preferences: null });
      return;
    }

    res.json({
      subscribed: true,
      preferences: {
        notifyOrderStatus: sub.notify_order_status,
        notifyPromotions: sub.notify_promotions,
        notifyStreakReminders: sub.notify_streak_reminders,
      },
    });
  } catch (err) {
    console.error('Get push preferences error:', err);
    res.status(500).json({ error: 'Eroare la obținerea preferințelor' });
  }
}

/** Actualizează preferințele de notificare */
export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Autentificare necesară' });
      return;
    }

    const { notifyOrderStatus, notifyPromotions, notifyStreakReminders } = req.body;

    await query(
      `UPDATE push_subscriptions SET
        notify_order_status = COALESCE($2, notify_order_status),
        notify_promotions = COALESCE($3, notify_promotions),
        notify_streak_reminders = COALESCE($4, notify_streak_reminders),
        updated_at = NOW()
       WHERE user_id = $1`,
      [userId, notifyOrderStatus, notifyPromotions, notifyStreakReminders]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update push preferences error:', err);
    res.status(500).json({ error: 'Eroare la actualizarea preferințelor' });
  }
}

// ============ ADMIN: Send notifications ============

/** Trimite notificare promoțională tuturor abonaților */
export async function sendPromotion(req: Request, res: Response) {
  try {
    const { title, body, url } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: 'Titlu și mesaj sunt obligatorii' });
      return;
    }

    const subs = await query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE notify_promotions = true'
    );

    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: { url: url || '/' },
    });

    // In production, use web-push library here
    // For now, return the count of subscribers that would receive it
    res.json({
      success: true,
      subscribersCount: subs.rows?.length || 0,
      message: `Notificarea va fi trimisă la ${subs.rows?.length || 0} abonați. Necesită configurarea web-push cu VAPID keys.`,
    });
  } catch (err) {
    console.error('Send promotion error:', err);
    res.status(500).json({ error: 'Eroare la trimiterea notificării' });
  }
}

/** Trimite notificare de status comandă unui utilizator specific */
export async function sendOrderStatusNotification(
  userId: string,
  orderId: string,
  status: string
) {
  try {
    const statusLabels: Record<string, string> = {
      confirmed: 'confirmată',
      preparing: 'în preparare',
      delivering: 'în livrare',
      delivered: 'livrată',
      cancelled: 'anulată',
    };

    const label = statusLabels[status] || status;
    const subs = await query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1 AND notify_order_status = true',
      [userId]
    );

    if (!subs.rows?.length) return;

    const payload = JSON.stringify({
      title: `Comanda #${orderId.slice(0, 8)}`,
      body: `Comanda ta a fost ${label}!`,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: { url: '/profile' },
    });

    // TODO: Use web-push library to send to each subscription
    // For each sub: webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, payload)
    console.log(`[Push] Would send order status notification to ${subs.rows.length} devices for user ${userId}`);
  } catch (err) {
    console.error('Send order status notification error:', err);
  }
}
