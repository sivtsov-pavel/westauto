import { classifyIdentifierLocal } from './identifier.js';
import {
  decodeHtml,
  extractJsonLd,
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
 * Copart — публичная страница лота.
 * Разметка меняется без предупреждения, поэтому читаем по нескольким
 * независимым признакам и на любой осечке честно возвращаем ok: false.
 */
/** Región → домен публичной страницы лота. Разбор разметки общий. */
const COPART_DOMAINS: Partial<Record<string, string>> = {
  copart: 'https://www.copart.com',
  copart_uk: 'https://www.copart.co.uk',
  copart_ca: 'https://www.copart.ca',
};

export function makeCopartFetcher(platform: 'copart' | 'copart_uk' | 'copart_ca'): LotFetcher {
  return {
    platform,
    async fetch(query: LotQuery): Promise<LotFetchResult> {
      const kind = classifyIdentifierLocal(query.identifier);
      if (kind === 'unknown') {
        return { ok: false, reason: 'Не похоже ни на номер лота, ни на VIN' };
      }
      if (kind === 'vin') {
        return { ok: false, reason: 'Copart: поиск по VIN недоступен без партнёрского доступа' };
      }

      const domain = COPART_DOMAINS[platform] ?? COPART_DOMAINS['copart']!;
      const url = `${domain}/lot/${encodeURIComponent(query.identifier)}`;
      const html = await fetchPublicPage(url);

      const data = parseCopart(html, query.identifier);
      data.platform = platform;

      if (!looksLikeVehicle(data)) {
        return { ok: false, reason: 'Страница открылась, но данные лота не распознаны' };
      }
      return { ok: true, data, source: url };
    },
  };
}

export const copartFetcher: LotFetcher = {
  platform: 'copart',

  async fetch(query: LotQuery): Promise<LotFetchResult> {
    const kind = classifyIdentifierLocal(query.identifier);
    if (kind === 'unknown') {
      return { ok: false, reason: 'Не похоже ни на номер лота, ни на VIN' };
    }

    // По VIN публичного прямого адреса лота нет — только поиск, который
    // закрыт от автоматизации. Честно говорим об этом сразу.
    if (kind === 'vin') {
      return { ok: false, reason: 'Copart: поиск по VIN недоступен без партнёрского доступа' };
    }

    const url = `https://www.copart.com/lot/${encodeURIComponent(query.identifier)}`;
    const html = await fetchPublicPage(url);

    const data = parseCopart(html, query.identifier);
    if (!looksLikeVehicle(data)) {
      return { ok: false, reason: 'Страница открылась, но данные лота не распознаны' };
    }

    return { ok: true, data, source: url };
  },
};

function parseCopart(html: string, lotNumber: string): LotData {
  // 1) JSON-LD, если он есть — самый надёжный источник
  const fromLd = readJsonLd(html);

  // 2) Запасной путь: подписи полей на странице лота
  const title =
    fromLd.name ??
    (matchOne(html, /<title>([^<]+)<\/title>/i)
      ? decodeHtml(matchOne(html, /<title>([^<]+)<\/title>/i) as string)
      : null);

  const year = fromLd.year ?? parseYear(matchOne(html, /\b(19[5-9]\d|20[0-4]\d)\b/));

  return {
    platform: 'copart',
    lotNumber,
    vin: fromLd.vin ?? matchOne(html, /\b([A-HJ-NPR-Z0-9]{17})\b/),
    makeModel: cleanTitle(title, year),
    year,
    engineVolume:
      parseEngineVolume(fromLd.engine) ??
      parseEngineVolume(matchOne(html, /Engine[^<]*<[^>]*>([^<]+)</i)),
    fuel:
      parseFuel(fromLd.fuel) ??
      parseFuel(matchOne(html, /Fuel[^<]*<[^>]*>([^<]+)</i)),
    location: matchOne(html, /Sale Location[^<]*<[^>]*>([^<]+)</i),
    vehicleKind:
      parseVehicleKind(fromLd.bodyType) ?? parseVehicleKind(title),
    currentBid: parseMoney(matchOne(html, /Current Bid[^<]*<[^>]*>([^<]+)</i)),
  };
}

interface LdFields {
  name: string | null;
  vin: string | null;
  year: number | null;
  engine: string | null;
  fuel: string | null;
  bodyType: string | null;
}

function readJsonLd(html: string): LdFields {
  const empty: LdFields = {
    name: null,
    vin: null,
    year: null,
    engine: null,
    fuel: null,
    bodyType: null,
  };

  for (const block of extractJsonLd(html)) {
    const node = findVehicleNode(block);
    if (!node) continue;
    return {
      name: str(node.name),
      vin: str(node.vehicleIdentificationNumber),
      year: parseYear(str(node.modelDate) ?? str(node.productionDate)),
      engine: str(node.vehicleEngine) ?? str(node.engineDisplacement),
      fuel: str(node.fuelType),
      bodyType: str(node.bodyType),
    };
  }
  return empty;
}

/** Находит узел с @type Vehicle / Car / Product в произвольно вложенном JSON-LD. */
function findVehicleNode(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVehicleNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;

  const node = value as Record<string, unknown>;
  const type = node['@type'];
  const types = Array.isArray(type) ? type.map(String) : [String(type ?? '')];
  if (types.some((t) => /^(Vehicle|Car|Product)$/i.test(t))) return node;

  for (const nested of Object.values(node)) {
    const found = findVehicleNode(nested);
    if (found) return found;
  }
  return null;
}

function str(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null) {
    const name = (value as Record<string, unknown>)['name'];
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return null;
}

/** «2021 TESLA MODEL 3 | Copart» → «Tesla Model 3» */
function cleanTitle(title: string | null, year: number | null): string | null {
  if (!title) return null;
  let value = title.split('|')[0] ?? title;
  if (year) value = value.replace(String(year), '');
  value = value.replace(/\b(lot|salvage|for sale|copart)\b/gi, '').replace(/\s+/g, ' ').trim();
  if (value.length < 2) return null;
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
