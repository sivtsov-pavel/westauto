import { DEFAULT_SETTINGS, type CalcSettings } from '@avtoklyuch/shared';
import { pool, query } from '../db/pool.js';
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

/** Записывает значения по умолчанию при первом старте, ничего не перетирая. */
export async function seedDefaultSettings(): Promise<void> {
  for (const [field, dbKey] of Object.entries(SETTING_KEYS) as [keyof CalcSettings, string][]) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [dbKey, DEFAULT_SETTINGS[field]],
    );
  }
}
