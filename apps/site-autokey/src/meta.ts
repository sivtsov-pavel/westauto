import { formatMoney } from '@avtoklyuch/shared';
import { BRAND } from './config';

/**
 * Заголовок и описание страницы.
 *
 * Считаются одной функцией и на сервере, и в браузере: иначе разметка,
 * которую видит поисковик, и та, что видит человек, начинают расходиться.
 */
export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  /** Страницу не нужно индексировать */
  noindex?: boolean;
}

export function metaForRoute(pathname: string, data: unknown): PageMeta {
  if (pathname === '/auto') {
    return {
      title: `Авто в наявності та на торгах — ${BRAND.full}`,
      description:
        'Автомобілі з Copart та IAAI: у дорозі, в наявності та на торгах. ' +
        'Ціна «під ключ в Україні» за кожним авто — з доставкою, зборами та розмитненням.',
      canonicalPath: '/auto',
    };
  }

  if (pathname.startsWith('/auto/')) {
    const car = (data as { item?: CarMeta } | null)?.item;
    if (car) {
      const specs = [car.year, car.makeModel].filter(Boolean).join(' ');
      return {
        title: `${specs} — під ключ ${formatMoney(car.turnkeyPriceUsd)} | ${BRAND.full}`,
        description:
          `${specs}: ціна під ключ в Україні ${formatMoney(car.turnkeyPriceUsd)} — ` +
          'ставка, доставка зі США, збори та розмитнення разом. Без доплат на митниці.',
        canonicalPath: pathname,
      };
    }
    return {
      title: `Авто — ${BRAND.full}`,
      description: 'Автомобілі з американських аукціонів під ключ в Україні.',
      canonicalPath: pathname,
    };
  }

  // Персональні розрахунки клієнтів індексувати не можна
  if (pathname.startsWith('/rozrahunok/')) {
    return {
      title: `Ваш розрахунок — ${BRAND.full}`,
      description: 'Персональний розрахунок вартості авто під ключ.',
      canonicalPath: pathname,
      noindex: true,
    };
  }

  return {
    title: `${BRAND.full} — авто з Copart та IAAI під ключ в Україні`,
    description:
      'Підбір лоту на Copart та IAAI, торги від вашого імені, доставка зі США ' +
      'та розмитнення під ключ. Прозорий розрахунок за кожною статтею витрат.',
    canonicalPath: '/',
  };
}

interface CarMeta {
  makeModel: string;
  year: number | null;
  turnkeyPriceUsd: number;
}
