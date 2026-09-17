import { round2 } from './money.js';
import type { CustomsQuote, CustomsQuoteRequest } from './types.js';

/**
 * Локальная ОЦЕНОЧНАЯ формула растаможки.
 *
 * Работает только когда baza-gai.com.ua недоступен или ключ ещё не получен.
 * Это не замена официальному расчёту: ставки и пороги меняются законодательством,
 * и поддерживать их вручную — ровно то, чего ТЗ просит избежать. Любой результат
 * отсюда помечается source: 'estimate' и показывается в интерфейсе с
 * предупреждением, чтобы менеджер не отправил его клиенту как окончательный.
 *
 * Все ставки и пороги вынесены в конфиг ниже — их правят в одном месте.
 */
export interface CustomsEstimateConfig {
  /** Ввозная пошлина, % от таможенной стоимости */
  dutyPercent: number;
  /** НДС, % от (стоимость + пошлина + акциз) */
  vatPercent: number;
  /** Акциз, бензин: порог объёма в см³ и базовые ставки в EUR */
  petrol: { volumeThresholdCc: number; baseRateEur: number; baseRateAboveEur: number };
  /** Акциз, дизель */
  diesel: { volumeThresholdCc: number; baseRateEur: number; baseRateAboveEur: number };
  /** Электро: EUR за 1 кВт·ч ёмкости батареи */
  electricRateEurPerKwh: number;
  /** Гибрид (ДВС только подзаряжает батарею): фиксированный акциз, EUR */
  hybridFixedExciseEur: number;
  /** Максимальный возрастной коэффициент акциза */
  maxAgeCoefficient: number;
  /**
   * Пенсионный сбор при первой регистрации: пороги в UAH и ставки в %.
   * Пороги привязаны к прожиточному минимуму и меняются ежегодно —
   * ПРОВЕРЬТЕ значения перед тем, как полагаться на оценку.
   */
  pensionTiers: { upToUah: number | null; percent: number }[];
}

export const DEFAULT_CUSTOMS_ESTIMATE_CONFIG: CustomsEstimateConfig = {
  dutyPercent: 10,
  vatPercent: 20,
  petrol: { volumeThresholdCc: 3000, baseRateEur: 50, baseRateAboveEur: 100 },
  diesel: { volumeThresholdCc: 3500, baseRateEur: 75, baseRateAboveEur: 150 },
  electricRateEurPerKwh: 1,
  hybridFixedExciseEur: 100,
  maxAgeCoefficient: 15,
  pensionTiers: [
    { upToUah: 496_650, percent: 3 },
    { upToUah: 872_900, percent: 4 },
    { upToUah: null, percent: 5 },
  ],
};

export interface EstimateContext {
  /** Текущий год — движок не читает дату сам */
  currentYear: number;
  /** UAH за 1 USD */
  usdUah: number;
  /** UAH за 1 EUR */
  eurUah: number;
  config?: CustomsEstimateConfig;
}

export function estimateCustoms(
  request: CustomsQuoteRequest,
  ctx: EstimateContext,
): CustomsQuote {
  const cfg = ctx.config ?? DEFAULT_CUSTOMS_ESTIMATE_CONFIG;
  const eurUsd = ctx.eurUah / ctx.usdUah;

  // Таможенная стоимость в USD
  const priceUsd =
    request.currency === 'USD'
      ? request.price
      : request.currency === 'EUR'
        ? request.price * eurUsd
        : request.price / ctx.usdUah;

  const duty = round2((priceUsd * cfg.dutyPercent) / 100);
  const exciseEur = estimateExciseEur(request, cfg, ctx.currentYear);
  const excise = round2(exciseEur * eurUsd);
  const nds = round2(((priceUsd + duty + excise) * cfg.vatPercent) / 100);

  const valueUah = priceUsd * ctx.usdUah;
  const pensionPercent = pickPensionPercent(valueUah, cfg.pensionTiers);
  const pensionFund = round2((priceUsd * pensionPercent) / 100);

  const totalFees = round2(duty + excise + nds + pensionFund);

  return {
    nds,
    duty,
    excise,
    pensionFund,
    totalFees,
    resultPriceUsd: round2(priceUsd + totalFees),
    resultPriceEur: round2((priceUsd + totalFees) / eurUsd),
    resultPriceUah: round2((priceUsd + totalFees) * ctx.usdUah),
    currency: 'USD',
    source: 'estimate',
    fetchedAt: new Date(0).toISOString(),
    warning:
      'Оценка по локальной формуле — baza-gai.com.ua недоступен или API-ключ не задан. ' +
      'Проверьте сумму перед отправкой клиенту.',
  };
}

function estimateExciseEur(
  request: CustomsQuoteRequest,
  cfg: CustomsEstimateConfig,
  currentYear: number,
): number {
  if (request.carType === 'hybrid') return cfg.hybridFixedExciseEur;

  if (request.carType === 'electric') {
    const kwh = request.power ?? 0;
    return round2(kwh * cfg.electricRateEurPerKwh);
  }

  // Объём приходит в литрах, ставки считаются от см³
  const volumeCc = (request.volume ?? 0) * 1000;
  if (volumeCc <= 0) return 0;

  const rates = request.motor === 'diesel' ? cfg.diesel : cfg.petrol;
  const baseRate =
    volumeCc > rates.volumeThresholdCc ? rates.baseRateAboveEur : rates.baseRateEur;

  const age = ageCoefficient(request.year ?? currentYear, currentYear, cfg.maxAgeCoefficient);
  return round2(baseRate * (volumeCc / 1000) * age);
}

/** Полных лет с года выпуска: новое авто — 1, потолок — maxAge. */
function ageCoefficient(year: number, currentYear: number, maxAge: number): number {
  const years = currentYear - year;
  if (!Number.isFinite(years) || years <= 1) return 1;
  return Math.min(years, maxAge);
}

function pickPensionPercent(
  valueUah: number,
  tiers: CustomsEstimateConfig['pensionTiers'],
): number {
  for (const tier of tiers) {
    if (tier.upToUah === null || valueUah <= tier.upToUah) return tier.percent;
  }
  return tiers.at(-1)?.percent ?? 3;
}

/** Топливо лота → car_type в терминах baza-gai.com.ua. */
export function carTypeFor(
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid',
  vehicleKind: string,
): CustomsQuoteRequest['carType'] {
  if (vehicleKind === 'motorcycle') return 'motorcycle';
  if (vehicleKind === 'truck') return 'truck';
  if (fuel === 'electric') return 'electric';
  if (fuel === 'hybrid') return 'hybrid';
  return 'car';
}
