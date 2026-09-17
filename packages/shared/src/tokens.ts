/**
 * Дизайн-токены из tz/design-tokens.json.
 * Сайт — светлая тёплая тема, приложение — тёмный графит, общий акцент.
 * В CSS они же продублированы переменными; здесь — для мест, где цвет нужен
 * в JS (сегментированная шкала, инлайновые SVG, генерация PNG).
 */

export const SITE_COLORS = {
  paper: '#F4EFE6',
  card: '#FBF8F2',
  ink: '#1B1D1F',
  inkSoft: '#746C5F',
  line: '#E2D9C6',
  accent: '#B8863E',
  accentDeep: '#8C6A34',
  teal: '#2F5C56',
  tealBg: '#E7EEEA',
} as const;

export const APP_COLORS = {
  ink: '#15181C',
  surface: '#1D2126',
  surface2: '#23282E',
  surface3: '#2A303A',
  border: '#323844',
  text: '#F1EDE4',
  textSoft: '#98938A',
  textFaint: '#6B655A',
  accent: '#C49A52',
  teal: '#4F8F86',
  tealBg: 'rgba(79,143,134,0.14)',
  violet: '#7E7BAE',
} as const;

/** Светлая тема приложения — производная от палитры сайта. */
export const APP_LIGHT_COLORS = {
  ink: '#F4EFE6',
  surface: '#FBF8F2',
  surface2: '#F1EBDF',
  surface3: '#E9E2D2',
  border: '#E2D9C6',
  text: '#1B1D1F',
  textSoft: '#746C5F',
  textFaint: '#9A9083',
  accent: '#8C6A34',
  teal: '#2F5C56',
  tealBg: 'rgba(47,92,86,0.10)',
  violet: '#5F5C8C',
} as const;

export const FONTS = {
  googleFontsHref:
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
  display: "'Instrument Serif', Georgia, serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const BRAND = {
  /** Плейсхолдер — меняется в одном месте */
  name: 'АвтоКлюч',
  namePrefix: 'Авто',
  nameAccent: 'Ключ',
} as const;
