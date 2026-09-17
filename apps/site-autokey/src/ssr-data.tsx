import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Данные, подготовленные на сервере.
 *
 * Страницы витрины должны приезжать поисковику готовой разметкой, а не
 * пустым контейнером — значит, данные нужны ещё до отрисовки. Здесь они
 * кладутся в контекст на сервере и переиспользуются при гидратации,
 * чтобы браузер не запрашивал то же самое повторно.
 *
 * В режиме разработки сервера нет, контекст пуст, и страницы загружают
 * данные сами — поведение не меняется.
 */
export interface SsrPayload {
  /** Ключ — путь, значение — то, что вернул API */
  [path: string]: unknown;
}

const SsrContext = createContext<SsrPayload>({});

export function SsrProvider({
  value,
  children,
}: {
  value: SsrPayload;
  children: ReactNode;
}) {
  return <SsrContext.Provider value={value}>{children}</SsrContext.Provider>;
}

declare global {
  interface Window {
    __SSR_DATA__?: SsrPayload;
  }
}

export function readClientPayload(): SsrPayload {
  if (typeof window === 'undefined') return {};
  return window.__SSR_DATA__ ?? {};
}

/**
 * Данные для страницы: сначала из подготовленных сервером, иначе — запрос.
 *
 * Возвращает состояние загрузки, чтобы страница могла честно показать
 * «загружаю» вместо мигания пустотой.
 */
export function useRouteData<T>(
  key: string,
  fetcher: () => Promise<T>,
): { data: T | null; state: 'loading' | 'ready' | 'error' } {
  const ssr = useContext(SsrContext);
  const preloaded = ssr[key] as T | undefined;

  const [data, setData] = useState<T | null>(preloaded ?? null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(
    preloaded !== undefined ? 'ready' : 'loading',
  );

  useEffect(() => {
    // Сервер уже всё принёс — второй запрос был бы лишним
    if (preloaded !== undefined) {
      setData(preloaded);
      setState('ready');
      return;
    }

    let cancelled = false;
    setState('loading');

    void fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
    // fetcher намеренно не в зависимостях: он пересоздаётся на каждый рендер
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, preloaded]);

  return { data, state };
}
