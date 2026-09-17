import { useEffect } from 'react';

/**
 * Заголовок вкладки для клієнтських маршрутів.
 * Головна сторінка пререндериться і має свій <title> у розмітці — тут лише
 * динамічні сторінки вітрини.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
