import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Данные, подготовленные сервером.
 *
 * Страницы витрины и статьи должны приезжать поисковику готовой разметкой,
 * поэтому данные загружаются до отрисовки и переиспользуются при гидратации.
 * В режиме разработки контекст пуст, и страницы грузят данные сами.
 */
export interface SsrPayload { [path: string]: unknown }

const SsrContext = createContext<SsrPayload>({});

export function SsrProvider({ value, children }: { value: SsrPayload; children: ReactNode }) {
  return <SsrContext.Provider value={value}>{children}</SsrContext.Provider>;
}

declare global {
  interface Window { __SSR_DATA__?: SsrPayload }
}

export function readClientPayload(): SsrPayload {
  if (typeof window === 'undefined') return {};
  return window.__SSR_DATA__ ?? {};
}

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
    return () => { cancelled = true; };
    // fetcher пересоздаётся на каждый рендер — в зависимости его не берём
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, preloaded]);

  return { data, state };
}
