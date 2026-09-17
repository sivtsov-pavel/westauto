/**
 * Доменные типы, общие для API, внутреннего приложения и публичного сайта.
 * Единственный источник правды по формам данных — держим здесь.
 */

// ─── Пользователи и роли ─────────────────────────────────────────────────────
// Сами роли и права живут в roles.ts

import type { CommissionType, Role } from './roles.js';

export interface User {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  /** Персональная скидка (+) / наценка (−) к доставке, в процентах. −5 = скидка 5%. */
  deliveryDiscountPercent: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Справочники лота ────────────────────────────────────────────────────────

export type Platform = 'copart' | 'iaai' | 'copart_uk' | 'copart_ca' | 'iaai_ca' | 'manheim';

export const PLATFORM_LABELS: Record<Platform, string> = {
  copart: 'Copart',
  iaai: 'IAAI',
  copart_uk: 'Copart UK',
  copart_ca: 'Copart Canada',
  iaai_ca: 'IAAI Canada',
  manheim: 'Manheim',
};

/**
 * Страна отправления. Влияет на логистику и на то, какие тарифы доставки
 * имеет смысл заводить: из Канады и Британии машины едут иначе, чем из США.
 */
export const PLATFORM_COUNTRY: Record<Platform, string> = {
  copart: 'США',
  iaai: 'США',
  copart_uk: 'Великобритания',
  copart_ca: 'Канада',
  iaai_ca: 'Канада',
  manheim: 'США',
};

/** Площадки, по которым система умеет читать публичную страницу лота. */
export const PLATFORMS_WITH_LOT_FETCH: Platform[] = [
  'copart',
  'iaai',
  'copart_uk',
  'copart_ca',
  'iaai_ca',
];

/** Вид авто — влияет на надбавку к доставке (тариф ищется по локации + виду). */
export type VehicleKind =
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'coupe'
  | 'minivan'
  | 'motorcycle'
  | 'truck';

export const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = {
  sedan: 'Седан',
  suv: 'Внедорожник',
  pickup: 'Пикап',
  coupe: 'Купе',
  minivan: 'Минивэн',
  motorcycle: 'Мотоцикл',
  truck: 'Грузовик',
};

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export const FUEL_LABELS: Record<FuelType, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Электро',
  hybrid: 'Гибрид',
};

/** car_type в терминах baza-gai.com.ua */
export type CarType = 'car' | 'electric' | 'hybrid' | 'motorcycle' | 'truck';

export type Currency = 'USD' | 'EUR' | 'UAH';

// ─── Тарифы ──────────────────────────────────────────────────────────────────

export interface DeliveryTariff {
  id: string;
  platform: Platform;
  /** Штат / город / площадка, например «Texas» */
  location: string;
  vehicleKind: VehicleKind;
  amountUsd: number;
  isActive: boolean;
  updatedAt: string;
  updatedByName: string | null;
}

export interface AuctionFeeTariff {
  id: string;
  platform: Platform;
  bidFrom: number;
  /** null = «и выше» */
  bidTo: number | null;
  /** Фиксированный сбор в USD */
  feeAmount: number;
  /** Дополнительный процент от ставки, если площадка берёт процент (0 = нет) */
  feePercent: number;
  isActive: boolean;
  updatedAt: string;
  updatedByName: string | null;
}

// ─── Настройки (значения по умолчанию) ───────────────────────────────────────

export interface CalcSettings {
  /** Комплекс, USD */
  complex: number;
  /** Сертификация, USD */
  certification: number;
  /** Комиссия компании, USD */
  commission: number;
  /** Swift, % от (ставка + аукционный сбор) */
  swiftPercent: number;
  /** Страховка фрахта, % от ставки */
  freightInsurancePercent: number;
  /** Портовые расходы (хендлинг), USD — отдельно от доставки */
  portHandling: number;
  /**
   * Экологический сбор, USD.
   * По умолчанию 0: в ответе baza-gai.com.ua растаможка уже приходит итоговой
   * суммой платежей, и отдельная строка легко приводит к задвоению.
   * Включать осознанно.
   */
  ecoFee: number;
  /** Маржа по умолчанию, USD — скрытая строка, в клиентскую карточку не выводится */
  marginDefault: number;
}

