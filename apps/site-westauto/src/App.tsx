import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
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
import { SharedCalculation } from '@/pages/SharedCalculation';
import { ROUTE_PATHS, type RoutePath } from '@/routes';

/** Какая страница за каким маршрутом. Ключи — весь список из routes.ts:
 *  пропустить маршрут или выдумать лишний не даст проверка типов. */
const PAGES: Record<RoutePath, ReactElement> = {
  '/': <Home />,
  '/auto': <Cars />,
  '/auto/:slug': <CarDetail />,
  '/blog': <Blog />,
  '/blog/:slug': <Article />,
  '/rozrahunok/:token': <SharedCalculation />,
};

/**
 * Маршруты дублируются под префиксами языков.
 *
 * Украинский живёт в корне (/auto), русский и английский — с префиксом
 * (/ru/auto, /en/auto). Так канонические адреса основной версии остаются
 * короткими, а у каждого языка свой адрес для поисковика.
 */
const ROUTES = (
  <>
    {ROUTE_PATHS.map((path) =>
      path === '/' ? (
        <Route key={path} index element={PAGES[path]} />
      ) : (
        <Route key={path} path={path.slice(1)} element={PAGES[path]} />
      ),
    )}
    {/* Несуществующий адрес показывает «страницы нет», а не главную:
        сервер по этому же признаку отвечает 404 */}
    <Route path="*" element={<NotFound />} />
  </>
);

export function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/">{ROUTES}</Route>
          <Route path="/ru">{ROUTES}</Route>
          <Route path="/en">{ROUTES}</Route>
        </Routes>
      </main>
      <Footer />
      <CallFab />
      <InstallBanner />
    </>
  );
}
