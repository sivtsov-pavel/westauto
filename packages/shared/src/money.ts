import type { Currency } from './types.js';

/** Округление до центов — все деньги внутри движка живут в USD с 2 знаками. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Округление до целых долларов — так суммы показываются менеджеру и клиенту. */
export function round0(value: number): number {
  return Math.round(value + Number.EPSILON);
}

const NBSP = ' ';

const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  UAH: '₴',
};

/**
 * $14 200 — тонкий пробел между разрядами, символ слева.
 * Отрицательные суммы: −$120 (минус типографский).
 */
export function formatMoney(
  value: number,
  currency: Currency = 'USD',
  opts: { decimals?: number } = {},
): string {
  const decimals = opts.decimals ?? 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const body = abs
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${negative ? '−' : ''}${CURRENCY_SYMBOL[currency]}${body}`;
}

/** 1,5% — запятая как десятичный разделитель. */
export function formatPercent(value: number, decimals = 1): string {
  const body = value
    .toFixed(decimals)
    .replace(/\.?0+$/, '')
    .replace('.', ',');
  return `${value > 0 ? '' : ''}${body}%`;
}

/** Принимает «14 200», «14,200», «$14200» → 14200. Мусор → null. */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw
    .replace(/[\s  ]/g, '')
    .replace(/[$€₴]/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .trim();
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rates: { usdUah: number; eurUah: number },
): number {
  if (from === to) return round2(amount);
  const inUah =
    from === 'UAH' ? amount : from === 'USD' ? amount * rates.usdUah : amount * rates.eurUah;
  if (to === 'UAH') return round2(inUah);
  return round2(to === 'USD' ? inUah / rates.usdUah : inUah / rates.eurUah);
}
