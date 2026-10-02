import { DEFAULT_SETTINGS, type CalcSettings } from '@avtoklyuch/shared';
import { pool, query, queryOne } from '../db/pool.js';
import { logChange } from './changelog.js';

/** Ключ в БД → поле в CalcSettings. Меняется только вместе с миграцией. */
const SETTING_KEYS: Record<keyof CalcSettings, string> = {
  complex: 'complex',
  certification: 'certification',
  commission: 'commission',
  swiftPercent: 'swift_percent',
  freightInsurancePercent: 'freight_insurance_percent',
  portHandling: 'port_handling',
  ecoFee: 'eco_fee',
  marginDefault: 'margin_default',
};

export const SETTING_LABELS: Record<keyof CalcSettings, string> = {
  complex: 'Комплекс',
  certification: 'Сертификация',
  commission: 'Комиссия',
  swiftPercent: 'Swift, %',
  freightInsurancePercent: 'Страховка фрахта, %',
  portHandling: 'Портовые расходы',
  ecoFee: 'Экологический сбор',
  marginDefault: 'Маржа по умолчанию',
};

/**
 * Скрывать ли учебные данные. Лежит в той же таблице settings, но в
 * CalcSettings не входит: это настройка видимости, а не денег, и в расчёт
 * попадать ей незачем.
 *
 * Значение числовое (0/1), потому что settings.value — numeric: заводить
 * вторую таблицу ради одного флага дороже, чем сравнить с нулём.
 */
const HIDE_DEMO_KEY = 'hide_demo_data';

export const HIDE_DEMO_LABEL = 'Скрывать учебные данные';

export async function getSettings(): Promise<CalcSettings> {
  const rows = await query<{ key: string; value: number }>(
    'SELECT key, value FROM settings',
  );
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const result = { ...DEFAULT_SETTINGS };
  for (const [field, dbKey] of Object.entries(SETTING_KEYS) as [keyof CalcSettings, string][]) {
    const value = byKey.get(dbKey);
    if (value !== undefined) result[field] = value;
  }
  return result;
}

export async function updateSettings(
  patch: Partial<CalcSettings>,
  actor: { id: string; fullName: string },
): Promise<CalcSettings> {
  const current = await getSettings();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [field, value] of Object.entries(patch) as [keyof CalcSettings, number][]) {
      if (value === undefined || !Number.isFinite(value)) continue;
      const dbKey = SETTING_KEYS[field];
      if (!dbKey) continue;
      if (current[field] === value) continue;

      await client.query(
        `INSERT INTO settings (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value,
               updated_by = EXCLUDED.updated_by,
               updated_at = now()`,
        [dbKey, value, actor.id],
      );

      await logChange(
        {
          entity: 'setting',
          entityId: dbKey,
          entityLabel: SETTING_LABELS[field],
          action: 'update',
          field,
          oldValue: current[field],
          newValue: value,
          userId: actor.id,
          userName: actor.fullName,
        },
        client,
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getSettings();
}

/**
 * Скрыты ли сейчас учебные записи.
 *
 * Отсутствие строки в таблице — это «показывать»: так ведёт себя стенд, на
 * который миграция ещё не доехала, и так же ведёт себя система до того, как
 * кто-то осознанно щёлкнул переключатель. Поведение по умолчанию прежнее.
 */
export async function isDemoHidden(): Promise<boolean> {
  const row = await queryOne<{ value: string }>(
    'SELECT value FROM settings WHERE key = $1',
    [HIDE_DEMO_KEY],
  );
  return Number(row?.value ?? 0) > 0;
}

/**
 * Переключает видимость учебных записей.
 *
 * Правка идёт в журнал, как и любая другая настройка: вопрос «куда делись
 * клиенты» задают раньше, чем вспоминают про этот выключатель, и ответ на
 * него должен находиться в истории, а не методом исключения.
 */
export async function setDemoHidden(
  hide: boolean,
  actor: { id: string; fullName: string },
): Promise<boolean> {
  const current = await isDemoHidden();
  if (current === hide) return current;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO settings (key, value, updated_by, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             updated_by = EXCLUDED.updated_by,
             updated_at = now()`,
      [HIDE_DEMO_KEY, hide ? 1 : 0, actor.id],
    );

    await logChange(
      {
        entity: 'setting',
        entityId: HIDE_DEMO_KEY,
        entityLabel: HIDE_DEMO_LABEL,
        action: 'update',
        field: 'hideDemoData',
        oldValue: current ? 1 : 0,
        newValue: hide ? 1 : 0,
        userId: actor.id,
        userName: actor.fullName,
      },
      client,
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return hide;
}

/** Записывает значения по умолчанию при первом старте, ничего не перетирая. */
export async function seedDefaultSettings(): Promise<void> {
  for (const [field, dbKey] of Object.entries(SETTING_KEYS) as [keyof CalcSettings, string][]) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [dbKey, DEFAULT_SETTINGS[field]],
    );
  }

  // Учебные данные по умолчанию видны: на демо-стенде они и есть содержимое,
  // а на боевом их прячут осознанно, переключателем в настройках
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, 0)
     ON CONFLICT (key) DO NOTHING`,
    [HIDE_DEMO_KEY],
  );
}
