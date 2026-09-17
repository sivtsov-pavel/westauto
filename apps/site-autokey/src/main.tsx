import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { readClientPayload, SsrProvider } from './ssr-data';
import './styles/site.css';

const container = document.getElementById('root');
if (!container) throw new Error('Не знайдено #root');

const tree = (
  <StrictMode>
    {/* Данные, подготовленные сервером: страница не запрашивает их заново */}
    <SsrProvider value={readClientPayload()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SsrProvider>
  </StrictMode>
);

// Головна сторінка приходить пререндереною — її гідратуємо, решту монтуємо.
// Без цієї розвилки React або сварився б на розбіжність, або двічі малював розмітку.
// Страница пришла отрисованной с сервера — гидратируем её, а не рисуем заново
if (container.dataset['prerendered'] === 'true') {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
