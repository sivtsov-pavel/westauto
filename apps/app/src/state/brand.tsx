import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CrmBrand } from '@avtoklyuch/shared';
import { api } from '@/api/client';

/**
 * Бренд экземпляра: имя клиента, цитата и цвета приходят из `GET /api/brand`.
 *
 * `null` означает «ещё не знаю», а не «АвтоКлюч». Это важнее, чем кажется:
 * подставить на время загрузки бренд по умолчанию — значит на миг показать
 * клиенту Larus чужое название ровно на том экране, где складывается первое
 * впечатление о системе. Пока ответа нет, экраны показывают нейтральную
 * заглушку.
 */
const BrandContext = createContext<CrmBrand | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<CrmBrand | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<CrmBrand>('/api/brand')
      .then((data) => {
        if (alive) setBrand(data);
      })
      .catch(() => {
        /*
         * Молчим намеренно. Бренд — оформление: если он не приехал, человек
         * всё равно должен увидеть форму входа и попробовать войти. А если
         * API недоступен целиком, об этом скажет уже сама попытка входа —
         * второе сообщение об одной и той же беде только путает.
         */
      });
    return () => {
      alive = false;
    };
  }, []);

  /*
   * Акцентный цвет подменяется переменной на :root, а не правкой app.css.
   *
   * Инлайновый стиль корня перебивает обе темы — и тёмную, и светлую, —
   * поэтому профиль со своим акцентом получает его везде, где в вёрстке
   * стоит var(--accent). У профиля без своего цвета (accent: null) ничего
   * не трогаем: экземпляр АвтоКлюча обязан выглядеть точно как раньше,
   * а его акцент в app.css для каждой темы свой и одним hex не заменяется.
   */
  useEffect(() => {
    const accent = brand?.accent;
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    // Текст на акцентных кнопках задаётся отдельно: контраст зависит от
    // самого акцента, и на зелёном нужен белый там, где на золотом тёмный
    if (brand?.accentInk) root.style.setProperty('--accent-ink', brand.accentInk);
    return () => {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-ink');
    };
  }, [brand]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

/** Бренд экземпляра или `null`, пока ответ от API не пришёл. */
export function useBrand(): CrmBrand | null {
  return useContext(BrandContext);
}
