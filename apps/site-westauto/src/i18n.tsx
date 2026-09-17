import { createContext, useContext, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  makeT,
  pathForLocale,
  type Locale,
} from '@avtoklyuch/shared';
import { dict, type DictKey } from './content/dict';

interface I18nValue {
  locale: Locale;
  t: (key: DictKey) => string;
  /** Адрес с текущим языком: /auto → /ru/auto */
  href: (path: string) => string;
  /** Код для дат и чисел: uk-UA, ru-UA, en-US */
  tag: string;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: makeT(dict, DEFAULT_LOCALE),
  href: (path) => path,
  tag: LOCALE_TAGS[DEFAULT_LOCALE],
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value: I18nValue = {
    locale,
    t: makeT(dict, locale),
    href: (path) => pathForLocale(path, locale),
    tag: LOCALE_TAGS[locale],
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
