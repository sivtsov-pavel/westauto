import { Agent, interceptors, request as undiciRequest } from 'undici';
import type { FuelType, VehicleKind } from '@avtoklyuch/shared';
import { config } from '../../lib/env.js';

/**
 * Общие помощники адаптеров.
 *
 * Работаем строго с публичными страницами лотов: обычный GET, обычный
 * User-Agent, разумный таймаут. Ничего, что обходит авторизацию площадок,
 * здесь нет и быть не должно — ни в коде, ни в логах.
 */
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

/**
 * В undici 7 редиректы включаются интерсептором, а не опцией запроса.
 * Лоты нередко отдают 301 на канонический адрес — без этого каждый такой
 * ответ выглядел бы как осечка.
 */
const dispatcher = new Agent().compose(interceptors.redirect({ maxRedirections: 3 }));

export async function fetchPublicPage(url: string): Promise<string> {
  const response = await undiciRequest(url, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    headersTimeout: config.LOT_FETCHER_TIMEOUT_MS,
    bodyTimeout: config.LOT_FETCHER_TIMEOUT_MS,
    dispatcher,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`HTTP ${response.statusCode}`);
  }
  return response.body.text();
}

/** Вытаскивает блоки <script type="application/ld+json"> — самый стабильный источник. */
export function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw.trim()));
    } catch {
      // Битый JSON-LD — не повод падать
    }
  }
  return blocks;
}

/** Первое совпадение группы 1 регулярки, с обрезкой пробелов. */
export function matchOne(html: string, re: RegExp): string | null {
  const match = re.exec(html);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

export function parseYear(value: string | null): number | null {
  if (!value) return null;
  const year = Number.parseInt(value, 10);
  const current = new Date().getFullYear();
  return Number.isFinite(year) && year >= 1950 && year <= current + 2 ? year : null;
}

/** «2.0L», «2000 cc», «2,0 л» → 2.0 (литры) */
export function parseEngineVolume(value: string | null): number | null {
  if (!value) return null;
  const litres = /([\d.,]+)\s*l\b/i.exec(value);
  if (litres?.[1]) {
    const n = Number.parseFloat(litres[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0 && n < 12) return Math.round(n * 10) / 10;
  }
  const cc = /(\d{3,5})\s*cc\b/i.exec(value);
  if (cc?.[1]) {
    const n = Number.parseInt(cc[1], 10) / 1000;
    if (Number.isFinite(n) && n > 0 && n < 12) return Math.round(n * 10) / 10;
  }
  return null;
}

export function parseFuel(value: string | null): FuelType | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (/(electric|ev\b)/.test(v)) return 'electric';
  if (/hybrid/.test(v)) return 'hybrid';
  if (/diesel/.test(v)) return 'diesel';
  if (/(gas|gasoline|petrol|flexible fuel)/.test(v)) return 'petrol';
  return null;
}

export function parseVehicleKind(value: string | null): VehicleKind | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (/(motorcycle|moped|scooter)/.test(v)) return 'motorcycle';
  if (/(truck|lorry|semi)/.test(v)) return 'truck';
  if (/(pickup|pick-up|crew cab|quad cab)/.test(v)) return 'pickup';
  if (/(suv|sport utility|crossover|wagon)/.test(v)) return 'suv';
  if (/(van|minivan)/.test(v)) return 'minivan';
  if (/coupe/.test(v)) return 'coupe';
  if (/(sedan|saloon|hatchback)/.test(v)) return 'sedan';
  return null;
}

export function parseMoney(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

/**
 * Похоже ли распознанное на настоящий автомобиль.
 *
 * Страницы аукционов отдают заглушки, капчи и баннеры про cookie, а
 * регулярки покорно находят в них «год» и «модель». Такой мусор, попав в
 * расчёт, превращается в неверную цену у клиента — поэтому лучше честно
 * сказать «заполните вручную», чем подставить правдоподобную ерунду.
 */
const JUNK_WORDS = [
  'icon', 'facebook', 'twitter', 'instagram', 'cookie', 'javascript',
  'sign in', 'log in', 'register', 'captcha', 'access denied', 'forbidden',
  'not found', 'error', 'undefined', 'null', 'search', 'menu', 'home',
  'привет', 'ошибка',
];

export function looksLikeVehicle(data: {
  makeModel: string | null;
  year: number | null;
  vin: string | null;
  currentBid: number | null;
}): boolean {
  // Год сам по себе ничего не доказывает: числа вида 2019 есть на любой странице
  const hasStrongSignal = data.vin !== null || data.currentBid !== null;

  const model = (data.makeModel ?? '').trim();
  if (model.length < 3) return false;

  const lower = model.toLowerCase();
  if (JUNK_WORDS.some((word) => lower.includes(word))) return false;

  // Название модели — это буквы и цифры, а не одна цифра и не сплошной символьный мусор
  if (!/[a-zа-яіїєґ]{3}/i.test(model)) return false;

  // Либо есть надёжный признак (VIN, ставка), либо и модель, и год разом
  return hasStrongSignal || data.year !== null;
}
