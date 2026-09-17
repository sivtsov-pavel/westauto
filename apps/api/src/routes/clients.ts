import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { requireAuth } from '../lib/auth.js';
import { conflict, notFound } from '../lib/errors.js';

/**
 * Клиенты.
 *
 * Отдельная сущность, а не строка внутри сделки: человек привозит машину
 * не один раз, и повторные обращения — главный показатель того, что сервис
 * работает. Если хранить клиента в сделке, второй приход станет новым
 * человеком, и посчитать вернувшихся будет нечем.
 */

/**
 * Ключ телефона — последние девять цифр.
 *
 * +380 67 123-45-67, 380671234567 и 0671234567 — один и тот же человек:
 * столько цифр в национальном номере, а код страны и ведущий ноль на них
 * уже не влияют. Сравнение по всем цифрам подряд считало такие записи
 * разными людьми.
 */
function phoneKey(phone: string): string {
  return phone.replace(/\D/g, '').slice(-9);
}

const clientBody = z.object({
  fullName: z.string().min(2, 'Вкажіть ім’я').max(160),
  phone: z.string().min(6, 'Вкажіть телефон').max(40),
  telegram: z.string().max(80).nullish(),
  viber: z.string().max(80).nullish(),
  whatsapp: z.string().max(80).nullish(),
  email: z.string().max(160).nullish(),
  city: z.string().max(120).nullish(),
  source: z.string().max(60).default('site'),
  agentId: z.string().uuid().nullish(),
  managerId: z.string().uuid().nullish(),
  notes: z.string().max(4000).nullish(),
});

