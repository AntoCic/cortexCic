import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from './firebase';

function buildAbsoluteUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return undefined;
  }
}

export const useForegroundPushNotifications = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      if (Notification.permission !== 'granted') {
        return;
      }

      const title = payload.notification?.title ?? payload.data?.title ?? 'cortexCic';
      const body = payload.notification?.body ?? payload.data?.body ?? '';
      const absoluteUrl = buildAbsoluteUrl(payload.data?.url);
      const notification = new Notification(title, {
        body,
        icon: '/img/icon-192.png',
        data: { url: absoluteUrl },
      });

      notification.onclick = () => {
        const nextUrl = notification.data?.url as string | undefined;
        window.focus();
        if (nextUrl) {
          window.location.assign(nextUrl);
        }
        notification.close();
      };
    });

    return unsubscribe;
  }, []);
};
