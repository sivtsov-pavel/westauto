import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { normalizeReferralCode } from '@avtoklyuch/shared';
import { pool, query, queryOne } from '../db/pool.js';
import { requireAuth } from '../lib/auth.js';
import { notFound } from '../lib/errors.js';
import { OWNER_OF, demoScopeSql, ownerScopeSql } from '../lib/scope.js';
import { isDemoHidden } from '../services/settings.js';

const leadSchema = z.object({
  name: z.string().min(2, 'Вкажіть ім’я').max(120),
  phone: z.string().min(6, 'Вкажіть телефон').max(40),
  comment: z.string().max(2000).optional().nullable(),
  showcaseItemId: z.string().uuid().optional().nullable(),
  source: z.string().max(60).default('site'),
  /** Реферальная метка агента из ссылки: ?ref=ivan */
  ref: z.string().max(40).optional().nullable(),
});

/**
 * Чей это клиент.
 *
 * Сначала метка в ссылке, затем домен, с которого пришла заявка. Без этой
 * привязки на вопрос «кому платить комиссию» ответить нечем, а спорить об
 * этом с агентом задним числом — худшее, что можно придумать.
 */
async function resolveAgent(
  ref: string | null | undefined,
  host: string | undefined,
): Promise<string | null> {
  if (ref) {
    const byRef = await queryOne<{ id: string }>(
      `SELECT id FROM users
        WHERE role = 'agent' AND is_active AND lower(referral_code) = lower($1)`,
      [normalizeReferralCode(ref)],
    );
    if (byRef) return byRef.id;
  }

  const clean = (host ?? '').split(':')[0]?.toLowerCase();
  if (!clean) return null;

  const byHost = await queryOne<{ agent_id: string }>(
    `SELECT d.agent_id FROM agent_domains d
       JOIN users u ON u.id = d.agent_id
      WHERE d.is_active AND u.is_active AND lower(d.host) = lower($1)`,
    [clean],
  );
  return byHost?.agent_id ?? null;
}

export async function publicLeadRoutes(app: FastifyInstance): Promise<void> {
  /** Заявка с публичного сайта. Без авторизации, но с жёстким лимитом. */
  app.post('/', {
    config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    handler: async (request, reply) => {
      const body = leadSchema.parse(request.body);

      const agentId = await resolveAgent(body.ref, request.headers.host);

      await pool.query(
        `INSERT INTO leads (name, phone, comment, showcase_item_id, source, agent_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          body.name, body.phone, body.comment ?? null,
          body.showcaseItemId ?? null, body.source, agentId,
        ],
      );

      reply.code(201);
      return { ok: true };
    },
  });
}

export async function adminLeadRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const q = z
      .object({ onlyNew: z.coerce.boolean().default(false) })
      .parse(request.query);

    const user = request.user!;

    // Агент видит только тех клиентов, которых привёл сам
    const where: string[] = [];
    const params: unknown[] = [];
    // Агент видит только свои заявки. Менеджеру виден весь входящий поток:
    // владельца у заявки с сайта нет, и «только свои» означало бы, что новая
    // заявка не видна никому, пока её кто-то не присвоит
    const scope = ownerScopeSql(user, OWNER_OF.leads(), params);
    if (scope) where.push(scope);

    // Учебные заявки скрываются той же настройкой, что клиенты и сделки:
    // иначе стенд выглядел бы вычищенным наполовину
    const demo = demoScopeSql(await isDemoHidden(), 'l');
    if (demo) where.push(demo);

    if (q.onlyNew) where.push('NOT l.is_processed');

    const rows = await query<Record<string, unknown>>(
      `SELECT l.*, s.title AS item_title, a.full_name AS agent_name
         FROM leads l
         LEFT JOIN showcase_items s ON s.id = l.showcase_item_id
         LEFT JOIN users a ON a.id = l.agent_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY l.created_at DESC LIMIT 200`,
      params,
    );

    return {
      items: rows.map((r) => ({
        id: r['id'] as string,
        name: r['name'] as string,
        phone: r['phone'] as string,
        comment: r['comment'] as string | null,
        itemTitle: (r['item_title'] as string | null) ?? null,
        agentName: (r['agent_name'] as string | null) ?? null,
        source: r['source'] as string,
        isProcessed: Boolean(r['is_processed']),
        isDemo: Boolean(r['is_demo']),
        createdAt: (r['created_at'] as Date).toISOString(),
      })),
    };
  });

  /**
   * Заявка → клиент.
   *
   * Человек, оставивший заявку, уже мог обращаться раньше — тогда заводить
   * его заново нельзя: развалится история сделок и счёт вернувшихся. Ищем по
   * телефону (по последним девяти цифрам, как везде) и либо подхватываем
   * существующего, либо заводим нового. Повторный вызов ничего не портит.
   */
  app.post('/:id/client', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const user = request.user!;

    const leadParams: unknown[] = [id];
    const leadScope = ownerScopeSql(user, OWNER_OF.leads(''), leadParams);

    const lead = await queryOne<Record<string, unknown>>(
      `SELECT * FROM leads WHERE id = $1${leadScope ? ` AND ${leadScope}` : ''}`,
      leadParams,
    );
    if (!lead) throw notFound('Заявка не найдена');

    if (lead['client_id']) {
      return { item: { id: lead['client_id'] as string, existing: true } };
    }

    const phone = (lead['phone'] as string) ?? '';
    const key = phone.replace(/\D/g, '').slice(-9);

    const found = key
      ? await queryOne<{ id: string }>(
          `SELECT id FROM clients
            WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = $1`,
          [key],
        )
      : null;

    const clientId = found
      ? found.id
      : (
          await queryOne<{ id: string }>(
            `INSERT INTO clients
               (full_name, phone, source, agent_id, manager_id, notes, is_demo)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
              lead['name'] as string,
              phone,
              (lead['source'] as string) ?? 'site',
              lead['agent_id'] ?? null,
              user.role === 'agent' ? null : user.id,
              lead['comment'] ?? null,
              // Из учебной заявки получается учебный клиент: иначе он
              // «отмоется» при переводе в сделку и останется на стенде
              // настоящим с виду
              Boolean(lead['is_demo']),
            ],
          )
        )!.id;

    await query('UPDATE leads SET client_id = $1, is_processed = true WHERE id = $2', [
      clientId,
      id,
    ]);

    return { item: { id: clientId, existing: Boolean(found) } };
  });

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({ isProcessed: z.boolean() }).parse(request.body);

    const user = request.user!;
    const params: unknown[] = [body.isProcessed, id];
    const scope = ownerScopeSql(user, OWNER_OF.leads(''), params);

    const row = await queryOne<{ id: string }>(
      `UPDATE leads SET is_processed = $1
        WHERE id = $2${scope ? ` AND ${scope}` : ''}
        RETURNING id`,
      params,
    );
    if (!row) throw notFound('Заявка не найдена');
    return { ok: true };
  });
}
