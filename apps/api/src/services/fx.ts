import { request as undiciRequest } from 'undici';
import type { FxRates } from '@avtoklyuch/shared';
import { pool, queryOne } from '../db/pool.js';
import { config } from '../lib/env.js';

/**
 * Курс НБУ. Публичный API, ключ не нужен.
 * Курс на момент расчёта сохраняется в снимок расчёта — иначе открытый через
 * месяц расчёт пересчитается по новому курсу и перестанет сходиться с тем,
 * что клиент видел на скриншоте.
 */
interface NbuRate {
  r030: number;
  txt: string;
  rate: number;
  cc: string;
  exchangedate: string;
}

/** Резервный курс на случай, когда НБУ недоступен и в базе пусто. */
const FALLBACK: Pick<FxRates, 'usdUah' | 'eurUah'> = { usdUah: 42, eurUah: 46 };

let memoryCache: { rates: FxRates; expiresAt: number } | null = null;

export async function getFxRates(force = false): Promise<FxRates> {
  const now = Date.now();
  if (!force && memoryCache && memoryCache.expiresAt > now) return memoryCache.rates;

  try {
    const fresh = await fetchFromNbu();
    await pool.query(
      'INSERT INTO fx_rates (usd_uah, eur_uah, source) VALUES ($1, $2, $3)',
      [fresh.usdUah, fresh.eurUah, fresh.source],
    );
    memoryCache = {
      rates: fresh,
      expiresAt: now + config.FX_REFRESH_MINUTES * 60_000,
    };
    return fresh;
  } catch (error) {
    console.warn(
      `[fx] НБУ недоступен (${error instanceof Error ? error.message : String(error)}), беру последний известный курс`,
    );
    return readLastKnown();
  }
}

async function fetchFromNbu(): Promise<FxRates> {
  const response = await undiciRequest(config.NBU_RATES_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    headersTimeout: 8000,
    bodyTimeout: 8000,
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }

  const rows = (await response.body.json()) as NbuRate[];
  const usd = rows.find((r) => r.cc === 'USD');
  const eur = rows.find((r) => r.cc === 'EUR');

  if (!usd?.rate || !eur?.rate) throw new Error('В ответе НБУ нет USD или EUR');

  return {
    usdUah: usd.rate,
    eurUah: eur.rate,
    eurUsd: eur.rate / usd.rate,
    fetchedAt: new Date().toISOString(),
    source: `НБУ, ${usd.exchangedate}`,
    pinned: false,
  };
}

async function readLastKnown(): Promise<FxRates> {
  const row = await queryOne<{
    usd_uah: number;
    eur_uah: number;
    source: string;
    fetched_at: Date;
  }>('SELECT usd_uah, eur_uah, source, fetched_at FROM fx_rates ORDER BY fetched_at DESC LIMIT 1');

  if (!row) {
    return {
      ...FALLBACK,
      eurUsd: FALLBACK.eurUah / FALLBACK.usdUah,
      fetchedAt: new Date().toISOString(),
      source: 'резервное значение — курс не получен',
      pinned: false,
    };
  }

  return {
    usdUah: row.usd_uah,
    eurUah: row.eur_uah,
    eurUsd: row.eur_uah / row.usd_uah,
    fetchedAt: row.fetched_at.toISOString(),
    source: `${row.source} (не обновлён)`,
    pinned: false,
  };
}
