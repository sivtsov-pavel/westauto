import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { localeFromAcceptLanguage, LOCALE_TAGS, type Locale } from '@avtoklyuch/shared';

/**
 * Сервер сайту WestAuto.
 *
 * Віддає зібрану статику і збирає сторінки на сервері: вітрина і статті
 * мають приїжджати пошуковику готовою розміткою, а список авто змінюється
 * щодня, тож пререндер під час збірки тут не годиться.
 */

const PORT = Number(process.env['SITE_PORT'] ?? 4174);
const API_URL = process.env['API_URL'] ?? 'http://api:3000';
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
  render: (url: string, data: Record<string, unknown>) => {
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
  routeDataRequests: (pathname: string) => { key: string; apiPath: string } | null;
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
  const { pathname } = new URL(url, 'http://localhost');

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

  const request = ssr.routeDataRequests(pathname);
  const data: Record<string, unknown> = {};
  let notFound = false;

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

  const { html, meta, locale } = ssr.render(url, data);
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
      '</head>',
      `${alternates}\n` +
        `    <link rel="alternate" hreflang="x-default" href="${escapeHtml(origin + '/')}" />\n` +
        (meta.noindex ? '    <meta name="robots" content="noindex, nofollow" />\n' : '') +
        `    <script>window.__SSR_DATA__=${serialize(data)};window.__PREFERRED_LOCALE__=${JSON.stringify(preferred)}</script>\n  </head>`,
    );

  return {
    status: notFound ? 404 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Language': LOCALE_TAGS[locale],
      Vary: 'Accept-Language',
      'Cache-Control': meta.noindex
        ? 'private, no-store'
        : 'public, max-age=60, stale-while-revalidate=300',
    },
    body: page,
  };
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

function buildOrigin(host: string | undefined): string {
  const clean = (host ?? 'westauto.seoshkin.tools').split(',')[0]!.trim();
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
