import type { Platform } from '@avtoklyuch/shared';
import { config } from '../../lib/env.js';
import { makeCopartFetcher } from './copart.js';
import { makeIaaiFetcher } from './iaai.js';
import { manheimFetcher } from './manheim.js';
import type { LotFetchResult, LotFetcher, LotQuery } from './types.js';

export type { LotData, LotFetchResult, LotQuery } from './types.js';

/**
 * Получение данных лота — намеренно изолированный модуль.
 *
 * Официального публичного API у Copart и IAAI нет, площадки меняют разметку и
 * закрываются от автоматизации. Поэтому здесь действует одно правило: этот
 * модуль НИКОГДА не роняет расчёт. Не получилось — возвращаем { ok: false },
 * интерфейс мягко переключается на ручной ввод, менеджер работает дальше.
 *
 * Выключается целиком через LOT_FETCHER_ENABLED=false, заменяется на
 * партнёрский API добавлением одного адаптера — остальной код не трогается.
 */
const FETCHERS: Record<Platform, LotFetcher> = {
  copart: makeCopartFetcher('copart'),
  copart_uk: makeCopartFetcher('copart_uk'),
  copart_ca: makeCopartFetcher('copart_ca'),
  iaai: makeIaaiFetcher('iaai'),
  iaai_ca: makeIaaiFetcher('iaai_ca'),
  manheim: manheimFetcher,
};

export async function fetchLot(query: LotQuery): Promise<LotFetchResult> {
  if (!config.LOT_FETCHER_ENABLED) {
    return { ok: false, reason: 'Автоподтяжка отключена в настройках сервера' };
  }

  const identifier = query.identifier.trim();
  if (identifier.length === 0) {
    return { ok: false, reason: 'Введите номер лота или VIN' };
  }

  /*
   * Площадка указана явно — ходим только туда.
   *
   * Раньше здесь был перебор остальных площадок «на всякий случай», и это
   * оказалось опасно: запрос лота Manheim молча уходил в IAAI, а менеджер
   * получал чужие данные под видом своего лота. Ошибиться с номером лота
   * дёшево, посчитать не ту машину — нет.
   */
  const order: Platform[] = query.platform ? [query.platform] : FALLBACK_ORDER;

  for (const platform of order) {
    try {
      const result = await FETCHERS[platform].fetch({ ...query, identifier });
      if (result.ok) return result;
    } catch (error) {
      console.warn(
        `[lot-fetcher] ${platform}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    ok: false,
    reason: 'Не удалось получить автоматически, заполните вручную',
  };
}

/** Куда заглядываем, если площадка не указана явно. */
const FALLBACK_ORDER: Platform[] = ['copart', 'iaai'];

export function isLotFetcherEnabled(): boolean {
  return config.LOT_FETCHER_ENABLED;
}

/** Номер лота — 6–10 цифр, VIN — 17 символов без I, O, Q. */
export function classifyIdentifier(raw: string): 'lot' | 'vin' | 'unknown' {
  const value = raw.trim().toUpperCase();
  if (/^\d{6,10}$/.test(value)) return 'lot';
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(value)) return 'vin';
  return 'unknown';
}
