import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool, query, queryOne } from '../db/pool.js';
import { requirePermission } from '../lib/auth.js';
import { conflict, notFound } from '../lib/errors.js';
import { runOnce } from '../services/lot-watcher.js';

const watchSchema = z.object({
  platform: z.enum(['copart', 'iaai', 'copart_uk', 'copart_ca', 'iaai_ca', 'manheim']),
  lotNumber: z.string().min(4).max(20),
  title: z.string().max(200).nullable().default(null),
  maxBid: z.number().nonnegative().nullable().default(null),
  calculationId: z.string().uuid().nullable().default(null),
});

export async function watchlistRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePermission('useWatchlist'));

  app.get('/', async (request) => {
    const rows = await query<Record<string, unknown>>(
      `SELECT w.*,
              COALESCE(
                (SELECT json_agg(json_build_object('bid', h.bid, 'seenAt', h.seen_at)
                                 ORDER BY h.seen_at)
                   FROM lot_bid_history h WHERE h.watch_id = w.id),
                '[]'::json
              ) AS history
         FROM lot_watches w
        WHERE w.user_id = $1
        ORDER BY w.is_active DESC, w.updated_at DESC`,
      [request.user!.id],
    );

    return { items: rows.map(mapWatch) };
  });

  app.post('/', async (request, reply) => {
    const body = watchSchema.parse(request.body);
    const user = request.user!;

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM lot_watches
        WHERE user_id = $1 AND platform = $2 AND lot_number = $3`,
      [user.id, body.platform, body.lotNumber],
    );
    if (existing) throw conflict('Этот лот уже на наблюдении');

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO lot_watches (user_id, platform, lot_number, title, max_bid, calculation_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.id, body.platform, body.lotNumber, body.title, body.maxBid, body.calculationId],
    );

    reply.code(201);
    return { item: mapWatch({ ...row!, history: [] }) };
  });

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z
      .object({
        maxBid: z.number().nonnegative().nullable().optional(),
        isActive: z.boolean().optional(),
        title: z.string().max(200).nullable().optional(),
      })
      .parse(request.body);

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM lot_watches WHERE id = $1 AND user_id = $2',
      [id, request.user!.id],
    );
    if (!before) throw notFound('Наблюдение не найдено');

    await pool.query(
      `UPDATE lot_watches
          SET max_bid = $1, is_active = $2, title = $3, updated_at = now()
        WHERE id = $4`,
      [
        body.maxBid !== undefined ? body.maxBid : before['max_bid'],
        body.isActive ?? before['is_active'],
        body.title !== undefined ? body.title : before['title'],
        id,
      ],
    );

    return { ok: true };
  });

  app.delete('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const row = await queryOne<{ id: string }>(
      'DELETE FROM lot_watches WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, request.user!.id],
    );
    if (!row) throw notFound('Наблюдение не найдено');
    return { ok: true };
  });

  /** Проверить прямо сейчас, не дожидаясь планового обхода. */
  app.post('/check-now', {
    config: { rateLimit: { max: 4, timeWindow: '5 minutes' } },
    handler: async () => {
      const result = await runOnce();
      return result;
    },
  });

  // ─── Уведомления ──────────────────────────────────────────────────────────

  app.get('/notifications', async (request) => {
    const rows = await query<Record<string, unknown>>(
      `SELECT id, kind, title, body, link, is_read, created_at
         FROM notifications WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 50`,
      [request.user!.id],
    );

    return {
      items: rows.map((r) => ({
        id: r['id'] as string,
        kind: r['kind'] as string,
        title: r['title'] as string,
        body: r['body'] as string | null,
        link: r['link'] as string | null,
        isRead: Boolean(r['is_read']),
        createdAt: (r['created_at'] as Date).toISOString(),
      })),
      unread: rows.filter((r) => !r['is_read']).length,
    };
  });

  app.post('/notifications/read', async (request) => {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND NOT is_read',
      [request.user!.id],
    );
    return { ok: true };
  });
}

function mapWatch(row: Record<string, unknown>) {
  const last = row['last_bid'] === null ? null : Number(row['last_bid']);
  const previous = row['previous_bid'] === null ? null : Number(row['previous_bid']);

  return {
    id: row['id'] as string,
    platform: row['platform'] as 'copart' | 'iaai',
    lotNumber: row['lot_number'] as string,
    title: row['title'] as string | null,
    maxBid: row['max_bid'] === null ? null : Number(row['max_bid']),
    lastBid: last,
    previousBid: previous,
    // Разница со времени прошлой проверки — то, на что менеджер смотрит первым
    delta: last !== null && previous !== null ? Number((last - previous).toFixed(2)) : null,
    overMax:
      last !== null && row['max_bid'] !== null && last > Number(row['max_bid']),
    calculationId: row['calculation_id'] as string | null,
    isActive: Boolean(row['is_active']),
    lastCheckedAt: row['last_checked_at']
      ? (row['last_checked_at'] as Date).toISOString()
      : null,
    lastError: row['last_error'] as string | null,
    history: (row['history'] ?? []) as { bid: number; seenAt: string }[],
  };
}
