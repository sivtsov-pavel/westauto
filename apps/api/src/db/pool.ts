import pg from 'pg';
import { config } from '../lib/env.js';

const { Pool, types } = pg;

// numeric приходит из pg строкой, чтобы не терять точность на больших числах.
// Все наши numeric — деньги и проценты в безопасном для double диапазоне,
// поэтому разбираем сразу в number: иначе каждый расчёт обрастает Number(...).
types.setTypeParser(1700, (value: string) => Number.parseFloat(value));
// int8 — только счётчики и id журнала, в JS-диапазон помещаются
types.setTypeParser(20, (value: string) => Number.parseInt(value, 10));

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // Соединение из пула умерло в простое — pg сам его заменит, но знать надо
  console.error('[db] неожиданная ошибка простаивающего соединения:', err.message);
});

export type Sql = typeof pool;

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as never[]);
  return result.rows;
}

export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Транзакция: коммит при успехе, откат при любой ошибке. */
export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function waitForDatabase(attempts = 30, delayMs = 1000): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.log(`[db] жду Postgres… попытка ${attempt}/${attempts}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
