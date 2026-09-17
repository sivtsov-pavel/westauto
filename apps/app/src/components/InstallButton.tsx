import { useEffect, useState } from 'react';
import { DownloadIcon } from './Icons';

/**
 * Событие установки PWA. В типах TypeScript его нет — браузерный API
 * до сих пор не вошёл в стандарт, хотя поддержан всеми Chromium-браузерами.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Кнопка «Установить приложение».
 *
 * Показывается только когда браузер действительно готов установить: иначе
 * кнопка, которая ничего не делает, раздражает сильнее, чем её отсутствие.
 * После установки исчезает сама.
 */
export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Уже запущено как приложение — предлагать нечего
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const onPrompt = (event: Event) => {
      // Браузер покажет свою панель внизу — перехватываем, чтобы
      // предложить установку там, где она уместна
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !prompt) return null;

  return (
    <button
      type="button"
      className="btn btn-sm"
      title="Поставить на рабочий стол — откроется отдельным окном, без вкладок браузера"
      onClick={() => {
        void prompt.prompt().then(() => setPrompt(null));
      }}
    >
      <DownloadIcon /> Установить приложение
    </button>
  );
}
