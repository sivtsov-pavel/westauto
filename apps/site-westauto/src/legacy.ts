/**
 * Адреса прежнего сайта компании (WordPress, жил на westauto.com.ua до
 * 21.09.2026) и куда они ведут теперь.
 *
 * Домен переехал на наш сервер вместе с накопленной историей: старые адреса
 * остались в выдаче, в чужих статьях и в закладках. Без этой таблицы они
 * отдают честный 404 — человек упирается в тупик, а поисковик просто теряет
 * страницу вместе с её весом. 301 переносит и человека, и вес на живой
 * раздел.
 *
 * Список снят из веб-архива (CDX, срезы с 2019 года) — сам сайт уже
 * недоступен. Спорные адреса не угадывались: заголовки смотрели в архиве,
 * поэтому «to-byu» это «Можно покупать» (подборка авто), а не опечатка.
 *
 * Язык цели — украинский, без префикса: это каноническая версия сайта, а
 * язык посетителя страница подбирает сама. Увести всех на /ru значило бы
 * закрепить русскую версию ссылкой, которую поисковик считает главной.
 */

/** Точное совпадение пути. Проверяется первым. */
const EXACT: Record<string, string> = {
  // ── Компания и услуги ────────────────────────────────────────────────────
  '/about-us': '/#about',
  '/contact-us-2': '/#contacts',
  '/auctions': '/#services',
  '/auctions/ground-transport': '/#services',
  '/auctions/logistic-service': '/#services',
  '/auctions/storage': '/#services',
  '/auctions/trucking-service': '/#services',

  // ── Статьи ───────────────────────────────────────────────────────────────
  '/news': '/blog',
  '/полезное': '/blog',
  '/category/полезное': '/blog',
  '/author/iasluco': '/blog',
  '/sertifikacia-auto-from-usa': '/blog',
  '/rastamozhka-pickup-2021': '/blog',
  '/top-benefits-of-hiring-our-trucking-service': '/blog',
  '/we-are-experienced-and-expert-in-the-business-of-logistics': '/blog',

  // ── Подборки авто ────────────────────────────────────────────────────────
  // «Можно покупать» и «Покупать нельзя» — подборки лотов, не страницы правил
  '/to-byu': '/auto',
  '/not-byu': '/auto',
  '/category/buy': '/auto',
  '/shop-2': '/auto',

  // ── Карточки машин: лоты 2013–2018 годов давно проданы, ведём на витрину ──
  '/audi-a6-premium-2018': '/auto',
  '/fiat-500l': '/auto',
  '/ford-fusion-se-2016': '/auto',
  '/jeep-cherokee-2015': '/auto',
  '/jeep-compass': '/auto',
  '/nisan-rogue-sl-2015': '/auto',
  '/nisan-rogue-sport': '/auto',
  '/vw-jetta-se-2016': '/auto',
  '/vw-passat-se-2014': '/auto',
  '/auctions/passat-b7-se-2014': '/auto',
};

/**
 * Совпадение по началу пути — для разделов, где адресов много и архив
 * заведомо видел не все: теги, товары, корзина магазина.
 *
 * Проверяются после точных совпадений и в порядке от длинного к короткому,
 * иначе короткое правило перехватывало бы длинное.
 */
const PREFIX: [string, string][] = [
  ['/product-category/', '/auto'],
  ['/product/', '/auto'],
  ['/shop-2/', '/auto'],
  ['/auctions/', '/#services'],
  ['/category/', '/blog'],
  ['/author/', '/blog'],
  ['/tag/', '/auto'],
];

/**
 * Куда вести старый адрес. `null` — адрес не с прежнего сайта, пусть идёт
 * дальше обычным порядком (и получит 404, если такой страницы нет).
 */
export function legacyTarget(pathname: string): string | null {
  const path = normalize(pathname);
  if (!path) return null;

  const exact = EXACT[path];
  if (exact) return exact;

  for (const [prefix, target] of PREFIX) {
    if (path.startsWith(prefix)) return target;
  }

  return null;
}

/**
 * Путь к виду, в котором лежит в таблице: без хвостовой косой, в нижнем
 * регистре и с раскодированной кириллицей — «/полезное» в ссылке приезжает
 * как «/%D0%BF%D0%BE%D0%BB...».
 */
function normalize(pathname: string): string | null {
  let path = pathname;

  try {
    path = decodeURIComponent(path);
  } catch {
    // Битая процентная последовательность: такой адрес прежнему сайту не
    // принадлежит, разбирать нечего
    return null;
  }

  path = path.replace(/\/+$/, '').toLowerCase();
  return path || '/';
}
