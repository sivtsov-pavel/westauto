import type { Locale } from '@avtoklyuch/shared';
import type { DictKey } from '../dict';

/**
 * Профиль бренда: всё, чем один экземпляр сайта отличается от другого.
 *
 * Код у экземпляров общий, образ один и тот же — различия живут здесь и
 * выбираются переменной BRAND_PROFILE в .env экземпляра. Поля описаны строго
 * и без необязательных «на всякий случай»: профиль, у которого набор полей
 * разошёлся с остальными, тихо теряет блоки на живом сайте, и выясняется это
 * не при сборке, а у клиента.
 *
 * Ключи словаря типизированы как DictKey намеренно: забытый перевод падает
 * на проверке типов, а не всплывает именем ключа в вёрстке.
 */

/** Названия и логотипы. */
export interface BrandIdentity {
  readonly name: string;
  /** Подпись в копирайте подвала. */
  readonly legalName: string;
  /** Логотип для шапки и светлых подложек. */
  readonly logo: string;
  /** Логотип для тёмного подвала. */
  readonly logoLight: string;
  /** Квадратный знак без надписи — для мест, где длинный логотип не влезает. */
  readonly shield: string;
  /**
   * Отдельного светлого логотипа нет — инвертируем тёмный фильтром.
   *
   * Работает только с монохромным знаком на прозрачном фоне: цветной логотип
   * инверсия превратит в негатив. Поэтому признак задаёт профиль, а не CSS
   * по догадке.
   */
  readonly invertLogoLight: boolean;
}

/** Телефоны, почта, соцсети. */
export interface BrandContacts {
  readonly phone: string;
  readonly phoneHref: string;
  /** Второй номер (например, американский) — null, если его нет. */
  readonly phoneAlt: string | null;
  readonly phoneAltHref: string | null;
  readonly email: string;
  readonly hoursKey: DictKey;
  /** Соцсети и мессенджеры: null означает «у клиента нет», а не «забыли». */
  readonly telegram: string | null;
  readonly viber: string | null;
  readonly instagram: string | null;
  readonly facebook: string | null;
  readonly tiktok: string | null;
}

/** Цифра в блоке статистики. */
export interface BrandStat {
  /** Только число строкой: вёрстка форматирует его по языку посетителя. */
  readonly value: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly labelKey: DictKey;
}

/** Видео с канала клиента. */
export interface BrandVideo {
  /** Идентификатор видео на YouTube. */
  readonly id: string;
  readonly titleKey: DictKey;
}

/**
 * Шаг доставки.
 *
 * Список, а не число: у разных клиентов разный маршрут и разное количество
 * шагов — у WestAuto их десять, до номерных знаков, у Larus пять до таможни
 * плюс выдача. Нумерацию рисует вёрстка по порядку, в профиле её нет.
 */
export interface BrandStep {
  readonly titleKey: DictKey;
  readonly descKey: DictKey;
}

/** Отзыв клиента. */
export interface BrandReview {
  /**
   * Подпись жирным, она же даёт букву аватара.
   *
   * Ключ, а не строка: в этом месте не всегда имя человека. У Larus третий
   * отзыв оставил автосалон без названия, и «Автосалон» на английской версии
   * должно читаться как Car dealership, а не кириллицей.
   */
  readonly nameKey: DictKey;
  /**
   * Подпись помельче под именем. У WestAuto это модель авто, у Larus — город
   * и тип покупателя, то есть текст, который нужно переводить. Поэтому ключ,
   * а не строка: иначе на английской версии висел бы украинский «приватний
   * покупець».
   */
  readonly noteKey: DictKey;
  readonly textKey: DictKey;
}

/**
 * Тема вёрстки экземпляра.
 *
 * Профиль задаёт не только цвета и тексты, но и визуальный язык: у одного
 * клиента заголовки секций слева с красной риской и этапы плиткой, у другого
 * заголовки по центру, а этапы — горизонтальным таймлайном. Это уже не цвет,
 * это компоновка, и подменить её переменной нельзя.
 *
 * Тема включает класс на корневом элементе (см. App) и дописывает к общим
 * стилям блок `.theme-<имя>` в site.css. Разметка расходится условным
 * рендером в тех немногих местах, где структура действительно другая, —
 * вторая копия страницы разошлась бы с первой на первой же правке.
 *
 * `classic` — исходная вёрстка WestAuto. У неё класса на корне НЕТ вовсе:
 * выдача живого сайта должна остаться ровно той, что была до появления тем.
 */
