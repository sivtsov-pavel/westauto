import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PLATFORM_LABELS, VEHICLE_KIND_LABELS, type Platform } from '@avtoklyuch/shared';
import { pool, query, queryOne } from '../db/pool.js';
import { requireAdmin, requirePermission } from '../lib/auth.js';
import { conflict, notFound } from '../lib/errors.js';
import { logChange, logFieldDiff } from '../services/changelog.js';

const ALL_PLATFORMS = ['copart', 'iaai', 'copart_uk', 'copart_ca', 'iaai_ca', 'manheim'] as const;
const platformEnum = z.enum(ALL_PLATFORMS);
const vehicleKindEnum = z.enum([
  'sedan',
  'suv',
  'pickup',
  'coupe',
  'minivan',
  'motorcycle',
  'truck',
]);

const deliverySchema = z.object({
  platform: platformEnum,
  location: z.string().min(1, 'Укажите локацию').max(120),
  vehicleKind: vehicleKindEnum,
  amountUsd: z.number().nonnegative(),
  isActive: z.boolean().default(true),
});

const auctionFeeSchema = z
  .object({
    platform: platformEnum,
    bidFrom: z.number().nonnegative(),
    bidTo: z.number().positive().nullable(),
    feeAmount: z.number().nonnegative().default(0),
    feePercent: z.number().nonnegative().max(100).default(0),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.bidTo === null || v.bidTo > v.bidFrom, {
    message: 'Верхняя граница должна быть больше нижней',
    path: ['bidTo'],
  });

const DELIVERY_SELECT = `
  SELECT t.id, t.platform, t.location, t.vehicle_kind, t.amount_usd, t.is_active,
         t.updated_at, u.full_name AS updated_by_name
    FROM delivery_tariffs t
    LEFT JOIN users u ON u.id = t.updated_by
`;

const AUCTION_SELECT = `
  SELECT t.id, t.platform, t.bid_from, t.bid_to, t.fee_amount, t.fee_percent,
         t.is_active, t.updated_at, u.full_name AS updated_by_name
    FROM auction_fee_tariffs t
    LEFT JOIN users u ON u.id = t.updated_by
`;

export async function tariffRoutes(app: FastifyInstance): Promise<void> {
  // Читать тарифы могут менеджер и администратор — без них не посчитать.
  // Агенту закупочные тарифы не показываются: по ним он вычислит нашу
  // себестоимость. Править может только администратор.
  app.addHook('preHandler', requirePermission('viewTariffs'));

  app.get('/delivery', async () => ({
    items: (await query(`${DELIVERY_SELECT} ORDER BY t.platform, t.location, t.vehicle_kind`))
      .map(mapDelivery),
  }));

  app.get('/auction-fees', async () => ({
    items: (await query(`${AUCTION_SELECT} ORDER BY t.platform, t.bid_from`)).map(mapAuction),
  }));

  app.post('/delivery', { preHandler: requireAdmin }, async (request, reply) => {
    const body = deliverySchema.parse(request.body);
    const actor = request.user!;

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM delivery_tariffs
        WHERE platform = $1 AND lower(location) = lower($2) AND vehicle_kind = $3`,
      [body.platform, body.location, body.vehicleKind],
    );
    if (existing) {
      throw conflict('Тариф на эту связку площадка + локация + вид авто уже есть');
    }

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO delivery_tariffs (platform, location, vehicle_kind, amount_usd, is_active, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [body.platform, body.location, body.vehicleKind, body.amountUsd, body.isActive, actor.id],
    );

    await logChange({
      entity: 'delivery_tariff',
      entityId: String(row!['id']),
      entityLabel: deliveryLabel(body),
      action: 'create',
      field: 'amountUsd',
      oldValue: null,
      newValue: body.amountUsd,
      userId: actor.id,
      userName: actor.fullName,
    });

    reply.code(201);
    const created = await queryOne(`${DELIVERY_SELECT} WHERE t.id = $1`, [row!['id']]);
    return { item: mapDelivery(created as Record<string, unknown>) };
  });

  app.patch('/delivery/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = deliverySchema.partial().parse(request.body);
    const actor = request.user!;

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM delivery_tariffs WHERE id = $1',
      [id],
    );
    if (!before) throw notFound('Тариф не найден');

    const next = {
      platform: body.platform ?? before['platform'],
      location: body.location ?? before['location'],
      vehicleKind: body.vehicleKind ?? before['vehicle_kind'],
      amountUsd: body.amountUsd ?? before['amount_usd'],
      isActive: body.isActive ?? before['is_active'],
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE delivery_tariffs
            SET platform = $1, location = $2, vehicle_kind = $3,
                amount_usd = $4, is_active = $5, updated_by = $6, updated_at = now()
          WHERE id = $7`,
        [next.platform, next.location, next.vehicleKind, next.amountUsd, next.isActive, actor.id, id],
      );

      await logFieldDiff(
        {
          entity: 'delivery_tariff',
          entityId: id,
          entityLabel: deliveryLabel({
            platform: next.platform as Platform,
            location: String(next.location),
            vehicleKind: next.vehicleKind as keyof typeof VEHICLE_KIND_LABELS,
          }),
          userId: actor.id,
          userName: actor.fullName,
        },
        {
          amountUsd: before['amount_usd'],
          location: before['location'],
          vehicleKind: before['vehicle_kind'],
          isActive: before['is_active'],
        },
        next,
        ['amountUsd', 'location', 'vehicleKind', 'isActive'],
        client,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const updated = await queryOne(`${DELIVERY_SELECT} WHERE t.id = $1`, [id]);
    return { item: mapDelivery(updated as Record<string, unknown>) };
  });

  app.delete('/delivery/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const actor = request.user!;

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM delivery_tariffs WHERE id = $1',
      [id],
    );
    if (!before) throw notFound('Тариф не найден');

    await pool.query('DELETE FROM delivery_tariffs WHERE id = $1', [id]);
    await logChange({
      entity: 'delivery_tariff',
      entityId: id,
      entityLabel: deliveryLabel({
        platform: before['platform'] as Platform,
        location: String(before['location']),
        vehicleKind: before['vehicle_kind'] as keyof typeof VEHICLE_KIND_LABELS,
      }),
      action: 'delete',
      field: 'amountUsd',
      oldValue: before['amount_usd'] as number,
      newValue: null,
      userId: actor.id,
      userName: actor.fullName,
    });

    return { ok: true };
  });

  app.post('/auction-fees', { preHandler: requireAdmin }, async (request, reply) => {
    const body = auctionFeeSchema.parse(request.body);
    const actor = request.user!;

    await assertNoRangeOverlap(body, null);

    const row = await queryOne<{ id: string }>(
      `INSERT INTO auction_fee_tariffs
         (platform, bid_from, bid_to, fee_amount, fee_percent, is_active, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [body.platform, body.bidFrom, body.bidTo, body.feeAmount, body.feePercent, body.isActive, actor.id],
    );

    await logChange({
      entity: 'auction_fee',
      entityId: row!.id,
      entityLabel: auctionLabel(body),
      action: 'create',
      field: 'feeAmount',
      oldValue: null,
      newValue: body.feeAmount,
      userId: actor.id,
      userName: actor.fullName,
    });

    reply.code(201);
    const created = await queryOne(`${AUCTION_SELECT} WHERE t.id = $1`, [row!.id]);
    return { item: mapAuction(created as Record<string, unknown>) };
  });

  app.patch('/auction-fees/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const patch = auctionFeeSchema.innerType().partial().parse(request.body);
    const actor = request.user!;

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM auction_fee_tariffs WHERE id = $1',
      [id],
    );
    if (!before) throw notFound('Диапазон не найден');

    const next = {
      platform: (patch.platform ?? before['platform']) as 'copart' | 'iaai',
      bidFrom: Number(patch.bidFrom ?? before['bid_from']),
      bidTo:
        patch.bidTo !== undefined ? patch.bidTo : (before['bid_to'] as number | null),
      feeAmount: Number(patch.feeAmount ?? before['fee_amount']),
      feePercent: Number(patch.feePercent ?? before['fee_percent']),
      isActive: Boolean(patch.isActive ?? before['is_active']),
    };

    if (next.bidTo !== null && next.bidTo <= next.bidFrom) {
      throw conflict('Верхняя граница должна быть больше нижней');
    }
    await assertNoRangeOverlap(next, id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE auction_fee_tariffs
            SET platform = $1, bid_from = $2, bid_to = $3, fee_amount = $4,
                fee_percent = $5, is_active = $6, updated_by = $7, updated_at = now()
          WHERE id = $8`,
        [
          next.platform, next.bidFrom, next.bidTo, next.feeAmount,
          next.feePercent, next.isActive, actor.id, id,
        ],
      );

      await logFieldDiff(
        {
          entity: 'auction_fee',
          entityId: id,
          entityLabel: auctionLabel(next),
          userId: actor.id,
          userName: actor.fullName,
        },
        {
          feeAmount: before['fee_amount'],
          feePercent: before['fee_percent'],
          bidFrom: before['bid_from'],
          bidTo: before['bid_to'],
          isActive: before['is_active'],
        },
        next,
        ['feeAmount', 'feePercent', 'bidFrom', 'bidTo', 'isActive'],
        client,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const updated = await queryOne(`${AUCTION_SELECT} WHERE t.id = $1`, [id]);
    return { item: mapAuction(updated as Record<string, unknown>) };
  });

  app.delete('/auction-fees/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const actor = request.user!;

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM auction_fee_tariffs WHERE id = $1',
      [id],
    );
    if (!before) throw notFound('Диапазон не найден');

    await pool.query('DELETE FROM auction_fee_tariffs WHERE id = $1', [id]);
    await logChange({
      entity: 'auction_fee',
      entityId: id,
      entityLabel: auctionLabel({
        platform: before['platform'] as Platform,
        bidFrom: Number(before['bid_from']),
        bidTo: before['bid_to'] as number | null,
        feePercent: Number(before['fee_percent']),
      }),
      action: 'delete',
      field: 'feeAmount',
      oldValue: before['fee_amount'] as number,
      newValue: null,
      userId: actor.id,
      userName: actor.fullName,
    });

    return { ok: true };
  });

  // ─── Импорт и экспорт ─────────────────────────────────────────────────────

  /**
   * Импорт тарифов доставки пачкой.
   *
   * Строки применяются в одной транзакции: либо заезжает весь файл, либо
   * ничего. Половина импортированной таблицы хуже, чем неудавшийся импорт —
   * по ней уже посчитают и отправят клиенту.
   */
  app.post('/delivery/import', { preHandler: requireAdmin }, async (request) => {
    const body = z
      .object({
        rows: z.array(deliverySchema).min(1).max(500),
        replaceAll: z.boolean().default(false),
      })
      .parse(request.body);
    const actor = request.user!;

    const client = await pool.connect();
    let created = 0;
    let updated = 0;
    let removed = 0;

    try {
      await client.query('BEGIN');

      if (body.replaceAll) {
        const { rowCount } = await client.query('DELETE FROM delivery_tariffs');
        removed = rowCount ?? 0;
        await logChange(
          {
            entity: 'delivery_tariff',
            entityId: 'import',
            entityLabel: 'Таблица доставки заменена импортом',
            action: 'delete',
            field: 'rows',
            oldValue: removed,
            newValue: body.rows.length,
            userId: actor.id,
            userName: actor.fullName,
          },
          client,
        );
      }

      for (const row of body.rows) {
        const existing = await client.query<{ id: string; amount_usd: number }>(
          `SELECT id, amount_usd FROM delivery_tariffs
            WHERE platform = $1 AND lower(location) = lower($2) AND vehicle_kind = $3`,
          [row.platform, row.location, row.vehicleKind],
        );

        const previous = existing.rows[0];

        if (previous) {
          if (Number(previous.amount_usd) === row.amountUsd) continue;
          await client.query(
            `UPDATE delivery_tariffs
                SET amount_usd = $1, is_active = $2, updated_by = $3, updated_at = now()
              WHERE id = $4`,
            [row.amountUsd, row.isActive, actor.id, previous.id],
          );
          updated += 1;
          await logChange(
            {
              entity: 'delivery_tariff',
              entityId: previous.id,
              entityLabel: `${deliveryLabel(row)} (импорт)`,
              action: 'update',
              field: 'amountUsd',
              oldValue: Number(previous.amount_usd),
              newValue: row.amountUsd,
              userId: actor.id,
              userName: actor.fullName,
            },
            client,
          );
        } else {
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO delivery_tariffs
               (platform, location, vehicle_kind, amount_usd, is_active, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [row.platform, row.location, row.vehicleKind, row.amountUsd, row.isActive, actor.id],
          );
          created += 1;
          await logChange(
            {
              entity: 'delivery_tariff',
              entityId: inserted.rows[0]!.id,
              entityLabel: `${deliveryLabel(row)} (импорт)`,
              action: 'create',
              field: 'amountUsd',
              oldValue: null,
              newValue: row.amountUsd,
              userId: actor.id,
              userName: actor.fullName,
            },
            client,
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { created, updated, removed, total: body.rows.length };
  });

  /** Импорт аукционных сборов. Пересечения диапазонов проверяются так же. */
  app.post('/auction-fees/import', { preHandler: requireAdmin }, async (request) => {
    const body = z
      .object({
        rows: z.array(auctionFeeSchema).min(1).max(200),
        replaceAll: z.boolean().default(false),
      })
      .parse(request.body);
    const actor = request.user!;

    // Пересечения внутри самого файла ловим до того, как трогать базу
    for (const platform of ALL_PLATFORMS) {
      const ranges = body.rows
        .filter((r) => r.platform === platform)
        .map((r) => ({ from: r.bidFrom, to: r.bidTo ?? Number.POSITIVE_INFINITY }))
        .sort((a, b) => a.from - b.from);

      for (let i = 1; i < ranges.length; i += 1) {
        if (ranges[i]!.from < ranges[i - 1]!.to) {
          throw conflict(
            `В импорте пересекаются диапазоны ${platform}: ` +
              `от $${ranges[i - 1]!.from} и от $${ranges[i]!.from}`,
          );
        }
      }
    }

    const client = await pool.connect();
    let created = 0;
    let removed = 0;

    try {
      await client.query('BEGIN');

      if (body.replaceAll) {
        const { rowCount } = await client.query('DELETE FROM auction_fee_tariffs');
        removed = rowCount ?? 0;
      } else {
        // Без замены импорт диапазонов почти наверняка даст пересечение
        // с тем, что уже есть — поэтому чистим только затронутые площадки
        const platforms = [...new Set(body.rows.map((r) => r.platform))];
        const { rowCount } = await client.query(
          'DELETE FROM auction_fee_tariffs WHERE platform = ANY($1)',
          [platforms],
        );
        removed = rowCount ?? 0;
      }

      for (const row of body.rows) {
        await client.query(
          `INSERT INTO auction_fee_tariffs
             (platform, bid_from, bid_to, fee_amount, fee_percent, is_active, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [row.platform, row.bidFrom, row.bidTo, row.feeAmount, row.feePercent, row.isActive, actor.id],
        );
        created += 1;
      }

      await logChange(
        {
          entity: 'auction_fee',
          entityId: 'import',
          entityLabel: 'Аукционные сборы загружены импортом',
          action: 'update',
          field: 'rows',
          oldValue: removed,
          newValue: created,
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

    return { created, updated: 0, removed, total: body.rows.length };
  });

  // Журнал правок: кто, когда, что было → что стало
  app.get('/history', async (request) => {
    const q = z
      .object({ limit: z.coerce.number().int().min(1).max(200).default(40) })
      .parse(request.query);

    const rows = await query<{
      id: number;
      entity: string;
      entity_label: string;
      action: string;
      field: string | null;
      old_value: string | null;
      new_value: string | null;
      user_name: string;
      created_at: Date;
    }>(
      `SELECT id, entity, entity_label, action, field, old_value, new_value, user_name, created_at
         FROM change_log ORDER BY created_at DESC LIMIT $1`,
      [q.limit],
    );

    return {
      items: rows.map((r) => ({
        id: r.id,
        entity: r.entity,
        label: r.entity_label,
        action: r.action,
        field: r.field,
        oldValue: r.old_value,
        newValue: r.new_value,
        userName: r.user_name,
        createdAt: r.created_at.toISOString(),
      })),
    };
  });
}

/**
 * Диапазоны ставок не должны пересекаться: иначе один и тот же лот получает
 * разный сбор в зависимости от порядка строк в таблице.
 */
async function assertNoRangeOverlap(
  range: { platform: string; bidFrom: number; bidTo: number | null },
  excludeId: string | null,
): Promise<void> {
  const rows = await query<{ id: string; bid_from: number; bid_to: number | null }>(
    `SELECT id, bid_from, bid_to FROM auction_fee_tariffs
      WHERE platform = $1 AND is_active AND ($2::uuid IS NULL OR id <> $2::uuid)`,
    [range.platform, excludeId],
  );

  const newTo = range.bidTo ?? Number.POSITIVE_INFINITY;
  for (const row of rows) {
    const existingTo = row.bid_to ?? Number.POSITIVE_INFINITY;
    if (range.bidFrom < existingTo && row.bid_from < newTo) {
      throw conflict(
        `Диапазон пересекается с существующим ($${row.bid_from} – ${row.bid_to ?? '∞'})`,
      );
    }
  }
}

function deliveryLabel(t: {
  platform: Platform;
  location: string;
  vehicleKind: keyof typeof VEHICLE_KIND_LABELS;
}): string {
  return `Доставка ${PLATFORM_LABELS[t.platform]} · ${t.location}, ${VEHICLE_KIND_LABELS[t.vehicleKind].toLowerCase()}`;
}

function auctionLabel(t: {
  platform: Platform;
  bidFrom: number;
  bidTo: number | null;
  feePercent?: number;
}): string {
  const range = t.bidTo === null ? `от $${t.bidFrom}` : `$${t.bidFrom}–$${t.bidTo}`;
  return `Аукционный сбор ${PLATFORM_LABELS[t.platform]}, ${range}`;
}

function mapDelivery(row: Record<string, unknown>) {
  return {
    id: row['id'] as string,
    platform: row['platform'] as Platform,
    location: row['location'] as string,
    vehicleKind: row['vehicle_kind'] as string,
    amountUsd: Number(row['amount_usd']),
    isActive: Boolean(row['is_active']),
    updatedAt: (row['updated_at'] as Date).toISOString(),
    updatedByName: (row['updated_by_name'] as string | null) ?? null,
  };
}

function mapAuction(row: Record<string, unknown>) {
  return {
    id: row['id'] as string,
    platform: row['platform'] as Platform,
    bidFrom: Number(row['bid_from']),
    bidTo: row['bid_to'] === null ? null : Number(row['bid_to']),
    feeAmount: Number(row['fee_amount']),
    feePercent: Number(row['fee_percent']),
    isActive: Boolean(row['is_active']),
    updatedAt: (row['updated_at'] as Date).toISOString(),
    updatedByName: (row['updated_by_name'] as string | null) ?? null,
  };
}
