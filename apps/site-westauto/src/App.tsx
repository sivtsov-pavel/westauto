import { Route, Routes } from 'react-router-dom';
import { CallFab } from '@/components/CallFab';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Article } from '@/pages/Article';
import { Blog } from '@/pages/Blog';
import { CarDetail } from '@/pages/CarDetail';
import { Cars } from '@/pages/Cars';
import { Home } from '@/pages/Home';
import { SharedCalculation } from '@/pages/SharedCalculation';

/**
 * Маршруты дублируются под префиксами языков.
 *
 * Украинский живёт в корне (/auto), русский и английский — с префиксом
 * (/ru/auto, /en/auto). Так канонические адреса основной версии остаются
 * короткими, а у каждого языка свой адрес для поисковика.
 */
const ROUTES = (
  <>
    <Route index element={<Home />} />
    <Route path="auto" element={<Cars />} />
    <Route path="auto/:slug" element={<CarDetail />} />
    <Route path="blog" element={<Blog />} />
    <Route path="blog/:slug" element={<Article />} />
    <Route path="rozrahunok/:token" element={<SharedCalculation />} />
    <Route path="*" element={<Home />} />
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
    </>
  );
}
