import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './state/auth';
import { ToastProvider } from './state/toast';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('Не найден #root');

/*
 * Service worker нужен, чтобы браузер предложил установить приложение.
 * Регистрируем после загрузки страницы: он не должен соревноваться
 * с первой отрисовкой за сеть.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {
      // Без него приложение работает как обычно — просто не устанавливается
    });
  });
}

createRoot(container).render(
  <StrictMode>
    {/* basename: приложение живёт на /app/ рядом с публичным сайтом */}
    <BrowserRouter basename="/app">
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
