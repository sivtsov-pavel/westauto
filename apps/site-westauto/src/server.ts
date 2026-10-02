import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { localeFromAcceptLanguage, LOCALE_TAGS, type Locale } from '@avtoklyuch/shared';
import { APP, BRAND, PALETTE, PROFILE_ID } from './content/brand';
import { legacyTarget } from './legacy';

/**
 * Сервер сайту WestAuto.
 *
 * Віддає зібрану статику і збирає сторінки на сервері: вітрина і статті
 * мають приїжджати пошуковику готовою розміткою, а список авто змінюється
 * щодня, тож пререндер під час збірки тут не годиться.
 */

const PORT = Number(process.env['SITE_PORT'] ?? 4174);
const API_URL = process.env['API_URL'] ?? 'http://api:3000';

/**
 * Профиль бренда этого экземпляра.
 *
 * Сервер собирает страницы сам и профиль берёт из окружения, но в браузере
 * окружения нет — поэтому значение впечатывается в <head> рядом с __SSR_DATA__.
 * Пусто — не впечатываем вовсе: сайт WestAuto должен отдавать ровно ту же
 * разметку, что и до появления профилей.
 */
const BRAND_PROFILE = process.env['BRAND_PROFILE'] ?? '';

/**
 * Экземпляр закрыт от индексации целиком.
 *
 * Демо и копии для показа клиенту в выдаче не нужны: те же тексты на чужом
 * домене — это дубликат, который вредит и клиенту, и нам. Признак сильнее
 * meta.noindex отдельных страниц: тот разрешает индексировать всё остальное.
 */
const NOINDEX_ALL = process.env['SITE_NOINDEX'] === 'true';
const ROOT = process.cwd();
const DIST = join(ROOT, 'apps/site-westauto/dist');
const SSR_ENTRY = join(ROOT, 'apps/site-westauto/dist-ssr/entry-server.js');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

interface SsrModule {
  render: (url: string, data: Record<string, unknown>, variant?: string | null) => {
    html: string;
    locale: Locale;
    meta: {
      title: string;
      description: string;
      canonicalPath: string;
      noindex?: boolean;
      alternates: { locale: Locale; path: string }[];
    };
  };
  routeDataRequests: (
    pathname: string,
    variant?: string | null,
  ) => { key: string; apiPath: string } | null;
  isMissingPage: (pathname: string) => boolean;
}

const ssr = (await import(SSR_ENTRY)) as SsrModule;
const template = await readFile(join(DIST, 'index.html'), 'utf8');