export const DEFAULT_SETTINGS: CalcSettings = {
  complex: 180,
  certification: 150,
  commission: 280,
  swiftPercent: 1.5,
  freightInsurancePercent: 1.5,
  portHandling: 0,
  ecoFee: 0,
  marginDefault: 0,
};

// ─── Строки расчёта ──────────────────────────────────────────────────────────

export type LineKey =
  | 'bid'
  | 'delivery'
  | 'auctionFee'
  | 'portHandling'
  | 'freightInsurance'
  | 'customs'
  | 'ecoFee'
  | 'complex'
  | 'certification'
  | 'commission'
  | 'swift'
  | 'margin';

/** Откуда взялось значение строки — показывается цветной точкой в интерфейсе. */
export type LineSource =
  /** ввёл пользователь (ставка) */
  | 'input'
  /** из таблицы тарифов */
  | 'tariff'
  /** живой ответ baza-gai.com.ua */
  | 'api'
  /** последний успешный ответ API из кеша, «не обновлено» */
  | 'api-cached'
  /** локальная оценочная формула — API недоступен или нет ключа */
  | 'estimate'
  /** значение по умолчанию из настроек */
  | 'settings'
  /** вычисляется формулой (swift, страховка) */
  | 'computed'
  /** менеджер вписал руками поверх всего */
  | 'manual';

/** Группировка для сегментированной шкалы и клиентской карточки. */
export type LineGroup = 'bid' | 'deliveryAndFees' | 'customs' | 'services';

export const LINE_GROUP_LABELS: Record<LineGroup, string> = {
  bid: 'Ставка',
  deliveryAndFees: 'Доставка и сборы',
  customs: 'Растаможка',
  services: 'Сертификация и услуги',
};

export const LINE_GROUP_COLORS: Record<LineGroup, string> = {
  bid: '#7C848F',
  deliveryAndFees: '#4F8F86',
  customs: '#C49A52',
  services: '#7E7BAE',
};

export const LINE_GROUP_OF: Record<LineKey, LineGroup> = {
  bid: 'bid',
  delivery: 'deliveryAndFees',
  auctionFee: 'deliveryAndFees',
  portHandling: 'deliveryAndFees',
  freightInsurance: 'deliveryAndFees',
  customs: 'customs',
  ecoFee: 'customs',
  complex: 'services',
  certification: 'services',
  commission: 'services',
  swift: 'services',
  margin: 'services',
};

export const LINE_LABELS: Record<LineKey, string> = {
  bid: 'Ставка',
  delivery: 'Доставка',
  auctionFee: 'Аукционный сбор',
  portHandling: 'Портовые расходы',
  freightInsurance: 'Страховка фрахта',
  customs: 'Растаможка',
  ecoFee: 'Экологический сбор',
  complex: 'Комплекс',
  certification: 'Сертификация',
  commission: 'Комиссия',
  swift: 'Swift',
  margin: 'Маржа',
};

/** Порядок строк в интерфейсе расчёта. */
export const LINE_ORDER: LineKey[] = [
  'bid',
  'delivery',
  'auctionFee',
  'portHandling',
  'freightInsurance',
  'customs',
  'ecoFee',
  'complex',
  'certification',
  'commission',
  'swift',
  'margin',
];

export interface CalcLine {
  key: LineKey;
  label: string;
  group: LineGroup;
  source: LineSource;
  /** Итоговая сумма строки в USD (уже с учётом override и скидки) */
  amount: number;
  /** Базовое значение до ручной правки — чтобы показать «было / стало» */
  baseAmount: number | null;
  /** Строка учтена в итоге */
  enabled: boolean;
  /** Строка правится руками */
  editable: boolean;
  /** Видна только сотрудникам, в клиентскую карточку не попадает */
  internalOnly: boolean;
  /** Пояснение под строкой: «TX, седан · тариф $1 640 · −5%» */
  note: string | null;
}

// ─── Вход и выход движка расчёта ─────────────────────────────────────────────

