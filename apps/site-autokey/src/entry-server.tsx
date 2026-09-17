import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './App';
import { metaForRoute, type PageMeta } from './meta';
import { SsrProvider, type SsrPayload } from './ssr-data';

/**
 * Отрисовка страницы на сервере.
 *
 * Публичный сайт обязан отдавать поисковику готовую разметку: карточка авто,
 * которая приезжает пустым <div>, в выдачу не попадёт, а витрина — это
 * основной коммерческий смысл сайта.
 */
export function render(
  url: string,
  data: SsrPayload,
): { html: string; meta: PageMeta } {
  const pathname = new URL(url, 'http://localhost').pathname;

  const html = renderToString(
    <StrictMode>
      <SsrProvider value={data}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </SsrProvider>
    </StrictMode>,
  );

  return { html, meta: metaForRoute(pathname, data[pathname]) };
}

/** Какие данные нужны маршруту. Сервер вызывает это до отрисовки. */
export function routeDataRequests(pathname: string): { key: string; apiPath: string } | null {
  if (pathname === '/') return { key: '/', apiPath: '/api/public/showcase?limit=3' };
  if (pathname === '/auto') return { key: '/auto', apiPath: '/api/public/showcase' };

  if (pathname.startsWith('/auto/')) {
    const slug = pathname.slice('/auto/'.length);
    if (slug && !slug.includes('/')) {
      return { key: pathname, apiPath: `/api/public/showcase/${encodeURIComponent(slug)}` };
    }
  }

  // Персональные расчёты на сервере не готовим: это приватные данные,
  // им незачем оказываться в разметке, которую может закешировать прокси
  return null;
}
