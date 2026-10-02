import { larus } from './brands/larus';
import type { BrandProfile } from './brands/types';
import { westauto } from './brands/westauto';

/**
 * Выбор профиля бренда для этого экземпляра сайта.
 *
 * Имена экспортов те же, что были до появления профилей (BRAND, CONTACTS,
 * STATS, VIDEOS, REVIEWS) — компоненты про многобрендовость не знают и знать
 * не должны.
 *
 * Профиль задаётся переменной BRAND_PROFILE в .env экземпляра. На сервере она
 * приходит из окружения, в браузере — из `window.__BRAND_PROFILE__`, которое
 * сервер впечатывает в <head> рядом с __SSR_DATA__. Значение читается один
 * раз при импорте модуля, и к этому моменту оба источника уже доступны:
 * скрипт в <head> выполняется до загрузки бандла.
 */
const PROFILES: Record<string, BrandProfile> = {
  [westauto.id]: westauto,
  [larus.id]: larus,
};

const DEFAULT_PROFILE = westauto;

function selectedProfile(): BrandProfile {
  // typeof вокруг обоих источников обязателен: в браузере нет process,
  // на сервере нет window — обращение напрямую падает ReferenceError
  const name =
    (typeof process !== 'undefined' ? process.env['BRAND_PROFILE'] : undefined) ??
    (typeof window !== 'undefined' ? window.__BRAND_PROFILE__ : undefined);

  if (!name) return DEFAULT_PROFILE;

  const profile = PROFILES[name];
  if (!profile) {
    // Опечатка в .env не должна ронять сайт: показываем прежний бренд и
    // громко пишем в журнал, иначе чужая вёрстка молча уедет в выдачу
    console.warn(`[brand] профиль «${name}» неизвестен — беру ${DEFAULT_PROFILE.id}`);
    return DEFAULT_PROFILE;
  }
  return profile;
}

declare global {
  interface Window {
    __BRAND_PROFILE__?: string;
  }
}

const profile = selectedProfile();

export const PROFILE_ID = profile.id;
export const BRAND = profile.brand;
export const CONTACTS = profile.contacts;
export const STATS = profile.stats;
export const VIDEOS = profile.videos;
export const REVIEWS = profile.reviews;
export const PALETTE = profile.palette;
export const FONTS = profile.fonts;
export const STEPS_FLOW = profile.steps;
export const APP = profile.app;
export const ARTICLE_SLUGS = profile.articles;

/**
 * Тема вёрстки экземпляра и блоки, которые есть только у неё.
 *
 * Отсутствующий блок — это «такой секции у этого клиента нет», а не «забыли
 * заполнить»: вёрстка проверяет наличие и не рисует секцию вовсе.
 */
export const LAYOUT = profile.layout;
export const HERO = profile.hero ?? null;
export const ADVANTAGES = profile.advantages ?? null;
export const PRICES = profile.prices ?? null;
export const OVERRIDES = profile.overrides ?? {};
