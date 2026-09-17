import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { localeFromPath } from '@avtoklyuch/shared';
import { App } from './App';
import { I18nProvider } from './i18n';
import { readClientPayload, SsrProvider } from './ssr-data';
import './styles/site.css';

const container = document.getElementById('root');
if (!container) throw new Error('Не знайдено #root');

const { locale } = localeFromPath(window.location.pathname);

const tree = (
  <StrictMode>
    <I18nProvider locale={locale}>
      <SsrProvider value={readClientPayload()}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SsrProvider>
    </I18nProvider>
  </StrictMode>
);

// Страница пришла отрисованной с сервера — гидратируем, а не рисуем заново
if (container.dataset['prerendered'] === 'true') {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}

// Service worker делает сайт устанавливаемым
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
