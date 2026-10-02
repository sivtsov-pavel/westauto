import { useEffect, useState } from 'react';
import { APP } from '@/content/brand';
import { useI18n } from '@/i18n';
import { CloseIcon } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'wa-install-dismissed';

/** Отказ помним два месяца: за это время человек успевает передумать сам. */
const DISMISS_DAYS = 60;

/** Сколько ждать, если человек читает, но не прокручивает. */
const QUIET_MS = 25_000;

/** Прокрутка, после которой считаем, что страницу начали читать. */
const SCROLLED_PX = 400;

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
 *
 * Но не сразу. Браузер присылает beforeinstallprompt в первые же секунды, и
 * плашка выезжала поверх текста раньше, чем человек успевал понять, куда
 * попал. Предложение на первой секунде первого визита раздражает, а отказ
 * запоминается надолго — поэтому ждём либо прокрутки, либо двадцати пяти
 * секунд: и то и другое означает, что страницу читают.
 */
export function InstallBanner() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  /** Человек успел что-то прочитать — показывать уже не грубо. */
  const [engaged, setEngaged] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isInstalled()) return;
    if (dismissedUntil() > Date.now()) return;

    setDismissed(false);

    const onPrompt = (event: Event) => {
      // Перехватываем браузерное предложение, чтобы показать своё
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPrompt(null);
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // Прокрутка — самый честный признак, что страницу читают; таймер нужен
    // тем, кто читает первый экран не прокручивая
    const onScroll = () => {
      if (window.scrollY >= SCROLLED_PX) setEngaged(true);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = window.setTimeout(() => setEngaged(true), QUIET_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISSED_KEY, String(until));
    } catch {
      // Приватное окно или запрет данных сайта — в этой сессии плашка уже
      // скрыта, а большего мы и не обещали
    }
  }

  if (dismissed || !engaged || !prompt) return null;

  return (
    <div className="install-banner" role="region" aria-label={t('install.title')}>
      {/* Та же иконка, что уедет на домашний экран, — человек должен узнать её */}
      <img src={APP.icons.icon192} alt="" width={44} height={44} />

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
              setDismissed(true);
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

/**
 * Уже установлено — предлагать нечего.
 *
 * Три проверки, а не одна: Chrome на телефоне открывает приложение как
 * standalone, установка на рабочий стол даёт minimal-ui, а старые iOS не
 * знают display-mode вовсе и отвечают только navigator.standalone.
 */
function isInstalled(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** До какого момента человек просил не напоминать. 0 — не просил. */
function dismissedUntil(): number {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(DISMISSED_KEY);
  } catch {
    // В приватном окне сам доступ бросает — считаем, что отказа не было
    return 0;
  }
  if (!stored) return 0;

  // До появления срока здесь лежала единица — такой отказ был бессрочным,
  // и превращать его в «показать прямо сейчас» нельзя: человек уже сказал нет
  if (stored === '1') return Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;

  const until = Number(stored);
  return Number.isFinite(until) ? until : 0;
}