export type BrandLayout = 'classic' | 'larus';

/**
 * Показатель в полосе под первым экраном.
 *
 * Значение здесь ключом словаря, а не числом, в отличие от BrandStat: в этой
 * полосе стоят не только числа, а «з 2020», «від $550», «1 %» — приставка
 * переводится вместе со строкой, и формат у каждого языка свой.
 */
export interface BrandHeroStat {
  readonly valueKey: DictKey;
  readonly labelKey: DictKey;
}

/**
 * Первый экран темы, где он собран иначе.
 *
 * Классической вёрстке эти поля не нужны: у неё в первом экране карточка
 * расчёта и три пилюли с признаками, а не бейдж, строка-подсказка и полоса
 * показателей. Поэтому блок необязателен — и отсутствует у WestAuto.
 */
export interface BrandHero {
  /** Бейдж-пилюля над заголовком: куда и откуда везём. */
  readonly badgeKey: DictKey;
  /** Строка-подсказка под абзацем — одной фразой главные условия. */
  readonly hintKey: DictKey;
  readonly stats: readonly BrandHeroStat[];
}

/** Карточка преимущества. */
export interface BrandAdvantage {
  readonly titleKey: DictKey;
  readonly descKey: DictKey;
}

/**
 * Тёмная карточка-призыв в конце ряда преимуществ.
 *
 * Заголовка в ней нет: там стоит название бренда из BrandIdentity — держать
 * его ещё и строкой словаря значит однажды переименовать в одном месте.
 */
export interface BrandPromo {
  readonly textKey: DictKey;
  readonly ctaKey: DictKey;
}

/** Блок преимуществ: карточки, тёмный призыв и список коротких пунктов. */
export interface BrandAdvantages {
  readonly cards: readonly BrandAdvantage[];
  readonly promo: BrandPromo;
  readonly points: readonly DictKey[];
}

/**
 * Позиция прайса.
 *
 * Цена ключом словаря по той же причине, что и у BrandHeroStat: «від $550» и
 * «from $550» — это одна позиция на двух языках, а не два числа.
 */
export interface BrandPrice {
  readonly captionKey: DictKey;
  readonly valueKey: DictKey;
  readonly noteKey: DictKey;
}

/**
 * Палитра.
 *
 * Стили лежат одним файлом на все экземпляры, поэтому цвета задаёт профиль, а
 * site.css обращается к ним только через переменные. Тройки каналов (*Rgb)
 * нужны для полупрозрачных наложений: `rgb(var(--accent-rgb) / 0.08)` даёт
 * свечение кнопки в цвете бренда, а не зашитый красный WestAuto.
 */
export interface BrandPalette {
  /** Основная масса: шапка, акцентные подложки, числа. */
  readonly brand: string;
  /** Тёмные секции и подвал. */
  readonly brandDeep: string;
  readonly brandSoft: string;
  /** Подсветка карточки на тёмной секции при наведении. */
  readonly brandRaise: string;
  /** Самый тёмный блок — подложка под видео. */
  readonly brandDarkest: string;
  /** Редкий акцент: главные действия, ключевые цифры. */
  readonly accent: string;
  readonly accentDeep: string;
  /** Фон страницы. */
  readonly paper: string;
  /** Фон карточек. */
  readonly card: string;
  /** Фон чередующихся секций. */
  readonly sand: string;
  /** Два оттенка фона для заглушки вместо фотографии авто. */
  readonly sandTint: string;
  readonly sandDeep: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly inkFaint: string;
  readonly line: string;
  readonly lineStrong: string;
  /** Текст на тёмных секциях — от основного до самого тихого. */
  readonly onDark: string;
  readonly onDarkSoft: string;
  readonly onDarkMid: string;
  readonly onDarkFaint: string;
  /** Каналы через пробел: «31 66 94». */
  readonly brandRgb: string;
  readonly accentRgb: string;
  readonly paperRgb: string;
  readonly inkRgb: string;
  /** Цвет строки состояния мобильного браузера. */
  readonly themeColor: string;
  /**
   * Три цвета, которые встречаются только в теме с блоком преимуществ:
   * кремовая подложка карточек, золотой заголовок на чёрной карточке и
   * оранжевые звёзды отзывов.
   *
   * Необязательны, потому что блока может не быть вовсе. Профиль без них не
   * печатает переменные совсем — выдача классической вёрстки не меняется.
   */
  readonly cream?: string;
  readonly gold?: string;
  readonly star?: string;
}

