import type { Dict } from '@avtoklyuch/shared';

/**
 * Словарь сайта WestAuto: украинский, русский, английский.
 *
 * Три варианта каждой строки лежат рядом, а не в трёх файлах — забытый
 * перевод виден сразу при чтении, а не всплывает пустотой на живом сайте.
 *
 * Тексты перенесены с westauto.com.ua; русский — оригинал клиента,
 * украинский и английский — перевод.
 */
export const dict = {
  // ── Навигация ─────────────────────────────────────────────────────────────
  'nav.home':      { uk: 'Головна',      ru: 'Главная',      en: 'Home' },
  'nav.about':     { uk: 'Про компанію', ru: 'О компании',   en: 'About' },
  'nav.services':  { uk: 'Послуги',      ru: 'Услуги',       en: 'Services' },
  'nav.cars':      { uk: 'Авто',         ru: 'Авто',         en: 'Cars' },
  'nav.blog':      { uk: 'Корисне',      ru: 'Полезное',     en: 'Guides' },
  'nav.contacts':  { uk: 'Контакти',     ru: 'Контакты',     en: 'Contacts' },
  'nav.calc':      { uk: 'Розрахувати вартість', ru: 'Рассчитать стоимость', en: 'Get a quote' },
  'nav.menu':      { uk: 'Меню',         ru: 'Меню',         en: 'Menu' },

  // ── Хиро ──────────────────────────────────────────────────────────────────
  'hero.eyebrow':  { uk: 'Copart · IAAI · Manheim', ru: 'Copart · IAAI · Manheim', en: 'Copart · IAAI · Manheim' },
  'hero.title1':   { uk: 'Авто зі США',  ru: 'Авто из США',  en: 'Cars from the USA' },
  'hero.title2':   { uk: 'під ключ',     ru: 'под ключ',     en: 'turnkey' },
  'hero.title3':   { uk: 'в Україні',    ru: 'в Украине',    en: 'in Ukraine' },
  'hero.lead': {
    uk: 'Викуп і доставка авто з американських аукціонів. Підбираємо лот, торгуємось від вашого імені, веземо, розмитнюємо і ставимо на облік. Ви бачите повний розрахунок ще до торгів.',
    ru: 'Выкуп и доставка авто с американских аукционов. Подбираем лот, торгуемся от вашего имени, везём, растаможиваем и ставим на учёт. Вы видите полный расчёт ещё до торгов.',
    en: 'We buy and ship cars from US auctions. We find the lot, bid on your behalf, handle shipping, customs and registration. You see the full cost before bidding starts.',
  },
  'hero.cta':      { uk: 'Безкоштовний підбір авто', ru: 'Бесплатный подбор авто', en: 'Free car selection' },
  'hero.cta2':     { uk: 'Як це працює', ru: 'Как это работает', en: 'How it works' },
  'hero.badge1':   { uk: 'Безкоштовний підбір', ru: 'Бесплатный подбор', en: 'Free selection' },
  'hero.badge2':   { uk: 'Договір і оплата через банк', ru: 'Договор и оплата через банк', en: 'Contract & bank payment' },
  'hero.badge3':   { uk: 'Ціна фіксується до торгів', ru: 'Цена фиксируется до торгов', en: 'Price fixed before bidding' },

  'calc.title':    { uk: 'Приклад розрахунку', ru: 'Пример расчёта', en: 'Sample quote' },
  'calc.lot':      { uk: 'Лот',          ru: 'Лот',           en: 'Lot' },
  'calc.bid':      { uk: 'Ставка на аукціоні', ru: 'Ставка на аукционе', en: 'Auction bid' },
  'calc.delivery': { uk: 'Доставка та збори', ru: 'Доставка и сборы', en: 'Shipping & fees' },
  'calc.customs':  { uk: 'Розмитнення',  ru: 'Растаможка',    en: 'Customs' },
  'calc.services': { uk: 'Сертифікація та послуги', ru: 'Сертификация и услуги', en: 'Certification & services' },
  'calc.total':    { uk: 'Разом під ключ', ru: 'Итого под ключ', en: 'Total, turnkey' },
  'calc.note': {
    uk: 'Сума всіх статей витрат. Без доплат на митниці.',
    ru: 'Сумма всех статей расходов. Без доплат на таможне.',
    en: 'All cost items included. No surprises at customs.',
  },

  // ── Статистика ────────────────────────────────────────────────────────────
  'stats.years':     { uk: 'років досвіду в галузі', ru: 'лет опыта в отрасли', en: 'years in the business' },
  'stats.delivered': { uk: 'доставлено авто',        ru: 'доставлено авто',     en: 'cars delivered' },
  'stats.avgPrice':  { uk: 'середня ціна покупки',   ru: 'средняя цена покупки', en: 'average purchase price' },
  'stats.avgSaving': { uk: 'середня економія клієнта', ru: 'средняя экономия клиента', en: 'average client saving' },

  // Цифры профиля Larus Logistics: подписи к позициям их прайса
  'stats.deliveryLviv': {
    uk: 'доставка до Львова, від',
    ru: 'доставка до Львова, от',
    en: 'delivery to Lviv, from',
  },
  'stats.insurance': {
    uk: 'страхування вантажу від вартості',
    ru: 'страхование груза от стоимости',
    en: 'cargo insurance of the value',
  },
  'stats.broker': {
    uk: 'брокерські послуги, від',
    ru: 'брокерские услуги, от',
    en: 'broker services, from',
  },

  'trust.title': { uk: 'Працюємо напряму з майданчиками:', ru: 'Работаем напрямую с площадками:', en: 'We work directly with:' },

  // ── Услуги ────────────────────────────────────────────────────────────────
  'services.eyebrow': { uk: 'Що входить',    ru: 'Что входит',    en: 'What we do' },
  'services.title':   { uk: 'Що входить у наші послуги', ru: 'Что входит в наши услуги', en: 'What our service covers' },
  'services.lead': {
    uk: 'Повний цикл: від пошуку лота до номерних знаків. Кожен етап веде один менеджер.',
    ru: 'Полный цикл: от поиска лота до номерных знаков. Каждый этап ведёт один менеджер.',
    en: 'Full cycle: from finding the lot to licence plates. One manager runs every step.',
  },

  'svc.select':   { uk: 'Підбір авто',       ru: 'Подбор авто',       en: 'Car selection' },
  'svc.selectД':  { uk: 'Шукаємо лот під ваш бюджет і завдання — безкоштовно.', ru: 'Ищем лот под ваш бюджет и задачу — бесплатно.', en: 'We find a lot for your budget and needs — free of charge.' },
  'svc.bid':      { uk: 'Торги та покупка',  ru: 'Торги и покупка',   en: 'Bidding & purchase' },
  'svc.bidД':     { uk: 'Торгуємось від вашого імені в межах узгодженого бюджету.', ru: 'Торгуемся от вашего имени в рамках согласованного бюджета.', en: 'We bid on your behalf within the agreed budget.' },
  'svc.check':    { uk: 'Перевірка авто',    ru: 'Проверка авто',     en: 'Vehicle inspection' },
  'svc.checkД':   { uk: 'Історія, документи, реальний стан до ставки.', ru: 'История, документы, реальное состояние до ставки.', en: 'History, title and real condition before bidding.' },
  'svc.ship':     { uk: 'Організація доставки', ru: 'Организация доставки', en: 'Shipping' },
  'svc.shipД':    { uk: 'Морський контейнер до Одеси — 2–3 місяці.', ru: 'Морской контейнер до Одессы — 2–3 месяца.', en: 'Sea container to Odesa — 2 to 3 months.' },
  'svc.customs':  { uk: 'Розмитнення',       ru: 'Растаможка',        en: 'Customs clearance' },
  'svc.customsД': { uk: 'За офіційним курсом і чинними ставками, без сірих схем.', ru: 'По официальному курсу и действующим ставкам, без серых схем.', en: 'Official rates, no grey schemes.' },
  'svc.cert':     { uk: 'Сертифікація',      ru: 'Сертификация',      en: 'Certification' },
  'svc.certД':    { uk: 'Євростандарт, документи, постановка на облік у МРЕВ.', ru: 'Евростандарт, документы, постановка на учёт в МРЭО.', en: 'Euro standard, paperwork, registration.' },

  // ── Этапы ─────────────────────────────────────────────────────────────────
  'steps.eyebrow': { uk: 'Етапи',            ru: 'Этапы',             en: 'Process' },
  'steps.title':   { uk: 'Етапи співпраці',  ru: 'Этапы сотрудничества', en: 'How we work together' },
  'steps.lead': {
    uk: 'Десять кроків від вибору авто до номерних знаків. На кожному ви знаєте, що відбувається і скільки це коштує.',
    ru: 'Десять шагов от выбора авто до номерных знаков. На каждом вы знаете, что происходит и сколько это стоит.',
    en: 'Ten steps from picking a car to licence plates. At every one you know what is happening and what it costs.',
  },

  'step.1':  { uk: 'Вибір авто',         ru: 'Выбор авто',          en: 'Choosing the car' },
  'step.1d': { uk: 'Підбираємо варіанти під ваші побажання і бюджет.', ru: 'Подбираем варианты под ваши пожелания и бюджет.', en: 'We shortlist options for your wishes and budget.' },
  'step.2':  { uk: 'Прорахунок витрат',  ru: 'Просчёт расходов',    en: 'Cost calculation' },
  'step.2d': { uk: 'Повна вартість «під ключ» до того, як зроблена ставка.', ru: 'Полная стоимость «под ключ» до того, как сделана ставка.', en: 'Full turnkey cost before any bid is placed.' },
  'step.3':  { uk: 'Договір',            ru: 'Заключение договора', en: 'Contract' },
  'step.3d': { uk: 'Письмові зобов’язання сторін, без усних домовленостей.', ru: 'Письменные обязательства сторон, без устных договорённостей.', en: 'Written obligations, nothing left verbal.' },
  'step.4':  { uk: 'Участь в аукціоні',  ru: 'Участие в аукционе',  en: 'Auction' },
  'step.4d': { uk: 'Торгуємось у межах вашого ліміту й не переступаємо його.', ru: 'Торгуемся в рамках вашего лимита и не переступаем его.', en: 'We bid within your limit and never past it.' },
  'step.5':  { uk: 'Оплата через банк',  ru: 'Оплата через банк',   en: 'Bank payment' },
  'step.5d': { uk: 'SWIFT-переказ, усі платежі прозорі й підтверджені.', ru: 'SWIFT-перевод, все платежи прозрачны и подтверждены.', en: 'SWIFT transfer, every payment documented.' },
  'step.6':  { uk: 'Доставка',           ru: 'Доставка',            en: 'Shipping' },
  'step.6d': { uk: 'Морський контейнер до Одеси, орієнтовно 2–3 місяці.', ru: 'Морской контейнер до Одессы, ориентировочно 2–3 месяца.', en: 'Sea container to Odesa, roughly 2 to 3 months.' },
  'step.7':  { uk: 'Розмитнення',        ru: 'Растаможка',          en: 'Customs' },
  'step.7d': { uk: 'Оформлення на митниці за офіційними ставками.', ru: 'Оформление на таможне по официальным ставкам.', en: 'Clearance at official rates.' },
  'step.8':  { uk: 'Ремонт',             ru: 'Ремонт авто',         en: 'Repair' },
  'step.8d': { uk: 'Відновлення після аукціонних пошкоджень, якщо потрібно.', ru: 'Восстановление после аукционных повреждений, если нужно.', en: 'Restoration after auction damage, if needed.' },
  'step.9':  { uk: 'Сертифікація',       ru: 'Сертификация',        en: 'Certification' },
  'step.9d': { uk: 'Приведення до євростандарту та отримання документів.', ru: 'Приведение к евростандарту и получение документов.', en: 'Bringing the car to Euro standard and papers.' },
  'step.10': { uk: 'Реєстрація в МРЕВ',  ru: 'Регистрация в МРЭО',  en: 'Registration' },
  'step.10d':{ uk: 'Постановка на облік і номерні знаки.', ru: 'Постановка на учёт и номерные знаки.', en: 'Registration and licence plates.' },

  // ── О компании ────────────────────────────────────────────────────────────
  'about.eyebrow': { uk: 'Про нас',      ru: 'О нас',        en: 'About us' },
  'about.title':   { uk: 'Хто ми і чому варто працювати саме з нами', ru: 'Кто мы такие и почему стоит работать именно с нами', en: 'Who we are and why work with us' },
  'about.p1': {
    uk: 'Ми від початку НЕ позиціонуємо себе як компанію, для якої важливий СТАТУС. Для нас важливий ІМІДЖ, для нас важливі КЛІЄНТИ, для нас важливо, щоб нас РЕКОМЕНДУВАЛИ.',
    ru: 'Мы изначально НЕ позиционируем себя как компанию, для которой важен СТАТУС. Для нас важен ИМИДЖ, для нас важны КЛИЕНТЫ, для нас важно, чтобы нас РЕКОМЕНДОВАЛИ.',
    en: 'We have never positioned ourselves as a company that cares about STATUS. What matters to us is our REPUTATION, our CLIENTS, and being RECOMMENDED.',
  },
  'about.p2': {
    uk: 'Тому авто виходить дешевше, ніж в інших компаній, на 1–2 тис. $ у сегменті до 10 000 $ і на 2–4 тис. $ у сегменті 10–20 тис. $.',
    ru: 'Поэтому авто получается Вам дешевле, чем у других компаний, на 1–2 тыс. $ в сегменте до 10 000 $ и на 2–4 тыс. $ в сегменте 10–20 тыс. $.',
    en: 'That is why our cars come out $1–2k cheaper than other companies below $10k, and $2–4k cheaper in the $10–20k range.',
  },

  // ── Авто ──────────────────────────────────────────────────────────────────
  'cars.eyebrow':  { uk: 'Вітрина',      ru: 'Витрина',      en: 'Inventory' },
  'cars.title':    { uk: 'Авто в наявності та на торгах', ru: 'Авто в наличии и на торгах', en: 'Cars available and at auction' },
  'cars.lead': {
    uk: 'Ціна біля кожного авто — підсумкова, «під ключ в Україні»: ставка, доставка, збори, розмитнення й оформлення разом.',
    ru: 'Цена возле каждого авто — итоговая, «под ключ в Украине»: ставка, доставка, сборы, растаможка и оформление вместе.',
    en: 'The price on each car is the final turnkey figure in Ukraine: bid, shipping, fees, customs and paperwork together.',
  },
  'cars.all':      { uk: 'Усі авто',     ru: 'Все авто',     en: 'All cars' },
  'cars.turnkey':  { uk: 'Під ключ в Україні', ru: 'Под ключ в Украине', en: 'Turnkey in Ukraine' },
  'cars.empty': {
    uk: 'У цій категорії зараз немає авто. Напишіть, яке шукаєте — підберемо лот і порахуємо вартість.',
    ru: 'В этой категории сейчас нет авто. Напишите, какое ищете — подберём лот и посчитаем стоимость.',
    en: 'No cars in this category right now. Tell us what you are looking for and we will find a lot and quote it.',
  },
  'cars.filterAll':      { uk: 'Усі',              ru: 'Все',               en: 'All' },
  'cars.available':      { uk: 'В дорозі / в наявності', ru: 'В пути / в наличии', en: 'In transit / available' },
  'cars.atAuction':      { uk: 'Зараз на торгах',  ru: 'Сейчас на торгах',  en: 'At auction now' },
  'cars.delivered':      { uk: 'Привезено — приклад', ru: 'Привезено — пример', en: 'Delivered — case study' },
  'cars.want':           { uk: 'Хочу це авто',     ru: 'Хочу это авто',     en: 'I want this car' },
  'cars.more':           { uk: 'Показати ще',      ru: 'Показать ещё',      en: 'Show more' },
  'cars.shown':          { uk: 'Показано',         ru: 'Показано',          en: 'Showing' },
  'cars.of':             { uk: 'з',                ru: 'из',                en: 'of' },
  'cars.back':           { uk: 'Усі авто',         ru: 'Все авто',          en: 'All cars' },
  'cars.gone': {
    uk: 'Цього авто вже немає у вітрині — можливо, його купили.',
    ru: 'Этого авто уже нет в витрине — возможно, его купили.',
    en: 'This car is no longer listed — it may have been sold.',
  },
  'cars.year':     { uk: 'Рік випуску',  ru: 'Год выпуска',  en: 'Year' },
  'cars.fuel':     { uk: 'Пальне',       ru: 'Топливо',      en: 'Fuel' },
  'cars.engine':   { uk: 'Об’єм двигуна', ru: 'Объём двигателя', en: 'Engine' },
  'cars.mileage':  { uk: 'Пробіг',       ru: 'Пробег',       en: 'Mileage' },
  'cars.platform': { uk: 'Майданчик',    ru: 'Площадка',     en: 'Auction' },
  'cars.lotNo':    { uk: 'Номер лота',   ru: 'Номер лота',   en: 'Lot number' },
  'cars.miles':    { uk: 'миль',         ru: 'миль',         en: 'miles' },

  'fuel.petrol':   { uk: 'Бензин',       ru: 'Бензин',       en: 'Petrol' },
  'fuel.diesel':   { uk: 'Дизель',       ru: 'Дизель',       en: 'Diesel' },
  'fuel.electric': { uk: 'Електро',      ru: 'Электро',      en: 'Electric' },
  'fuel.hybrid':   { uk: 'Гібрид',       ru: 'Гибрид',       en: 'Hybrid' },

  // ── Отзывы ────────────────────────────────────────────────────────────────
  'reviews.eyebrow': { uk: 'Відгуки',    ru: 'Отзывы',       en: 'Reviews' },
  'reviews.title':   { uk: 'Що кажуть клієнти', ru: 'Что говорят клиенты', en: 'What clients say' },

  'review.igor': {
    uk: 'Підбір зайняв приблизно тиждень, доставка — два місяці. Усе, що обіцяли на старті, збіглося з фактом.',
    ru: 'Подбор занял примерно неделю, доставка — два месяца. Всё, что обещали на старте, совпало с фактом.',
    en: 'Selection took about a week, shipping two months. Everything promised at the start matched the outcome.',
  },
  'review.oleksandr': {
    uk: 'Фінальна ціна вийшла 8 100 $ — рівно та, яку порахували до торгів.',
    ru: 'Финальная цена вышла 8 100 $ — ровно та, которую посчитали до торгов.',
    en: 'Final price came out at $8,100 — exactly what was quoted before the auction.',
  },
  'review.vitalii': {
    uk: 'Кросовер 2015 року за 8 000 $ під ключ. Порівнював із ринком — виходило дорожче.',
    ru: 'Кроссовер 2015 года за 8 000 $ под ключ. Сравнивал с рынком — выходило дороже.',
    en: 'A 2015 crossover for $8,000 turnkey. I compared with the local market — it was pricier there.',
  },
  'review.olena': {
    uk: 'Порівняно з українськими цінами економія вийшла 32 %. Для мене це вирішило все.',
    ru: 'По сравнению с украинскими ценами экономия вышла 32 %. Для меня это решило всё.',
    en: 'Compared with Ukrainian prices I saved 32%. That settled it for me.',
  },

  // Имена авторов отзывов. У WestAuto они намеренно одинаковы во всех трёх
  // языках: так было до появления профилей, и менять выдачу живого сайта
  // ради единообразия незачем
  'review.name.igor':      { uk: 'Ігор',      ru: 'Ігор',      en: 'Ігор' },
  'review.name.oleksandr': { uk: 'Олександр', ru: 'Олександр', en: 'Олександр' },
  'review.name.vitalii':   { uk: 'Віталій',   ru: 'Віталій',   en: 'Віталій' },
  'review.name.olena':     { uk: 'Олена',     ru: 'Олена',     en: 'Олена' },

  'review.name.larusKyiv':   { uk: 'Олександр', ru: 'Александр', en: 'Oleksandr' },
  'review.name.larusLviv':   { uk: 'Ірина',     ru: 'Ирина',     en: 'Iryna' },
  'review.name.larusDealer': { uk: 'Автосалон', ru: 'Автосалон', en: 'Car dealership' },

  // Подписи под именем автора отзыва. У WestAuto это модель авто — одна и та
  // же во всех трёх языках, но ключом, а не строкой: у других клиентов в этом
  // месте стоит город и тип покупателя, и их уже надо переводить
  'review.who.igor':      { uk: 'VW Passat',    ru: 'VW Passat',    en: 'VW Passat' },
  'review.who.oleksandr': { uk: 'Ford Fusion',  ru: 'Ford Fusion',  en: 'Ford Fusion' },
  'review.who.vitalii':   { uk: 'Jeep Compass', ru: 'Jeep Compass', en: 'Jeep Compass' },
  'review.who.olena':     { uk: 'Audi A6',      ru: 'Audi A6',      en: 'Audi A6' },

  // ── Отзывы профиля Larus Logistics — с laruslogistics.com ─────────────────
  'review.who.larusKyiv': {
    uk: 'Київ · приватний покупець',
    ru: 'Киев · частный покупатель',
    en: 'Kyiv · private buyer',
  },
  'review.who.larusLviv': {
    uk: 'Львів · приватний покупець',
    ru: 'Львов · частный покупатель',
    en: 'Lviv · private buyer',
  },
  'review.who.larusDealer': {
    uk: 'Одеса · партнер',
    ru: 'Одесса · партнёр',
    en: 'Odesa · partner',
  },
  'review.larusKyiv': {
    uk: 'Авто приїхало за шість тижнів — рівно в строк. Раджу всім, хто бере машину зі США.',
    ru: 'Авто приехало за шесть недель — ровно в срок. Советую всем, кто берёт машину из США.',
    en: 'The car arrived in six weeks, right on schedule. I recommend them to anyone buying from the US.',
  },
  'review.larusLviv': {
    uk: 'Усе порахувала сама і бачила кожен етап. Зручно і без зайвих нервів.',
    ru: 'Всё посчитала сама и видела каждый этап. Удобно и без лишних нервов.',
    en: 'I worked out the numbers myself and could see every stage. Convenient and stress-free.',
  },
  'review.larusDealer': {
    uk: 'Працюємо разом уже п’ять років — стабільно, без сюрпризів. Для автосалону це головне.',
    ru: 'Работаем вместе уже пять лет — стабильно, без сюрпризов. Для автосалона это главное.',
    en: 'We have worked together for five years now — stable, no surprises. For a dealership that is what matters.',
  },

  // ── Тема Larus: перший екран, переваги і прайс ────────────────────────────
  //
  // Блоки є тільки в темі larus (див. content/brands/larus.ts). Тексти зняті
  // з laruslogistics.com: кожна цифра і кожна обіцянка тут — те, що клієнт
  // пише про себе сам. Нічого виведеного: перша ж незнайома йому перевага
  // обесцінить решту.

  'lhero.badge': {
    uk: 'Доставка авто з аукціонів США → Україна',
    ru: 'Доставка авто с аукционов США → Украина',
    en: 'Car delivery from US auctions → Ukraine',
  },
  'lhero.hint': {
    uk: 'Безкоштовні акаунти аукціонів, страхування вантажу 1 %, навіть одне авто',
    ru: 'Бесплатные аккаунты аукционов, страхование груза 1 %, даже одно авто',
    en: 'Free auction accounts, 1% cargo insurance, even a single car',
  },

  // Показники під першим екраном. Значення — рядки, а не числа: приставка
  // «від» і «з» перекладається разом із ними
  'lstat.clients':    { uk: '1500+', ru: '1500+', en: '1500+' },
  'lstat.clientsL':   { uk: 'клієнтів уже з нами', ru: 'клиентов уже с нами', en: 'happy clients' },
  'lstat.since':      { uk: 'з 2020', ru: 'с 2020', en: 'since 2020' },
  'lstat.sinceL':     { uk: 'у логістиці', ru: 'в логистике', en: 'in logistics' },
  'lstat.insurance':  { uk: '1 %', ru: '1 %', en: '1%' },
  'lstat.insuranceL': { uk: 'страхування вантажу', ru: 'страхование груза', en: 'cargo insurance' },
  'lstat.delivery':   { uk: 'від $550', ru: 'от $550', en: 'from $550' },
  'lstat.deliveryL':  { uk: 'доставка до Львова', ru: 'доставка до Львова', en: 'delivery to Lviv' },

  'adv.eyebrow': { uk: 'Переваги', ru: 'Преимущества', en: 'Why us' },
  'adv.title': {
    uk: 'Чому клієнти залишаються з нами',
    ru: 'Почему клиенты остаются с нами',
    en: 'Why clients stay with us',
  },
  'adv.lead': {
    uk: 'Працюємо напряму, без посередників — і показуємо кожен крок дороги.',
    ru: 'Работаем напрямую, без посредников — и показываем каждый шаг дороги.',
    en: 'We work directly, with no middlemen — and we show every step of the way.',
  },

  'adv.1':  { uk: 'Власні контейнери', ru: 'Собственные контейнеры', en: 'Our own containers' },
  'adv.1d': {
    uk: 'Зберігаємо авто на складі до відправки і вантажимо у свої контейнери з надійним кріпленням.',
    ru: 'Храним авто на складе до отправки и грузим в свои контейнеры с надёжным креплением.',
    en: 'We store the car until shipment and load it into our own containers, properly secured.',
  },
  'adv.2':  { uk: 'Реальні цифри до покупки', ru: 'Реальные цифры до покупки', en: 'Real numbers before you buy' },
  'adv.2d': {
    uk: 'Стан, історія і повна вартість — без прикрас і без прихованих платежів.',
    ru: 'Состояние, история и полная стоимость — без прикрас и без скрытых платежей.',
    en: 'Condition, history and the full cost — no embellishment, no hidden charges.',
  },
  'adv.3':  { uk: 'Фото і відео з кожного етапу', ru: 'Фото и видео с каждого этапа', en: 'Photos and video from every stage' },
  'adv.3d': {
    uk: 'Пояснюємо кожен крок, а де зараз авто — видно за VIN будь-коли.',
    ru: 'Объясняем каждый шаг, а где сейчас авто — видно по VIN в любой момент.',
    en: 'We explain every step, and you can check where the car is by VIN at any time.',
  },

  'adv.promoText': {
    uk: 'Веземо авто з аукціонів США в Україну з 2020 року — від оплати лота до видачі у Львові. Надішліть посилання на лот, і ми порахуємо доставку.',
    ru: 'Везём авто с аукционов США в Украину с 2020 года — от оплаты лота до выдачи во Львове. Пришлите ссылку на лот, и мы посчитаем доставку.',
    en: 'We have been shipping cars from US auctions to Ukraine since 2020 — from paying for the lot to handover in Lviv. Send us a lot link and we will quote the delivery.',
  },
  'adv.promoCta': { uk: 'Порахувати доставку', ru: 'Посчитать доставку', en: 'Calculate delivery' },

  'adv.p1': { uk: 'Безкоштовні акаунти COPART, IAAI та Manheim', ru: 'Бесплатные аккаунты COPART, IAAI и Manheim', en: 'Free COPART, IAAI and Manheim accounts' },
  'adv.p2': { uk: 'Страхування вантажу — 1 % від вартості', ru: 'Страхование груза — 1 % от стоимости', en: 'Cargo insurance at 1% of the value' },
  'adv.p3': { uk: 'Переказ оплати в USDT — 0,4 %', ru: 'Перевод оплаты в USDT — 0,4 %', en: 'Payment transfer in USDT at 0.4%' },
  'adv.p4': { uk: 'Розмитнення на фізичну особу або на компанію', ru: 'Растаможка на физлицо или на компанию', en: 'Customs clearance for a person or a company' },
  'adv.p5': { uk: 'Відстеження авто за VIN на кожному етапі', ru: 'Отслеживание авто по VIN на каждом этапе', en: 'Track the car by VIN at every stage' },
  'adv.p6': { uk: 'Навіть одне авто, без обов’язкових обсягів', ru: 'Даже одно авто, без обязательных объёмов', en: 'Even a single car, no minimum volume' },

  'price.eyebrow': { uk: 'Ціни', ru: 'Цены', en: 'Pricing' },
  'price.title':   { uk: 'Скільки коштує доставка', ru: 'Сколько стоит доставка', en: 'What delivery costs' },
  'price.lead': {
    uk: 'Базові позиції прайсу. Точну суму під ваш лот порахує калькулятор нижче або менеджер у відповідь на заявку.',
    ru: 'Базовые позиции прайса. Точную сумму под ваш лот посчитает калькулятор ниже или менеджер в ответ на заявку.',
    en: 'The basic price list. The calculator below, or a manager replying to your request, works out the exact figure for your lot.',
  },

  'price.1':  { uk: 'Доставка до Львова', ru: 'Доставка до Львова', en: 'Delivery to Lviv' },
  'price.1v': { uk: 'від $550', ru: 'от $550', en: 'from $550' },
  'price.1n': {
    uk: 'Склад у США, контейнер, море, порт Клайпеди і дорога до Львова',
    ru: 'Склад в США, контейнер, море, порт Клайпеды и дорога до Львова',
    en: 'US warehouse, container, ocean, port of Klaipeda and the road to Lviv',
  },
  'price.2':  { uk: 'Брокерські послуги', ru: 'Брокерские услуги', en: 'Broker services' },
  'price.2v': { uk: 'від $100', ru: 'от $100', en: 'from $100' },
  'price.2n': {
    uk: 'Підготовка документів і розмитнення — на фізособу або на компанію',
    ru: 'Подготовка документов и растаможка — на физлицо или на компанию',
    en: 'Paperwork and customs clearance, for a person or a company',
  },
  'price.3':  { uk: 'Страхування вантажу', ru: 'Страхование груза', en: 'Cargo insurance' },
  'price.3v': { uk: '1 %', ru: '1 %', en: '1%' },
  'price.3n': {
    uk: 'Рахується від вартості авто',
    ru: 'Считается от стоимости авто',
    en: 'Calculated on the value of the car',
  },
  'price.4':  { uk: 'Переказ оплати в USDT', ru: 'Перевод оплаты в USDT', en: 'Payment transfer in USDT' },
  'price.4v': { uk: '0,4 %', ru: '0,4 %', en: '0.4%' },
  'price.4n': {
    uk: 'Оплата лота й аукціонних зборів',
    ru: 'Оплата лота и аукционных сборов',
    en: 'Paying for the lot and the auction fees',
  },

  // ── Видео ─────────────────────────────────────────────────────────────────
  'videos.eyebrow': { uk: 'Відео',       ru: 'Видео',        en: 'Video' },
  'videos.title':   { uk: 'Привезені авто на відео', ru: 'Привезённые авто на видео', en: 'Delivered cars on video' },
  'videos.lead': {
    uk: 'Реальні машини, які ми привезли клієнтам. Без студійного світла і ретуші.',
    ru: 'Реальные машины, которые мы привезли клиентам. Без студийного света и ретуши.',
    en: 'Real cars we delivered to clients. No studio lighting, no retouching.',
  },
  'videos.play':    { uk: 'Дивитись відео', ru: 'Смотреть видео', en: 'Play video' },

  'video.passat':  { uk: 'VW Passat 1.8 TSI, 2014',  ru: 'VW Passat 1.8 TSI, 2014',  en: 'VW Passat 1.8 TSI, 2014' },
  'video.tsi':     { uk: '1.8 TSI — готовий до видачі', ru: '1.8 TSI — готов к выдаче', en: '1.8 TSI — ready for handover' },
  'video.compass': { uk: 'Jeep Compass, 2016',       ru: 'Jeep Compass, 2016',       en: 'Jeep Compass, 2016' },
  'video.fusion':  { uk: 'Ford Fusion Titanium',     ru: 'Ford Fusion Titanium',     en: 'Ford Fusion Titanium' },
  'video.rogue':   { uk: 'Nissan Rogue Sport, 2019', ru: 'Nissan Rogue Sport, 2019', en: 'Nissan Rogue Sport, 2019' },
  'video.mazda':   { uk: 'Mazda 3, 2012',            ru: 'Mazda 3, 2012',            en: 'Mazda 3, 2012' },

  // ── Блог ──────────────────────────────────────────────────────────────────
  'blog.eyebrow':  { uk: 'Корисне',      ru: 'Полезное',     en: 'Guides' },
  'blog.title':    { uk: 'Розбори та інструкції', ru: 'Разборы и инструкции', en: 'Guides and breakdowns' },
  'blog.lead': {
    uk: 'Розмитнення, вибір авто, документи аукціонів — без міфів і реклами.',
    ru: 'Растаможка, выбор авто, документы аукционов — без мифов и рекламы.',
    en: 'Customs, choosing a car, auction titles — no myths, no sales pitch.',
  },
  'blog.all':      { uk: 'Усі матеріали', ru: 'Все материалы', en: 'All guides' },
  'blog.readMore': { uk: 'Читати',       ru: 'Читать',       en: 'Read' },
  'blog.back':     { uk: 'Усі матеріали', ru: 'Все материалы', en: 'All guides' },
  'blog.notFound': { uk: 'Матеріал не знайдено', ru: 'Материал не найден', en: 'Guide not found' },

  // ── Заявка ────────────────────────────────────────────────────────────────
  'lead.title':    { uk: 'Отримати професійний підбір авто', ru: 'Получить профессиональный подбор авто', en: 'Get a professional car selection' },
  'lead.lead': {
    uk: 'Залиште контакти — менеджер зателефонує, уточнить завдання і безкоштовно підбере варіанти з розрахунком «під ключ».',
    ru: 'Оставьте контакты — менеджер позвонит, уточнит задачу и бесплатно подберёт варианты с расчётом «под ключ».',
    en: 'Leave your contacts — a manager will call, clarify your needs and put together options with a full turnkey quote, free of charge.',
  },
  'lead.name':     { uk: 'Ваше ім’я',    ru: 'Ваше имя',     en: 'Your name' },
  'lead.phone':    { uk: 'Телефон',      ru: 'Телефон',      en: 'Phone' },
  'lead.comment':  { uk: 'Яке авто шукаєте або номер лота', ru: 'Какое авто ищете или номер лота', en: 'What car you need, or a lot number' },
  'lead.submit':   { uk: 'Замовити підбір', ru: 'Заказать подбор', en: 'Request selection' },
  'lead.sending':  { uk: 'Надсилаю…',    ru: 'Отправляю…',   en: 'Sending…' },
  'lead.done': {
    uk: 'Дякуємо! Менеджер зателефонує найближчим часом.',
    ru: 'Спасибо! Менеджер позвонит в ближайшее время.',
    en: 'Thank you. A manager will call you shortly.',
  },
  'lead.error':    { uk: 'Не вдалося надіслати заявку', ru: 'Не удалось отправить заявку', en: 'Could not send the request' },

  // ── Контакты и подвал ─────────────────────────────────────────────────────
  'contacts.title':  { uk: 'Контакти',   ru: 'Контакты',     en: 'Contacts' },
  'contacts.hours':  { uk: 'Пн–Пт: 09:00–19:00', ru: 'Пн–Пт: 09:00–19:00', en: 'Mon–Fri: 9:00–19:00' },
  'contacts.write':  { uk: 'Напишіть у месенджер', ru: 'Напишите в мессенджер', en: 'Message us' },

  'footer.about': {
    uk: 'Викуп, доставка та розмитнення авто з аукціонів США під ключ. Працюємо по всій Україні.',
    ru: 'Выкуп, доставка и растаможка авто с аукционов США под ключ. Работаем по всей Украине.',
    en: 'Buying, shipping and customs clearance of US auction cars, turnkey. We work across Ukraine.',
  },
  'footer.company':  { uk: 'Компанія',   ru: 'Компания',     en: 'Company' },
  'footer.useful':   { uk: 'Корисне',    ru: 'Полезное',     en: 'Guides' },
  'footer.contacts': { uk: 'Контакти',   ru: 'Контакты',     en: 'Contacts' },
  'footer.rights':   { uk: 'Усі права захищені.', ru: 'Все права защищены.', en: 'All rights reserved.' },
  'footer.disclaimer': {
    uk: 'Розрахунки орієнтовні до підтвердження лота на аукціоні.',
    ru: 'Расчёты ориентировочные до подтверждения лота на аукционе.',
    en: 'Quotes are indicative until the lot is confirmed at auction.',
  },
  'footer.allUkraine': { uk: 'Працюємо по всій Україні', ru: 'Работаем по всей Украине', en: 'Serving all of Ukraine' },

  // ── Вход в систему ────────────────────────────────────────────────────────
  'portal.title':    { uk: 'Вхід у систему', ru: 'Вход в систему', en: 'System access' },
  'portal.cabinet':  { uk: 'Особистий кабінет', ru: 'Личный кабинет', en: 'Manager portal' },
  'portal.short':    { uk: 'Кабінет',      ru: 'Кабинет',      en: 'Sign in' },
  'portal.admin':    { uk: 'Адмінпанель',  ru: 'Админпанель',  en: 'Admin panel' },
  'portal.calc':     { uk: 'Калькулятор',  ru: 'Калькулятор',  en: 'Calculator' },
  'portal.note': {
    uk: 'Доступ лише для співробітників компанії.',
    ru: 'Доступ только для сотрудников компании.',
    en: 'Staff access only.',
  },

  // ── Расчёт по ссылке ──────────────────────────────────────────────────────
  'shared.title':    { uk: 'Ваш розрахунок', ru: 'Ваш расчёт',  en: 'Your quote' },
  'shared.rate':     { uk: 'Курс розрахунку', ru: 'Курс расчёта', en: 'Exchange rate' },
  'shared.valid':    { uk: 'Дійсний до',   ru: 'Действителен до', en: 'Valid until' },
  'shared.made':     { uk: 'Розраховано',  ru: 'Рассчитано',   en: 'Calculated' },
  'shared.gone':     { uk: 'Посилання більше не діє', ru: 'Ссылка больше не действует', en: 'This link is no longer valid' },
  'shared.goneText': { uk: 'Попросіть менеджера надіслати актуальний розрахунок.', ru: 'Попросите менеджера прислать актуальный расчёт.', en: 'Ask your manager to send an up-to-date quote.' },
  'shared.questions':{ uk: 'Залишились питання?', ru: 'Остались вопросы?', en: 'Any questions?' },
  'shared.questionsText': { uk: 'Залиште контакти — менеджер передзвонить.', ru: 'Оставьте контакты — менеджер перезвонит.', en: 'Leave your contacts and a manager will call back.' },
  'shared.home':     { uk: 'На головну',   ru: 'На главную',   en: 'Home' },

  // ── Публічний калькулятор ─────────────────────────────────────────────────
  'pc.eyebrow':   { uk: 'Калькулятор',   ru: 'Калькулятор',   en: 'Calculator' },
  'pc.title':     { uk: 'Порахуйте вартість під ключ просто зараз', ru: 'Посчитайте стоимость под ключ прямо сейчас', en: 'Work out your turnkey price right now' },
  'pc.lead': {
    uk: 'Той самий розрахунок, що веде менеджер: ставка, доставка, збори, розмитнення й оформлення. Цифра на сайті не розійдеться з тією, яку назвуть у розмові.',
    ru: 'Тот же расчёт, что ведёт менеджер: ставка, доставка, сборы, растаможка и оформление. Цифра на сайте не разойдётся с той, которую назовут в разговоре.',
    en: 'The same calculation our manager runs: bid, shipping, fees, customs and paperwork. The number here will match what you hear on the phone.',
  },
  'pc.bid':       { uk: 'Ставка на аукціоні, $', ru: 'Ставка на аукционе, $', en: 'Auction bid, $' },
  'pc.year':      { uk: 'Рік випуску',   ru: 'Год выпуска',   en: 'Model year' },
  'pc.fuel':      { uk: 'Пальне',        ru: 'Топливо',       en: 'Fuel' },
  'pc.volume':    { uk: 'Об’єм, л',      ru: 'Объём, л',      en: 'Engine, L' },
  'pc.battery':   { uk: 'Батарея, кВт·год', ru: 'Батарея, кВт·ч', en: 'Battery, kWh' },
  'pc.kind':      { uk: 'Тип кузова',    ru: 'Тип кузова',    en: 'Body type' },
  'pc.location':  { uk: 'Майданчик відправлення', ru: 'Площадка отправления', en: 'Pickup location' },
  'pc.hint':      { uk: 'Вкажіть параметри — розрахунок з’явиться одразу.', ru: 'Укажите параметры — расчёт появится сразу.', en: 'Set the parameters — the quote appears instantly.' },
  'pc.approx': {
    uk: 'Орієнтовний розрахунок. Точну суму підтвердить менеджер після перевірки лота.',
    ru: 'Ориентировочный расчёт. Точную сумму подтвердит менеджер после проверки лота.',
    en: 'Indicative quote. A manager confirms the exact figure after checking the lot.',
  },
  'pc.failed':    { uk: 'Не вдалося порахувати. Залиште контакти — порахуємо вручну.', ru: 'Не удалось посчитать. Оставьте контакты — посчитаем вручную.', en: 'Could not calculate. Leave your contacts and we will do it manually.' },
  'pc.cta':       { uk: 'Хочу таке авто', ru: 'Хочу такое авто', en: 'I want a car like this' },
  'pc.leadTitle': { uk: 'Підберемо конкретний лот під цей бюджет', ru: 'Подберём конкретный лот под этот бюджет', en: 'We will find a real lot for this budget' },
  'pc.leadText':  { uk: 'Безкоштовно, протягом доби, з перевіркою документів лота.', ru: 'Бесплатно, в течение суток, с проверкой документов лота.', en: 'Free of charge, within a day, with a title check.' },

  'kind.sedan':   { uk: 'Седан',         ru: 'Седан',         en: 'Sedan' },
  'kind.suv':     { uk: 'Кросовер',      ru: 'Кроссовер',     en: 'SUV' },
  'kind.pickup':  { uk: 'Пікап',         ru: 'Пикап',         en: 'Pickup' },
  'kind.minivan': { uk: 'Мінівен',       ru: 'Минивэн',       en: 'Minivan' },

  // ── Персональний менеджер (сайт агента) ───────────────────────────────────
  'agent.yourManager': { uk: 'Ваш персональний менеджер', ru: 'Ваш персональный менеджер', en: 'Your personal manager' },

  // ── Встановлення застосунку ───────────────────────────────────────────────
  'install.title':  { uk: 'Встановити застосунок', ru: 'Установить приложение', en: 'Install the app' },
  'install.text': {
    uk: 'Швидкий доступ до вітрини й калькулятора просто з робочого столу',
    ru: 'Быстрый доступ к витрине и калькулятору прямо с рабочего стола',
    en: 'Quick access to the showroom and calculator from your home screen',
  },
  'install.action': { uk: 'Встановити',     ru: 'Установить',     en: 'Install' },
  'install.later':  { uk: 'Не зараз',       ru: 'Не сейчас',      en: 'Not now' },

  // ── Сторінку не знайдено ──────────────────────────────────────────────────
  'notFound.title': { uk: 'Сторінку не знайдено', ru: 'Страница не найдена', en: 'Page not found' },
  'notFound.text': {
    uk: 'Можливо, адреса змінилася або сторінку прибрали. Подивіться авто у продажу — вітрина оновлюється щодня.',
    ru: 'Возможно, адрес изменился или страницу убрали. Посмотрите авто в продаже — витрина обновляется каждый день.',
    en: 'The address may have changed or the page was removed. Take a look at the cars we have — the showroom is updated daily.',
  },
  'notFound.cars':  { uk: 'Авто у продажу', ru: 'Авто в продаже', en: 'Cars available' },
  'notFound.home':  { uk: 'На головну',     ru: 'На главную',     en: 'Home' },

  // ── Партнерська програма (сторінка на поддомене partners.*) ───────────────
  // Рисуется только темой larus — см. site-variant.ts. Строки описывают то,
  // что в системе уже есть: кабинет, калькулятор, расчёт ссылкой, своя
  // страница, нарисованное вознаграждение и видимые этапы. Ни приложения
  // партнёра, ни выплат онлайн, ни API здесь нет — и обещать их нельзя.
  'partners.hero.badge': {
    uk: 'Партнерська програма',
    ru: 'Партнёрская программа',
    en: 'Partner programme',
  },
  'partners.hero.title': {
    uk: 'Ви приводите клієнта — ми привозимо авто',
    ru: 'Вы приводите клиента — мы привозим авто',
    en: 'You bring the client — we bring the car',
  },
  'partners.hero.lead': {
    uk: 'Одне авто на місяць чи постійний потік клієнтів — працюємо однаково. Ви отримуєте не відсоток на словах, а готову інфраструктуру: кабінет зі своїми клієнтами, калькулятор, розрахунок для клієнта посиланням і власну сторінку з вашим ім’ям.',
    ru: 'Одно авто в месяц или постоянный поток клиентов — работаем одинаково. Вы получаете не процент на словах, а готовую инфраструктуру: кабинет со своими клиентами, калькулятор, расчёт для клиента ссылкой и собственную страницу с вашим именем.',
    en: 'One car a month or a steady flow of clients — the terms are the same. You get working infrastructure, not a verbal percentage: your own dashboard with your clients, a calculator, a shareable quote link and a personal page with your name on it.',
  },
  'partners.hero.hint': {
    uk: 'Винагорода нараховується автоматично, коли угоду закрито',
    ru: 'Вознаграждение начисляется автоматически, когда сделка закрыта',
    en: 'Your fee is calculated automatically the moment a deal is won',
  },
  'partners.hero.cta': { uk: 'Залишити заявку', ru: 'Оставить заявку', en: 'Apply now' },
  'partners.hero.cta2': {
    uk: 'Подивитись систему',
    ru: 'Посмотреть систему',
    en: 'See the system',
  },

  // ── Що отримує партнер ────────────────────────────────────────────────────
  'partners.tools.eyebrow': {
    uk: 'Інструменти партнера',
    ru: 'Инструменты партнёра',
    en: 'Partner tools',
  },
  'partners.tools.title': { uk: 'Що ви отримуєте', ru: 'Что вы получаете', en: 'What you get' },
  'partners.tools.lead': {
    uk: 'Усе, щоб вести клієнта самостійно: порахувати, показати цифри, відповісти на «де зараз авто» і побачити свою винагороду.',
    ru: 'Всё, чтобы вести клиента самостоятельно: посчитать, показать цифры, ответить на «где сейчас авто» и увидеть своё вознаграждение.',
    en: 'Everything you need to run the client yourself: quote the car, show the numbers, answer "where is it now" and see your own fee.',
  },
  'partners.tool.cabinet': { uk: 'Особистий кабінет', ru: 'Личный кабинет', en: 'Your dashboard' },
  'partners.tool.cabinetD': {
    uk: 'Ваші клієнти, угоди і винагорода — у розділі «Мій кабінет». Тарифів компанії, маржі й угод інших партнерів ви не бачите — як і вони ваших.',
    ru: 'Ваши клиенты, сделки и вознаграждение — в разделе «Мой кабинет». Тарифов компании, маржи и сделок других партнёров вы не видите — как и они ваших.',
    en: 'Your clients, deals and fees live in "My dashboard". You never see company rates, margins or other partners’ deals — and they never see yours.',
  },
  'partners.tool.calc': { uk: 'Калькулятор під рукою', ru: 'Калькулятор под рукой', en: 'The calculator' },
  'partners.tool.calcD': {
    uk: 'Рахуєте клієнту підсумок самі: ставка, доставка, збори, розмитнення. Цифра не розійдеться з тією, яку назве менеджер — розрахунок один і той самий.',
    ru: 'Считаете клиенту итог сами: ставка, доставка, сборы, растаможка. Цифра не разойдётся с той, что назовёт менеджер — расчёт один и тот же.',
    en: 'You quote the client yourself: bid, shipping, fees, customs. The figure cannot differ from the manager’s — it is literally the same calculation.',
  },
  'partners.tool.quote': {
    uk: 'Розрахунок клієнту посиланням',
    ru: 'Расчёт клиенту ссылкой',
    en: 'A quote you can send',
  },
  'partners.tool.quoteD': {
    uk: 'Надсилаєте акуратну сторінку з розбивкою по статтях витрат. Закупівельних цін там немає — тільки те, що належить бачити клієнту.',
    ru: 'Отправляете аккуратную страницу с разбивкой по статьям расходов. Закупочных цен там нет — только то, что положено видеть клиенту.',
    en: 'Send a clean page with the cost broken down line by line. Purchase prices are not on it — only what the client is meant to see.',
  },
  'partners.tool.page': {
    uk: 'Своя сторінка з вашим ім’ям',
    ru: 'Своя страница с вашим именем',
    en: 'Your own page',
  },
  'partners.tool.pageD': {
    uk: 'Окрема адреса, де стоїть карточка «Ваш персональний менеджер» з вашим ім’ям і телефоном. Заявки звідти закріплюються за вами автоматично.',
    ru: 'Отдельный адрес, где стоит карточка «Ваш персональный менеджер» с вашим именем и телефоном. Заявки оттуда закрепляются за вами автоматически.',
    en: 'A separate address carrying a "Your personal manager" card with your name and phone. Requests from it are assigned to you automatically.',
  },
  'partners.tool.reward': {
    uk: 'Винагорода нараховується сама',
    ru: 'Вознаграждение считается само',
    en: 'The fee counts itself',
  },
  'partners.tool.rewardD': {
    uk: 'Щойно угоду відмічено виграною, винагорода порахована й записана. Нараховане заднім числом не переписується — ні вами, ні нами.',
    ru: 'Как только сделка отмечена выигранной, вознаграждение посчитано и записано. Начисленное задним числом не переписывается — ни вами, ни нами.',
    en: 'The moment a deal is marked won, your fee is calculated and recorded. What is already recorded is never rewritten — not by you, not by us.',
  },
  'partners.tool.status': { uk: 'Видно кожен етап', ru: 'Виден каждый этап', en: 'Every stage is visible' },
  'partners.tool.statusD': {
    uk: 'Аукціон, склад у США, контейнер, порт Клайпеда, митниця, видача. Ви відповідаєте клієнту самі, не передзвонюючи в офіс.',
    ru: 'Аукцион, склад в США, контейнер, порт Клайпеда, таможня, выдача. Вы отвечаете клиенту сами, не перезванивая в офис.',
    en: 'Auction, US warehouse, container, port of Klaipeda, customs, handover. You answer the client yourself instead of calling the office back.',
  },
  'partners.tool.leads': { uk: 'Заявки не губляться', ru: 'Заявки не теряются', en: 'Nothing gets lost' },
  'partners.tool.leadsD': {
    uk: 'Заявка з сайту потрапляє в систему, а не в чиюсь переписку: видно, коли прийшла і що з нею далі.',
    ru: 'Заявка с сайта попадает в систему, а не в чью-то переписку: видно, когда пришла и что с ней дальше.',
    en: 'A request from the site lands in the system, not in somebody’s chat: you see when it came in and what happened next.',
  },

  // ── Як рахується винагорода ───────────────────────────────────────────────
  'partners.reward.eyebrow': { uk: 'Умови', ru: 'Условия', en: 'Terms' },
  'partners.reward.title': {
    uk: 'Як рахується винагорода',
    ru: 'Как считается вознаграждение',
    en: 'How your fee is calculated',
  },
  'partners.reward.lead': {
    uk: 'Два варіанти — обираєте той, що вам ближче. Конкретні суми й відсотки обговорюємо індивідуально: вони залежать від того, скільком клієнтам ви возите і хто веде угоду.',
    ru: 'Два варианта — выбираете тот, что вам ближе. Конкретные суммы и проценты обсуждаем индивидуально: они зависят от того, скольким клиентам вы возите и кто ведёт сделку.',
    en: 'Two options — you pick the one that suits you. The exact amounts and percentages are agreed individually: they depend on your volume and on who runs the deal.',
  },
  'partners.reward.fixed': {
    uk: 'Фіксована сума за авто',
    ru: 'Фиксированная сумма за авто',
    en: 'A fixed amount per car',
  },
  'partners.reward.fixedD': {
    uk: 'Однакова сума за кожне доставлене авто, незалежно від його ціни. Свою винагороду ви знаєте ще до торгів.',
    ru: 'Одинаковая сумма за каждое доставленное авто, независимо от его цены. Своё вознаграждение вы знаете ещё до торгов.',
    en: 'The same amount for every delivered car, whatever it costs. You know your fee before the bidding even starts.',
  },
  'partners.reward.share': {
    uk: 'Відсоток від маржі',
    ru: 'Процент от маржи',
    en: 'A share of the margin',
  },
  'partners.reward.shareD': {
    uk: 'Частка від заробітку компанії на угоді. Дорожчі й складніші авто приносять більше, ніж фіксована сума.',
    ru: 'Доля от заработка компании на сделке. Более дорогие и сложные авто приносят больше, чем фиксированная сумма.',
    en: 'A share of what the company earns on the deal. Pricier, trickier cars pay more than a flat amount would.',
  },
  'partners.reward.promo': {
    uk: 'Умови фіксуємо до першої угоди, а не після неї. Нарахування видно в кабінеті того ж дня.',
    ru: 'Условия фиксируем до первой сделки, а не после неё. Начисление видно в кабинете в тот же день.',
    en: 'Terms are fixed before the first deal, not after it. The accrual shows up in your dashboard the same day.',
  },
  'partners.reward.promoCta': {
    uk: 'Обговорити умови',
    ru: 'Обсудить условия',
    en: 'Discuss the terms',
  },
  'partners.reward.p1': {
    uk: 'Один розрахунок і для вас, і для клієнта',
    ru: 'Один расчёт и для вас, и для клиента',
    en: 'One calculation for you and for the client',
  },
  'partners.reward.p2': {
    uk: 'Кожне нарахування видно в кабінеті',
    ru: 'Каждое начисление видно в кабинете',
    en: 'Every accrual is visible in the dashboard',
  },
  'partners.reward.p3': {
    uk: 'Заявки з вашої сторінки закріплені за вами',
    ru: 'Заявки с вашей страницы закреплены за вами',
    en: 'Requests from your page stay yours',
  },

  // ── Як почати ─────────────────────────────────────────────────────────────
  'partners.start.eyebrow': { uk: 'Початок', ru: 'Начало', en: 'Getting started' },
  'partners.start.title': { uk: 'Як почати', ru: 'Как начать', en: 'How to start' },
  'partners.start.lead': {
    uk: 'Чотири кроки. Без вступних платежів і обов’язкових обсягів.',
    ru: 'Четыре шага. Без вступительных платежей и обязательных объёмов.',
    en: 'Four steps. No joining fee, no minimum volume.',
  },
  'partners.start.1': { uk: 'Заявка', ru: 'Заявка', en: 'Your request' },
  'partners.start.1d': {
    uk: 'Залишаєте ім’я, телефон і пару слів про себе. Відповідаємо в робочий час.',
    ru: 'Оставляете имя, телефон и пару слов о себе. Отвечаем в рабочее время.',
    en: 'Leave your name, phone and a couple of words about yourself. We reply during business hours.',
  },
  'partners.start.2': { uk: 'Обговорюємо умови', ru: 'Обсуждаем условия', en: 'We agree the terms' },
  'partners.start.2d': {
    uk: 'Розповідаєте, скільком клієнтам возите. Обираємо варіант винагороди і фіксуємо його.',
    ru: 'Рассказываете, скольким клиентам возите. Выбираем вариант вознаграждения и фиксируем его.',
    en: 'You tell us about your clients. We pick the fee model together and write it down.',
  },
  'partners.start.3': {
    uk: 'Кабінет і своя сторінка',
    ru: 'Кабинет и своя страница',
    en: 'Dashboard and your page',
  },
  'partners.start.3d': {
    uk: 'Видаємо доступ до кабінету і піднімаємо вашу сторінку з вашим ім’ям і телефоном.',
    ru: 'Выдаём доступ в кабинет и поднимаем вашу страницу с вашим именем и телефоном.',
    en: 'We hand over the dashboard and put up your page with your name and phone on it.',
  },
  'partners.start.4': { uk: 'Перша угода', ru: 'Первая сделка', en: 'The first deal' },
  'partners.start.4d': {
    uk: 'Рахуєте клієнту авто, доставку ведемо ми. Винагорода нарахується, коли угоду закрито.',
    ru: 'Считаете клиенту авто, доставку ведём мы. Вознаграждение начислится, когда сделка закрыта.',
    en: 'You quote the car, we run the delivery. Your fee is accrued once the deal is won.',
  },

  // ── Заявка партнера ───────────────────────────────────────────────────────
  'partners.lead.eyebrow': { uk: 'Заявка', ru: 'Заявка', en: 'Apply' },
  'partners.lead.title': {
    uk: 'Розкажіть про себе — обговоримо умови',
    ru: 'Расскажите о себе — обсудим условия',
    en: 'Tell us about yourself and we will talk terms',
  },
  'partners.lead.lead': {
    uk: 'Відповідаємо в робочий час. На цьому кроці жодних зобов’язань: спершу умови, потім ваше рішення.',
    ru: 'Отвечаем в рабочее время. На этом шаге никаких обязательств: сначала условия, потом ваше решение.',
    en: 'We reply during business hours. Nothing is committed at this step: first the terms, then your decision.',
  },
  'partners.lead.city': { uk: 'Місто', ru: 'Город', en: 'City' },
  'partners.lead.about': {
    uk: 'Пара слів про себе: скільком клієнтам возите, чим займаєтесь',
    ru: 'Пара слов о себе: скольким клиентам возите, чем занимаетесь',
    en: 'A couple of words about you: your clients, what you do',
  },
  'partners.lead.submit': { uk: 'Надіслати заявку', ru: 'Отправить заявку', en: 'Send request' },
  'partners.meta.title': { uk: 'Стати партнером', ru: 'Стать партнёром', en: 'Become a partner' },
  'partners.meta.description': {
    uk: 'Партнерська програма Larus Logistics: кабінет зі своїми клієнтами, калькулятор, розрахунок клієнту посиланням, власна сторінка з вашим ім’ям і винагорода, що нараховується автоматично.',
    ru: 'Партнёрская программа Larus Logistics: кабинет со своими клиентами, калькулятор, расчёт клиенту ссылкой, своя страница с вашим именем и вознаграждение, которое начисляется автоматически.',
    en: 'The Larus Logistics partner programme: your own dashboard, a calculator, shareable quotes, a personal page with your name and a fee that is calculated automatically.',
  },

  // ── Общее ─────────────────────────────────────────────────────────────────
  'common.loading':  { uk: 'Завантаження…', ru: 'Загрузка…',  en: 'Loading…' },
} satisfies Dict<string>;

export type DictKey = keyof typeof dict;
