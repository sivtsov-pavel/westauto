import { classifyIdentifierLocal } from './identifier.js';
import {
  decodeHtml,
  fetchPublicPage,
  matchOne,
  parseEngineVolume,
  parseFuel,
  parseMoney,
  parseVehicleKind,
  parseYear,
  looksLikeVehicle,
} from './shared.js';
import type { LotData, LotFetchResult, LotFetcher, LotQuery } from './types.js';

/**
 * IAAI — публичная страница лота.
 * Та же логика, что и у Copart: осечка не ошибка, а сигнал «заполните вручную».
 */
/** IAAI Canada отличается только суффиксом региона в адресе лота. */
export function makeIaaiFetcher(platform: 'iaai' | 'iaai_ca'): LotFetcher {
  const region = platform === 'iaai_ca' ? 'CA' : 'US';
  return {
    platform,
    async fetch(query: LotQuery): Promise<LotFetchResult> {
      const kind = classifyIdentifierLocal(query.identifier);
      if (kind === 'unknown') {
        return { ok: false, reason: 'Не похоже ни на номер лота, ни на VIN' };
      }
      if (kind === 'vin') {
        return { ok: false, reason: 'IAAI: поиск по VIN недоступен без партнёрского доступа' };
      }

      const url = `https://www.iaai.com/VehicleDetail/${encodeURIComponent(query.identifier)}~${region}`;
      const html = await fetchPublicPage(url);
      const title = matchOne(html, /<title>([^<]+)<\/title>/i);
      const year = parseYear(matchOne(html, /\b(19[5-9]\d|20[0-4]\d)\b/));

      const data: LotData = {
        platform,
        lotNumber: query.identifier,
        vin: matchOne(html, /\b([A-HJ-NPR-Z0-9]{17})\b/),
        makeModel: cleanTitle(title ? decodeHtml(title) : null, year),
        year,
        engineVolume: parseEngineVolume(matchOne(html, /Engine[^<]*<[^>]*>([^<]+)</i)),
        fuel: parseFuel(matchOne(html, /Fuel\s*Type[^<]*<[^>]*>([^<]+)</i)),
        location: matchOne(html, /Branch[^<]*<[^>]*>([^<]+)</i),
        vehicleKind:
          parseVehicleKind(matchOne(html, /Body\s*Style[^<]*<[^>]*>([^<]+)</i)) ??
          parseVehicleKind(title),
        currentBid: parseMoney(matchOne(html, /Current Bid[^<]*<[^>]*>([^<]+)</i)),
      };

      if (!looksLikeVehicle(data)) {
        return { ok: false, reason: 'Страница открылась, но данные лота не распознаны' };
      }
      return { ok: true, data, source: url };
    },
  };
}

export const iaaiFetcher: LotFetcher = {
  platform: 'iaai',

  async fetch(query: LotQuery): Promise<LotFetchResult> {
    const kind = classifyIdentifierLocal(query.identifier);
    if (kind === 'unknown') {
      return { ok: false, reason: 'Не похоже ни на номер лота, ни на VIN' };
    }
    if (kind === 'vin') {
      return { ok: false, reason: 'IAAI: поиск по VIN недоступен без партнёрского доступа' };
    }

    const url = `https://www.iaai.com/VehicleDetail/${encodeURIComponent(query.identifier)}~US`;
    const html = await fetchPublicPage(url);

    const title = matchOne(html, /<title>([^<]+)<\/title>/i);
    const year = parseYear(matchOne(html, /\b(19[5-9]\d|20[0-4]\d)\b/));

    const data: LotData = {
      platform: 'iaai',
      lotNumber: query.identifier,
      vin: matchOne(html, /\b([A-HJ-NPR-Z0-9]{17})\b/),
      makeModel: cleanTitle(title ? decodeHtml(title) : null, year),
      year,
      engineVolume: parseEngineVolume(matchOne(html, /Engine[^<]*<[^>]*>([^<]+)</i)),
      fuel: parseFuel(matchOne(html, /Fuel\s*Type[^<]*<[^>]*>([^<]+)</i)),
      location: matchOne(html, /Branch[^<]*<[^>]*>([^<]+)</i),
      vehicleKind: parseVehicleKind(matchOne(html, /Body\s*Style[^<]*<[^>]*>([^<]+)</i)) ??
        parseVehicleKind(title),
      currentBid: parseMoney(matchOne(html, /Current Bid[^<]*<[^>]*>([^<]+)</i)),
    };

    if (!looksLikeVehicle(data)) {
      return { ok: false, reason: 'Страница открылась, но данные лота не распознаны' };
    }

    return { ok: true, data, source: url };
  },
};

function cleanTitle(title: string | null, year: number | null): string | null {
  if (!title) return null;
  let value = title.split('|')[0] ?? title;
  if (year) value = value.replace(String(year), '');
  value = value
    .replace(/\b(iaai|lot|salvage|for sale|auction)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (value.length < 2) return null;
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
