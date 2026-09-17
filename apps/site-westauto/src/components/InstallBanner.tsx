import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { CloseIcon } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'wa-install-dismissed';

/**
 * Предложение установить сайт приложением.
 *
 * Появляется только когда браузер действительно готов установить: по https
 * или на localhost, после регистрации service worker. По обычному http
 * установка невозможна в принципе, и плашки не будет — это не поломка.
 *
 * Свою плашку показываем вместо браузерной потому, что браузер решает сам,
 * когда её показать, и часто не показывает вовсе. А ещё её можно закрыть —
 * и мы это запомним: навязываться второй раз невежливо.
 */
export function InstallBanner() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Уже установлено — предлагать нечего
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      // приватный режим — просто покажем
    }
    if (dismissed) return;

    const onPrompt = (event: Event) => {
      // Перехватываем браузерное предложение, чтобы показать своё
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setPrompt(null);
      setHidden(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // не критично
    }
  }

  if (hidden || !prompt) return null;

  return (
    <div className="install-banner" role="region" aria-label={t('install.title')}>
      <img src="/brand/icon-192.png" alt="" width={44} height={44} />

      <div className="stack" style={{ gap: 2, minWidth: 0 }}>
        <strong style={{ fontSize: 15 }}>{t('install.title')}</strong>
        <span className="muted" style={{ fontSize: 13.5 }}>{t('install.text')}</span>
      </div>

      <div className="install-actions">
        <button
          type="button"
          className="btn btn-red btn-sm"
          onClick={() => {
            void prompt.prompt().then(() => {
              setPrompt(null);
              setHidden(true);
            });
          }}
        >
          {t('install.action')}
        </button>
        <button
          type="button"
          className="install-close"
          onClick={dismiss}
          aria-label={t('install.later')}
          title={t('install.later')}
        >
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  );
}
