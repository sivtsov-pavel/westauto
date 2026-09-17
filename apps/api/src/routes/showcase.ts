import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { groupLabel, type LineGroup } from '@avtoklyuch/shared';
import { pool, query, queryOne } from '../db/pool.js';
import { requirePermission } from '../lib/auth.js';
import { config } from '../lib/env.js';
import { badRequest, notFound } from '../lib/errors.js';

const statusEnum = z.enum(['available', 'at_auction', 'delivered_case']);
const fuelEnum = z.enum(['petrol', 'diesel', 'electric', 'hybrid']);
const platformEnum = z.enum(['copart', 'iaai', 'copart_uk', 'copart_ca', 'iaai_ca', 'manheim']);
const vehicleKindEnum = z.enum([
  'sedan', 'suv', 'pickup', 'coupe', 'minivan', 'motorcycle', 'truck',
]);

const itemSchema = z.object({
  status: statusEnum.default('available'),
  title: z.string().min(2, 'Укажите заголовок').max(200),
  makeModel: z.string().min(1).max(200),
  year: z.number().int().min(1950).max(2100).nullable().default(null),
  fuel: fuelEnum.default('petrol'),
  engineVolume: z.number().positive().max(20).nullable().default(null),
  vehicleKind: vehicleKindEnum.default('sedan'),
  platform: platformEnum.default('copart'),
  location: z.string().max(120).default(''),
  lotNumber: z.string().max(40).nullable().default(null),
  mileage: z.number().int().nonnegative().max(2_000_000).nullable().default(null),
  damage: z.string().max(400).nullable().default(null),
  turnkeyPriceUsd: z.number().nonnegative(),
  breakdown: z
    .array(z.object({ label: z.string().max(120), amount: z.number() }))
    .default([]),
  description: z.string().max(4000).nullable().default(null),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  calculationId: z.string().uuid().nullable().default(null),
});

const SELECT_ITEM = `
  SELECT s.*,
         COALESCE(
           (SELECT json_agg(json_build_object('id', p.id, 'url', p.url, 'sortOrder', p.sort_order)
                            ORDER BY p.sort_order, p.created_at)
              FROM showcase_photos p WHERE p.item_id = s.id),
           '[]'::json
         ) AS photos
    FROM showcase_items s
`;

// ─── Публичная витрина: без авторизации, только опубликованное ──────────────

export async function publicShowcaseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (request) => {
    const q = z
      .object({
        status: statusEnum.optional(),
        limit: z.coerce.number().int().min(1).max(60).default(24),
      })
      .parse(request.query);

    const params: unknown[] = [];
    let statusFilter = '';
    if (q.status) {
      params.push(q.status);
      statusFilter = `AND s.status = $${params.length}`;
    }
    params.push(q.limit);

    const rows = await query<Record<string, unknown>>(
      `${SELECT_ITEM}
        WHERE s.is_published ${statusFilter}
        ORDER BY s.sort_order, s.published_at DESC NULLS LAST
        LIMIT $${params.length}`,
      params,
    );

    return { items: rows.map(mapPublicItem) };
  });

  app.get('/:slug', async (request) => {
    const { slug } = z.object({ slug: z.string().max(200) }).parse(request.params);
    const row = await queryOne<Record<string, unknown>>(
      `${SELECT_ITEM} WHERE s.slug = $1 AND s.is_published`,
      [slug],
    );
    if (!row) throw notFound('Авто не знайдено');
    return { item: mapPublicItem(row) };
  });
}

// ─── Управление витриной из приложения ──────────────────────────────────────

