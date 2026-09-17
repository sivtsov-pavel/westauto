import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, waitForDatabase } from './pool.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/**
 * Простой forward-only мигратор: файлы 00N_name.sql применяются по порядку,
 * каждый в своей транзакции, факт применения и контрольная сумма пишутся
 * в schema_migrations. Изменение уже применённого файла — ошибка, а не тихий
 * пропуск: иначе базы на разных машинах молча разъезжаются.
 */
export async function migrate(): Promise<void> {
  await waitForDatabase();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        text PRIMARY KEY,
      checksum    text NOT NULL,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows: applied } = await pool.query<{ name: string; checksum: string }>(
    'SELECT name, checksum FROM schema_migrations',
  );
  const appliedByName = new Map(applied.map((r) => [r.name, r.checksum]));

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex').slice(0, 16);
    const previous = appliedByName.get(file);

    if (previous !== undefined) {
      if (previous !== checksum) {
        throw new Error(
          `Миграция ${file} уже применена, но файл изменился ` +
            `(${previous} → ${checksum}). Добавьте новую миграцию вместо правки старой.`,
        );
      }
      continue;
    }

    console.log(`[migrate] применяю ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
        [file, checksum],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(
        `Миграция ${file} упала: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      client.release();
    }
  }

  console.log(`[migrate] схема в актуальном состоянии (${files.length} миграций)`);
}

// Запуск напрямую: npm run migrate -w @avtoklyuch/api
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[migrate] ошибка:', error);
      process.exit(1);
    });
}
