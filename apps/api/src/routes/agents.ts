import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { normalizeReferralCode, type CommissionType } from '@avtoklyuch/shared';
import { pool, query, queryOne } from '../db/pool.js';
import { requireAdmin, requireAuth } from '../lib/auth.js';
import { conflict, notFound } from '../lib/errors.js';
import { hashPassword } from '../lib/password.js';
import { logChange } from '../services/changelog.js';

/**
 * Агентская сеть.
 *
 * Агент — партнёр на комиссии. Заводит его администратор: выдаёт доступ,
 * условия вознаграждения и, при необходимости, домен под персональный сайт.
 */
const createSchema = z.object({
  login: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Только латиница, цифры, точка, дефис и подчёркивание'),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8, 'Пароль не короче 8 символов').max(200),
  publicName: z.string().max(120).nullable().default(null),
  phone: z.string().max(40).nullable().default(null),
  telegram: z.string().max(80).nullable().default(null),
  referralCode: z.string().max(40).nullable().default(null),
  commissionType: z.enum(['fixed', 'percent_of_margin']).default('fixed'),
  commissionValue: z.number().nonnegative().max(100_000).default(0),
});

const updateSchema = createSchema
  .partial()
  .omit({ login: true })
  .extend({ isActive: z.boolean().optional() });

const SELECT_AGENT = `
  SELECT u.id, u.login, u.full_name, u.public_name, u.phone, u.telegram,
         u.referral_code, u.commission_type, u.commission_value, u.is_active, u.created_at,
         COALESCE(
           (SELECT json_agg(json_build_object('id', d.id, 'host', d.host, 'isActive', d.is_active)
                            ORDER BY d.created_at)
              FROM agent_domains d WHERE d.agent_id = u.id),
           '[]'::json
         ) AS domains
    FROM users u
   WHERE u.role = 'agent'
`;

/*
 * Показатели считаем подзапросами, а не JOIN.
 *
 * При соединении сразу с заявками и расчётами строки размножаются: у агента
 * с двумя заявками и одной сделкой сумма комиссии удваивалась.
 * count(DISTINCT) от этого спасает, а sum() — нет.
 */
const STATS_COLUMNS = `
  (SELECT count(*)::int FROM leads l WHERE l.agent_id = %ID%) AS leads_total,
  (SELECT count(*)::int FROM leads l WHERE l.agent_id = %ID% AND NOT l.is_processed) AS leads_new,
  (SELECT count(*)::int FROM calculations c WHERE c.agent_id = %ID% AND c.status = 'saved') AS calculations,
  (SELECT count(*)::int FROM calculations c WHERE c.agent_id = %ID% AND c.outcome = 'won') AS deals_won,
  (SELECT count(*)::int FROM calculations c WHERE c.agent_id = %ID% AND c.outcome = 'lost') AS deals_lost,
  (SELECT COALESCE(sum(c.commission_usd), 0) FROM calculations c
    WHERE c.agent_id = %ID% AND c.outcome = 'won') AS earned,
  (SELECT COALESCE(sum(c.commission_usd), 0) FROM calculations c
    WHERE c.agent_id = %ID% AND c.commission_paid_at IS NOT NULL) AS paid
`;