export async function adminShowcaseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePermission('manageShowcase'));

  app.get('/', async () => {
    const rows = await query<Record<string, unknown>>(
      `${SELECT_ITEM} ORDER BY s.is_published DESC, s.sort_order, s.created_at DESC`,
    );
    return { items: rows.map(mapAdminItem) };
  });

  app.get('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const row = await queryOne<Record<string, unknown>>(`${SELECT_ITEM} WHERE s.id = $1`, [id]);
    if (!row) throw notFound('Карточка не найдена');
    return { item: mapAdminItem(row) };
  });

  app.post('/', async (request, reply) => {
    const body = itemSchema.parse(request.body);
    const actor = request.user!;

    const slug = await uniqueSlug(makeSlug(body.title, body.year));

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO showcase_items (
         slug, status, title, make_model, year, fuel, engine_volume, vehicle_kind,
         platform, location, lot_number, mileage, damage,
         turnkey_price_usd, breakdown, description,
         is_published, published_at, sort_order, calculation_id, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING id`,
      [
        slug, body.status, body.title, body.makeModel, body.year, body.fuel,
        body.engineVolume, body.vehicleKind, body.platform, body.location,
        body.lotNumber, body.mileage, body.damage, body.turnkeyPriceUsd,
        JSON.stringify(body.breakdown), body.description,
        body.isPublished, body.isPublished ? new Date() : null,
        body.sortOrder, body.calculationId, actor.id,
      ],
    );

    reply.code(201);
    const created = await queryOne<Record<string, unknown>>(
      `${SELECT_ITEM} WHERE s.id = $1`,
      [row!['id']],
    );
    return { item: mapAdminItem(created!) };
  });

  /**
   * «Опубликовать на сайте» прямо из расчёта: карточка витрины собирается из
   * сохранённого расчёта, но берёт из него только то, что можно показать
   * клиенту. Маржа и себестоимость сюда не попадают ни при каких условиях.
   */
  app.post('/from-calculation/:calculationId', async (request, reply) => {
    const { calculationId } = z
      .object({ calculationId: z.string().uuid() })
      .parse(request.params);
    const body = z
      .object({
        status: statusEnum.default('available'),
        mileage: z.number().int().nonnegative().nullable().default(null),
        damage: z.string().max(400).nullable().default(null),
        description: z.string().max(4000).nullable().default(null),
        publishNow: z.boolean().default(false),
      })
      .parse(request.body ?? {});

    const calc = await queryOne<Record<string, unknown>>(
      'SELECT * FROM calculations WHERE id = $1',
      [calculationId],
    );
    if (!calc) throw notFound('Расчёт не найден');

    const result = calc['result_snapshot'] as {
      clientTotal?: number;
      clientBreakdown?: { label: string; amount: number }[];
    };

    const title = [calc['year'], calc['make_model']].filter(Boolean).join(' ') || 'Авто';
    const slug = await uniqueSlug(makeSlug(String(calc['make_model'] ?? 'auto'), calc['year'] as number | null));

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO showcase_items (
         slug, status, title, make_model, year, fuel, engine_volume, vehicle_kind,
         platform, location, lot_number, mileage, damage,
         turnkey_price_usd, breakdown, description,
         is_published, published_at, calculation_id, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id`,
      [
        slug, body.status, title, calc['make_model'] ?? '', calc['year'],
        calc['fuel'], calc['engine_volume'], calc['vehicle_kind'],
        calc['platform'], calc['location'], calc['lot_number'],
        body.mileage, body.damage,
        // Цена клиенту — ровно та, что была в карточке расчёта
        Number(calc['client_total_usd']),
        JSON.stringify(result.clientBreakdown ?? []),
        body.description,
        body.publishNow, body.publishNow ? new Date() : null,
        calculationId, request.user!.id,
      ],
    );

    reply.code(201);
    const created = await queryOne<Record<string, unknown>>(
      `${SELECT_ITEM} WHERE s.id = $1`,
      [row!['id']],
    );
    return { item: mapAdminItem(created!) };
  });

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = itemSchema.partial().parse(request.body);

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM showcase_items WHERE id = $1',
      [id],
    );
    if (!before) throw notFound('Карточка не найдена');

    const next = {
      status: body.status ?? before['status'],
      title: body.title ?? before['title'],
      makeModel: body.makeModel ?? before['make_model'],
      year: body.year !== undefined ? body.year : before['year'],
      fuel: body.fuel ?? before['fuel'],
      engineVolume: body.engineVolume !== undefined ? body.engineVolume : before['engine_volume'],
      vehicleKind: body.vehicleKind ?? before['vehicle_kind'],
      platform: body.platform ?? before['platform'],
      location: body.location ?? before['location'],
      lotNumber: body.lotNumber !== undefined ? body.lotNumber : before['lot_number'],
      mileage: body.mileage !== undefined ? body.mileage : before['mileage'],
      damage: body.damage !== undefined ? body.damage : before['damage'],
      turnkeyPriceUsd: body.turnkeyPriceUsd ?? Number(before['turnkey_price_usd']),
      breakdown: body.breakdown ?? before['breakdown'],
      description: body.description !== undefined ? body.description : before['description'],
      isPublished: body.isPublished ?? before['is_published'],
      sortOrder: body.sortOrder ?? Number(before['sort_order']),
    };

    // Дата публикации проставляется один раз — при первом включении
    const publishedAt =
      next.isPublished && !before['is_published'] ? new Date() : before['published_at'];

    await pool.query(
      `UPDATE showcase_items SET
         status=$1, title=$2, make_model=$3, year=$4, fuel=$5, engine_volume=$6,
         vehicle_kind=$7, platform=$8, location=$9, lot_number=$10, mileage=$11,
         damage=$12, turnkey_price_usd=$13, breakdown=$14, description=$15,
         is_published=$16, published_at=$17, sort_order=$18, updated_at=now()
       WHERE id=$19`,
      [
        next.status, next.title, next.makeModel, next.year, next.fuel, next.engineVolume,
        next.vehicleKind, next.platform, next.location, next.lotNumber, next.mileage,
        next.damage, next.turnkeyPriceUsd, JSON.stringify(next.breakdown), next.description,
        next.isPublished, publishedAt, next.sortOrder, id,
      ],
    );

    const updated = await queryOne<Record<string, unknown>>(`${SELECT_ITEM} WHERE s.id = $1`, [id]);
    return { item: mapAdminItem(updated!) };
  });

  app.delete('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    // Файлы фото удаляем вместе с карточкой, чтобы том не зарастал мусором
    const photos = await query<{ url: string }>(
      'SELECT url FROM showcase_photos WHERE item_id = $1',
      [id],
    );
    await pool.query('DELETE FROM showcase_items WHERE id = $1', [id]);
    for (const photo of photos) {
      await removeUploadedFile(photo.url);
    }

    return { ok: true };
  });

  // ─── Фотографии ───────────────────────────────────────────────────────────

  app.post('/:id/photos', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const item = await queryOne<{ id: string }>(
      'SELECT id FROM showcase_items WHERE id = $1',
      [id],
    );
    if (!item) throw notFound('Карточка не найдена');

    const file = await request.file();
    if (!file) throw badRequest('Файл не получен');

    const ext = extname(file.filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      throw badRequest('Допустимы только JPG, PNG, WebP и AVIF');
    }

    const dir = join(config.UPLOADS_DIR, 'showcase');
    await mkdir(dir, { recursive: true });

    // Имя генерируем сами: пользовательское имя файла в путь не попадает
    const name = `${randomUUID()}${ext}`;
    await pipeline(file.file, createWriteStream(join(dir, name)));

    if (file.file.truncated) {
      await unlink(join(dir, name)).catch(() => {});
      throw badRequest('Файл слишком большой (максимум 8 МБ)');
    }

    const url = `/uploads/showcase/${name}`;
    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO showcase_photos (item_id, url, sort_order)
       VALUES ($1, $2, COALESCE((SELECT max(sort_order) + 1 FROM showcase_photos WHERE item_id = $1), 0))
       RETURNING id, url, sort_order`,
      [id, url],
    );

    reply.code(201);
    return {
      photo: {
        id: row!['id'] as string,
        url: row!['url'] as string,
        sortOrder: Number(row!['sort_order']),
      },
    };
  });

  app.delete('/:id/photos/:photoId', async (request) => {
    const { photoId } = z
      .object({ id: z.string().uuid(), photoId: z.string().uuid() })
      .parse(request.params);

    const row = await queryOne<{ url: string }>(
      'DELETE FROM showcase_photos WHERE id = $1 RETURNING url',
      [photoId],
    );
    if (!row) throw notFound('Фото не найдено');

    await removeUploadedFile(row.url);
    return { ok: true };
  });
}

// ─── Вспомогательное ────────────────────────────────────────────────────────

/** Удаляет файл, но только внутри каталога загрузок. */
async function removeUploadedFile(url: string): Promise<void> {
  const prefix = '/uploads/';
  if (!url.startsWith(prefix)) return;
  const relative = url.slice(prefix.length);
  if (relative.includes('..') || relative.startsWith('/')) return;
  await unlink(join(config.UPLOADS_DIR, relative)).catch(() => {});
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ъ: '',
};

function makeSlug(title: string, year: number | null): string {
  const base = `${year ?? ''} ${title}`
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base.slice(0, 80) : 'auto';
}

/** Слаг должен быть уникален — иначе публичная ссылка укажет не на то авто. */
async function uniqueSlug(base: string): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await queryOne<{ id: string }>(
      'SELECT id FROM showcase_items WHERE slug = $1',
      [candidate],
    );
    if (!taken) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function mapPublicItem(row: Record<string, unknown>) {
  return {
    id: row['id'] as string,
    slug: row['slug'] as string,
    status: row['status'] as string,
    title: row['title'] as string,
    makeModel: row['make_model'] as string,
    year: row['year'] as number | null,
    fuel: row['fuel'] as string,
    engineVolume: row['engine_volume'] === null ? null : Number(row['engine_volume']),
    vehicleKind: row['vehicle_kind'] as string,
    platform: row['platform'] as string,
    location: row['location'] as string,
    lotNumber: row['lot_number'] as string | null,
    mileage: row['mileage'] as number | null,
    damage: row['damage'] as string | null,
    turnkeyPriceUsd: Number(row['turnkey_price_usd']),
    // Разбивка сохраняется с ключом группы, а подпись подставляется здесь:
    // расчёт ведётся в русском интерфейсе, а витрина у нас украинская
    breakdown: ((row['breakdown'] ?? []) as { group?: LineGroup; label: string; amount: number }[])
      .map((line) => ({
        label: line.group ? groupLabel(line.group, 'uk') : line.label,
        amount: line.amount,
      })),
    description: row['description'] as string | null,
    photos: row['photos'] as { id: string; url: string; sortOrder: number }[],
    publishedAt: row['published_at'] ? (row['published_at'] as Date).toISOString() : null,
  };
}

function mapAdminItem(row: Record<string, unknown>) {
  return {
    ...mapPublicItem(row),
    isPublished: Boolean(row['is_published']),
    sortOrder: Number(row['sort_order']),
    calculationId: row['calculation_id'] as string | null,
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}
