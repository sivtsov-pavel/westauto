import { pool, queryOne } from './pool.js';

/**
 * Стартовое наполнение витрины.
 *
 * Машины взяты из примеров на сайте клиента westauto.com.ua — это реальные
 * модели, которые компания возит. Цены посчитаны по той же логике, что и в
 * калькуляторе: ставка + доставка и сборы + растаможка + услуги.
 *
 * Идемпотентно: если витрина уже наполнена, ничего не трогаем.
 */
interface SeedCar {
  slug: string;
  status: 'available' | 'at_auction' | 'delivered_case';
  title: string;
  makeModel: string;
  year: number;
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  engineVolume: number | null;
  vehicleKind: 'sedan' | 'suv' | 'pickup' | 'coupe' | 'minivan';
  platform: 'copart' | 'iaai';
  location: string;
  lotNumber: string;
  mileage: number;
  damage: string;
  bid: number;
  delivery: number;
  customs: number;
  services: number;
  description: string;
}

const CARS: SeedCar[] = [
  {
    slug: 'jeep-compass-latitude-2016',
    status: 'available',
    title: 'Jeep Compass Latitude, 2016',
    makeModel: 'Jeep Compass Latitude',
    year: 2016, fuel: 'petrol', engineVolume: 2.0, vehicleKind: 'suv',
    platform: 'copart', location: 'Texas', lotNumber: '58214477',
    mileage: 86400, damage: 'Передній удар, подушки цілі',
    bid: 7400, delivery: 2180, customs: 3120, services: 860,
    description: 'Повний привід, шкіряний салон. Авто в дорозі, прибуття до Одеси очікується протягом 3 тижнів.',
  },
  {
    slug: 'nissan-rogue-sport-2019',
    status: 'available',
    title: 'Nissan Rogue Sport, 2019',
    makeModel: 'Nissan Rogue Sport',
    year: 2019, fuel: 'petrol', engineVolume: 2.0, vehicleKind: 'suv',
    platform: 'iaai', location: 'New Jersey', lotNumber: '41903562',
    mileage: 52100, damage: 'Бічний удар, лонжерони цілі',
    bid: 9800, delivery: 2340, customs: 3980, services: 860,
    description: 'Один власник за історією Carfax, сервісна книга повна. Готується до відправлення.',
  },
  {
    slug: 'vw-passat-se-2014',
    status: 'delivered_case',
    title: 'VW Passat SE 1.8 TSI, 2014',
    makeModel: 'Volkswagen Passat SE',
    year: 2014, fuel: 'petrol', engineVolume: 1.8, vehicleKind: 'sedan',
    platform: 'copart', location: 'Georgia', lotNumber: '49872301',
    mileage: 118700, damage: 'Передній удар — відновлено',
    bid: 5200, delivery: 1980, customs: 2640, services: 860,
    description: 'Привезено і передано клієнту. Реальний приклад розрахунку: усі статті витрат у картці нижче.',
  },
  {
    slug: 'ford-fusion-se-2017',
    status: 'delivered_case',
    title: 'Ford Fusion SE 2.5, 2017',
    makeModel: 'Ford Fusion SE',
    year: 2017, fuel: 'petrol', engineVolume: 2.5, vehicleKind: 'sedan',
    platform: 'copart', location: 'Texas', lotNumber: '52001984',
    mileage: 74300, damage: 'Задній удар — відновлено',
    bid: 5600, delivery: 1640, customs: 2900, services: 860,
    description: 'Фінальна ціна під ключ — 11 000 $. Клієнт отримав авто на облік через 11 тижнів після торгів.',
  },
  {
    slug: 'jeep-cherokee-l-2015',
    status: 'at_auction',
    title: 'Jeep Cherokee L 3.2, 2015',
    makeModel: 'Jeep Cherokee L',
    year: 2015, fuel: 'petrol', engineVolume: 3.2, vehicleKind: 'suv',
    platform: 'copart', location: 'California', lotNumber: '60114872',
    mileage: 132500, damage: 'Град, механіка ціла',
    bid: 6900, delivery: 2180, customs: 4460, services: 860,
    description: 'Торги за три дні. Розрахунок наведено для поточної ставки — фінальна ціна залежить від результату торгів.',
  },
  {
    slug: 'jeep-renegade-2016',
    status: 'at_auction',
    title: 'Jeep Renegade Latitude, 2016',
    makeModel: 'Jeep Renegade Latitude',
    year: 2016, fuel: 'petrol', engineVolume: 2.4, vehicleKind: 'suv',
    platform: 'iaai', location: 'Illinois', lotNumber: '42116903',
    mileage: 94800, damage: 'Передній удар, airbag не спрацював',
    bid: 5400, delivery: 2050, customs: 3280, services: 860,
    description: 'Компактний кросовер із повним приводом. Готові торгуватись під ваш ліміт.',
  },
  {
    slug: 'toyota-rav4-hybrid-2019',
    status: 'available',
    title: 'Toyota RAV4 Hybrid, 2019',
    makeModel: 'Toyota RAV4 Hybrid',
    year: 2019, fuel: 'hybrid', engineVolume: 2.5, vehicleKind: 'suv',
    platform: 'copart', location: 'New Jersey', lotNumber: '59983210',
    mileage: 61200, damage: 'Незначні пошкодження кузова',
    bid: 13400, delivery: 2290, customs: 4120, services: 860,
    description: 'Перевірений гібрид Toyota: батарея без деградації, помилок немає. Найвигідніший варіант за податками.',
  },
  {
    slug: 'mazda-cx-5-2018',
    status: 'available',
    title: 'Mazda CX-5 Touring, 2018',
    makeModel: 'Mazda CX-5 Touring',
    year: 2018, fuel: 'petrol', engineVolume: 2.5, vehicleKind: 'suv',
    platform: 'iaai', location: 'Texas', lotNumber: '42208741',
    mileage: 68900, damage: 'Бічний удар, двері під заміну',
    bid: 10200, delivery: 2270, customs: 4340, services: 860,
    description: 'Комплектація Touring, повний привід. Прибуття очікується наприкінці місяця.',
  },
  {
    slug: 'honda-crv-ex-2018',
    status: 'available',
    title: 'Honda CR-V EX, 2018',
    makeModel: 'Honda CR-V EX',
    year: 2018, fuel: 'petrol', engineVolume: 1.5, vehicleKind: 'suv',
    platform: 'copart', location: 'Georgia', lotNumber: '58790124',
    mileage: 79400, damage: 'Передній удар, радіатор під заміну',
    bid: 9600, delivery: 2120, customs: 3260, services: 860,
    description: 'Турбований 1.5 — низький акциз завдяки малому об’єму. Один із найпопулярніших варіантів у нашій практиці.',
  },
  {
    slug: 'tesla-model-3-2021',
    status: 'at_auction',
    title: 'Tesla Model 3 Standard Range, 2021',
    makeModel: 'Tesla Model 3',
    year: 2021, fuel: 'electric', engineVolume: null, vehicleKind: 'sedan',
    platform: 'copart', location: 'California', lotNumber: '60228845',
    mileage: 41300, damage: 'Передній удар, батарея ціла',
    bid: 14200, delivery: 2180, customs: 3860, services: 860,
    description: 'Батарея 60 кВт·год, без пошкоджень. Акциз для електро рахується від ємності батареї — виходить вигідно.',
  },
];

