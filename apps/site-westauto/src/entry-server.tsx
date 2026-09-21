import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { localeFromPath, type Locale } from '@avtoklyuch/shared';
import { App } from './App';
import { findArticle } from './content/articles';
import { I18nProvider } from './i18n';
import { metaForRoute, type PageMeta } from './meta';
import { matchRoutePath } from './routes';
import { SsrProvider, type SsrPayload } from './ssr-data';

export function render(
  url: string,
  data: SsrPayload,
): { html: string; meta: PageMeta; locale: Locale } {
  const pathname = new URL(url, 'http://localhost').pathname;
  const { locale, rest } = localeFromPath(pathname);

  const html = renderToString(
    <StrictMode>
      <I18nProvider locale={locale}>
        <SsrProvider value={data}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </SsrProvider>
      </I18nProvider>
    </StrictMode>,
  );

  return { html, meta: metaForRoute(rest, locale, data[rest]), locale };
}

/** Какие данные нужны маршруту. Ключ — путь без языкового префикса. */
export function routeDataRequests(pathname: string): { key: string; apiPath: string } | null {
  const { rest } = localeFromPath(pathname);

  if (rest === '/') return { key: '/', apiPath: '/api/public/showcase?limit=8' };
  if (rest === '/auto') return { key: '/auto', apiPath: '/api/public/showcase?limit=60' };

  if (rest.startsWith('/auto/')) {
    const slug = rest.slice('/auto/'.length);
    if (slug && !slug.includes('/')) {
      return { key: rest, apiPath: `/api/public/showcase/${encodeURIComponent(slug)}` };
    }
  }

  // Персональные расчёты на сервере не готовим: приватные данные не должны
  // оказываться в разметке, которую может закешировать прокси
  return null;
}

/**
 * Существует ли такая страница вообще.
 *
 * Сервер отвечает по этому признаку 404, а не 200. Иначе выдуманный адрес
 * отдаёт главную с кодом «всё хорошо» — для поисковика это копия главной,
 * и таких копий ровно столько, сколько мёртвых ссылок ведёт на сайт.
 *
 * Статьи проверяем здесь же: они лежат рядом, в content/articles. Наличие
 * авто в витрине спрашивает сервер — он и ходит в API.
 */
export function isMissingPage(pathname: string): boolean {
  const { rest } = localeFromPath(pathname);

  if (!matchRoutePath(rest)) return true;
  if (rest.startsWith('/blog/')) return !findArticle(rest.slice('/blog/'.length));

  return false;
}
