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

  // ── Общее ─────────────────────────────────────────────────────────────────
  'common.loading':  { uk: 'Завантаження…', ru: 'Загрузка…',  en: 'Loading…' },
} satisfies Dict<string>;

export type DictKey = keyof typeof dict;
