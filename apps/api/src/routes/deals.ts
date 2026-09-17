import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool, query, queryOne, transaction } from '../db/pool.js';
import { requireAuth } from '../lib/auth.js';
import { badRequest, notFound } from '../lib/errors.js';

/**
 * Сделки — одно авто от заявки до выдачи.
 *
 * Деньги считаются по четырём статьям (лот со сбором, доставка с комплексом,
 * растаможка, стоянка). По каждой отдельно живут начисление («сколько
 * должен») и платежи («сколько внёс, когда»): частичная оплата — обычное
 * дело, и без отдельной таблицы её записать некуда.
 */

const STAGES = [
  'lead',
  'quoted',
  'bidding',
  'purchased',
  'shipping',
  'port',
  'customs',
  'delivered',
] as const;

const ARTICLES = ['lot', 'delivery', 'customs', 'parking'] as const;

const dealBody = z.object({
  clientId: z.string().uuid(),
  leadId: z.string().uuid().nullish(),
  calculationId: z.string().uuid().nullish(),
  agentId: z.string().uuid().nullish(),
  managerId: z.string().uuid().nullish(),
  stage: z.enum(STAGES).default('lead'),
  outcome: z.enum(['active', 'won', 'lost']).default('active'),
  // Значения совпадают с типом platform в базе: шесть площадок
  platform: z
    .enum(['copart', 'iaai', 'manheim', 'copart_uk', 'copart_ca', 'iaai_ca'])
    .nullish(),
  lotNumber: z.string().max(60).nullish(),
  vin: z.string().max(40).nullish(),
  makeModel: z.string().max(160).nullish(),
  year: z.coerce.number().int().min(1950).max(2100).nullish(),
  location: z.string().max(160).nullish(),
  purchasePriceUsd: z.coerce.number().min(0).max(10_000_000).nullish(),
  portEta: z.string().max(20).nullish(),
  portArrivedAt: z.string().max(20).nullish(),
  deliveredAt: z.string().max(20).nullish(),
  notes: z.string().max(8000).nullish(),
});

function iso(value: unknown): string | null {
  return value ? (value as Date).toISOString() : null;
}

