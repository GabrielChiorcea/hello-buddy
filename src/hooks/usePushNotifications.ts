/**
 * Hook pentru gestionarea push notifications în frontend
 * Cere permisiune, subscrie la service worker, sincronizează cu backend-ul
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface PushPreferences {
  notifyOrderStatus: boolean;
  notifyPromotions: boolean;
  notifyStreakReminders: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<PushPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const token = useAppSelector((state) => state.user.token);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Verifică starea abonamentului la backend
  useEffect(() => {
    if (!token || !isSupported) return;

    fetch(`${API_BASE}/push/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setIsSubscribed(data.subscribed || false);
        if (data.preferences) setPreferences(data.preferences);
      })
      .catch(() => {});
  }, [token, isSupported]);

  const subscribe = useCallback(
    async (prefs?: Partial<PushPreferences>) => {
      if (!isSupported || !token || !VAPID_PUBLIC_KEY) return false;
      setLoading(true);

      try {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== 'granted') {
          setLoading(false);
          return false;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const subJSON = subscription.toJSON();
        const response = await fetch(`${API_BASE}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subscription: {
              endpoint: subJSON.endpoint,
              keys: subJSON.keys,
            },
            preferences: {
              notifyOrderStatus: prefs?.notifyOrderStatus ?? true,
              notifyPromotions: prefs?.notifyPromotions ?? false,
              notifyStreakReminders: prefs?.notifyStreakReminders ?? false,
            },
          }),
        });

        if (response.ok) {
          setIsSubscribed(true);
          setPreferences({
            notifyOrderStatus: prefs?.notifyOrderStatus ?? true,
            notifyPromotions: prefs?.notifyPromotions ?? false,
            notifyStreakReminders: prefs?.notifyStreakReminders ?? false,
          });
          setLoading(false);
          return true;
        }
      } catch (err) {
        console.error('Push subscribe error:', err);
      }

      setLoading(false);
      return false;
    },
    [isSupported, token]
  );

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !token) return false;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch(`${API_BASE}/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setPreferences(null);
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    }

    setLoading(false);
    return true;
  }, [isSupported, token]);

  const updatePreferences = useCallback(
    async (prefs: Partial<PushPreferences>) => {
      if (!token) return;

      try {
        await fetch(`${API_BASE}/push/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prefs),
        });
        setPreferences((prev) => (prev ? { ...prev, ...prefs } : null));
      } catch (err) {
        console.error('Update push preferences error:', err);
      }
    },
    [token]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreferences,
  };
}
