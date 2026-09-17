/**
 * Бренд и контакты WestAuto.
 *
 * Всё взято с сайта клиента westauto.com.ua. Меняется здесь в одном месте.
 */
export const BRAND = {
  name: 'WestAuto',
  legalName: 'WestAuto — USA Auto Group',
  logo: '/brand/logo-full.png',
  logoLight: '/brand/westauto-logo-light.png',
  shield: '/brand/shield.png',
} as const;

export const CONTACTS = {
  phone: '+38 (096) 180-16-90',
  phoneHref: 'tel:+380961801690',
  email: 'info@westauto.com.ua',
  hoursKey: 'contacts.hours',
  telegram: 'https://t.me/westauto',
  viber: 'https://bit.ly/3dpD0ol',
  instagram: 'https://www.instagram.com/westauto_comua/',
  facebook: 'https://www.facebook.com/WestAuto.com.ua',
  tiktok: 'https://www.tiktok.com/@westautoukraine',
} as const;

/**
 * Цифры компании — подтверждены клиентом 17.09.2026.
 * Не плейсхолдеры: на старом сайте в этих местах стояли нули.
 */
export const STATS = [
  { value: '9', suffix: '', labelKey: 'stats.years' },
  { value: '3000', suffix: '+', labelKey: 'stats.delivered' },
  { value: '9350', prefix: '$', labelKey: 'stats.avgPrice' },
  { value: '3740', prefix: '$', labelKey: 'stats.avgSaving' },
] as const;

/** Видео с YouTube-канала клиента. */
export const VIDEOS = [
  { id: 'fal1LIxL97A', titleKey: 'video.passat' },
  { id: 'CpUwFhUttiM', titleKey: 'video.tsi' },
  { id: '93qVsoZrJ7s', titleKey: 'video.compass' },
  { id: 'GurUlXJo-ts', titleKey: 'video.fusion' },
  { id: 'DENOIsAnamE', titleKey: 'video.rogue' },
  { id: 'ch6fIXgIri4', titleKey: 'video.mazda' },
] as const;

/** Отзывы клиентов — с сайта westauto.com.ua. */
export const REVIEWS = [
  { name: 'Ігор', car: 'VW Passat', textKey: 'review.igor' },
  { name: 'Олександр', car: 'Ford Fusion', textKey: 'review.oleksandr' },
  { name: 'Віталій', car: 'Jeep Compass', textKey: 'review.vitalii' },
  { name: 'Олена', car: 'Audi A6', textKey: 'review.olena' },
] as const;
