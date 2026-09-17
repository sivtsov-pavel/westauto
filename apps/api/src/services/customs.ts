import { createHash } from 'node:crypto';
import { request as undiciRequest } from 'undici';
import {
  estimateCustoms,
  round2,
  type CustomsQuote,
  type CustomsQuoteRequest,
} from '@avtoklyuch/shared';
import { pool, queryOne } from '../db/pool.js';
import { config, hasBazaGaiKey } from '../lib/env.js';
import { getFxRates } from './fx.js';

/**
 * Растаможка через baza-gai.com.ua.
 *
 * Три уровня надёжности, по ТЗ:
 *   1. живой ответ API          → source: 'api'
 *   2. последний успешный ответ → source: 'api-cached', пометка «не обновлено»
 *   3. локальная оценка         → source: 'estimate', предупреждение в интерфейсе
 *
 * Ключ читается только здесь, запрос уходит только с сервера — во фронтенд
 * он не попадает ни при каких условиях.
 */
export async function getCustomsQuote(
  input: CustomsQuoteRequest,
): Promise<CustomsQuote> {
  const cacheKey = buildCacheKey(input);

  if (hasBazaGaiKey) {
    try {
      const quote = await fetchFromBazaGai(input);
      await saveToCache(cacheKey, input, quote);
      return quote;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[customs] baza-gai недоступен (${reason}), пробую кеш`);

      const cached = await readFromCache(cacheKey);
      if (cached) return cached;
    }
  }

  // Ключа нет или API лежит и кеш пуст — считаем сами и честно это помечаем
  const fx = await getFxRates();
  return estimateCustoms(input, {
    currentYear: new Date().getFullYear(),
    usdUah: fx.usdUah,
    eurUah: fx.eurUah,
  });
}

interface BazaGaiResponse {
  origin_price?: number;
  nds?: number;
  duty?: number;
  excise?: number;
  pension_fund?: number;
  all_fees?: number;
  all_fees_with_pension_fund?: number;
  result_price?: number;
  currency?: string;
  result_price_usd?: number;
  result_price_eur?: number;
  result_price_uah?: number;
}

async function fetchFromBazaGai(input: CustomsQuoteRequest): Promise<CustomsQuote> {
  const url = new URL('/taxes', config.BAZA_GAI_BASE_URL);
  url.searchParams.set('car_type', input.carType);
  url.searchParams.set('price', String(round2(input.price)));
  url.searchParams.set('currency', input.currency);

  if (input.carType === 'car' || input.carType === 'truck') {
    if (input.volume != null) url.searchParams.set('volume', String(input.volume));
    if (input.motor) url.searchParams.set('motor', input.motor);
    if (input.year != null) url.searchParams.set('year', String(input.year));
  } else if (input.carType === 'electric') {
    if (input.power != null) url.searchParams.set('power', String(input.power));
  } else if (input.carType === 'motorcycle') {
    // У мотоциклов объём в см³, а внутри системы он в литрах
    if (input.volume != null) url.searchParams.set('volume', String(input.volume * 1000));
  }

  const response = await undiciRequest(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Api-Key': config.BAZA_GAI_API_KEY,
    },
    headersTimeout: config.BAZA_GAI_TIMEOUT_MS,
    bodyTimeout: config.BAZA_GAI_TIMEOUT_MS,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const body = await response.body.text().catch(() => '');
    throw new Error(`HTTP ${response.statusCode}: ${body.slice(0, 200)}`);
  }

  const data = (await response.body.json()) as BazaGaiResponse;

  // Сумма платежей — это то, что ложится в строку «Растаможка».
  // Предпочитаем готовое поле; если его нет — складываем составляющие сами.
  const totalFees =
    data.all_fees_with_pension_fund ??
    (data.nds ?? 0) + (data.duty ?? 0) + (data.excise ?? 0) + (data.pension_fund ?? 0);

  if (!Number.isFinite(totalFees)) {
    throw new Error('Ответ API без сумм платежей');
  }

  return {
    nds: round2(data.nds ?? 0),
    duty: round2(data.duty ?? 0),
    excise: round2(data.excise ?? 0),
    pensionFund: round2(data.pension_fund ?? 0),
    totalFees: round2(totalFees),
    resultPriceUsd: round2(data.result_price_usd ?? 0),
    resultPriceEur: data.result_price_eur != null ? round2(data.result_price_eur) : null,
    resultPriceUah: data.result_price_uah != null ? round2(data.result_price_uah) : null,
    currency: 'USD',
    source: 'api',
    fetchedAt: new Date().toISOString(),
    warning: null,
  };
}

/** Ключ кеша — стабильный хеш от набора параметров расчёта. */
function buildCacheKey(input: CustomsQuoteRequest): string {
  const canonical = JSON.stringify({
    carType: input.carType,
    price: round2(input.price),
    currency: input.currency,
    volume: input.volume ?? null,
    motor: input.motor ?? null,
    year: input.year ?? null,
    power: input.power ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

async function saveToCache(
  key: string,
  request: CustomsQuoteRequest,
  quote: CustomsQuote,
): Promise<void> {
  await pool.query(
    `INSERT INTO customs_cache (cache_key, request, response, fetched_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (cache_key) DO UPDATE
       SET response = EXCLUDED.response, fetched_at = now()`,
    [key, JSON.stringify(request), JSON.stringify(quote)],
  );
}

async function readFromCache(key: string): Promise<CustomsQuote | null> {
  const row = await queryOne<{ response: CustomsQuote; fetched_at: Date }>(
    'SELECT response, fetched_at FROM customs_cache WHERE cache_key = $1',
    [key],
  );
  if (!row) return null;

  return {
    ...row.response,
    source: 'api-cached',
    fetchedAt: row.fetched_at.toISOString(),
    warning: `Не обновлено: baza-gai.com.ua недоступен, показан ответ от ${formatWhen(row.fetched_at)}.`,
  };
}

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export const customsMode = hasBazaGaiKey ? 'api' : 'estimate';