function day(value: unknown): string | null {
  if (!value) return null;
  const d = value as Date;
  // Дата без времени: у сервера своя таймзона, и toISOString сдвинул бы день
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mapDeal(r: Record<string, unknown>): Record<string, unknown> {
  return {
    id: r['id'] as string,
    clientId: r['client_id'] as string,
    clientName: (r['client_name'] as string | null) ?? null,
    clientPhone: (r['client_phone'] as string | null) ?? null,
    leadId: (r['lead_id'] as string | null) ?? null,
    calculationId: (r['calculation_id'] as string | null) ?? null,
    agentId: (r['agent_id'] as string | null) ?? null,
    agentName: (r['agent_name'] as string | null) ?? null,
    managerId: (r['manager_id'] as string | null) ?? null,
    stage: r['stage'] as string,
    outcome: r['outcome'] as string,
    platform: (r['platform'] as string | null) ?? null,
    lotNumber: (r['lot_number'] as string | null) ?? null,
    vin: (r['vin'] as string | null) ?? null,
    makeModel: (r['make_model'] as string | null) ?? null,
    year: (r['year'] as number | null) ?? null,
    location: (r['location'] as string | null) ?? null,
    purchasePriceUsd: r['purchase_price_usd'] !== null && r['purchase_price_usd'] !== undefined
      ? Number(r['purchase_price_usd'])
      : null,
    portEta: day(r['port_eta']),
    portArrivedAt: day(r['port_arrived_at']),
    deliveredAt: day(r['delivered_at']),
    notes: (r['notes' ] as string | null) ?? null,
    // Итоги по деньгам считает база: складывать в приложении — верный способ
    // однажды показать одну сумму в списке и другую в карточке
    plannedUsd: Number(r['planned_usd'] ?? 0),
    paidUsd: Number(r['paid_usd'] ?? 0),
    photosCount: Number(r['photos_count'] ?? 0),
    commentsCount: Number(r['comments_count'] ?? 0),
    createdAt: iso(r['created_at']),
    updatedAt: iso(r['updated_at']),
  };
}

/**
 * Суммы по сделке приводим к доллару.
 *
 * Гривневый платёж пересчитываем курсом, записанным в момент платежа, а не
 * сегодняшним: иначе итог сделки меняется каждый день сам по себе и никогда
 * не сходится с кассой.
 */
const MONEY_SUBQUERY = `
  (SELECT coalesce(sum(ch.planned * to_usd(ch.currency, NULL)), 0)
     FROM deal_charges ch WHERE ch.deal_id = d.id) AS planned_usd,
  (SELECT coalesce(sum(p.amount * to_usd(p.currency, p.fx_rate)), 0)
     FROM deal_payments p WHERE p.deal_id = d.id) AS paid_usd,
  (SELECT count(*) FROM deal_photos ph WHERE ph.deal_id = d.id)   AS photos_count,
  (SELECT count(*) FROM deal_comments cm WHERE cm.deal_id = d.id) AS comments_count
`;

export async function dealRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // ─── Список ───────────────────────────────────────────────────────────────

  app.get('/', async (request) => {
    const q = z
      .object({
        stage: z.enum(STAGES).optional(),
        outcome: z.enum(['active', 'won', 'lost']).optional(),
        search: z.string().max(120).optional(),
        limit: z.coerce.number().min(1).max(500).default(300),
      })
      .parse(request.query);

    const user = request.user!;
    const where: string[] = [];
    const params: unknown[] = [];

    if (user.role === 'agent') {
      params.push(user.id);
      where.push(`d.agent_id = $${params.length}`);
    }
    if (q.stage) {
      params.push(q.stage);
      where.push(`d.stage = $${params.length}::deal_stage`);
    }
    if (q.outcome) {
      params.push(q.outcome);
      where.push(`d.outcome = $${params.length}::deal_outcome`);
    }
    if (q.search?.trim()) {
      params.push(`%${q.search.trim().toLowerCase()}%`);
      const like = `$${params.length}`;
      where.push(
        `(lower(coalesce(d.vin, '')) LIKE ${like}
          OR lower(coalesce(d.lot_number, '')) LIKE ${like}
          OR lower(coalesce(d.make_model, '')) LIKE ${like}
          OR lower(c.full_name) LIKE ${like})`,
      );
    }

    params.push(q.limit);

    const rows = await query<Record<string, unknown>>(
      `SELECT d.*, c.full_name AS client_name, c.phone AS client_phone,
              a.full_name AS agent_name,
              ${MONEY_SUBQUERY}
         FROM deals d
         JOIN clients c ON c.id = d.client_id
         LEFT JOIN users a ON a.id = d.agent_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY d.created_at DESC
        LIMIT $${params.length}`,
      params,
    );

    return { items: rows.map(mapDeal) };
  });

  // ─── Одна сделка со всем содержимым ───────────────────────────────────────

  app.get('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const user = request.user!;

    const row = await queryOne<Record<string, unknown>>(
      `SELECT d.*, c.full_name AS client_name, c.phone AS client_phone,
              a.full_name AS agent_name,
              ${MONEY_SUBQUERY}
         FROM deals d
         JOIN clients c ON c.id = d.client_id
         LEFT JOIN users a ON a.id = d.agent_id
        WHERE d.id = $1 AND ($2::uuid IS NULL OR d.agent_id = $2::uuid)`,
      [id, user.role === 'agent' ? user.id : null],
    );
    if (!row) throw notFound('Сделка не найдена');

    const [charges, payments, photos, comments, history] = await Promise.all([
      query<Record<string, unknown>>(
        'SELECT * FROM deal_charges WHERE deal_id = $1 ORDER BY article',
        [id],
      ),
      query<Record<string, unknown>>(
        `SELECT p.*, u.full_name AS author_name
           FROM deal_payments p LEFT JOIN users u ON u.id = p.created_by
          WHERE p.deal_id = $1 ORDER BY p.paid_at DESC, p.created_at DESC`,
        [id],
      ),
      query<Record<string, unknown>>(
        'SELECT * FROM deal_photos WHERE deal_id = $1 ORDER BY created_at',
        [id],
      ),
      query<Record<string, unknown>>(
        `SELECT cm.*, u.full_name AS author_name
           FROM deal_comments cm LEFT JOIN users u ON u.id = cm.author_id
          WHERE cm.deal_id = $1 ORDER BY cm.created_at DESC`,
        [id],
      ),
      query<Record<string, unknown>>(
        `SELECT h.*, u.full_name AS author_name
           FROM deal_stage_history h LEFT JOIN users u ON u.id = h.author_id
          WHERE h.deal_id = $1 ORDER BY h.created_at`,
        [id],
      ),
    ]);

    return {
      item: mapDeal(row),
      charges: charges.map((c) => ({
        id: c['id'] as string,
        article: c['article'] as string,
        planned: Number(c['planned'] ?? 0),
        currency: c['currency'] as string,
        comment: (c['comment'] as string | null) ?? null,
      })),
      payments: payments.map((p) => ({
        id: p['id'] as string,
        article: p['article'] as string,
        amount: Number(p['amount'] ?? 0),
        currency: p['currency'] as string,
        paidAt: day(p['paid_at']),
        fxRate: p['fx_rate'] ? Number(p['fx_rate']) : null,
        method: (p['method'] as string | null) ?? null,
        comment: (p['comment'] as string | null) ?? null,
        authorName: (p['author_name'] as string | null) ?? null,
      })),
      photos: photos.map((ph) => ({
        id: ph['id'] as string,
        kind: ph['kind'] as string,
        url: (ph['url'] as string | null) ?? null,
        filePath: (ph['file_path'] as string | null) ?? null,
        caption: (ph['caption'] as string | null) ?? null,
        createdAt: iso(ph['created_at']),
      })),
      comments: comments.map((cm) => ({
        id: cm['id'] as string,
        body: cm['body'] as string,
        authorName: (cm['author_name'] as string | null) ?? null,
        createdAt: iso(cm['created_at']),
      })),
      history: history.map((h) => ({
        id: h['id'] as string,
        fromStage: (h['from_stage'] as string | null) ?? null,
        toStage: h['to_stage'] as string,
        authorName: (h['author_name'] as string | null) ?? null,
        createdAt: iso(h['created_at']),
      })),
    };
  });

  // ─── Создание ─────────────────────────────────────────────────────────────

  app.post('/', async (request) => {
    const body = dealBody.parse(request.body);
    const user = request.user!;

    const client = await queryOne<{ id: string; agent_id: string | null }>(
      'SELECT id, agent_id FROM clients WHERE id = $1',
      [body.clientId],
    );
    if (!client) throw badRequest('Клиент не найден');
    if (user.role === 'agent' && client.agent_id !== user.id) {
      throw notFound('Клиент не найден');
    }

    const created = await transaction(async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `INSERT INTO deals
           (client_id, lead_id, calculation_id, agent_id, manager_id, stage, outcome,
            platform, lot_number, vin, make_model, year, location,
            purchase_price_usd, port_eta, port_arrived_at, delivered_at, notes)
         VALUES ($1,$2,$3,$4,$5,$6::deal_stage,$7::deal_outcome,
                 $8::platform,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          body.clientId,
          body.leadId ?? null,
          body.calculationId ?? null,
          user.role === 'agent' ? user.id : (body.agentId ?? client.agent_id),
          body.managerId ?? (user.role === 'agent' ? null : user.id),
          body.stage,
          body.outcome,
          body.platform ?? null,
          body.lotNumber ?? null,
          body.vin ?? null,
          body.makeModel ?? null,
          body.year ?? null,
          body.location ?? null,
          body.purchasePriceUsd ?? null,
          body.portEta || null,
          body.portArrivedAt || null,
          body.deliveredAt || null,
          body.notes ?? null,
        ],
      );
      const id = rows[0]!.id;

      // Первая запись истории: без неё «сколько сделка шла» посчитать нечем
      await tx.query(
        'INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, author_id) VALUES ($1, NULL, $2::deal_stage, $3)',
        [id, body.stage, user.id],
      );

      // Заявку помечаем обработанной и привязываем к клиенту: иначе она
      // останется висеть в новых, хотя работа по ней уже идёт
      if (body.leadId) {
        await tx.query(
          'UPDATE leads SET is_processed = true, client_id = $1 WHERE id = $2',
          [body.clientId, body.leadId],
        );
      }
      if (body.calculationId) {
        await tx.query('UPDATE calculations SET deal_id = $1 WHERE id = $2', [
          id,
          body.calculationId,
        ]);
      }

      return id;
    });

    return { item: { id: created } };
  });

  // ─── Правка ───────────────────────────────────────────────────────────────

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = dealBody.partial().parse(request.body);
    const user = request.user!;

    const current = await queryOne<{ stage: string; agent_id: string | null }>(
      'SELECT stage, agent_id FROM deals WHERE id = $1',
      [id],
    );
    if (!current) throw notFound('Сделка не найдена');
    if (user.role === 'agent' && current.agent_id !== user.id) {
      throw notFound('Сделка не найдена');
    }

    const columns: Record<string, unknown> = {
      lead_id: body.leadId,
      calculation_id: body.calculationId,
      agent_id: user.role === 'agent' ? undefined : body.agentId,
      manager_id: body.managerId,
      stage: body.stage,
      outcome: body.outcome,
      platform: body.platform,
      lot_number: body.lotNumber,
      vin: body.vin,
      make_model: body.makeModel,
      year: body.year,
      location: body.location,
      purchase_price_usd: body.purchasePriceUsd,
      port_eta: body.portEta || null,
      port_arrived_at: body.portArrivedAt || null,
      delivered_at: body.deliveredAt || null,
      notes: body.notes,
    };

    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [column, value] of Object.entries(columns)) {
      if (value === undefined) continue;
      params.push(value);
      const cast =
        column === 'stage' ? '::deal_stage'
        : column === 'outcome' ? '::deal_outcome'
        : column === 'platform' ? '::platform'
        : '';
      sets.push(`${column} = $${params.length}${cast}`);
    }
    if (sets.length === 0) return { ok: true };

    sets.push('updated_at = now()');
    params.push(id);

    await transaction(async (tx) => {
      await tx.query(`UPDATE deals SET ${sets.join(', ')} WHERE id = $${params.length}`, params);

      if (body.stage && body.stage !== current.stage) {
        await tx.query(
          `INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, author_id)
           VALUES ($1, $2::deal_stage, $3::deal_stage, $4)`,
          [id, current.stage, body.stage, user.id],
        );
      }
    });

    return { ok: true };
  });

  app.delete('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    if (request.user!.role !== 'admin') throw notFound('Сделка не найдена');
    const row = await queryOne<{ id: string }>('DELETE FROM deals WHERE id = $1 RETURNING id', [id]);
    if (!row) throw notFound('Сделка не найдена');
    return { ok: true };
  });

  // ─── Деньги ───────────────────────────────────────────────────────────────

  /** Начисление по статье: одна строка на статью, поэтому upsert. */
  app.put('/:id/charges/:article', async (request) => {
    const { id, article } = z
      .object({ id: z.string().uuid(), article: z.enum(ARTICLES) })
      .parse(request.params);
    const body = z
      .object({
        planned: z.coerce.number().min(0).max(10_000_000),
        currency: z.enum(['USD', 'UAH', 'EUR']).default('USD'),
        comment: z.string().max(500).nullish(),
      })
      .parse(request.body);

    await assertAccess(id, request.user!);

    await pool.query(
      `INSERT INTO deal_charges (deal_id, article, planned, currency, comment)
       VALUES ($1, $2::deal_charge_article, $3, $4, $5)
       ON CONFLICT (deal_id, article) DO UPDATE
          SET planned = excluded.planned,
              currency = excluded.currency,
              comment = excluded.comment,
              updated_at = now()`,
      [id, article, body.planned, body.currency, body.comment ?? null],
    );

    return { ok: true };
  });

  app.post('/:id/payments', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z
      .object({
        article: z.enum(ARTICLES),
        amount: z.coerce.number().min(0.01).max(10_000_000),
        currency: z.enum(['USD', 'UAH', 'EUR']).default('USD'),
        paidAt: z.string().max(20).optional(),
        fxRate: z.coerce.number().min(0).max(1_000_000).nullish(),
        method: z.string().max(60).nullish(),
        comment: z.string().max(500).nullish(),
      })
      .parse(request.body);

    await assertAccess(id, request.user!);

    // Курс на день платежа. Не передали — берём последний известный: лучше
    // приблизительный курс, записанный один раз, чем пересчёт задним числом.
    let fxRate = body.fxRate ?? null;
    if (!fxRate && body.currency !== 'USD') {
      // Храним множитель «сколько долларов за единицу валюты» — с ним сумма
      // платежа переводится умножением и не зависит от будущих курсов
      const row = await queryOne<{ usd_uah: string; eur_uah: string }>(
        'SELECT usd_uah, eur_uah FROM fx_rates ORDER BY fetched_at DESC LIMIT 1',
        [],
      );
      const usdUah = row ? Number(row.usd_uah) : 0;
      if (usdUah > 0) {
        fxRate =
          body.currency === 'UAH' ? 1 / usdUah : Number(row!.eur_uah) / usdUah;
      }
    }

    const row = await queryOne<{ id: string }>(
      `INSERT INTO deal_payments
         (deal_id, article, amount, currency, paid_at, fx_rate, method, comment, created_by)
       VALUES ($1, $2::deal_charge_article, $3, $4, coalesce($5::date, current_date), $6, $7, $8, $9)
       RETURNING id`,
      [
        id,
        body.article,
        body.amount,
        body.currency,
        body.paidAt || null,
        fxRate,
        body.method ?? null,
        body.comment ?? null,
        request.user!.id,
      ],
    );

    return { item: { id: row!.id } };
  });

  app.delete('/:id/payments/:paymentId', async (request) => {
    const { id, paymentId } = z
      .object({ id: z.string().uuid(), paymentId: z.string().uuid() })
      .parse(request.params);
    await assertAccess(id, request.user!);

    const row = await queryOne<{ id: string }>(
      'DELETE FROM deal_payments WHERE id = $1 AND deal_id = $2 RETURNING id',
      [paymentId, id],
    );
    if (!row) throw notFound('Платёж не найден');
    return { ok: true };
  });

  // ─── Фото ─────────────────────────────────────────────────────────────────

  app.post('/:id/photos', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z
      .object({
        kind: z.enum(['auction', 'port', 'other']).default('other'),
        url: z.string().url('Нужна ссылка целиком, вместе с https://').max(2000),
        caption: z.string().max(200).nullish(),
      })
      .parse(request.body);

    await assertAccess(id, request.user!);

    const row = await queryOne<{ id: string }>(
      `INSERT INTO deal_photos (deal_id, kind, url, caption, created_by)
       VALUES ($1, $2::deal_photo_kind, $3, $4, $5) RETURNING id`,
      [id, body.kind, body.url, body.caption ?? null, request.user!.id],
    );
    return { item: { id: row!.id } };
  });

  app.delete('/:id/photos/:photoId', async (request) => {
    const { id, photoId } = z
      .object({ id: z.string().uuid(), photoId: z.string().uuid() })
      .parse(request.params);
    await assertAccess(id, request.user!);

    const row = await queryOne<{ id: string }>(
      'DELETE FROM deal_photos WHERE id = $1 AND deal_id = $2 RETURNING id',
      [photoId, id],
    );
    if (!row) throw notFound('Фото не найдено');
    return { ok: true };
  });

  // ─── Комментарии ──────────────────────────────────────────────────────────

  app.post('/:id/comments', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({ body: z.string().min(1).max(4000) }).parse(request.body);
    await assertAccess(id, request.user!);

    const row = await queryOne<{ id: string }>(
      'INSERT INTO deal_comments (deal_id, author_id, body) VALUES ($1, $2, $3) RETURNING id',
      [id, request.user!.id, body.body],
    );
    return { item: { id: row!.id } };
  });
}

/** Агент работает только со своими сделками — проверяем на каждом действии. */
async function assertAccess(
  dealId: string,
  user: { id: string; role: string },
): Promise<void> {
  const row = await queryOne<{ agent_id: string | null }>(
    'SELECT agent_id FROM deals WHERE id = $1',
    [dealId],
  );
  if (!row) throw notFound('Сделка не найдена');
  if (user.role === 'agent' && row.agent_id !== user.id) throw notFound('Сделка не найдена');
}
