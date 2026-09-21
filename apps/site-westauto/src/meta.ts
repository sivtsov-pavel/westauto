import { formatMoney, LOCALE_TAGS, pathForLocale, type Locale } from '@avtoklyuch/shared';
import { findArticle } from './content/articles';
import { dict } from './content/dict';
import { matchRoutePath } from './routes';

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string;
  noindex?: boolean;
  /** Альтернативные языковые версии — для hreflang */
  alternates: { locale: Locale; path: string }[];
}

/**
 * Заголовок и описание страницы считаются одной функцией и на сервере,
 * и в браузере: иначе разметка для поисковика и для человека расходятся.
 */
export function metaForRoute(path: string, locale: Locale, data: unknown): PageMeta {
  const alternates = (['uk', 'ru', 'en'] as Locale[]).map((code) => ({
    locale: code,
    path: pathForLocale(path, code),
  }));

  const base = (title: string, description: string): PageMeta => ({
    title,
    description,
    canonicalPath: pathForLocale(path, locale),
    alternates,
  });

  const s = (key: keyof typeof dict): string => dict[key][locale];

  // Выдуманный адрес — свой заголовок, а не заголовок главной: иначе в
  // выдаче страницы-призраки не отличить от настоящей главной
  if (!matchRoutePath(path)) {
    return { ...base(`${s('notFound.title')} — WestAuto`, s('notFound.text')), noindex: true };
  }

  if (path === '/auto') {
    return base(`${s('cars.title')} — WestAuto`, s('cars.lead'));
  }

  if (path.startsWith('/auto/')) {
    const car = (data as { item?: CarMeta } | null)?.item;
    if (car) {
      const name = [car.year, car.makeModel].filter(Boolean).join(' ');
      return base(
        `${name} — ${s('cars.turnkey')} ${formatMoney(car.turnkeyPriceUsd)} | WestAuto`,
        `${name}: ${s('cars.turnkey').toLowerCase()} ${formatMoney(car.turnkeyPriceUsd)}. ${s('calc.note')}`,
      );
    }
    return base(`${s('nav.cars')} — WestAuto`, s('cars.lead'));
  }

  if (path === '/blog') {
    return base(`${s('blog.title')} — WestAuto`, s('blog.lead'));
  }

  if (path.startsWith('/blog/')) {
    const article = findArticle(path.slice('/blog/'.length));
    if (article) {
      return base(`${article.title[locale]} — WestAuto`, article.excerpt[locale]);
    }
    // Статьи с таким адресом нет — страница отвечает 404, и заголовок должен
    // говорить то же самое. Заголовок блога здесь вводил бы в заблуждение
    return { ...base(`${s('notFound.title')} — WestAuto`, s('notFound.text')), noindex: true };
  }

  if (path.startsWith('/rozrahunok/')) {
    // Персональные расчёты клиентов в поиске делать нечего
    return { ...base(`${s('shared.title')} — WestAuto`, s('calc.note')), noindex: true };
  }

  return base(
    `WestAuto — ${s('hero.title1')} ${s('hero.title2')} ${s('hero.title3')}`,
    s('hero.lead'),
  );
}

interface CarMeta {
  makeModel: string;
  year: number | null;
  turnkeyPriceUsd: number;
}

export const localeTag = (locale: Locale): string => LOCALE_TAGS[locale];
