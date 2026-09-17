/**
 * Бренд і контакти — плейсхолдери з ТЗ.
 * Міняються тут в одному місці, по всьому сайту підхопиться автоматично.
 * Квадратні дужки навмисні: поки значення не підтверджене клієнтом, воно має
 * впадати в око, а не виглядати як справжній телефон.
 */
export const BRAND = {
  prefix: 'Авто',
  accent: 'Ключ',
  full: 'АвтоКлюч',
} as const;

export const CONTACTS = {
  phone: '[+380 __ ___ __ __]',
  email: '[email@avtoklyuch.ua]',
  city: '[Місто], Україна',
} as const;

export const STATS = {
  years: '[7]',
  carsThisYear: '[500+]',
} as const;

export const SITE_URL = 'https://westauto.com.ua';