function mapClient(r: Record<string, unknown>): Record<string, unknown> {
  return {
    id: r['id'] as string,
    fullName: r['full_name'] as string,
    phone: r['phone'] as string,
    telegram: (r['telegram'] as string | null) ?? null,
    viber: (r['viber'] as string | null) ?? null,
    whatsapp: (r['whatsapp'] as string | null) ?? null,
    email: (r['email'] as string | null) ?? null,
    city: (r['city'] as string | null) ?? null,
    source: r['source'] as string,
    agentId: (r['agent_id'] as string | null) ?? null,
    agentName: (r['agent_name'] as string | null) ?? null,
    managerId: (r['manager_id'] as string | null) ?? null,
    notes: (r['notes'] as string | null) ?? null,
    dealsCount: Number(r['deals_count'] ?? 0),
    lastDealAt: r['last_deal_at'] ? (r['last_deal_at'] as Date).toISOString() : null,
    createdAt: (r['created_at'] as Date).toISOString(),
  };
}

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const q = z
      .object({
        search: z.string().max(120).optional(),
        limit: z.coerce.number().min(1).max(500).default(200),
      })
      .parse(request.query);

    const user = request.user!;
    const where: string[] = [];
    const params: unknown[] = [];

    // Агент видит только тех, кого привёл сам
    if (user.role === 'agent') {
      params.push(user.id);
      where.push(`c.agent_id = $${params.length}`);
    }

    if (q.search?.trim()) {
      const term = q.search.trim();
      params.push(`%${term.toLowerCase()}%`);
      const like = `$${params.length}`;
      // По телефону ищем по цифрам: человек набирает как привык
      params.push(`%${term.replace(/\D/g, '')}%`);
      const phoneLike = `$${params.length}`;
      where.push(
        `(lower(c.full_name) LIKE ${like}
          OR lower(coalesce(c.telegram, '')) LIKE ${like}
          OR (${term.replace(/\D/g, '').length > 0} AND regexp_replace(c.phone, '\\D', '', 'g') LIKE ${phoneLike}))`,
      );
    }

    params.push(q.limit);

    const rows = await query<Record<string, unknown>>(
      `SELECT c.*,
              a.full_name AS agent_name,
              (SELECT count(*) FROM deals d WHERE d.client_id = c.id)            AS deals_count,
              (SELECT max(d.created_at) FROM deals d WHERE d.client_id = c.id)   AS last_deal_at
         FROM clients c
         LEFT JOIN users a ON a.id = c.agent_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY c.created_at DESC
        LIMIT $${params.length}`,
      params,
    );

    return { items: rows.map(mapClient) };
  });

  app.get('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const user = request.user!;

    const row = await queryOne<Record<string, unknown>>(
      `SELECT c.*, a.full_name AS agent_name,
              (SELECT count(*) FROM deals d WHERE d.client_id = c.id)          AS deals_count,
              (SELECT max(d.created_at) FROM deals d WHERE d.client_id = c.id) AS last_deal_at
         FROM clients c
         LEFT JOIN users a ON a.id = c.agent_id
        WHERE c.id = $1 AND ($2::uuid IS NULL OR c.agent_id = $2::uuid)`,
      [id, user.role === 'agent' ? user.id : null],
    );
    if (!row) throw notFound('Клиент не найден');

    const deals = await query<Record<string, unknown>>(
      `SELECT id, stage, outcome, make_model, year, lot_number, vin,
              purchase_price_usd, created_at
         FROM deals WHERE client_id = $1 ORDER BY created_at DESC`,
      [id],
    );

    return {
      item: mapClient(row),
      deals: deals.map((d) => ({
        id: d['id'] as string,
        stage: d['stage'] as string,
        outcome: d['outcome'] as string,
        makeModel: (d['make_model'] as string | null) ?? null,
        year: d['year'] as number | null,
        lotNumber: (d['lot_number'] as string | null) ?? null,
        vin: (d['vin'] as string | null) ?? null,
        purchasePriceUsd: d['purchase_price_usd'] ? Number(d['purchase_price_usd']) : null,
        createdAt: (d['created_at'] as Date).toISOString(),
      })),
    };
  });

  app.post('/', async (request) => {
    const body = clientBody.parse(request.body);
    const user = request.user!;

    // Тот же номер — тот же человек. Молча заводить дубль нельзя: он
    // разваливает и историю сделок, и счёт повторных клиентов.
    const same = await queryOne<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM clients
        WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = $1`,
      [phoneKey(body.phone)],
    );
    if (same) {
      throw conflict(`Такой телефон уже записан за клиентом «${same.full_name}»`);
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO clients
         (full_name, phone, telegram, viber, whatsapp, email, city, source,
          agent_id, manager_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        body.fullName,
        body.phone,
        body.telegram ?? null,
        body.viber ?? null,
        body.whatsapp ?? null,
        body.email ?? null,
        body.city ?? null,
        body.source,
        // Агент заводит клиента всегда себе: чужого ему приписывать нечего
        user.role === 'agent' ? user.id : (body.agentId ?? null),
        body.managerId ?? (user.role === 'manager' || user.role === 'admin' ? user.id : null),
        body.notes ?? null,
      ],
    );

    return { item: { id: row!.id } };
  });

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = clientBody.partial().parse(request.body);
    const user = request.user!;

    if (body.phone) {
      const same = await queryOne<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM clients
          WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = $1 AND id <> $2`,
        [phoneKey(body.phone), id],
      );
      if (same) throw conflict(`Телефон уже записан за клиентом «${same.full_name}»`);
    }

    const fields: Record<string, unknown> = {
      full_name: body.fullName,
      phone: body.phone,
      telegram: body.telegram,
      viber: body.viber,
      whatsapp: body.whatsapp,
      email: body.email,
      city: body.city,
      source: body.source,
      agent_id: user.role === 'agent' ? undefined : body.agentId,
      manager_id: body.managerId,
      notes: body.notes,
    };

    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [column, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
    if (sets.length === 0) return { ok: true };

    sets.push('updated_at = now()');
    params.push(id);
    params.push(user.role === 'agent' ? user.id : null);

    const row = await queryOne<{ id: string }>(
      `UPDATE clients SET ${sets.join(', ')}
        WHERE id = $${params.length - 1}
          AND ($${params.length}::uuid IS NULL OR agent_id = $${params.length}::uuid)
        RETURNING id`,
      params,
    );
    if (!row) throw notFound('Клиент не найден');
    return { ok: true };
  });

  app.delete('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    if (request.user!.role !== 'admin') throw notFound('Клиент не найден');

    const row = await queryOne<{ id: string }>(
      'DELETE FROM clients WHERE id = $1 RETURNING id',
      [id],
    );
    if (!row) throw notFound('Клиент не найден');
    return { ok: true };
  });
}
