import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { BrandTheme } from '@/components/BrandTheme';
import { LAYOUT } from '@/content/brand';
import { CallFab } from '@/components/CallFab';
import { InstallBanner } from '@/components/InstallBanner';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Article } from '@/pages/Article';
import { Blog } from '@/pages/Blog';
import { CarDetail } from '@/pages/CarDetail';
import { Cars } from '@/pages/Cars';
import { Home } from '@/pages/Home';
import { NotFound } from '@/pages/NotFound';
import { Partners } from '@/pages/Partners';
import { SharedCalculation } from '@/pages/SharedCalculation';
import { ROUTE_PATHS, type RoutePath } from '@/routes';
import { useSiteVariant, type SiteVariant } from '@/site-variant';

/**
 * Какая страница за каким маршрутом. Ключи — весь список из routes.ts:
 * пропустить маршрут или выдумать лишний не даст проверка типов.
 *
 * Корень зависит от версии сайта: на поддомене partners.* главной своего
 * адреса стоит страница партнёрской программы, а не витрина. Остальные
 * маршруты там те же — ссылки шапки и подвала обязаны работать.
 */
function pagesFor(variant: SiteVariant): Record<RoutePath, ReactElement> {
  return {
    '/': variant === 'partners' ? <Partners /> : <Home />,
    '/auto': <Cars />,
    '/auto/:slug': <CarDetail />,
    '/blog': <Blog />,
    '/blog/:slug': <Article />,
    '/rozrahunok/:token': <SharedCalculation />,
  };
}

/**
 * Маршруты дублируются под префиксами языков.
 *
 * Украинский живёт в корне (/auto), русский и английский — с префиксом
 * (/ru/auto, /en/auto). Так канонические адреса основной версии остаются
 * короткими, а у каждого языка свой адрес для поисковика.
 */
function routesFor(variant: SiteVariant) {
  const pages = pagesFor(variant);

  return (
    <>
      {ROUTE_PATHS.map((path) =>
        path === '/' ? (
          <Route key={path} index element={pages[path]} />
        ) : (
          <Route key={path} path={path.slice(1)} element={pages[path]} />
        ),
      )}
      {/* Несуществующий адрес показывает «страницы нет», а не главную:
          сервер по этому же признаку отвечает 404 */}
      <Route path="*" element={<NotFound />} />
    </>
  );
}

export function App() {
  // Версия сайта пришла из хоста (см. server.ts) — у каждого запроса своя
  const routes = routesFor(useSiteVariant());

  const shell = (
    <>
      {/* Цвета и шрифты бренда — до первой отрисовки, не после */}
      <BrandTheme />
      <Header />
      <main>
        <Routes>
          <Route path="/">{routes}</Route>
          <Route path="/ru">{routes}</Route>
          <Route path="/en">{routes}</Route>
        </Routes>
      </main>
      <Footer />
      <CallFab />
      <InstallBanner />
    </>
  );

  /*
    Класс темы вёрстки на корневом элементе: от него пляшет блок `.theme-*`
    в site.css. Обёртки нет вовсе, когда тема классическая, — а не обёртка с
    пустым классом: разметка боевого WestAuto должна остаться ровно той, что
    была до появления тем, вплоть до лишнего <div>.

    Обёртка безобидна для прилипающей шапки и плавающих кнопок: у <div> нет
    ни transform, ни overflow, ни filter, поэтому ни sticky, ни fixed внутри
    него поведения не меняют.
  */
  if (LAYOUT === 'classic') return shell;

  return <div className={`theme-${LAYOUT}`}>{shell}</div>;
}
