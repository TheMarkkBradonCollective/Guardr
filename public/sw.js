// Guardr PWA service worker — push notifications + offline shell (SacramentoBuyNothing-aligned lifecycle)
const CACHE_NAME = 'guardr-cache-v1-0-64';
const WALKIE_CHIRP_SOUND = '/sounds/walkie-chirp.wav';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/logo.png',
  '/logo-64.png',
  '/logo-128.png',
  '/logo-256.png',
  '/logo-wordmark.png',
  '/logo-wordmark-128.png',
  '/logo-wordmark-256.png',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/icons/favicon-light.png',
  '/icons/favicon-dark.png',
  '/icons/apple-touch-icon-light.png',
  '/icons/apple-touch-icon-dark.png',
  '/icons/icon-light-192.png',
  '/icons/icon-dark-192.png',
  '/badge-72.png',
  '/manifest.json',
  WALKIE_CHIRP_SOUND,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn('Offline pre-cache partial:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html')
  );
}

async function networkFirst(request, fallbackUrl = '/index.html') {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = (await caches.match(request)) || (await caches.match(fallbackUrl));
    if (cached) return cached;
    throw new Error('Offline and no cached fallback');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || caches.match('/index.html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  if (url.pathname === '/sw.js' || url.pathname === '/service-worker.js') {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isNavigationRequest(event.request) || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (url.pathname === '/manifest.json') {
    event.respondWith(networkFirst(event.request, '/manifest.json'));
    return;
  }

  if (url.pathname === '/download/version.json') {
    event.respondWith(networkFirst(event.request, '/download/version.json'));
    return;
  }

  if (/\.(js|css|mjs|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

async function refreshPushSubscription() {
  const vapidRes = await fetch('/api/push/vapid-public-key');
  if (!vapidRes.ok) throw new Error('VAPID key unavailable');
  const { publicKey } = await vapidRes.json();
  if (!publicKey) throw new Error('Missing VAPID public key');

  const subscription = await self.registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // DB row is refreshed when the signed-in app calls /api/push/subscribe.
  return subscription;
}

function resolveNotificationUrl(rawUrl) {
  if (!rawUrl) return '/';
  try {
    const parsed = new URL(rawUrl, self.location.origin);
    if (parsed.origin === self.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return '/';
  } catch {
    return rawUrl.startsWith('/') ? rawUrl : '/';
  }
}

function notifyClientsSubscriptionChanged() {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
    }
  });
}

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'Guardr alert', body: event.data.text() };
    }
  }

  const title = payload.title || 'Guardr alert';
  const body =
    String(payload.body || '').trim() ||
    String(payload.title || '').trim() ||
    'You have a new operational update.';
  const options = {
    body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/badge-72.png',
    tag: payload.tag || payload.eventType || payload.data?.type || 'guardr-notification',
    data: {
      url: resolveNotificationUrl(payload.url || payload.data?.url || '/'),
      eventType: payload.eventType || payload.data?.type || '',
      ...(payload.data || {}),
    },
    requireInteraction: payload.priority === 'high' || payload.data?.priority === 'high',
    renotify: true,
    silent: false,
    vibrate:
      payload.priority === 'high' || payload.data?.priority === 'high' ? [200, 100, 200, 100, 200] : undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    refreshPushSubscription()
      .then(() => notifyClientsSubscriptionChanged())
      .catch((err) => {
        console.warn('[sw] push subscription refresh failed:', err);
        return notifyClientsSubscriptionChanged();
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = resolveNotificationUrl(
    event.notification.data?.url || event.notification.data?.destination || '/'
  );

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(targetUrl).then(() => client.focus());
          }
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
