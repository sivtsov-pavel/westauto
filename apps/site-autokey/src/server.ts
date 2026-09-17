import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

/**
 * Сервер публичного сайта.
 *
 * Отдаёт собранную статику и отрисовывает страницы на сервере, чтобы витрина
 * попадала в поисковую выдачу: карточки авто меняются каждый день, и
 * пререндерить их при сборке бессмысленно.
 *
 * Без внешних зависимостей: http из стандартной библиотеки здесь достаточно,
 * а лишний фреймворк на фронтовом сервисе — лишняя поверхность обновлений.
 */

const PORT = Number(process.env['SITE_PORT'] ?? 4173);
const API_URL = process.env['API_URL'] ?? 'http://api:3000';
const DIST = join(process.cwd(), 'apps/site-autokey/dist');
const SSR_ENTRY = join(process.cwd(), 'apps/site-autokey/dist-ssr/entry-server.js');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

interface SsrModule {
  render: (url: string, data: Record<string, unknown>) => {
    html: string;
    meta: { title: string; description: string; canonicalPath: string; noindex?: boolean };
  };
  routeDataRequests: (pathname: string) => { key: string; apiPath: string } | null;
}

const ssr = (await import(SSR_ENTRY)) as SsrModule;
const template = await readFile(join(DIST, 'index.html'), 'utf8');

const server = createServer((req, res) => {
  void handle(req.url ?? '/', req.headers.host)
    .then(({ status, headers, body }) => {
      res.writeHead(status, headers);
      res.end(body);
    })
    .catch((error) => {
      console.error('[site] ошибка отрисовки:', error);
      // Падать целиком нельзя: пусть страница приедет пустым каркасом и
      // дорисуется в браузере — это хуже для поисковика, но не для человека
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(template.replace('<!--app-html-->', ''));
    });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[site] отрисовка на сервере, порт ${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}

async function handle(
  url: string,
  host: string | undefined,
): Promise<{ status: number; headers: Record<string, string>; body: string | Buffer }> {
  const { pathname } = new URL(url, 'http://localhost');

  // Статика: всё, у чего есть расширение и что реально лежит в dist
  if (extname(pathname)) {
    const file = await resolveStatic(pathname);
    if (file) {
      const isHashed = pathname.startsWith('/assets/');
      return {
        status: 200,
        headers: {
          'Content-Type': MIME[extname(pathname)] ?? 'application/octet-stream',
          'Cache-Control': isHashed
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=3600',
        },
        body: await readFile(file),
      };
    }
    return { status: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Not found' };
  }

  // Данные для страницы забираем до отрисовки
  const request = ssr.routeDataRequests(pathname);
  const data: Record<string, unknown> = {};
  let notFound = false;

  if (request) {
    try {
      const response = await fetch(`${API_URL}${request.apiPath}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        data[request.key] = await response.json();
      } else if (response.status === 404) {
        notFound = true;
      }
    } catch (error) {
      // API недоступен — отрисуем каркас, страница доберёт данные сама.
      // Отдать 500 было бы хуже: человек увидел бы ошибку вместо сайта.
      console.warn(
        `[site] данные для ${pathname} не получены:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const { html, meta } = ssr.render(url, data);
  const origin = `${host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https'}://${host ?? 'westauto.com.ua'}`;

  const page = template
    .replace('<!--app-html-->', html)
    .replace('<div id="root">', '<div id="root" data-prerendered="true">')
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*>/,
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
      /<meta\s+property="og:description"[^>]*>/,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    )
    .replace(
      '</head>',
      `${meta.noindex ? '    <meta name="robots" content="noindex, nofollow" />\n' : ''}` +
        `    <script>window.__SSR_DATA__=${serialize(data)}</script>\n  </head>`,
    );

  return {
    status: notFound ? 404 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Витрина меняется часто — короткий кеш с фоновым обновлением
      'Cache-Control': meta.noindex
        ? 'private, no-store'
        : 'public, max-age=60, stale-while-revalidate=300',
    },
    body: page,
  };
}

async function resolveStatic(pathname: string): Promise<string | null> {
  // normalize + проверка префикса: без этого «/../» вывел бы за пределы dist
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
 * JSON внутрь <script>. Закрывающий тег и разделители строк Unicode ломают
 * разбор страницы, поэтому экранируем их, а не полагаемся на удачу.
 */
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