export interface LotInfo {
  lotNumber: string | null;
  vin: string | null;
  makeModel: string | null;
  year: number | null;
  /** Объём двигателя в литрах, например 2.0 */
  engineVolume: number | null;
  /** Ёмкость батареи, кВт·ч — для электро */
  batteryPower: number | null;
  fuel: FuelType;
  platform: Platform;
  /** Штат / город аукциона */
  location: string;
  vehicleKind: VehicleKind;
}

export interface FxRates {
  /** Сколько UAH за 1 USD */
  usdUah: number;
  /** Сколько UAH за 1 EUR */
  eurUah: number;
  /** Сколько USD за 1 EUR — производная */
  eurUsd: number;
  fetchedAt: string;
  source: string;
  /** Курс зафиксирован менеджером вручную на этот расчёт */
  pinned: boolean;
}

export interface CalcInput {
  lot: LotInfo;
  /** Ставка на аукционе, USD */
  bid: number;
  /** Найденный тариф доставки, USD. null — тариф не найден */
  deliveryTariff: { amount: number; label: string } | null;
  /** Найденный аукционный сбор, USD */
  auctionFeeTariff: { amount: number; label: string } | null;
  /** Растаможка: значение и его происхождение */
  customs: { amount: number; source: Extract<LineSource, 'api' | 'api-cached' | 'estimate'> } | null;
  /** Персональная скидка менеджера к доставке, % */
  deliveryDiscountPercent: number;
  settings: CalcSettings;
  /** Ручные правки поверх любой строки */
  overrides: Partial<Record<LineKey, number>>;
  /** Строки, выключенные в этом расчёте (страховка не нужна и т.п.) */
  disabled: LineKey[];
}

export interface CompositionSegment {
  group: LineGroup;
  label: string;
  amount: number;
  /** Доля от себестоимости, 0–100 */
  percent: number;
  color: string;
}

export interface CalcResult {
  lines: CalcLine[];
  /** Себестоимость — всё, кроме маржи */
  cost: number;
  /** Маржа, USD */
  margin: number;
  /** Цена клиенту = себестоимость + маржа */
  clientTotal: number;
  composition: CompositionSegment[];
  /** Свёрнутая разбивка для карточки клиента — без внутренних строк */
  clientBreakdown: { group: LineGroup; label: string; amount: number }[];
}

// ─── Растаможка ──────────────────────────────────────────────────────────────

export interface CustomsQuoteRequest {
  carType: CarType;
  price: number;
  currency: Currency;
  volume?: number | null;
  motor?: 'petrol' | 'diesel' | null;
  year?: number | null;
  power?: number | null;
}

export interface CustomsQuote {
  /** НДС */
  nds: number;
  /** Пошлина */
  duty: number;
  /** Акциз */
  excise: number;
  /** Пенсионный фонд */
  pensionFund: number;
  /** Сумма всех платежей (то, что попадает в строку «Растаможка») */
  totalFees: number;
  resultPriceUsd: number;
  resultPriceEur: number | null;
  resultPriceUah: number | null;
  currency: Currency;
  source: Extract<LineSource, 'api' | 'api-cached' | 'estimate'>;
  fetchedAt: string;
  /** Текст для интерфейса, если значение неактуально или оценочное */
  warning: string | null;
}

// ─── Витрина авто на публичном сайте ─────────────────────────────────────────

export type ShowcaseStatus =
  /** В пути / в наличии — можно купить сейчас */
  | 'available'
  /** Сейчас на торгах — готовы торговаться под клиента */
  | 'at_auction'
  /** Уже привезли: кейс с реальной итоговой ценой */
  | 'delivered_case';

export const SHOWCASE_STATUS_LABELS: Record<ShowcaseStatus, string> = {
  available: 'В дорозі / в наявності',
  at_auction: 'Зараз на торгах',
  delivered_case: 'Привезено — приклад розрахунку',
};