export async function seedShowcase(adminId: string): Promise<void> {
  const existing = await queryOne<{ count: number }>(
    'SELECT count(*)::int AS count FROM showcase_items',
  );
  if ((existing?.count ?? 0) > 0) return;

  for (const [index, car] of CARS.entries()) {
    const total = car.bid + car.delivery + car.customs + car.services;

    // Разбивка теми же группами, что и в карточке расчёта менеджера —
    // клиент видит одинаковую структуру на сайте и в присланном расчёте
    const breakdown = [
      { group: 'bid', label: 'Ставка', amount: car.bid },
      { group: 'deliveryAndFees', label: 'Доставка и сборы', amount: car.delivery },
      { group: 'customs', label: 'Растаможка', amount: car.customs },
      { group: 'services', label: 'Сертификация и услуги', amount: car.services },
    ];

    await pool.query(
      `INSERT INTO showcase_items (
         slug, status, title, make_model, year, fuel, engine_volume, vehicle_kind,
         platform, location, lot_number, mileage, damage,
         turnkey_price_usd, breakdown, description,
         is_published, published_at, sort_order, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,now(),$17,$18)
       ON CONFLICT (slug) DO NOTHING`,
      [
        car.slug, car.status, car.title, car.makeModel, car.year, car.fuel,
        car.engineVolume, car.vehicleKind, car.platform, car.location,
        car.lotNumber, car.mileage, car.damage, total,
        JSON.stringify(breakdown), car.description, index, adminId,
      ],
    );
  }

  console.log(`[seed] витрина наполнена: ${CARS.length} авто`);
}
