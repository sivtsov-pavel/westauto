import { Route, Routes } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { CarDetail } from '@/pages/CarDetail';
import { Home } from '@/pages/Home';
import { SharedCalculation } from '@/pages/SharedCalculation';
import { Showcase } from '@/pages/Showcase';

export function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auto" element={<Showcase />} />
          <Route path="/auto/:slug" element={<CarDetail />} />
          {/* Розрахунок, надісланий менеджером клієнту */}
          <Route path="/rozrahunok/:token" element={<SharedCalculation />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
