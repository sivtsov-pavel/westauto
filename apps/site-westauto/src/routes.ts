/**
 * Маршруты сайта — один список на всё.
 *
 * По нему строятся <Route> в браузере и по нему же сервер отличает живую
 * страницу от выдуманного адреса. Раньше списка не было: любой неизвестный
 * путь ловил `<Route path="*">` и показывал главную с кодом 200. Для
 * человека это выглядит как «промахнулся ссылкой», а для поисковика — как
 * сотня копий главной под разными адресами. После переезда на
 * westauto.com.ua это перестало быть мелочью: адреса прежнего сайта
 * остались в индексе и ведут сюда.
 *
 * Список и таблица страниц в App.tsx связаны типом: добавить маршрут и
 * забыть страницу (или наоборот) не даст компилятор.
 */
export const ROUTE_PATHS = [
  '/',
  '/auto',
  '/auto/:slug',
  '/blog',
  '/blog/:slug',
  '/rozrahunok/:token',
] as const;

export type RoutePath = (typeof ROUTE_PATHS)[number];

/**
 * Совпадает ли путь с известным маршрутом.
 *
 * Путь передаётся уже без языкового префикса (`localeFromPath`), потому что
 * /ru/auto и /auto — одна и та же страница.
 */
export function matchRoutePath(rest: string): RoutePath | null {
  const parts = segments(rest);

  for (const pattern of ROUTE_PATHS) {
    const expected = segments(pattern);
    if (expected.length !== parts.length) continue;

    const same = expected.every((segment, i) =>
      segment.startsWith(':') ? (parts[i] ?? '').length > 0 : segment === parts[i],
    );
    if (same) return pattern;
  }

  return null;
}

// Пустые части отбрасываем: так «/auto» и «/auto/» — один и тот же адрес.
// Хвостовая косая встречается в старых ссылках сплошь и рядом.
function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}