export interface ShowcasePhoto {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ShowcaseItem {
  id: string;
  slug: string;
  status: ShowcaseStatus;
  title: string;
  makeModel: string;
  year: number | null;
  fuel: FuelType;
  engineVolume: number | null;
  vehicleKind: VehicleKind;
  platform: Platform;
  location: string;
  lotNumber: string | null;
  mileage: number | null;
  damage: string | null;
  /** Итоговая цена «под ключ», USD */
  turnkeyPriceUsd: number;
  /** Свёрнутая разбивка, которую видит клиент */
  breakdown: { label: string; amount: number }[];
  description: string | null;
  photos: ShowcasePhoto[];
  isPublished: boolean;
  publishedAt: string | null;
  /** Из какого расчёта опубликовано */
  calculationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Язык клиентских документов ──────────────────────────────────────────────

/**
 * Интерфейс приложения русский, публичный сайт украинский, а клиенту удобнее
 * получить документ на своём языке. Поэтому карточка и коммерческое
 * предложение переключаются отдельно от интерфейса.
 */
export type ClientLocale = 'ru' | 'uk';

export const LINE_GROUP_LABELS_UK: Record<LineGroup, string> = {
  bid: 'Ставка',
  deliveryAndFees: 'Доставка та збори',
  customs: 'Розмитнення',
  services: 'Сертифікація та послуги',
};

export function groupLabel(group: LineGroup, locale: ClientLocale): string {
  return locale === 'uk' ? LINE_GROUP_LABELS_UK[group] : LINE_GROUP_LABELS[group];
}

/** Подписи клиентских документов. Только то, что реально видит клиент. */
export const CLIENT_STRINGS: Record<ClientLocale, {
  offerTitle: string;
  total: string;
  vehicle: string;
  lot: string;
  year: string;
  fuel: string;
  volume: string;
  location: string;
  breakdown: string;
  validUntil: string;
  rate: string;
  disclaimer: string;
  contacts: string;
}> = {
  ru: {
    offerTitle: 'Коммерческое предложение',
    total: 'Итого под ключ',
    vehicle: 'Автомобиль',
    lot: 'Лот / VIN',
    year: 'Год выпуска',
    fuel: 'Топливо',
    volume: 'Объём двигателя',
    location: 'Площадка',
    breakdown: 'Из чего складывается цена',
    validUntil: 'Расчёт действителен до',
    rate: 'Курс расчёта',
    disclaimer:
      'Цена включает доставку, сборы, растаможку и оформление. ' +
      'Окончательная сумма фиксируется после подтверждения лота на аукционе.',
    contacts: 'Контакты',
  },
  uk: {
    offerTitle: 'Комерційна пропозиція',
    total: 'Разом під ключ',
    vehicle: 'Автомобіль',
    lot: 'Лот / VIN',
    year: 'Рік випуску',
    fuel: 'Пальне',
    volume: 'Об’єм двигуна',
    location: 'Майданчик',
    breakdown: 'З чого складається ціна',
    validUntil: 'Розрахунок дійсний до',
    rate: 'Курс розрахунку',
    disclaimer:
      'Ціна включає доставку, збори, розмитнення та оформлення. ' +
      'Остаточна сума фіксується після підтвердження лоту на аукціоні.',
    contacts: 'Контакти',
  },
};

export const FUEL_LABELS_UK: Record<FuelType, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Електро',
  hybrid: 'Гібрид',
};

export function fuelLabel(fuel: FuelType, locale: ClientLocale): string {
  return locale === 'uk' ? FUEL_LABELS_UK[fuel] : FUEL_LABELS[fuel];
}

// ─── Агент ───────────────────────────────────────────────────────────────────

export interface AgentProfile {
  id: string;
  login: string;
  fullName: string;
  /** Имя, которое видит клиент на сайте агента */
  publicName: string | null;
  phone: string | null;
  telegram: string | null;
  referralCode: string | null;
  commissionType: CommissionType;
  commissionValue: number;
  isActive: boolean;
  domains: { id: string; host: string; isActive: boolean }[];
  createdAt: string;
}

export interface AgentStats {
  leadsTotal: number;
  leadsNew: number;
  calculations: number;
  dealsWon: number;
  dealsLost: number;
  commissionEarned: number;
  commissionPaid: number;
  commissionPending: number;
}

/** Публичная карточка агента для его сайта — ничего внутреннего. */
export interface AgentPublicCard {
  publicName: string;
  phone: string | null;
  telegram: string | null;
  referralCode: string | null;
}