/** Шрифты бренда. */
export interface BrandFonts {
  /** Заголовочный — целиком font-family со списком запасных. */
  readonly display: string;
  readonly sans: string;
  readonly mono: string;
  /**
   * Адрес Google Fonts — целиком, со всеми начертаниями. В index.html набора
   * нет намеренно: там он был бы один на все бренды, и экземпляр клиента
   * грузил бы два — свой и чужой. null, если профилю хватает системных.
   */
  readonly href: string | null;
}

/** Иконки установленного приложения. */
export interface BrandAppIcons {
  readonly favicon: string;
  readonly appleTouch: string;
  readonly icon192: string;
  readonly icon512: string;
  /**
   * Лаунчер обрезает её до круга или сквиркла и безопасной считает только
   * центральные 80 % — поэтому это отдельный файл с бóльшими полями, а не
   * копия icon512.
   */
  readonly maskable512: string;
}

/** Установленное приложение: как оно называется и чем выглядит. */
export interface BrandApp {
  /** Имя в манифесте — видно в списке приложений телефона. */
  readonly name: string;
  /** Подпись под иконкой. Длиннее 12 символов телефон обрежет. */
  readonly shortName: string;
  readonly description: string;
  /** Фон экрана запуска. */
  readonly backgroundColor: string;
  readonly icons: BrandAppIcons;
}

/**
 * Переопределения строк общего словаря.
 *
 * Словарь один на все экземпляры, но у клиентов разный бизнес: WestAuto везёт
 * до Одессы и ставит на учёт в МРЭО, Larus — до Клайпеды и выдаёт во Львове.
 * Профиль перекрывает только расходящиеся строки, остальные остаются общими и
 * правятся в одном месте. Ключи проверены типом: опечатка не доедет до сборки.
 */
export type BrandTextOverrides = Partial<Record<DictKey, Record<Locale, string>>>;

export interface BrandProfile {
  /** Значение BRAND_PROFILE, по которому профиль выбирается. */
  readonly id: string;
  readonly layout: BrandLayout;
  readonly brand: BrandIdentity;
  readonly contacts: BrandContacts;
  readonly stats: readonly BrandStat[];
  readonly steps: readonly BrandStep[];
  /**
   * Какие материалы блога показывает этот экземпляр — список slug'ов из
   * content/articles в нужном порядке.
   *
   * Не весь корпус всем: разбор растаможки из Германии у клиента, который
   * возит только из США, сразу выдаёт, что сайт чужой. Невошедшая статья
   * исчезает и из списка, и по прямой ссылке — сервер отвечает по ней 404.
   */
  readonly articles: readonly string[];
  readonly videos: readonly BrandVideo[];
  readonly reviews: readonly BrandReview[];
  readonly palette: BrandPalette;
  readonly fonts: BrandFonts;
  readonly app: BrandApp;
  /**
   * Блоки, которые рисует только тема с другой компоновкой.
   *
   * Отсутствуют — секции не рисуются вовсе. Это не «забыли заполнить»:
   * классической вёрстке WestAuto первый экран с полосой показателей,
   * карточки преимуществ и прайс не нужны, у неё на этих местах другое.
   */
  readonly hero?: BrandHero;
  readonly advantages?: BrandAdvantages;
  readonly prices?: readonly BrandPrice[];
  /** Отсутствует — профиль целиком живёт на общих текстах. */
  readonly overrides?: BrandTextOverrides;
}
