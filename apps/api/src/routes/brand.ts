import type { FastifyInstance } from 'fastify';
import { resolveCrmBrand } from '@avtoklyuch/shared';
import { config } from '../lib/env.js';

/**
 * Бренд экземпляра для CRM. Без авторизации — экран входа открыт тому, кто
 * ещё не вошёл, и узнать название ему нужно до логина, а не после.
 *
 * Отдавать тут нечего секретного: это ровно то, что клиент и так видит на
 * своём сайте. Запись берётся из реестра в shared, а не собирается здесь,
 * чтобы приложение и API говорили об одном и том же наборе полей.
 */
export async function publicBrandRoutes(app: FastifyInstance): Promise<void> {
  // Профиль читается один раз: переменная окружения за время жизни процесса
  // не меняется, а резолвер при неизвестном значении пишет предупреждение —
  // в логе оно должно появиться один раз при старте, а не на каждый запрос
  const brand = resolveCrmBrand(config.BRAND_PROFILE);

  app.get('/', async (_request, reply) => {
    /*
     * Кеш короткий — минута, а не час. Ответ меняется только при
     * перезапуске контейнера с другим .env, но именно это и происходит при
     * настройке нового экземпляра: долгий кеш означал бы, что у настроившего
     * ещё час висит прежнее название и он правит .env по второму разу.
     */
    reply.header('Cache-Control', 'public, max-age=60');
    return brand;
  });

  /*
   * Манифест приложения — тоже по профилю.
   *
   * В образе лежит статический файл с именем АвтоКлюча, и на экземпляре
   * клиента система вставала на телефон под чужим именем. Подменить его при
   * сборке нельзя: образ один на все экземпляры, а профиль задаётся при
   * запуске. Поэтому манифест собирается здесь, а nginx отдаёт по адресу
   * /app/manifest.webmanifest именно этот ответ.
   */
  app.get('/manifest.webmanifest', async (_request, reply) => {
    reply
      .header('Content-Type', 'application/manifest+json; charset=utf-8')
      .header('Cache-Control', 'public, max-age=60');

    // Тёмная панель профиля заодно красит системную строку при запуске:
    // у кого её нет, остаётся прежний цвет оболочки
    const themeColor = brand.darkPanel ?? '#15181C';

    return {
      name: `${brand.name} — расчёт стоимости авто`,
      short_name: brand.name,
      description: 'Внутренний калькулятор стоимости авто с Copart и IAAI под ключ',
      lang: 'ru',
      dir: 'ltr',
      start_url: '/app/',
      scope: '/app/',
      display: 'standalone',
      orientation: 'any',
      background_color: themeColor,
      theme_color: themeColor,
      categories: ['business', 'productivity', 'finance'],
      icons: [
        { src: '/app/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/app/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/app/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      shortcuts: [
        {
          name: 'Новый расчёт',
          url: '/app/',
          icons: [{ src: '/app/icons/icon-192.png', sizes: '192x192' }],
        },
        { name: 'История расчётов', url: '/app/history' },
        { name: 'Тарифы', url: '/app/tariffs' },
      ],
    };
  });
}
