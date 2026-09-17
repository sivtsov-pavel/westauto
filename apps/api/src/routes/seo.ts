import type { FastifyInstance } from 'fastify';
import { query } from '../db/pool.js';
import { config } from '../lib/env.js';

/**
 * robots.txt и sitemap.xml.
 *
 * Карточки витрины рисуются в браузере, поэтому карта сайта здесь не
 * формальность: без неё поисковик не узнает адреса опубликованных авто,
 * потому что ссылок на них с пререндеренной главной нет.
 *
 * Отдаём из API, а не файлом: список авто меняется каждый день, и карта
 * должна меняться вместе с ним, а не при следующей сборке.
 */
export async function seoRoutes(app: FastifyInstance): Promise<void> {
  app.get('/robots.txt', async (request, reply) => {
    const origin = publicOrigin(request.headers.host);

    reply.type('text/plain; charset=utf-8').header('Cache-Control', 'public, max-age=3600');

    // /app — внутренний инструмент, ему в поиске делать нечего.
    // /rozrahunok — персональные ссылки клиентам, их индексировать нельзя.
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /app/',
      'Disallow: /rozrahunok/',
      'Disallow: /api/',
      '',
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n');
  });

  app.get('/sitemap.xml', async (request, reply) => {
    const origin = publicOrigin(request.headers.host);

    const cars = await query<{ slug: string; updated_at: Date }>(
      `SELECT slug, updated_at FROM showcase_items
        WHERE is_published ORDER BY published_at DESC LIMIT 2000`,
    );

    const staticPages: [string, string][] = [
      ['/', 'daily'],
      ['/auto', 'daily'],
    ];

    const urls = [
      ...staticPages.map(([path, freq]) => entry(`${origin}${path}`, null, freq, '1.0')),
      ...cars.map((car) =>
        entry(`${origin}/auto/${car.slug}`, car.updated_at, 'weekly', '0.8'),
      ),
    ];

    reply
      .type('application/xml; charset=utf-8')
      .header('Cache-Control', 'public, max-age=1800');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">'.replace(
        'www.sitemap.org',
        'www.sitemaps.org',
      ),
      ...urls,
      '</urlset>',
      '',
    ].join('\n');
  });
}

function entry(
  loc: string,
  lastmod: Date | null,
  changefreq: string,
  priority: string,
): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Адрес сайта берём из заголовка Host: тогда карта верна и на локальном
 * стенде, и на боевом домене, без отдельной настройки.
 */
function publicOrigin(host: string | undefined): string {
  const clean = (host ?? 'westauto.com.ua').split(',')[0]!.trim();
  const scheme = config.NODE_ENV === 'production' && !clean.includes('localhost') ? 'https' : 'http';
  return `${scheme}://${clean}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
