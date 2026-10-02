import type { BrandProfile } from './types';

/**
 * Профиль Larus Logistics — экземпляр на laruslogistics.seoshkin.tools.
 *
 * Данные сняты с laruslogistics.com 01.10.2026. Всё, чего на их сайте нет
 * (вторые соцсети, отзывы в пригодном виде, видео), оставлено пустым
 * намеренно: выдуманная ссылка или выдуманная цифра дороже отсутствующего
 * блока — её увидит клиент и перестанет верить остальному.
 */
export const larus = {
  id: 'larus',

  /**
   * Своя тема вёрстки, а не только свои цвета.
   *
   * У laruslogistics.com другой визуальный язык: тёмно-синий первый экран с
   * диагональным срезом и полосой показателей, заголовки секций по центру в
   * три уровня, этапы доставки горизонтальным таймлайном, кремовые карточки
   * преимуществ с чёрной карточкой-призывом в конце ряда и крупные цифры
   * прайса. Одной палитрой это не передаётся — поэтому тема.
   */
  layout: 'larus',

  brand: {
    name: 'Larus Logistics',
    legalName: 'Larus Logistics — Your Transporter',
    logo: '/brand/larus-logo.png',
    // Отдельного светлого логотипа клиент не давал. Знак монохромный и лежит
    // на прозрачном фоне, поэтому для тёмного подвала его инвертирует CSS —
    // см. invertLogoLight ниже
    logoLight: '/brand/larus-logo.png',
    shield: '/brand/larus-logo.png',
    invertLogoLight: true,
  },

  contacts: {
    phone: '+380 96 330 23 20',
    phoneHref: 'tel:+380963302320',
    // Американский номер — для тех, кто звонит из США по лоту
    phoneAlt: '+1 (740) 200-8899',
    phoneAltHref: 'tel:+17402008899',
    email: 'laruslogistics@gmail.com',
    hoursKey: 'contacts.hours',
    telegram: null,
    viber: null,
    instagram: 'https://www.instagram.com/larus.logistics/',
    facebook: null,
    tiktok: null,
  },

  /**
   * Только проверяемые цифры с сайта клиента: год основания и три позиции
   * прайса. Количества доставленных авто в надёжном виде нет — блока с ним
   * здесь тоже нет.
   */
  stats: [
    { value: '6', labelKey: 'stats.years' },
    { value: '550', prefix: '$', labelKey: 'stats.deliveryLviv' },
    { value: '1', suffix: '%', labelKey: 'stats.insurance' },
    { value: '100', prefix: '$', labelKey: 'stats.broker' },
  ],

  /**
   * Пять шагов маршрута плюс выдача. У WestAuto их десять, до номерных
   * знаков, — у Larus дорога заканчивается таможней и выдачей во Львове,
   * постановкой на учёт они не занимаются.
   */
  steps: [
    { titleKey: 'step.1', descKey: 'step.1d' },
    { titleKey: 'step.2', descKey: 'step.2d' },
    { titleKey: 'step.3', descKey: 'step.3d' },
    { titleKey: 'step.4', descKey: 'step.4d' },
    { titleKey: 'step.5', descKey: 'step.5d' },
    { titleKey: 'step.6', descKey: 'step.6d' },
  ],

  /** Видео у клиента нет — блок не рисуется. */
  videos: [],

  /**
   * Отзывы с laruslogistics.com. Третий оставил автосалон, не назвавшись, —
   * поэтому в подписи стоит род занятий, а город ушёл строкой ниже.
   */
  reviews: [
    { nameKey: 'review.name.larusKyiv', noteKey: 'review.who.larusKyiv', textKey: 'review.larusKyiv' },
    { nameKey: 'review.name.larusLviv', noteKey: 'review.who.larusLviv', textKey: 'review.larusLviv' },
    { nameKey: 'review.name.larusDealer', noteKey: 'review.who.larusDealer', textKey: 'review.larusDealer' },
  ],

  /**
   * Разбор растаможки из Германии пропущен: Larus возит только из США, и
   * чужая тема в блоге выдаёт пересаженный сайт быстрее всего остального.
   * Остальные материалы — про украинскую таможню и документы аукционов,
   * их машины едут в Украину теми же правилами.
   */
  articles: [
    'rozmytnennia-avto-zi-ssha-2026',
    'hibrydy-2026',
    'yaki-loty-mozhna-kupuvaty',
    'yaki-loty-ne-varto-kupuvaty',
  ],

  /**
   * Палитра снята из CSS их сайта.
   *
   * Красный, что стоял здесь раньше (#f84747), оказался бутстраповым
   * дефолтом их темы, а не цветом бренда: ни одна кнопка и ни один акцент
   * на живом сайте в него не окрашены. Настоящая пара — зелёный на всех
   * главных действиях и синий на надзаголовках, номерах шагов и ссылках;
   * массу держит тёмно-синий первого экрана, тёмных секций и подвала.
   *
   * Оттенки между снятыми значениями (brandRaise, sandTint и прочие ступени
   * наведения и границ) выведены от них же — таких состояний на сайте
   * клиента просто нет, а вёрстке они нужны.
   */
  palette: {
    // Синий: надзаголовки секций, номера шагов, ссылки, активная навигация
    brand: '#1f64e0',
    // Тёмно-синий первого экрана, тёмных секций и подвала
    brandDeep: '#0f1b2d',
    brandSoft: '#5b7da8',
    brandRaise: '#17263d',
    brandDarkest: '#0a1220',
    // Зелёный: все главные кнопки
    accent: '#16a34a',
    accentDeep: '#13863d',
    paper: '#ffffff',
    card: '#ffffff',
    sand: '#f0f3f7',
    sandTint: '#f7f9fc',
    sandDeep: '#e7edf4',
    ink: '#33445b',
    // Чуть темнее снятого #5b7da8: на белом тот даёт 4,2 : 1 и не дотягивает
    // до AA для текста абзаца. Сам #5b7da8 остался в brandSoft, где он на
    // подложках и не несёт текста
    inkSoft: '#56749c',
    inkFaint: '#8ea4c2',
    line: '#e7edf4',
    lineStrong: '#d3deec',
    onDark: '#ffffff',
    onDarkSoft: '#a9bdd8',
    onDarkMid: '#d6e2f0',
    onDarkFaint: '#8ea4c2',
    // Кремовая подложка карточек преимуществ, золотой заголовок на чёрной
    // карточке и оранжевые звёзды отзывов — цвета, которые встречаются
    // только в этих блоках
    cream: '#fdf8f3',
    gold: '#eab308',
    star: '#f59e0b',
    brandRgb: '31 100 224',
    accentRgb: '22 163 74',
    paperRgb: '255 255 255',
    inkRgb: '51 68 91',
    themeColor: '#0f1b2d',
  },

  /** Иконки собраны из их логотипа: монохромный знак на белом поле. */
  app: {
    name: 'Larus Logistics — авто зі США під ключ',
    // Под иконкой на телефоне помещается около двенадцати знаков, полное
    // название обрезалось бы на «Larus Logis…»
    shortName: 'Larus',
    description: 'Доставка авто з аукціонів США в Україну під ключ',
    backgroundColor: '#f8f9fa',
    icons: {
      favicon: '/brand/larus-favicon.png',
      appleTouch: '/brand/larus-apple-touch-icon.png',
      icon192: '/brand/larus-icon-192.png',
      icon512: '/brand/larus-icon-512.png',
      maskable512: '/brand/larus-icon-maskable-512.png',
    },
  },

  fonts: {
    display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    // Моноширинного в наборе клиента нет, а цифры расчёта должны стоять
    // ровными столбцами — берём системный, он есть везде и не стоит запроса
    mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap',
  },

  /**
   * Первый экран.
   *
   * Четыре показателя — ровно те, что стоят у них на сайте: число клиентов,
   * год начала работы, страхование груза и нижняя граница цены доставки.
   * Ничего выведенного: каждую цифру можно показать на их странице.
   *
   * Кнопки отслеживания по VIN здесь нет намеренно, хотя у них в первом
   * экране она есть. Наружу статус доставки мы не отдаём — он виден внутри
   * сделки в CRM, — и кнопка вела бы в никуда. Это хуже её отсутствия.
   */
  hero: {
    badgeKey: 'lhero.badge',
    hintKey: 'lhero.hint',
    stats: [
      { valueKey: 'lstat.clients', labelKey: 'lstat.clientsL' },
      { valueKey: 'lstat.since', labelKey: 'lstat.sinceL' },
      { valueKey: 'lstat.insurance', labelKey: 'lstat.insuranceL' },
      { valueKey: 'lstat.delivery', labelKey: 'lstat.deliveryL' },
    ],
  },

  /**
   * Преимущества: три кремовые карточки, чёрная карточка-призыв и шесть
   * коротких пунктов под ними.
   *
   * Всё собрано из того, что клиент пишет о себе сам (свои контейнеры, фото
   * и видео с этапов, отслеживание по VIN, бесплатные аккаунты аукционов,
   * 1 % страхования, 0,4 % за перевод в USDT, растаможка на компанию, даже
   * одно авто). Ни одного выдуманного обещания: блок читает клиент, и
   * первое же незнакомое ему преимущество обесценит остальные.
   */
  advantages: {
    cards: [
      { titleKey: 'adv.1', descKey: 'adv.1d' },
      { titleKey: 'adv.2', descKey: 'adv.2d' },
      { titleKey: 'adv.3', descKey: 'adv.3d' },
    ],
    promo: { textKey: 'adv.promoText', ctaKey: 'adv.promoCta' },
    points: ['adv.p1', 'adv.p2', 'adv.p3', 'adv.p4', 'adv.p5', 'adv.p6'],
  },

  /**
   * Прайс — четыре позиции, которые клиент называет на своём сайте.
   *
   * Евровой позиции (€300) здесь нет: цифра у них есть, а что именно в неё
   * входит, из страницы не следует. Подписать её наугад нельзя — ошибка в
   * прайсе дороже отсутствующей строки.
   */
  prices: [
    { captionKey: 'price.1', valueKey: 'price.1v', noteKey: 'price.1n' },
    { captionKey: 'price.2', valueKey: 'price.2v', noteKey: 'price.2n' },
    { captionKey: 'price.3', valueKey: 'price.3v', noteKey: 'price.3n' },
    { captionKey: 'price.4', valueKey: 'price.4v', noteKey: 'price.4n' },
  ],

  /**
   * Что расходится с общим словарём.
   *
   * Словарь написан по текстам WestAuto, а у Larus другой бизнес: дорога
   * заканчивается Клайпедой и выдачей во Львове, сертификации и постановки на
   * учёт в МРЭО они не делают вовсе. Перекрываем только расходящееся — общие
   * строки (навигация, формы, витрина) правятся в одном месте для всех.
   *
   * Тексты сняты с laruslogistics.com 01.10.2026 и переведены на три языка.
   * Украинский основной: клиенты у них украинские.
   */
  overrides: {
    // ── Первый экран ────────────────────────────────────────────────────────
    'hero.lead': {
      uk: 'Веземо авто з американських аукціонів під ключ: оплачуємо лот, забираємо на склад у США, вантажимо в контейнер, доводимо морем до Клайпеди і розмитнюємо. Ви забираєте машину у Львові або отримуєте доставкою по Україні.',
      ru: 'Везём авто с американских аукционов под ключ: оплачиваем лот, забираем на склад в США, грузим в контейнер, доводим морем до Клайпеды и растаможиваем. Вы забираете машину во Львове или получаете доставкой по Украине.',
      en: 'We bring cars from US auctions turnkey: we pay for the lot, move it to our US warehouse, load the container, ship it to Klaipeda and clear customs. You collect the car in Lviv or have it delivered anywhere in Ukraine.',
    },
    'hero.cta': { uk: 'Порахувати доставку', ru: 'Посчитать доставку', en: 'Calculate delivery' },
    'hero.badge1': {
      uk: 'Безкоштовні акаунти аукціонів',
      ru: 'Бесплатные аккаунты аукционов',
      en: 'Free auction accounts',
    },
    'hero.badge2': {
      uk: 'Страхування вантажу — 1 %',
      ru: 'Страхование груза — 1 %',
      en: 'Cargo insurance — 1%',
    },
    'hero.badge3': {
      uk: 'Навіть одне авто, без обов’язкових обсягів',
      ru: 'Даже одно авто, без обязательных объёмов',
      en: 'Even a single car, no minimum volume',
    },

    // Сертификацией и учётом они не занимаются — в расчёте это брокер
    'calc.services': { uk: 'Брокер і документи', ru: 'Брокер и документы', en: 'Broker & paperwork' },

    // ── Услуги ──────────────────────────────────────────────────────────────
    'services.title': {
      uk: 'Повний цикл доставки під ключ',
      ru: 'Полный цикл доставки под ключ',
      en: 'Full turnkey delivery cycle',
    },
    'services.lead': {
      uk: 'Беремо на себе всю логістику — від аукціону в США до отримання авто в Україні. Шукати окремих підрядників не доведеться.',
      ru: 'Берём на себя всю логистику — от аукциона в США до получения авто в Украине. Искать отдельных подрядчиков не придётся.',
      en: 'We handle the whole logistics — from the US auction to receiving the car in Ukraine. No need to look for separate contractors.',
    },
    'svc.select': { uk: 'Доступ до аукціонів', ru: 'Доступ к аукционам', en: 'Auction access' },
    'svc.selectД': {
      uk: 'Безкоштовні акаунти на COPART, IAAI та Manheim з мінімальними зборами.',
      ru: 'Бесплатные аккаунты на COPART, IAAI и Manheim с минимальными сборами.',
      en: 'Free accounts on COPART, IAAI and Manheim with minimal auction fees.',
    },
    'svc.bid': { uk: 'Оплата лота і перекази', ru: 'Оплата лота и переводы', en: 'Payments & transfers' },
    'svc.bidД': {
      uk: 'Платимо за авто й аукціонні збори. Переказ в USDT — 0,4 %.',
      ru: 'Платим за авто и аукционные сборы. Перевод в USDT — 0,4 %.',
      en: 'We pay for the car and the auction fees. USDT transfer at 0.4%.',
    },
    // Пакеты отчётов CARFAX — отдельная их услуга; подходящего блока в вёрстке
    // нет, поэтому встала сюда: иконка со щитом здесь про проверку истории
    'svc.check': { uk: 'Звіти CARFAX', ru: 'Отчёты CARFAX', en: 'CARFAX reports' },
    'svc.checkД': {
      uk: 'Офіційна історія авто з баз США: власники, ДТП, пробіг, документи. Пакети звітів — що більший, то дешевше.',
      ru: 'Официальная история авто из баз США: владельцы, ДТП, пробег, документы. Пакеты отчётов — чем больше, тем дешевле.',
      en: 'Official vehicle history from US databases: owners, accidents, mileage, title. The bigger the report package, the lower the price.',
    },
    'svc.ship': { uk: 'Склад, контейнер і море', ru: 'Склад, контейнер и море', en: 'Warehouse, container, ocean' },
    'svc.shipД': {
      uk: 'Зберігаємо авто до відправки, вантажимо у власні контейнери з надійним кріпленням.',
      ru: 'Храним авто до отправки, грузим в собственные контейнеры с надёжным креплением.',
      en: 'We store the car until shipment and load it into our own containers, properly secured.',
    },
    'svc.customs': { uk: 'Митниця і документи', ru: 'Таможня и документы', en: 'Customs & documents' },
    'svc.customsД': {
      uk: 'Готуємо документи та розмитнюємо — зокрема на компанію.',
      ru: 'Готовим документы и растаможиваем — в том числе на компанию.',
      en: 'We prepare the paperwork and clear customs, including for companies.',
    },
    'svc.cert': { uk: 'Експедирування і видача', ru: 'Экспедирование и выдача', en: 'Forwarding & handover' },
    'svc.certД': {
      uk: 'Зустрічаємо авто в порту Клайпеди. Видача у Львові або доставка по Україні.',
      ru: 'Встречаем авто в порту Клайпеды. Выдача во Львове или доставка по Украине.',
      en: 'We meet the car at the port of Klaipeda. Pick-up in Lviv or delivery across Ukraine.',
    },

    // ── Этапы доставки ──────────────────────────────────────────────────────
    'steps.title': { uk: 'Як проходить доставка', ru: 'Как проходит доставка', en: 'How delivery works' },
    'steps.lead': {
      uk: 'Прозорий маршрут: ви завжди знаєте, де зараз ваше авто.',
      ru: 'Прозрачный маршрут: вы всегда знаете, где сейчас ваше авто.',
      en: 'A transparent route — you always know where your car is.',
    },
    'step.1': { uk: 'Заявка і розрахунок', ru: 'Заявка и расчёт', en: 'Request & quote' },
    'step.1d': {
      uk: 'Перші авто рахуємо разом, далі ви легко користуєтесь калькулятором самі.',
      ru: 'Первые авто считаем вместе, дальше вы легко пользуетесь калькулятором сами.',
      en: 'We quote the first cars together, then you use the calculator yourself.',
    },
    'step.2': { uk: 'Аукціон і склад у США', ru: 'Аукцион и склад в США', en: 'Auction & US warehouse' },
    'step.2d': {
      uk: 'Забираємо авто з аукціону на наш найближчий склад у США.',
      ru: 'Забираем авто с аукциона на наш ближайший склад в США.',
      en: 'We move the car from the auction to our nearest US warehouse.',
    },
    'step.3': { uk: 'Контейнер і море', ru: 'Контейнер и море', en: 'Container & sea' },
    'step.3d': {
      uk: 'На складі вантажимо авто в контейнери і відправляємо морем.',
      ru: 'На складе грузим авто в контейнеры и отправляем морем.',
      en: 'At the warehouse we load the cars into containers and ship them by sea.',
    },
    'step.4': { uk: 'Порт Клайпеда', ru: 'Порт Клайпеда', en: 'Port of Klaipeda' },
    'step.4d': {
      uk: 'Судно приходить у Клайпеду — наш експедитор зустрічає й оформлює авто в Литві.',
      ru: 'Судно приходит в Клайпеду — наш экспедитор встречает и оформляет авто в Литве.',
      en: 'The ship arrives in Klaipeda, where our forwarder meets and processes the car.',
    },
    'step.5': { uk: 'Доставка і митниця', ru: 'Доставка и таможня', en: 'Delivery & customs' },
    'step.5d': {
      uk: 'Привозимо авто в Україну та розмитнюємо — на фізичну особу або на компанію.',
      ru: 'Привозим авто в Украину и растаможиваем — на физлицо или на компанию.',
      en: 'We bring the car to Ukraine and clear customs, for a person or a company.',
    },
    'step.6': { uk: 'Отримання авто', ru: 'Получение авто', en: 'Receiving the car' },
    'step.6d': {
      uk: 'Забираєте у Львові або замовляєте доставку в будь-яке місто України.',
      ru: 'Забираете во Львове или заказываете доставку в любой город Украины.',
      en: 'Pick it up in Lviv, or order delivery to any city in Ukraine.',
    },

    // ── О компании ──────────────────────────────────────────────────────────
    'about.title': {
      uk: 'Хто ми і чому з нами спокійно',
      ru: 'Кто мы и почему с нами спокойно',
      en: 'Who we are and why clients stay',
    },
    'about.p1': {
      uk: 'Larus Logistics возить авто з американських аукціонів із 2020 року. Працюємо напряму, без посередників: ви бачите стан, історію і реальні цифри ще до покупки — без прикрас.',
      ru: 'Larus Logistics возит авто с американских аукционов с 2020 года. Работаем напрямую, без посредников: вы видите состояние, историю и реальные цифры ещё до покупки — без прикрас.',
      en: 'Larus Logistics has been shipping cars from US auctions since 2020. You work with us directly — no middlemen, no hidden charges. You see the condition, the history and the real numbers before you buy.',
    },
    'about.p2': {
      uk: 'Усе в одному місці: від оплати лота до доставки за вашою адресою. Пояснюємо кожен крок, надсилаємо фото й відео з кожного етапу, а де зараз авто — видно за VIN будь-коли.',
      ru: 'Всё в одном месте: от оплаты лота до доставки по вашему адресу. Объясняем каждый шаг, присылаем фото и видео с каждого этапа, а где сейчас авто — видно по VIN в любой момент.',
      en: 'Everything in one place — from paying for the lot to delivery at your door. We explain every step, send photos and video from each stage, and you can check where the car is by VIN at any time.',
    },

    // ── Заявка ──────────────────────────────────────────────────────────────
    'lead.title': {
      uk: 'Надішліть посилання на лот — порахуємо доставку',
      ru: 'Пришлите ссылку на лот — посчитаем доставку',
      en: 'Send us a lot link and we will quote the delivery',
    },
    'lead.lead': {
      uk: 'У робочий час відповідаємо за 5–10 хвилин. Спершу розрахунок — жодної передоплати.',
      ru: 'В рабочее время отвечаем за 5–10 минут. Сначала расчёт — никакой предоплаты.',
      en: 'We reply within 5–10 minutes during business hours. The quote comes first — no prepayment.',
    },
    'lead.comment': {
      uk: 'Посилання на лот COPART або IAAI',
      ru: 'Ссылка на лот COPART или IAAI',
      en: 'Lot link (COPART or IAAI)',
    },
    'lead.submit': { uk: 'Надіслати запит', ru: 'Отправить запрос', en: 'Send request' },

    // ── Контакты и подвал ───────────────────────────────────────────────────
    // Расписания на их сайте нет, выдумывать часы нельзя — у них обещано
    // «always in touch», это и ставим
    'contacts.hours': { uk: 'Завжди на зв’язку', ru: 'Всегда на связи', en: 'Always in touch' },
    'footer.about': {
      uk: 'Доставляємо авто з аукціонів США в Україну з 2020 року — надійно, прозоро і під ключ.',
      ru: 'Доставляем авто с аукционов США в Украину с 2020 года — надёжно, прозрачно и под ключ.',
      en: 'Delivering cars from US auctions to Ukraine since 2020 — reliable, transparent and turnkey.',
    },
    'footer.allUkraine': {
      uk: 'Видача у Львові, доставка по Україні',
      ru: 'Выдача во Львове, доставка по Украине',
      en: 'Pick-up in Lviv, delivery across Ukraine',
    },
  },
} as const satisfies BrandProfile;
