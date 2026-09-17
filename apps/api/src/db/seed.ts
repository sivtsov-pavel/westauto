import { pool, queryOne } from './pool.js';
import { config } from '../lib/env.js';
import { hashPassword } from '../lib/password.js';
import { seedDefaultSettings } from '../services/settings.js';
import { seedShowcase } from './seed-showcase.js';

/**
 * Первый запуск на пустой базе: администратор, настройки по умолчанию и
 * стартовые тарифы из дизайн-макета, чтобы калькулятор считал сразу, а не
 * встречал менеджера пустыми таблицами.
 *
 * Идемпотентно: ничего не перетирает, всё через ON CONFLICT DO NOTHING.
 */
export async function seed(): Promise<void> {
  await seedDefaultSettings();

  const admin = await ensureAdmin();
  await seedTariffs(admin);
  await seedShowcase(admin);
}

async function ensureAdmin(): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1`,
  );
  if (existing) return existing.id;

  const hash = await hashPassword(config.BOOTSTRAP_ADMIN_PASSWORD);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO users (login, full_name, password_hash, role)
     VALUES ($1, $2, $3, 'admin') RETURNING id`,
    [config.BOOTSTRAP_ADMIN_LOGIN, config.BOOTSTRAP_ADMIN_NAME, hash],
  );

  console.log(
    `[seed] создан администратор «${config.BOOTSTRAP_ADMIN_LOGIN}». ` +
      'Смените пароль после первого входа.',
  );
  return row!.id;
}

const DELIVERY_SEED: [platform: string, location: string, kind: string, amount: number][] = [
  ['copart', 'Texas', 'sedan', 1640],
  ['copart', 'Texas', 'suv', 1890],
  ['copart', 'Texas', 'pickup', 2040],
  ['copart', 'California', 'sedan', 1980],
  ['copart', 'California', 'suv', 2180],
  ['copart', 'California', 'pickup', 2140],
  ['copart', 'New Jersey', 'sedan', 1520],
  ['copart', 'New Jersey', 'suv', 1740],
  ['copart', 'Georgia', 'sedan', 1580],
  ['copart', 'Georgia', 'suv', 1820],
  ['iaai', 'New Jersey', 'sedan', 1720],
  ['iaai', 'New Jersey', 'suv', 1940],
  ['iaai', 'Texas', 'sedan', 1690],
  ['iaai', 'Texas', 'suv', 1930],
  ['iaai', 'Illinois', 'sedan', 1610],
  ['iaai', 'Illinois', 'suv', 1850],
];

const AUCTION_FEE_SEED: [platform: string, from: number, to: number | null, fee: number][] = [
  ['copart', 0, 5000, 300],
  ['copart', 5000, 10000, 400],
  ['copart', 10000, 20000, 540],
  ['copart', 20000, null, 720],
  ['iaai', 0, 5000, 320],
  ['iaai', 5000, 10000, 425],
  ['iaai', 10000, 20000, 565],
  ['iaai', 20000, null, 750],
];

async function seedTariffs(adminId: string): Promise<void> {
  const { rows } = await pool.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM delivery_tariffs',
  );
  if ((rows[0]?.count ?? 0) > 0) return;

  for (const [platform, location, kind, amount] of DELIVERY_SEED) {
    await pool.query(
      `INSERT INTO delivery_tariffs (platform, location, vehicle_kind, amount_usd, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [platform, location, kind, amount, adminId],
    );
  }

  for (const [platform, from, to, fee] of AUCTION_FEE_SEED) {
    await pool.query(
      `INSERT INTO auction_fee_tariffs (platform, bid_from, bid_to, fee_amount, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [platform, from, to, fee, adminId],
    );
  }

  console.log(
    `[seed] загружены стартовые тарифы: ${DELIVERY_SEED.length} строк доставки, ` +
      `${AUCTION_FEE_SEED.length} диапазонов сбора. Правьте их в разделе «Тарифы».`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[seed] ошибка:', error);
      process.exit(1);
    });
}
