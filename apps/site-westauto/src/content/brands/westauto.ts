import type { BrandProfile } from './types';

/**
 * Профиль WestAuto — исходный клиент и профиль по умолчанию.
 *
 * Всё взято с сайта клиента westauto.com.ua. Экземпляр без переменной
 * BRAND_PROFILE работает именно по этому профилю, поэтому любое изменение
 * здесь видно на боевом westauto.com.ua, а не только на демо.
 */
export const westauto = {
  id: 'westauto',

  /**
   * Исходная вёрстка — та, что и была до появления тем.
   *
   * Класса на корневом элементе она не добавляет вовсе, и блок `.theme-*`
   * в стилях её не касается: выдача боевого westauto.com.ua остаётся
   * прежней до байта.
   */
  layout: 'classic',

  brand: {
    name: 'WestAuto',
    legalName: 'WestAuto — USA Auto Group',
    logo: '/brand/logo-full.png',
    logoLight: '/brand/westauto-logo-light.png',
    shield: '/brand/shield.png',
    invertLogoLight: false,
  },

  contacts: {
    phone: '+38 (096) 180-16-90',
    phoneHref: 'tel:+380961801690',
    phoneAlt: null,
    phoneAltHref: null,
    email: 'info@westauto.com.ua',
    hoursKey: 'contacts.hours',
    telegram: 'https://t.me/westauto',
    viber: 'https://bit.ly/3dpD0ol',
    instagram: 'https://www.instagram.com/westauto_comua/',
    facebook: 'https://www.facebook.com/WestAuto.com.ua',
    tiktok: 'https://www.tiktok.com/@westautoukraine',
  },

  /**
   * Цифры компании — подтверждены клиентом 17.09.2026.
   * Не плейсхолдеры: на старом сайте в этих местах стояли нули.
   */
  stats: [
    { value: '9', suffix: '', labelKey: 'stats.years' },
    { value: '3000', suffix: '+', labelKey: 'stats.delivered' },
    { value: '9350', prefix: '$', labelKey: 'stats.avgPrice' },
    { value: '3740', prefix: '$', labelKey: 'stats.avgSaving' },
  ],

  /** Десять шагов маршрута — от выбора лота до номерных знаков. */
  steps: [
    { titleKey: 'step.1', descKey: 'step.1d' },
    { titleKey: 'step.2', descKey: 'step.2d' },
    { titleKey: 'step.3', descKey: 'step.3d' },
    { titleKey: 'step.4', descKey: 'step.4d' },
    { titleKey: 'step.5', descKey: 'step.5d' },
    { titleKey: 'step.6', descKey: 'step.6d' },
    { titleKey: 'step.7', descKey: 'step.7d' },
    { titleKey: 'step.8', descKey: 'step.8d' },
    { titleKey: 'step.9', descKey: 'step.9d' },
    { titleKey: 'step.10', descKey: 'step.10d' },
  ],

  /** Видео с YouTube-канала клиента. */
  videos: [
    { id: 'fal1LIxL97A', titleKey: 'video.passat' },
    { id: 'CpUwFhUttiM', titleKey: 'video.tsi' },
    { id: '93qVsoZrJ7s', titleKey: 'video.compass' },
    { id: 'GurUlXJo-ts', titleKey: 'video.fusion' },
    { id: 'DENOIsAnamE', titleKey: 'video.rogue' },
    { id: 'ch6fIXgIri4', titleKey: 'video.mazda' },
  ],

  /** Отзывы клиентов — с сайта westauto.com.ua. */
  reviews: [
    { nameKey: 'review.name.igor', noteKey: 'review.who.igor', textKey: 'review.igor' },
    { nameKey: 'review.name.oleksandr', noteKey: 'review.who.oleksandr', textKey: 'review.oleksandr' },
    { nameKey: 'review.name.vitalii', noteKey: 'review.who.vitalii', textKey: 'review.vitalii' },
    { nameKey: 'review.name.olena', noteKey: 'review.who.olena', textKey: 'review.olena' },
  ],

  /** Весь корпус материалов — он и написан для этого клиента. */
  articles: [
    'rozmytnennia-avto-zi-ssha-2026',
    'rozmytnennia-avto-z-nimechchyny-2026',
    'hibrydy-2026',
    'yaki-loty-mozhna-kupuvaty',
    'yaki-loty-ne-varto-kupuvaty',
  ],

  /**
   * Палитра снята с логотипа клиента: глубокий флотский синий со щита и
   * красный со слова WEST AUTO. Классическая американская автомобильная пара —
   * именно она делает сайт узнаваемым без единого пояснения.
   *
   * Красный здесь редкость: главные действия, ключевые цифры, акценты. Синий
   * несёт основную массу. Песочный фон вместо чисто белого убирает «дешёвую»
   * яркость и даёт ощущение дорогой бумаги.
   */
  palette: {
    brand: '#1f425e',
    brandDeep: '#13293c',
    brandSoft: '#35607f',
    brandRaise: '#17334a',
    brandDarkest: '#0e1a24',
    accent: '#e22131',
    accentDeep: '#b8121f',
    paper: '#f7f6f3',
    card: '#ffffff',
    sand: '#efece6',
    sandTint: '#f3f1ec',
    sandDeep: '#e7e3db',
    ink: '#14202b',
    inkSoft: '#5b6b78',
    inkFaint: '#8a98a3',
    line: '#e0dcd4',
    lineStrong: '#cdc7bc',
    onDark: '#eef2f5',
    onDarkSoft: '#9fb2c0',
    onDarkMid: '#cfdae2',
    onDarkFaint: '#7d93a4',
    brandRgb: '31 66 94',
    accentRgb: '226 33 49',
    paperRgb: '247 246 243',
    inkRgb: '20 32 43',
    themeColor: '#1f425e',
  },

  /** Значения перенесены из прежнего public/manifest.webmanifest без правок. */
  app: {
    name: 'WestAuto — авто зі США під ключ',
    shortName: 'WestAuto',
    description: 'Викуп, доставка та розмитнення авто з аукціонів США',
    backgroundColor: '#f7f6f3',
    icons: {
      favicon: '/favicon.png',
      appleTouch: '/brand/apple-touch-icon.png',
      icon192: '/brand/icon-192.png',
      icon512: '/brand/icon-512.png',
      maskable512: '/brand/icon-maskable-512.png',
    },
  },

  fonts: {
    display: "'Playfair Display', 'Instrument Serif', Georgia, serif",
    sans: "'Manrope', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
  },

  // overrides нет намеренно: общий словарь написан по текстам этого клиента,
  // перекрывать в нём нечего
} as const satisfies BrandProfile;
