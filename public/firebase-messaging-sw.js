importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDEOhENzMU44tQY2cLCICXzmdYTWZDNzN4',
  authDomain: 'cortex-cic.firebaseapp.com',
  projectId: 'cortex-cic',
  storageBucket: 'cortex-cic.firebasestorage.app',
  messagingSenderId: '326336897936',
  appId: '1:326336897936:web:accddf98bcf6b19f194915',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? payload.data?.title ?? 'cortexCic';
  const body = payload.notification?.body ?? payload.data?.body ?? '';
  const url = payload.data?.url;

  self.registration.showNotification(title, {
    body,
    icon: '/img/icon-192.png',
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