export async function agentAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async () => {
    const rows = await query<Record<string, unknown>>(`${SELECT_AGENT} ORDER BY u.full_name`);

    const stats = await query<Record<string, unknown>>(
      `SELECT u.id AS agent_id, ${STATS_COLUMNS.replaceAll('%ID%', 'u.id')}
         FROM users u WHERE u.role = 'agent'`,
    );
    const byAgent = new Map(stats.map((s) => [String(s['agent_id']), s]));

    return {
      items: rows.map((row) => ({
        ...mapAgent(row),
        stats: mapStats(byAgent.get(String(row['id']))),
      })),
    };
  });

  app.post('/', async (request, reply) => {
    const body = createSchema.parse(request.body);
    const actor = request.user!;

    const taken = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE lower(login) = lower($1)',
      [body.login],
    );
    if (taken) throw conflict('Такой логин уже занят');

    const code = normalizeReferralCode(body.referralCode || body.login);

    const codeTaken = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE lower(referral_code) = lower($1)',
      [code],
    );
    if (codeTaken) throw conflict(`Метка «${code}» уже используется другим агентом`);

    const row = await queryOne<{ id: string }>(
      `INSERT INTO users (
         login, full_name, password_hash, role,
         public_name, phone, telegram, referral_code,
         commission_type, commission_value
       ) VALUES ($1, $2, $3, 'agent', $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        body.login, body.fullName, await hashPassword(body.password),
        body.publicName ?? body.fullName, body.phone, body.telegram, code,
        body.commissionType, body.commissionValue,
      ],
    );

    await logChange({
      entity: 'user',
      entityId: row!.id,
      entityLabel: `Агент ${body.fullName}`,
      action: 'create',
      field: 'commission',
      oldValue: null,
      newValue: `${body.commissionType} ${body.commissionValue}`,
      userId: actor.id,
      userName: actor.fullName,
    });

    reply.code(201);
    const created = await queryOne<Record<string, unknown>>(
      `${SELECT_AGENT} AND u.id = $1`,
      [row!.id],
    );
    return { item: { ...mapAgent(created!), stats: mapStats(undefined) } };
  });

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const actor = request.user!;

    const before = await queryOne<Record<string, unknown>>(
      `SELECT * FROM users WHERE id = $1 AND role = 'agent'`,
      [id],
    );
    if (!before) throw notFound('Агент не найден');

    const code =
      body.referralCode !== undefined && body.referralCode !== null
        ? normalizeReferralCode(body.referralCode)
        : (before['referral_code'] as string | null);

    if (code && code !== before['referral_code']) {
      const taken = await queryOne<{ id: string }>(
        'SELECT id FROM users WHERE lower(referral_code) = lower($1) AND id <> $2',
        [code, id],
      );
      if (taken) throw conflict(`Метка «${code}» уже используется другим агентом`);
    }

    const next = {
      fullName: body.fullName ?? before['full_name'],
      publicName: body.publicName !== undefined ? body.publicName : before['public_name'],
      phone: body.phone !== undefined ? body.phone : before['phone'],
      telegram: body.telegram !== undefined ? body.telegram : before['telegram'],
      commissionType: body.commissionType ?? before['commission_type'],
      commissionValue: body.commissionValue ?? Number(before['commission_value']),
      isActive: body.isActive ?? before['is_active'],
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (body.password) {
        await client.query(
          'UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2',
          [await hashPassword(body.password), id],
        );
      }

      // Отключение агента должно немедленно выкидывать его из системы
      await client.query(
        `UPDATE users SET
           full_name = $1, public_name = $2, phone = $3, telegram = $4,
           referral_code = $5, commission_type = $6, commission_value = $7,
           is_active = $8, token_version = token_version + $9, updated_at = now()
         WHERE id = $10`,
        [
          next.fullName, next.publicName, next.phone, next.telegram, code,
          next.commissionType, next.commissionValue, next.isActive,
          body.isActive === false ? 1 : 0, id,
        ],
      );

      if (
        Number(before['commission_value']) !== next.commissionValue ||
        before['commission_type'] !== next.commissionType
      ) {
        await logChange(
          {
            entity: 'user',
            entityId: id,
            entityLabel: `Агент ${next.fullName} · условия`,
            action: 'update',
            field: 'commission',
            oldValue: `${before['commission_type']} ${before['commission_value']}`,
            newValue: `${next.commissionType} ${next.commissionValue}`,
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

    const updated = await queryOne<Record<string, unknown>>(`${SELECT_AGENT} AND u.id = $1`, [id]);
    return { item: { ...mapAgent(updated!), stats: mapStats(undefined) } };
  });

  // ─── Домены агента ────────────────────────────────────────────────────────

  app.post('/:id/domains', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z
      .object({
        host: z
          .string()
          .min(4)
          .max(180)
          .regex(/^[a-z0-9.-]+$/i, 'Домен: латиница, цифры, точка и дефис'),
      })
      .parse(request.body);

    const host = body.host.trim().toLowerCase();

    const taken = await queryOne<{ id: string }>(
      'SELECT id FROM agent_domains WHERE lower(host) = lower($1)',
      [host],
    );
    if (taken) throw conflict('Этот домен уже закреплён за агентом');

    const row = await queryOne<Record<string, unknown>>(
      'INSERT INTO agent_domains (agent_id, host) VALUES ($1, $2) RETURNING id, host, is_active',
      [id, host],
    );

    reply.code(201);
    return {
      domain: {
        id: row!['id'] as string,
        host: row!['host'] as string,
        isActive: Boolean(row!['is_active']),
      },
    };
  });

  app.delete('/:id/domains/:domainId', async (request) => {
    const { domainId } = z
      .object({ id: z.string().uuid(), domainId: z.string().uuid() })
      .parse(request.params);

    const row = await queryOne<{ id: string }>(
      'DELETE FROM agent_domains WHERE id = $1 RETURNING id',
      [domainId],
    );
    if (!row) throw notFound('Домен не найден');
    return { ok: true };
  });

  /** Отметить вознаграждение выплаченным. */
  app.post('/payouts/:calculationId', async (request) => {
    const { calculationId } = z
      .object({ calculationId: z.string().uuid() })
      .parse(request.params);

    const row = await queryOne<{ id: string }>(
      `UPDATE calculations SET commission_paid_at = now()
        WHERE id = $1 AND outcome = 'won' AND commission_paid_at IS NULL
        RETURNING id`,
      [calculationId],
    );
    if (!row) throw notFound('Сделка не найдена или вознаграждение уже выплачено');
    return { ok: true };
  });
}

// ─── Кабинет самого агента ──────────────────────────────────────────────────

export async function agentSelfRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  /**
   * Сводка для агента: только свои данные и только то, что положено.
   * Ни маржи, ни себестоимости, ни чужих цифр здесь нет.
   */
  app.get('/summary', async (request) => {
    const user = request.user!;
    if (user.role !== 'agent') {
      return { agent: null, stats: null, deals: [] };
    }

    const profile = await queryOne<Record<string, unknown>>(
      `${SELECT_AGENT} AND u.id = $1`,
      [user.id],
    );

    const stats = await queryOne<Record<string, unknown>>(
      `SELECT ${STATS_COLUMNS.replaceAll('%ID%', '$1')}`,
      [user.id],
    );

    const deals = await query<Record<string, unknown>>(
      `SELECT id, make_model, year, client_total_usd, commission_usd,
              outcome, outcome_at, commission_paid_at, created_at
         FROM calculations
        WHERE agent_id = $1 AND outcome IS NOT NULL
        ORDER BY outcome_at DESC LIMIT 100`,
      [user.id],
    );

    return {
      agent: profile ? mapAgent(profile) : null,
      stats: mapStats(stats ?? undefined),
      deals: deals.map((d) => ({
        id: d['id'] as string,
        makeModel: d['make_model'] as string | null,
        year: d['year'] as number | null,
        clientTotalUsd: Number(d['client_total_usd']),
        commissionUsd: d['commission_usd'] === null ? 0 : Number(d['commission_usd']),
        outcome: d['outcome'] as 'won' | 'lost',
        outcomeAt: d['outcome_at'] ? (d['outcome_at'] as Date).toISOString() : null,
        paidAt: d['commission_paid_at'] ? (d['commission_paid_at'] as Date).toISOString() : null,
        createdAt: (d['created_at'] as Date).toISOString(),
      })),
    };
  });
}

// ─── Публичная карточка агента для его сайта ────────────────────────────────

export async function agentPublicRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Кого показывать на сайте: ищем по метке или по домену.
   * Наружу отдаём только то, что агент и так пишет на визитке.
   */
  app.get('/', async (request) => {
    const q = z
      .object({ host: z.string().max(180).optional(), ref: z.string().max(40).optional() })
      .parse(request.query);

    const host = (q.host ?? request.headers.host ?? '').split(':')[0]?.toLowerCase() ?? '';

    let row: Record<string, unknown> | null = null;

    if (q.ref) {
      row = await queryOne<Record<string, unknown>>(
        `SELECT u.public_name, u.full_name, u.phone, u.telegram, u.referral_code
           FROM users u
          WHERE u.role = 'agent' AND u.is_active
            AND lower(u.referral_code) = lower($1)`,
        [normalizeReferralCode(q.ref)],
      );
    }

    if (!row && host) {
      row = await queryOne<Record<string, unknown>>(
        `SELECT u.public_name, u.full_name, u.phone, u.telegram, u.referral_code
           FROM agent_domains d
           JOIN users u ON u.id = d.agent_id
          WHERE d.is_active AND u.is_active AND u.role = 'agent'
            AND lower(d.host) = lower($1)`,
        [host],
      );
    }

    if (!row) return { agent: null };

    return {
      agent: {
        publicName: (row['public_name'] as string | null) ?? (row['full_name'] as string),
        phone: row['phone'] as string | null,
        telegram: row['telegram'] as string | null,
        referralCode: row['referral_code'] as string | null,
      },
    };
  });
}

// ─── Общее ──────────────────────────────────────────────────────────────────

function mapAgent(row: Record<string, unknown>) {
  return {
    id: row['id'] as string,
    login: row['login'] as string,
    fullName: row['full_name'] as string,
    publicName: row['public_name'] as string | null,
    phone: row['phone'] as string | null,
    telegram: row['telegram'] as string | null,
    referralCode: row['referral_code'] as string | null,
    commissionType: row['commission_type'] as CommissionType,
    commissionValue: Number(row['commission_value']),
    isActive: Boolean(row['is_active']),
    domains: (row['domains'] ?? []) as { id: string; host: string; isActive: boolean }[],
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}

function mapStats(row: Record<string, unknown> | undefined) {
  const earned = Number(row?.['earned'] ?? 0);
  const paid = Number(row?.['paid'] ?? 0);
  return {
    leadsTotal: Number(row?.['leads_total'] ?? 0),
    leadsNew: Number(row?.['leads_new'] ?? 0),
    calculations: Number(row?.['calculations'] ?? 0),
    dealsWon: Number(row?.['deals_won'] ?? 0),
    dealsLost: Number(row?.['deals_lost'] ?? 0),
    commissionEarned: earned,
    commissionPaid: paid,
    commissionPending: Math.round((earned - paid) * 100) / 100,
  };
}
