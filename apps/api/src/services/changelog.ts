import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';

export type ChangeEntity = 'delivery_tariff' | 'auction_fee' | 'setting' | 'user';

export interface ChangeRecord {
  entity: ChangeEntity;
  entityId: string;
  entityLabel: string;
  action: 'create' | 'update' | 'delete';
  field?: string | null;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  userId: string;
  userName: string;
}

/**
 * Пишет одну запись в журнал правок. По ТЗ это не «желательно», а обязательное
 * условие: без него нельзя объяснить, почему расчёт недельной давности не
 * сходится с сегодняшним.
 */
export async function logChange(
  record: ChangeRecord,
  client?: PoolClient,
): Promise<void> {
  const runner = client ?? pool;
  await runner.query(
    `INSERT INTO change_log
       (entity, entity_id, entity_label, action, field, old_value, new_value, user_id, user_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      record.entity,
      record.entityId,
      record.entityLabel,
      record.action,
      record.field ?? null,
      record.oldValue === null || record.oldValue === undefined ? null : String(record.oldValue),
      record.newValue === null || record.newValue === undefined ? null : String(record.newValue),
      record.userId,
      record.userName,
    ],
  );
}

/**
 * Сравнивает старую и новую версии записи и пишет по строке на каждое
 * изменившееся поле — так журнал читается как «$1 580 → $1 640», а не как
 * два JSON-блоба.
 */
export async function logFieldDiff(
  base: Omit<ChangeRecord, 'field' | 'oldValue' | 'newValue' | 'action'>,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
  client?: PoolClient,
): Promise<void> {
  for (const field of fields) {
    const oldValue = before[field];
    const newValue = after[field];
    if (String(oldValue ?? '') === String(newValue ?? '')) continue;
    await logChange(
      {
        ...base,
        action: 'update',
        field,
        oldValue: oldValue as string | number | null,
        newValue: newValue as string | number | null,
      },
      client,
    );
  }
}
