/**
 * Языки публичных сайтов.
 *
 * Украинский по умолчанию — этого требует закон про мову для бизнеса в
 * Украине. Русский нужен сложившейся аудитории клиента, английский — для
 * диаспоры и американских партнёров по аукционам.
 *
 * Внутреннее приложение остаётся русским: им пользуются сотрудники, и
 * переключать там язык незачем.
 */

export type Locale = 'uk' | 'ru' | 'en';

export const LOCALES: Locale[] = ['uk', 'ru', 'en'];

export const DEFAULT_LOCALE: Locale = 'uk';

export const LOCALE_LABELS: Record<Locale, string> = {
  uk: 'Укр',
  ru: 'Рус',
  en: 'Eng',
};

/** Полные названия — для атрибута lang и для подписей в меню выбора. */
export const LOCALE_NAMES: Record<Locale, string> = {
  uk: 'Українська',
  ru: 'Русский',
  en: 'English',
};

/** Коды для тега <html lang> и для форматирования дат и чисел. */
export const LOCALE_TAGS: Record<Locale, string> = {
  uk: 'uk-UA',
  ru: 'ru-UA',
  en: 'en-US',
};

/**
 * Словарь: одна запись на строку, три варианта.
 *
 * Держим переводы рядом, а не в трёх отдельных файлах: так забытый перевод
 * виден сразу при чтении, а не всплывает пустотой на живом сайте.
 */
export type Dict<K extends string> = Record<K, Record<Locale, string>>;

/** Достаёт строку словаря; при отсутствии перевода честно падает на украинский. */
export function translate<K extends string>(
  dict: Dict<K>,
  key: K,
  locale: Locale,
): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[locale] || entry[DEFAULT_LOCALE] || key;
}

/** Готовая функция перевода для конкретного языка. */
export function makeT<K extends string>(dict: Dict<K>, locale: Locale) {
  return (key: K): string => translate(dict, key, locale);
}

/**
 * Язык из адреса: /ru/..., /en/... Украинский живёт в корне, без префикса —
 * так канонические адреса основной версии остаются короткими.
 */
export function localeFromPath(pathname: string): { locale: Locale; rest: string } {
  const match = /^\/(ru|en)(\/|$)/.exec(pathname);
  if (match) {
    const locale = match[1] as Locale;
    const rest = pathname.slice(match[1]!.length + 1) || '/';
    return { locale, rest };
  }
  return { locale: DEFAULT_LOCALE, rest: pathname };
}

/** Собирает адрес с нужным языком: ('/auto', 'ru') → '/ru/auto' */
export function pathForLocale(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** Предпочитаемый язык из заголовка Accept-Language. */
export function localeFromAcceptLanguage(header: string | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const lower = header.toLowerCase();
  // Порядок важен: украинский первым, чтобы «uk,ru» дал украинский
  for (const locale of LOCALES) {
    if (lower.includes(locale)) return locale;
  }
  return DEFAULT_LOCALE;
}
