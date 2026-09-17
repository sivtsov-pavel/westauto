/*
 * Service worker приложения.
 *
 * Задача у него ровно одна: сделать приложение устанавливаемым и не мешать.
 * Расчёты, тарифы и курс валют обязаны быть свежими, поэтому НИЧЕГО из /api
 * здесь не кешируется — офлайн-режим с устаревшими тарифами опаснее, чем
 * честное сообщение «сервер недоступен».
 *
 * Кешируется только оболочка: шрифты, иконки и собранные ассеты с хешем в
 * имени, которые по определению неизменяемы.
 */

const SHELL_CACHE = 'avk-shell-v1';
const SHELL_FILES = [
  '/app/',
  '/app/icons/icon-192.png',
  '/app/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Один недоступный файл не должен валить установку целиком
      .then((cache) => Promise.allSettled(SHELL_FILES.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Чужие домены и загруженные фото трогать незачем
  if (url.origin !== self.location.origin) return;

  // Данные всегда только из сети: устаревший тариф дороже, чем ожидание
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;

  // Навигация: сеть, при отказе — оболочка из кеша
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/app/').then((hit) => hit ?? Response.error())),
    );
    return;
  }

  // Ассеты с хешем в имени неизменяемы — отдаём из кеша, докладываем в фоне
  if (url.pathname.startsWith('/app/assets/') || url.pathname.startsWith('/app/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