const server = createServer((req, res) => {
  void handle(req.url ?? '/', req.headers.host, req.headers['accept-language'])
    .then(({ status, headers, body }) => {
      res.writeHead(status, headers);
      res.end(body);
    })
    .catch((error) => {
      console.error('[westauto] помилка відтворення:', error);
      // Падати цілком не можна: хай приїде каркас і домалюється в браузері
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(template.replace('<!--app-html-->', ''));
    });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[westauto] сервер сайту на порту ${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

async function handle(
  url: string,
  host: string | undefined,
  acceptLanguage: string | undefined,
): Promise<{ status: number; headers: Record<string, string>; body: string | Buffer }> {
  const { pathname, search } = new URL(url, 'http://localhost');

  // Адреса прежнего сайта компании — до разбора косой: в старых ссылках она
  // стоит почти всегда, и без этого каждый такой переход шёл бы двумя
  // прыжками вместо одного
  const legacy = legacyTarget(pathname);
  if (legacy) {
    return { status: 301, headers: { Location: legacy }, body: '' };
  }

  // Хвостовая косая — для поисковика отдельный адрес, а в старых ссылках она
  // стоит почти всегда. Поэтому не 404, а перевод на канонический адрес:
  // иначе /auto/ и /auto — две страницы с одним содержимым.
  if (pathname !== '/' && pathname.endsWith('/')) {
    return {
      status: 301,
      headers: { Location: (pathname.replace(/\/+$/, '') || '/') + search },
      body: '',
    };
  }

  // Оболочка приложения собирается по профилю, поэтому идёт до статики:
  // одноимённые файлы в dist её бы перекрыли
  if (pathname === '/manifest.webmanifest') {
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
      body: buildManifest(),
    };
  }

  if (pathname === '/sw.js') {
    const source = await readFile(join(DIST, 'sw.js'), 'utf8');
    return {
      status: 200,
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        // no-cache, а не max-age: иначе старый worker живёт у человека
        // сутками и правки оболочки до него не доезжают
        'Cache-Control': 'no-cache',
        'Service-Worker-Allowed': '/',
      },
      body: brandSw(source),
    };
  }

  if (extname(pathname)) {
    const file = await resolveStatic(pathname);
    if (file) {
      const immutable = pathname.startsWith('/assets/');
      return {
        status: 200,
        headers: {
          'Content-Type': MIME[extname(pathname)] ?? 'application/octet-stream',
          'Cache-Control': immutable
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=3600',
        },
        body: await readFile(file),
      };
    }
    return { status: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Not found' };
  }

  // Версия сайта — из хоста запроса: partners.<домен> отдаёт в корне
  // партнёрскую страницу, сам домен — прежнюю главную
  const variant = siteVariant(host);

  const request = ssr.routeDataRequests(pathname, variant);
  const data: Record<string, unknown> = {};
  // Несуществующий маршрут и пропавшая статья видны сразу, без похода в API
  let notFound = ssr.isMissingPage(pathname);

  if (request) {
    try {
      const response = await fetch(`${API_URL}${request.apiPath}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) data[request.key] = await response.json();
      else if (response.status === 404) notFound = true;
    } catch (error) {
      // API недоступний — віддамо каркас, сторінка добере дані сама
      console.warn(
        `[westauto] дані для ${pathname} не отримано:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const { html, meta, locale } = ssr.render(url, data, variant);
  const origin = buildOrigin(host);

  // Мова, якій відвідувач надає перевагу — підказка, а не примус:
  // редиректи за Accept-Language ламають прямі посилання й кешування
  const preferred = localeFromAcceptLanguage(acceptLanguage);

  const alternates = meta.alternates
    .map((alt) => `    <link rel="alternate" hreflang="${alt.locale}" href="${escapeHtml(origin + alt.path)}" />`)
    .join('\n');

  const page = template
    .replace('<!--app-html-->', html)
    .replace('<div id="root">', '<div id="root" data-prerendered="true">')
    .replace('<html lang="uk">', `<html lang="${LOCALE_TAGS[locale].split('-')[0]}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    )
    .replace(
      /<link rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${escapeHtml(origin + meta.canonicalPath)}" />`,
    )
    .replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    )
    .replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    )
    .replace(
      /<meta property="og:site_name"[^>]*>/,
      `<meta property="og:site_name" content="${escapeHtml(BRAND.name)}" />`,
    )
    .replace(
      /<meta name="apple-mobile-web-app-title"[^>]*>/,
      `<meta name="apple-mobile-web-app-title" content="${escapeHtml(BRAND.name)}" />`,
    )
    .replace(
      /<link rel="icon"[^>]*>/,
      `<link rel="icon" type="image/png" href="${escapeHtml(APP.icons.favicon)}" />`,
    )
    .replace(
      /<link rel="apple-touch-icon"[^>]*>/,
      `<link rel="apple-touch-icon" href="${escapeHtml(APP.icons.appleTouch)}" />`,
    )
    .replace(
      /<meta name="theme-color"[^>]*>/,
      `<meta name="theme-color" content="${escapeHtml(PALETTE.themeColor)}" />`,
    )
    .replace(
      '</head>',
      `${alternates}\n` +
        `    <link rel="alternate" hreflang="x-default" href="${escapeHtml(origin + '/')}" />\n` +
        (meta.noindex || NOINDEX_ALL
          ? '    <meta name="robots" content="noindex, nofollow" />\n'
          : '') +
        `    <script>window.__SSR_DATA__=${serialize(data)};window.__PREFERRED_LOCALE__=${JSON.stringify(preferred)}` +
        // serialize, а не голый JSON.stringify: он же гасит «<» и разделители
        // строк, которые внутри <script> сломали бы разбор страницы
        (BRAND_PROFILE ? `;window.__BRAND_PROFILE__=${serialize(BRAND_PROFILE)}` : '') +
        // Версия сайта — тем же способом, что профиль: заголовка Host в
        // браузере нет, а гидратация обязана собрать то же дерево, что
        // пришло с сервера. Впечатывается то, что сказал Host, а показывать
        // ли по нему партнёрскую страницу, решает resolveVariant — одна
        // функция на оба конца, поэтому разойтись им нечем
        (variant ? `;window.__SITE_VARIANT__=${serialize(variant)}` : '') +
        `</script>\n  </head>`,
    );

  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Language': LOCALE_TAGS[locale],
    Vary: 'Accept-Language',
    'Cache-Control': meta.noindex
      ? 'private, no-store'
      : 'public, max-age=60, stale-while-revalidate=300',
  };

  // Заголовком, а не только метатегом: метатег виден лишь тому, кто разобрал
  // страницу, а заголовок действует и на картинки, и на ответы без разметки
  if (NOINDEX_ALL) headers['X-Robots-Tag'] = 'noindex, nofollow';

  return { status: notFound ? 404 : 200, headers, body: page };
}

/**
 * Манифест приложения — маршрутом, а не файлом из каталога статики.
 *
 * Имя, иконки и цвета у каждого клиента свои, а файл в public один на образ:
 * экземпляр Larus предлагал бы установить приложение с иконкой WestAuto. Из
 * корня он отдаётся и по второй причине — область действия ограничена
 * каталогом, из которого файл отдан, и манифест из /brand/ накрывал бы только
 * /brand/.
 */
function buildManifest(): string {
  return JSON.stringify(
    {
      name: APP.name,
      short_name: APP.shortName,
      description: APP.description,
      lang: 'uk',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: APP.backgroundColor,
      theme_color: PALETTE.themeColor,
      categories: ['business', 'shopping', 'travel'],
      icons: [
        { src: APP.icons.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: APP.icons.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: APP.icons.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Авто в наявності', url: '/auto' },
        { name: 'Корисне', url: '/blog' },
      ],
    },
    null,
    2,
  );
}

/**
 * Service worker с подстановкой профиля.
 *
 * Имя кеша обязано включать профиль: без этого у клиента в кеше оболочки
 * осталась бы главная WestAuto, и вычистить её можно было бы только сменой
 * версии вручную. Сам файл при этом остаётся рабочим сам по себе — в режиме
 * разработки он отдаётся как есть, и подставлять там нечего.
 */
function brandSw(source: string): string {
  return source
    .replace(/const CACHE = '[^']*';/, `const CACHE = '${PROFILE_ID}-shell-v1';`)
    .replace(
      /const SHELL = \[[^\]]*\];/,
      `const SHELL = ${JSON.stringify(['/', BRAND.logo, APP.icons.icon192])};`,
    );
}

async function resolveStatic(pathname: string): Promise<string | null> {
  // normalize + перевірка префікса: без цього «/../» вивів би за межі dist
  const target = normalize(join(DIST, pathname));
  if (!target.startsWith(DIST)) return null;
  try {
    const info = await stat(target);
    return info.isFile() ? target : null;
  } catch {
    return null;
  }
}

/**
 * Какую версию сайта спрашивают — по заголовку Host.
 *
 * Роутер проксирует и laruslogistics.seoshkin.tools, и
 * partners.laruslogistics.seoshkin.tools в один и тот же контейнер, поэтому
 * отличить адреса можно только здесь. Сравниваем первую метку имени целиком,
 * а не ищем подстроку: домен вида partners-auto.example поддоменом партнёров
 * не является, и отдавать ему чужую главную нельзя.
 *
 * Возвращается строка-признак, а не готовый тип: решение, показывать ли
 * партнёрскую страницу этому бренду вообще, принимает site-variant.ts — одно
 * место и для сервера, и для браузера.
 */
function siteVariant(host: string | undefined): string | null {
  // Host бывает списком при цепочке прокси, и почти всегда с портом
  const clean = (host ?? '').split(',')[0]!.trim().toLowerCase().split(':')[0] ?? '';
  return clean.split('.')[0] === 'partners' ? 'partners' : null;
}

function buildOrigin(host: string | undefined): string {
  const clean = (host ?? 'westauto.com.ua').split(',')[0]!.trim();
  const local = clean.includes('localhost') || clean.startsWith('127.') || clean.includes(':8081');
  return `${local ? 'http' : 'https'}://${clean}`;
}

/** JSON усередину <script>: екрануємо те, що ламає розбір сторінки. */
function serialize(data: unknown): string {
  return JSON.stringify(data ?? {})
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
