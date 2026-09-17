import { useEffect } from 'react';

/** Заголовок вкладки для клиентских маршрутов. На сервере его ставит server.ts. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
