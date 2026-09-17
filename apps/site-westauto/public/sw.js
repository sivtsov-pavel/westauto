/*
 * Service worker публічного сайту.
 *
 * Робить сайт встановлюваним і прискорює повторні відвідування. Дані з /api
 * не кешуються ніколи: ціни й наявність авто змінюються щодня, і показати
 * вчорашню ціну гірше, ніж чесно сказати «немає зв'язку».
 */
const CACHE = 'westauto-shell-v1';
const SHELL = ['/', '/brand/logo-full.png', '/brand/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;
  if (url.pathname.startsWith('/app')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((hit) => hit ?? Response.error())),
    );
    return;
  }

  // Ассети з хешем в імені незмінні — віддаємо з кешу
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/brand/')) {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit ?? fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
      ),
    );
  }
});
