import type { Locale } from '@avtoklyuch/shared';

/**
 * Материалы раздела «Полезное».
 *
 * Перенесены с westauto.com.ua. Русский — авторский текст клиента, он
 * оставлен дословно. Украинский и английский — перевод.
 *
 * Тексты лежат в коде, а не в базе: они меняются раз в несколько месяцев,
 * а редактор статей — отдельный продукт, которого ТЗ не просило.
 */

export type Block =
  | { t: 'p'; v: Record<Locale, string> }
  | { t: 'h2'; v: Record<Locale, string> }
  | { t: 'h3'; v: Record<Locale, string> }
  | { t: 'ul'; v: Record<Locale, string[]> }
  | { t: 'ol'; v: Record<Locale, string[]> }
  | { t: 'quote'; v: Record<Locale, string> };

export interface Article {
  slug: string;
  date: string;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  blocks: Block[];
}

export const ARTICLES: Article[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'rozmytnennia-avto-zi-ssha-2026',
    date: '2026-01-14',
    title: {
      uk: 'Розмитнення авто зі США у 2026 році: як рахується і скільки реально платити',
      ru: 'Растаможка авто из США в 2026 году: как считается и сколько реально платить',
      en: 'US car customs in Ukraine, 2026: how it is calculated and what you really pay',
    },
    excerpt: {
      uk: 'Формула без міфів: мито, акциз, ПДВ. Приклад розрахунку і чому електромобілі поки вигідні.',
      ru: 'Формула без мифов: пошлина, акциз, НДС. Пример расчёта и почему электромобили пока выгодны.',
      en: 'The formula without myths: duty, excise, VAT. A worked example and why EVs are still a bargain.',
    },
    blocks: [
      { t: 'p', v: {
        uk: 'Купівля автомобіля зі США давно перестала бути екзотикою. Українці активно ввозять авто з аукціонів Copart та IAAI, але головне питання лишається тим самим — скільки реально коштує розмитнення авто зі США у 2026 році і з чого складається підсумкова сума.',
        ru: 'Покупка автомобиля из США давно перестала быть экзотикой. Украинцы активно ввозят авто с аукционов Copart и IAAI, но главный вопрос остаётся прежним — сколько реально стоит растаможка авто из США в 2026 году и из чего складывается итоговая сумма.',
        en: 'Importing a car from the USA stopped being exotic long ago. Ukrainians actively buy at Copart and IAAI, but the main question stays the same: what does customs clearance really cost in 2026, and what makes up the final figure.',
      }},
      { t: 'p', v: {
        uk: 'Розберемо все по кроках, простою мовою, без міфів і «сюрпризів».',
        ru: 'Разберём всё по шагам, простым языком, без мифов и «сюрпризов».',
        en: 'Let us go through it step by step, in plain language, without myths or surprises.',
      }},
      { t: 'h2', v: {
        uk: 'З чого складається вартість розмитнення',
        ru: 'Из чего состоит стоимость растаможки',
        en: 'What customs clearance consists of',
      }},
      { t: 'p', v: {
        uk: 'Розмитнення в Україні рахується не «на око», а за чіткою формулою. У 2026 році вона включає:',
        ru: 'Растаможка автомобиля в Украине считается не «на глаз», а по чёткой формуле. В 2026 году она включает:',
        en: 'Customs in Ukraine is not guesswork — there is a clear formula. In 2026 it includes:',
      }},
      { t: 'ol', v: {
        uk: ['Ввізне мито', 'Акцизний податок', 'ПДВ (20 %)'],
        ru: ['Ввозную пошлину', 'Акцизный налог', 'НДС (20 %)'],
        en: ['Import duty', 'Excise tax', 'VAT (20%)'],
      }},
      { t: 'p', v: {
        uk: 'Базою для розрахунку найчастіше є митна вартість, яка включає ціну автомобіля на аукціоні, аукціонні збори та доставку до України.',
        ru: 'Базой для расчёта чаще всего является таможенная стоимость, которая включает цену автомобиля на аукционе, аукционные сборы и доставку до Украины.',
        en: 'The base is usually the customs value: the auction price, auction fees and shipping to Ukraine.',
      }},
      { t: 'h2', v: { uk: 'Ввізне мито', ru: 'Ввозная пошлина', en: 'Import duty' }},
      { t: 'ul', v: {
        uk: ['10 % — для бензинових і дизельних авто', '0 % — для електромобілів (пільга поки діє)'],
        ru: ['10 % — для бензиновых и дизельных авто', '0 % — для электромобилей (льгота пока действует)'],
        en: ['10% for petrol and diesel cars', '0% for electric cars (the exemption still applies)'],
      }},
      { t: 'h2', v: { uk: 'Акцизний податок: ключовий елемент', ru: 'Акцизный налог: ключевой элемент', en: 'Excise tax: the key element' }},
      { t: 'p', v: {
        uk: 'Акциз залежить від типу двигуна, об’єму двигуна та року випуску. Спрощено формула виглядає так:',
        ru: 'Акциз зависит от типа двигателя, объёма двигателя и года выпуска. Упрощённо формула выглядит так:',
        en: 'Excise depends on engine type, engine size and model year. Simplified, the formula looks like this:',
      }},
      { t: 'quote', v: {
        uk: 'Акциз = базова ставка × об’єм двигуна × коефіцієнт віку',
        ru: 'Акциз = базовая ставка × объём двигателя × коэффициент возраста',
        en: 'Excise = base rate × engine volume × age coefficient',
      }},
      { t: 'p', v: {
        uk: 'Чим старше авто і більший мотор — тим вищий акциз. Саме тому авто 2019–2021 років найчастіше найвигідніші.',
        ru: 'Чем старше авто и больше мотор — тем выше акциз. Именно поэтому авто 2019–2021 годов чаще всего самые выгодные.',
        en: 'The older the car and the bigger the engine, the higher the excise. That is why cars from 2019–2021 usually work out best.',
      }},
      { t: 'h2', v: { uk: 'ПДВ — 20 %', ru: 'НДС — 20 %', en: 'VAT — 20%' }},
      { t: 'p', v: {
        uk: 'ПДВ нараховується на все разом: вартість авто, доставку, мито й акциз. Саме ПДВ часто «добиває» фінальну цифру, через що ціна після розмитнення відрізняється від очікувань.',
        ru: 'НДС начисляется на всё сразу: стоимость авто, доставку, пошлину и акциз. Именно НДС часто «добивает» финальную цифру, из-за чего цена после растаможки отличается от ожиданий.',
        en: 'VAT is charged on everything at once: the car, shipping, duty and excise. VAT is what usually pushes the final figure above expectations.',
      }},
      { t: 'h2', v: { uk: 'Приклад розрахунку', ru: 'Пример расчёта растаможки', en: 'A worked example' }},
      { t: 'p', v: {
        uk: 'Припустимо: авто куплене за 10 000 $, доставка і збори — 2 000 $, двигун 2.0 бензин, рік випуску 2020. Приблизно вийде:',
        ru: 'Допустим: авто куплено за 10 000 $, доставка и сборы — 2 000 $, объём двигателя 2.0 бензин, год выпуска 2020. Примерно:',
        en: 'Say the car costs $10,000, shipping and fees $2,000, a 2.0 petrol engine, model year 2020. Roughly:',
      }},
      { t: 'ul', v: {
        uk: ['мито: близько 1 200 $', 'акциз: близько 1 000 $', 'ПДВ: близько 2 800 $', 'Разом розмитнення: близько 5 000 $'],
        ru: ['пошлина: ~1 200 $', 'акциз: ~1 000 $', 'НДС: ~2 800 $', 'Итого растаможка: около 5 000 $'],
        en: ['duty: about $1,200', 'excise: about $1,000', 'VAT: about $2,800', 'Total customs: about $5,000'],
      }},
      { t: 'p', v: {
        uk: 'Кожен випадок індивідуальний, але порядок цифр саме такий.',
        ru: 'Каждый случай индивидуален, но порядок цифр именно такой.',
        en: 'Every case differs, but this is the order of magnitude.',
      }},
      { t: 'h2', v: { uk: 'Електромобілі у 2026 році', ru: 'Электромобили в 2026 году', en: 'Electric cars in 2026' }},
      { t: 'ul', v: {
        uk: ['ввізне мито — 0 %', 'акциз — 1 євро за 1 кВт·год', 'ПДВ — 20 %', 'пенсійний збір не стягується'],
        ru: ['ввозная пошлина — 0 %', 'акциз — 1 евро за 1 кВт·ч', 'НДС — 20 %', 'ПФ — не взимается'],
        en: ['import duty — 0%', 'excise — €1 per kWh', 'VAT — 20%', 'no pension fund levy'],
      }},
      { t: 'p', v: {
        uk: 'Але пільги не вічні. Саме тому електромобілі активно ввозять уже зараз, поки умови максимально вигідні.',
        ru: 'Но льготы не вечны. Именно поэтому электромобили активно ввозят уже сейчас, пока условия максимально выгодные.',
        en: 'But exemptions do not last forever. That is exactly why people are importing EVs now, while the terms are at their best.',
      }},
      { t: 'h2', v: { uk: 'Підсумок', ru: 'Итог', en: 'The bottom line' }},
      { t: 'p', v: {
        uk: 'Розмитнення авто зі США у 2026 році — це не лотерея, а розрахунок. Якщо заздалегідь розуміти формулу і нюанси, покупка авто з аукціону лишається одним із найвигідніших способів придбати автомобіль.',
        ru: 'Растаможка авто из США в 2026 году — это не лотерея, а расчёт. Если заранее понимать формулу и нюансы, покупка авто с аукциона остаётся одним из самых выгодных способов приобрести автомобиль.',
        en: 'Customs on a US car in 2026 is arithmetic, not a lottery. Understand the formula in advance and buying at auction stays one of the best ways to get a car.',
      }},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'rozmytnennia-avto-z-nimechchyny-2026',
    date: '2025-12-26',
    title: {
      uk: 'Розмитнення авто з Німеччини у 2026 році: ставки, приклади розрахунку і нюанси',
      ru: 'Растаможка авто из Германии в 2026 году: актуальные ставки, примеры расчёта и важные нюансы',
      en: 'German car customs in 2026: rates, worked examples and the fine print',
    },
    excerpt: {
      uk: 'Як визначається митна вартість, чому таможня може її скоригувати і що найчастіше забувають порахувати.',
      ru: 'Как определяется таможенная стоимость, почему таможня может её скорректировать и что чаще всего забывают посчитать.',
      en: 'How customs value is set, why customs may adjust it, and what people forget to count.',
    },
    blocks: [
      { t: 'p', v: {
        uk: 'Розмитнення автомобілів лишається одним із головних питань для тих, хто планує пригнати авто з Німеччини в Україну. У 2026 році правила загалом зберігають знайому логіку, але є важливі деталі, які напряму впливають на підсумкову вартість.',
        ru: 'Растаможка автомобилей остаётся одним из главных вопросов для тех, кто планирует пригнать авто из Германии в Украину. В 2026 году правила в целом сохраняют знакомую логику, но есть важные детали, которые напрямую влияют на итоговую стоимость.',
        en: 'Customs remains the main question for anyone bringing a car from Germany to Ukraine. In 2026 the logic is familiar, but the details matter and they move the final number.',
      }},
      { t: 'h2', v: { uk: 'З чого складається вартість', ru: 'Из чего складывается стоимость растаможки', en: 'What makes up the cost' }},
      { t: 'ul', v: {
        uk: ['Ввізне мито — 10 % від митної вартості', 'Акцизний податок — залежить від пального, об’єму і віку', 'ПДВ — 20 % від суми: митна вартість + мито + акциз', 'Додаткові витрати — сертифікація, пенсійний збір, брокер'],
        ru: ['Ввозная пошлина — 10 % от таможенной стоимости', 'Акцизный налог — зависит от топлива, объёма и возраста', 'НДС — 20 % от суммы: таможенная стоимость + пошлина + акциз', 'Дополнительные расходы — сертификация, пенсионный сбор, брокер'],
        en: ['Import duty — 10% of customs value', 'Excise — depends on fuel, engine size and age', 'VAT — 20% of customs value plus duty plus excise', 'Extras — certification, pension levy, broker fees'],
      }},
      { t: 'h2', v: { uk: 'Як визначається митна вартість', ru: 'Как определяется таможенная стоимость', en: 'How customs value is determined' }},
      { t: 'p', v: {
        uk: 'Митна вартість — це не завжди ціна в договорі. Митниця орієнтується на середньоринкові ціни, рік випуску і комплектацію, тип двигуна та екологічний стандарт, реальний технічний стан.',
        ru: 'Таможенная стоимость — это не всегда цена, указанная в договоре купли-продажи. Таможня ориентируется на среднерыночные цены, год выпуска и комплектацию, тип двигателя и экологический стандарт, реальное техническое состояние.',
        en: 'Customs value is not always the contract price. Customs look at market averages, year and trim, engine type and emissions class, and the actual condition.',
      }},
      { t: 'p', v: {
        uk: 'Якщо ціна в документах виглядає заниженою, митниця має право скоригувати її вгору. Це звичайна практика, і до неї варто бути готовим заздалегідь.',
        ru: 'Если цена в документах выглядит заниженной, таможня имеет право скорректировать её в сторону увеличения. Это нормальная практика, и к ней нужно быть готовым заранее.',
        en: 'If the documented price looks understated, customs may raise it. That is normal practice and worth expecting.',
      }},
      { t: 'h2', v: { uk: 'Акциз у 2026 році', ru: 'Акциз в 2026 году: как он считается', en: 'Excise in 2026' }},
      { t: 'quote', v: {
        uk: 'Акциз = базова ставка × об’єм двигуна × вік авто',
        ru: 'Акциз = базовая ставка × объём двигателя × возраст авто',
        en: 'Excise = base rate × engine volume × vehicle age',
      }},
      { t: 'ul', v: {
        uk: ['бензин — 50 євро', 'дизель — 75 євро', 'гібрид — знижена ставка'],
        ru: ['бензин — 50 евро', 'дизель — 75 евро', 'гибрид — сниженная ставка'],
        en: ['petrol — €50', 'diesel — €75', 'hybrid — reduced rate'],
      }},
      { t: 'p', v: {
        uk: 'Саме тому автомобілі 2016–2018 років найчастіше лишаються найвигіднішими для ввезення.',
        ru: 'Именно поэтому автомобили 2016–2018 годов чаще всего остаются самыми выгодными для ввоза.',
        en: 'That is why cars from 2016–2018 usually remain the most sensible to import.',
      }},
      { t: 'h2', v: { uk: 'Приклад: дизель із Німеччини', ru: 'Пример расчёта: дизельное авто из Германии', en: 'Example: a German diesel' }},
      { t: 'p', v: {
        uk: 'Mercedes E220, 2017 рік, дизель 2.0. Ціна в Німеччині 13 000 €.',
        ru: 'Mercedes E220, 2017 год, дизель 2.0. Цена в Германии 13 000 €.',
        en: 'Mercedes E220, 2017, 2.0 diesel. Price in Germany €13,000.',
      }},
      { t: 'ul', v: {
        uk: ['Мито (10 %): 1 300 €', 'Акциз: 75 × 2.0 × 9 = 1 350 €', 'ПДВ: близько 3 130 €', 'Разом розмитнення: приблизно 5 800–6 000 €'],
        ru: ['Пошлина (10 %): 1 300 €', 'Акциз: 75 × 2.0 × 9 = 1 350 €', 'НДС: около 3 130 €', 'Итого растаможка: примерно 5 800–6 000 €'],
        en: ['Duty (10%): €1,300', 'Excise: 75 × 2.0 × 9 = €1,350', 'VAT: about €3,130', 'Total customs: roughly €5,800–6,000'],
      }},
      { t: 'h2', v: { uk: 'Що найчастіше пропускають', ru: 'Что чаще всего упускают при расчётах', en: 'What people miss' }},
      { t: 'ul', v: {
        uk: ['рахують лише за калькулятором, без коригування вартості', 'забувають про сертифікацію і пенсійний збір', 'не враховують логістику та простої'],
        ru: ['считают растаможку только по калькулятору без учёта корректировки стоимости', 'забывают про сертификацию и пенсионный сбор', 'не учитывают логистику и простои'],
        en: ['they use a calculator only, ignoring value adjustments', 'they forget certification and the pension levy', 'they leave out logistics and demurrage'],
      }},
      { t: 'p', v: {
        uk: 'У результаті підсумкова сума виявляється вищою за очікування, хоча формально «нічого не подорожчало».',
        ru: 'В результате итоговая сумма оказывается выше ожиданий, хотя формально «ничего не подорожало».',
        en: 'The result is a higher final figure, even though formally nothing got more expensive.',
      }},
      { t: 'h2', v: { uk: 'Підсумок', ru: 'Итог', en: 'The bottom line' }},
      { t: 'p', v: {
        uk: 'Німеччина досі вигідна для купівлі доглянутих автомобілів із прозорою історією, особливо в сегменті 2016–2019 років. Реальну вартість «під ключ» краще рахувати заздалегідь, а не на етапі митниці.',
        ru: 'Германия по-прежнему выгодна для покупки ухоженных автомобилей с прозрачной историей, особенно в сегменте 2016–2019 годов. Реальную стоимость «под ключ» лучше считать заранее, а не на этапе таможни.',
        en: 'Germany is still worthwhile for well-kept cars with clean histories, especially 2016–2019. Work out the real turnkey cost in advance, not at the customs desk.',
      }},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'hibrydy-2026',
    date: '2026-01-18',
    title: {
      uk: 'Гібриди: чи варто ввозити в Україну у 2026 році',
      ru: 'Гибриды: стоит ли ввозить в Украину в 2026 году',
      en: 'Hybrids: are they worth importing to Ukraine in 2026?',
    },
    excerpt: {
      uk: 'Типи гібридів, податки, на що дивитись при виборі та які варіанти вигідніше везти зі США.',
      ru: 'Типы гибридов, налоги, на что смотреть при выборе и какие варианты выгоднее везти из США.',
      en: 'Hybrid types, taxes, what to check, and which ones make sense to ship from the USA.',
    },
    blocks: [
      { t: 'p', v: {
        uk: 'Після введення повноцінного розмитнення електромобілі тепер оподатковуються як звичайні авто, і покупці активніше дивляться в бік гібридів. Розбираємось по порядку.',
        ru: 'Украинский рынок после введения полноценной растаможки претерпел изменения: электромобили теперь облагаются налогами как обычные автомобили, а покупатели начали активнее смотреть в сторону гибридов. Разбираемся по порядку.',
        en: 'With full customs now applied, EVs are taxed like ordinary cars and buyers are looking harder at hybrids. Let us work through it.',
      }},
      { t: 'h2', v: { uk: 'Що таке гібриди', ru: 'Что такое гибриды', en: 'What hybrids are' }},
      { t: 'p', v: {
        uk: 'Гібрид — автомобіль із двома джерелами енергії: традиційним двигуном внутрішнього згоряння та електромотором з акумулятором.',
        ru: 'Гибрид — это автомобиль с двумя источниками энергии: традиционный двигатель внутреннего сгорания и электрический двигатель с аккумулятором.',
        en: 'A hybrid has two power sources: a conventional combustion engine and an electric motor with a battery.',
      }},
      { t: 'ul', v: {
        uk: ['Full Hybrid — може рухатись на електриці самостійно', 'Mild Hybrid — електрика лише допомагає ДВЗ', 'Plug-in (PHEV) — акумулятор можна заряджати від мережі'],
        ru: ['Full Hybrid — автомобиль может двигаться на электричестве самостоятельно', 'Mild Hybrid — электрическая часть работает лишь в помощь ДВС', 'Plug-in (PHEV) — аккумулятор можно заряжать от сети'],
        en: ['Full hybrid — can drive on electricity alone', 'Mild hybrid — the electric side only assists the engine', 'Plug-in (PHEV) — the battery charges from the grid'],
      }},
      { t: 'h2', v: { uk: 'Переваги для України', ru: 'Преимущества гибридов для Украины', en: 'Why they suit Ukraine' }},
      { t: 'ul', v: {
        uk: ['Менша витрата пального — до 20–30 % у міському циклі', 'Менший знос гальм і двигуна завдяки рекуперації', 'Нижчі податки порівняно з потужними бензиновими', 'Хороші пропозиції на аукціонах США'],
        ru: ['Меньший расход топлива — до 20–30 % в городском цикле', 'Меньше износ тормозов и двигателя благодаря рекуперации', 'Более низкие налоги по сравнению с мощными бензиновыми', 'Хорошие предложения на аукционах США'],
        en: ['Lower fuel use — up to 20–30% in city driving', 'Less brake and engine wear thanks to regeneration', 'Lower taxes than large petrol engines', 'Good deals at US auctions'],
      }},
      { t: 'h2', v: { uk: 'Як рахуються податки', ru: 'Как считаются налоги для гибридов', en: 'How hybrids are taxed' }},
      { t: 'p', v: {
        uk: 'Мито 10 %, ПДВ 20 %, акциз за формулою з коефіцієнтами віку й об’єму, пенсійний збір. Для гібридів формула зазвичай вигідніша, ніж для бензину такого ж об’єму — підсумкове розмитнення може бути на 10–20 % нижчим.',
        ru: 'Пошлина 10 %, НДС 20 %, акциз по формуле с множителями по возрасту и объёму двигателя, пенсионный сбор. Для гибридов формула обычно выглядит выгоднее, чем для бензина аналогичного объёма — итоговая растаможка может быть на 10–20 % ниже.',
        en: 'Duty 10%, VAT 20%, excise by the age-and-volume formula, plus the pension levy. For hybrids the formula usually works out better than for petrol of the same size — total customs can be 10–20% lower.',
      }},
      { t: 'h2', v: { uk: 'На що особливо дивитись', ru: 'На что особенно смотреть', en: 'What to check carefully' }},
      { t: 'h3', v: { uk: 'Стан батареї', ru: 'Состояние батареи', en: 'Battery condition' }},
      { t: 'p', v: {
        uk: 'Акумулятор гібрида часто коштує дорожче за двигун. Перевіряйте стан батареї, рівень деградації, коди помилок.',
        ru: 'Аккумулятор гибрида часто стоит дороже двигателя. Проверяйте состояние батареи, уровень деградации, коды ошибок.',
        en: 'A hybrid battery often costs more than the engine. Check its state of health, degradation and fault codes.',
      }},
      { t: 'h3', v: { uk: 'Електроніка', ru: 'Электроника', en: 'Electronics' }},
      { t: 'p', v: {
        uk: 'У гібридах багато датчиків і контролерів. Навіть косметичний удар може створити код помилки і вимкнути частину функцій.',
        ru: 'В гибридах много датчиков, контроллеров и CAN-шины. Даже косметический удар может создать код ошибки и отключить часть функций.',
        en: 'Hybrids carry a lot of sensors and controllers. Even cosmetic damage can throw a fault code and disable functions.',
      }},
      { t: 'h3', v: { uk: 'Доступність запчастин', ru: 'Доступность запчастей', en: 'Parts availability' }},
      { t: 'p', v: {
        uk: 'У японських гібридів (Toyota, Lexus, Honda) запчастини й діагностика доступніші в Україні, ніж у європейських аналогів.',
        ru: 'У японских гибридов (Toyota, Lexus, Honda) запчасти и диагностика более доступные в Украине, чем у европейских аналогов.',
        en: 'Japanese hybrids (Toyota, Lexus, Honda) have better parts and diagnostics availability in Ukraine than European equivalents.',
      }},
      { t: 'h2', v: { uk: 'Висновок', ru: 'Вывод: стоит ли везти гибрид', en: 'The verdict' }},
      { t: 'p', v: {
        uk: 'Так — якщо авто вигідне на аукціоні, стан батареї та електроніки хороший, і це mild hybrid або перевірений full hybrid від японських брендів. Обережніше — з дорогими PHEV із великим пробігом: ремонт батареї коштує дорого.',
        ru: 'Да — если авто стоит выгодно на аукционе, состояние батареи и электроники хорошее, и это mild hybrid или проверенный full hybrid от японских брендов. Осторожнее — с дорогими PHEV с большим пробегом: ремонт батареи стоит дорого.',
        en: 'Yes, if the auction price is good, the battery and electronics are healthy, and it is a mild hybrid or a proven Japanese full hybrid. Be careful with expensive high-mileage PHEVs — battery repair is costly.',
      }},
      { t: 'p', v: {
        uk: 'Гібриди у 2026 році — реальна золота середина між електромобілями і старими бензиновими та дизельними машинами.',
        ru: 'Гибриды в 2026 году — это реальная золотая середина между электрическими автомобилями и старыми бензиновыми/дизельными машинами.',
        en: 'In 2026 hybrids really are the middle ground between EVs and older petrol or diesel cars.',
      }},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'yaki-loty-mozhna-kupuvaty',
    date: '2025-11-10',
    title: {
      uk: 'Які лоти можна купувати: документи, з якими немає проблем',
      ru: 'Можно покупать: документы, с которыми нет проблем',
      en: 'Titles you can safely buy',
    },
    excerpt: {
      uk: 'Категорії титулів, які спокійно проходять розмитнення і постановку на облік в Україні.',
      ru: 'Категории титулов, которые спокойно проходят растаможку и постановку на учёт в Украине.',
      en: 'Title categories that clear Ukrainian customs and registration without trouble.',
    },
    blocks: [
      { t: 'p', v: {
        uk: 'Лоти з документами, наведеними нижче, можна купувати сміливо: вони проходять розмитнення і реєстрацію без додаткових питань.',
        ru: 'Лоты с документами, которые приведены ниже, можно покупать смело: они проходят растаможку и регистрацию без дополнительных вопросов.',
        en: 'Lots with the titles below can be bought with confidence: they clear customs and registration without extra questions.',
      }},
      { t: 'h2', v: { uk: 'Основні категорії', ru: 'Основные категории', en: 'Main categories' }},
      { t: 'ul', v: {
        uk: [
          'Salvage title і сертифікати salvage, зокрема з переоформленням (reassignment)',
          'Clean title з переоформленням між штатами',
          'Rebuilt і reconstructed title — авто вже відновлене і легалізоване',
          'Certificate of title — flood / water damage за умови адекватного стану',
          'Lemon law repurchase — викуп виробником за програмою заміни',
        ],
        ru: [
          'Salvage title и сертификаты salvage, в том числе с переоформлением (reassignment)',
          'Clean title с переоформлением между штатами',
          'Rebuilt и reconstructed title — авто уже восстановлено и легализовано',
          'Certificate of title — flood / water damage при адекватном состоянии',
          'Lemon law repurchase — выкуп производителем по программе замены',
        ],
        en: [
          'Salvage titles and salvage certificates, including with reassignment',
          'Clean titles with interstate reassignment',
          'Rebuilt and reconstructed titles — already restored and legalised',
          'Certificate of title with flood or water damage, condition permitting',
          'Lemon law repurchase — bought back by the manufacturer',
        ],
      }},
      { t: 'h2', v: { uk: 'Приклади формулювань', ru: 'Примеры формулировок', en: 'Typical wordings' }},
      { t: 'ul', v: {
        uk: ['907A SALVAGE WITH REASSIGNMENT', 'BRANDED DISCLOSED DAMAGE', 'CERT OF SALVAGE — WATER DAMAGE', 'REBUILT SALVAGE', 'CERT OF TITLE — FLOOD'],
        ru: ['907A SALVAGE WITH REASSIGNMENT', 'BRANDED DISCLOSED DAMAGE', 'CERT OF SALVAGE — WATER DAMAGE', 'REBUILT SALVAGE', 'CERT OF TITLE — FLOOD'],
        en: ['907A SALVAGE WITH REASSIGNMENT', 'BRANDED DISCLOSED DAMAGE', 'CERT OF SALVAGE — WATER DAMAGE', 'REBUILT SALVAGE', 'CERT OF TITLE — FLOOD'],
      }},
      { t: 'p', v: {
        uk: 'Формулювань понад п’ятсот, і багато з них специфічні для конкретного штату. Якщо у вас на руках конкретний лот — надішліть номер, ми перевіримо титул безкоштовно до торгів.',
        ru: 'Формулировок более пятисот, и многие специфичны для конкретного штата. Если у вас на руках конкретный лот — пришлите номер, мы проверим титул бесплатно до торгов.',
        en: 'There are over five hundred wordings, many state-specific. If you have a particular lot, send us the number and we will check the title free of charge before bidding.',
      }},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'yaki-loty-ne-varto-kupuvaty',
    date: '2025-11-10',
    title: {
      uk: 'Які лоти купувати не варто: небезпечні документи',
      ru: 'Покупать нельзя: опасные документы',
      en: 'Titles to avoid',
    },
    excerpt: {
      uk: 'Титули, з якими авто не поставити на облік або ремонт вийде дорожчим за саму машину.',
      ru: 'Титулы, с которыми авто не поставить на учёт или ремонт выйдет дороже самой машины.',
      en: 'Titles that block registration or make repair cost more than the car.',
    },
    blocks: [
      { t: 'p', v: {
        uk: 'Лоти з документами, зазначеними нижче, купувати не варто. Проблема не в ціні, а в тому, що таке авто або не поставити на облік, або відновлення коштуватиме дорожче за саму машину.',
        ru: 'Лоты с документами, которые указаны ниже, покупать не стоит. Проблема не в цене, а в том, что такое авто либо не поставить на учёт, либо восстановление обойдётся дороже самой машины.',
        en: 'Do not buy lots with the titles below. The issue is not price: either the car cannot be registered, or restoring it costs more than the car is worth.',
      }},
      { t: 'h2', v: { uk: 'Категорії ризику', ru: 'Категории риска', en: 'Risk categories' }},
      { t: 'ul', v: {
        uk: [
          'Abandonment — документи про покинуте авто, процедури і повідомлення',
          'Junk title — автомобіль офіційно визнано брухтом',
          'Non-repairable certificate — відновленню не підлягає за законом штату',
          'Bill of sale — parts only, no VIN, flood damage: продаж на запчастини',
          'Lien papers і repossession — застава та вилучення, документи не завершені',
          'Government і court-ordered titles — рішення суду, обмеження на реєстрацію',
        ],
        ru: [
          'Abandonment — документы о брошенном авто, процедуры и уведомления',
          'Junk title — автомобиль официально признан ломом',
          'Non-repairable certificate — восстановлению не подлежит по закону штата',
          'Bill of sale — parts only, no VIN, flood damage: продажа на запчасти',
          'Lien papers и repossession — залог и изъятие, документы не завершены',
          'Government и court-ordered titles — решение суда, ограничения на регистрацию',
        ],
        en: [
          'Abandonment — abandoned-vehicle paperwork, notices and procedures',
          'Junk title — officially declared scrap',
          'Non-repairable certificate — cannot legally be rebuilt in that state',
          'Bill of sale — parts only, no VIN, flood damage: sold for parts',
          'Lien papers and repossession — incomplete paperwork',
          'Government and court-ordered titles — court restrictions on registration',
        ],
      }},
      { t: 'h2', v: { uk: 'Головне правило', ru: 'Главное правило', en: 'The rule of thumb' }},
      { t: 'p', v: {
        uk: 'Якщо в титулі є слова parts only, junk, non-repairable або відсутній VIN — лот не розглядається, якою б привабливою не була ціна.',
        ru: 'Если в титуле есть слова parts only, junk, non-repairable или отсутствует VIN — лот не рассматривается, какой бы привлекательной ни была цена.',
        en: 'If the title says parts only, junk or non-repairable, or there is no VIN, the lot is off the table no matter how attractive the price.',
      }},
      { t: 'p', v: {
        uk: 'Ми перевіряємо титул кожного лота до ставки — це входить у безкоштовний підбір.',
        ru: 'Мы проверяем титул каждого лота до ставки — это входит в бесплатный подбор.',
        en: 'We check the title of every lot before bidding — it is part of the free selection service.',
      }},
    ],
  },
];

export function findArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}
