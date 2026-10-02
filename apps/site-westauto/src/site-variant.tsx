import { createContext, useContext, type ReactNode } from 'react';
import { LAYOUT } from '@/content/brand';

/**
 * Какую версию сайта отдаём на этом адресе.
 *
 * `main` — обычный сайт бренда. `partners` — тот же сайт, но на поддомене
 * partners.*: главной своего адреса там стоит страница «Стати партнером».
 *
 * Признак живёт в контексте, а не модульной переменной, в отличие от профиля
 * бренда: профиль у экземпляра один на всю жизнь процесса, а хостов процесс
 * обслуживает несколько — и partners.laruslogistics…, и laruslogistics…
 * приходят в один и тот же контейнер. Модульная переменная здесь означала бы,
 * что первый запрос решает, что увидят все остальные.
 */
export type SiteVariant = 'main' | 'partners';

/**
 * Признак из запроса — в версию сайта.
 *
 * Партнёрская страница — часть темы larus, поэтому у остальных профилей она
 * не появляется ни по какому хосту: проверка здесь, в одном месте, а не в
 * вёрстке. Иначе достаточно завести экземпляру WestAuto поддомен partners.*,
 * и в выдаче окажется страница про чужую партнёрскую программу.
 */
export function resolveVariant(raw: string | null | undefined): SiteVariant {
  if (raw !== 'partners') return 'main';
  return LAYOUT === 'larus' ? 'partners' : 'main';
}

const SiteVariantContext = createContext<SiteVariant>('main');

export function SiteVariantProvider({
  value,
  children,
}: {
  value: SiteVariant;
  children: ReactNode;
}) {
  return <SiteVariantContext.Provider value={value}>{children}</SiteVariantContext.Provider>;
}

export function useSiteVariant(): SiteVariant {
  return useContext(SiteVariantContext);
}

declare global {
  interface Window {
    __SITE_VARIANT__?: string;
  }
}

/** Что сервер впечатал в <head> — в браузере окружения нет. */
export function readClientVariant(): SiteVariant {
  if (typeof window === 'undefined') return 'main';
  return resolveVariant(window.__SITE_VARIANT__);
}
