import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/pool.js';
import { requireAuth } from '../lib/auth.js';
import { demoScopeSql } from '../lib/scope.js';
import { isDemoHidden } from '../services/settings.js';

/**
 * Сводка для главной.
 *
 * Считает база, а не приложение: те же числа приходят в карточку сделки и в
 * список, и расхождение между экранами здесь недопустимо — на эти цифры
 * смотрят, принимая решения.
 *
 * Агент видит только своё. Это не украшение: в его сводке не должно быть
 * оборота компании.
 */
export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request) => {
    const q = z
      .object({ months: z.coerce.number().min(3).max(24).default(12) })
      .parse(request.query);

    const user = request.user!;

    // Сводка показывает ровно то, что человеку положено видеть. Агенту — его
    // сделки, менеджеру — его и ещё не распределённые, администратору — всё.
    // Иначе в сводке менеджера оказался бы оборот всей компании.
    const agentId = user.role === 'agent' ? user.id : null;
    const managerId = user.role === 'manager' ? user.id : null;

    // Учебные записи не должны попадать в сводку: именно здесь они опаснее
    // всего — оборот, долги и график роста складываются из них молча, и
    // заказчик принимает решения по цифрам, которых в жизни не было.
    //
    // Условие дописывается готовым куском SQL и НЕ добавляет параметров.
    // В этом файле $1 (агент) и $2 (менеджер) повторяются по многу раз в
    // одном запросе, а $3 (месяцы) есть только в одном: лишний параметр
    // пришлось бы вписывать в каждый запрос отдельно, иначе PostgreSQL
    // отвергнет тот, где он не используется.
    const hideDemo = await isDemoHidden();
    const andLive = (alias: string): string => {
      const condition = demoScopeSql(hideDemo, alias);
      return condition ? ` AND ${condition}` : '';
    };

    const [
      totals,
      stages,
      months,
      articles,
      upcoming,
      recent,
      sources,
      topCars,
    ] = await Promise.all([
      // ─ Общие цифры ─
      queryOne<Record<string, unknown>>(
        `SELECT
           (SELECT count(*) FROM clients c
             WHERE ($1::uuid IS NULL OR c.agent_id = $1::uuid) AND ($2::uuid IS NULL OR c.manager_id = $2::uuid OR c.manager_id IS NULL)${andLive('c')})                       AS clients_total,
           (SELECT count(*) FROM clients c
             WHERE ($1::uuid IS NULL OR c.agent_id = $1::uuid) AND ($2::uuid IS NULL OR c.manager_id = $2::uuid OR c.manager_id IS NULL)
               AND (SELECT count(*) FROM deals d WHERE d.client_id = c.id${andLive('d')}) > 1${andLive('c')})       AS clients_returning,
           (SELECT count(*) FROM deals d
             WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
               AND d.outcome = 'active' AND d.stage <> 'delivered'${andLive('d')})                   AS deals_active,
           (SELECT count(*) FROM deals d
             WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
               AND d.stage = 'delivered'${andLive('d')})                                             AS deals_delivered,
           (SELECT coalesce(sum(ch.planned * to_usd(ch.currency, NULL)), 0)
              FROM deal_charges ch JOIN deals d ON d.id = ch.deal_id
             WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
               AND d.outcome <> 'lost'${andLive('d')})                                               AS planned_usd,
           (SELECT coalesce(sum(p.amount * to_usd(p.currency, p.fx_rate)), 0)
              FROM deal_payments p JOIN deals d ON d.id = p.deal_id
             WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
               AND d.outcome <> 'lost'${andLive('d')})                                               AS paid_usd,
           (SELECT count(*) FROM leads l
             WHERE ($1::uuid IS NULL OR l.agent_id = $1::uuid) AND NOT l.is_processed${andLive('l')}) AS leads_new`,
        [agentId, managerId],
      ),

      // ─ Сколько сделок и денег на каждом этапе ─
      query<Record<string, unknown>>(
        `SELECT d.stage,
                count(*) AS deals,
                coalesce(sum(
                  (SELECT coalesce(sum(ch.planned * to_usd(ch.currency, NULL)), 0)
                     FROM deal_charges ch WHERE ch.deal_id = d.id)), 0) AS amount
           FROM deals d
          WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL) AND d.outcome = 'active'${andLive('d')}
          GROUP BY d.stage`,
        [agentId, managerId],
      ),

      // ─ Клиенты по месяцам: новые и те, кто вернулся ─
      //
      // Вернувшимся считаем месяц, в котором у клиента появилась не первая
      // сделка. Именно этот показатель говорит, довольны ли люди сервисом.
      query<Record<string, unknown>>(
        `WITH span AS (
           SELECT generate_series(
             date_trunc('month', now()) - make_interval(months => $3::int - 1),
             date_trunc('month', now()),
             interval '1 month') AS m
         ),
         numbered AS (
           SELECT d.client_id,
                  date_trunc('month', d.created_at) AS m,
                  row_number() OVER (PARTITION BY d.client_id ORDER BY d.created_at) AS n
             FROM deals d
            WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)${andLive('d')}
         )
         SELECT to_char(span.m, 'YYYY-MM') AS month,
                (SELECT count(*) FROM clients c
                  WHERE ($1::uuid IS NULL OR c.agent_id = $1::uuid) AND ($2::uuid IS NULL OR c.manager_id = $2::uuid OR c.manager_id IS NULL)
                    AND date_trunc('month', c.created_at) = span.m${andLive('c')})          AS new_clients,
                (SELECT count(DISTINCT client_id) FROM numbered
                  WHERE numbered.m = span.m AND numbered.n > 1)              AS returning_clients,
                (SELECT count(*) FROM deals d
                  WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
                    AND date_trunc('month', d.created_at) = span.m${andLive('d')})          AS deals,
                (SELECT coalesce(sum(p.amount * to_usd(p.currency, p.fx_rate)), 0)
                   FROM deal_payments p JOIN deals d ON d.id = p.deal_id
                  WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
                    AND date_trunc('month', p.paid_at) = span.m${andLive('d')})             AS paid_usd
           FROM span ORDER BY span.m`,
        [agentId, managerId, q.months],
      ),

      // ─ Долг по статьям: где именно застряли деньги ─
      query<Record<string, unknown>>(
        `SELECT ch.article,
                coalesce(sum(ch.planned * to_usd(ch.currency, NULL)), 0) AS planned,
                coalesce((SELECT sum(p.amount * to_usd(p.currency, p.fx_rate))
                            FROM deal_payments p
                           WHERE p.article = ch.article
                             AND p.deal_id IN (SELECT id FROM deals d2
                                                WHERE ($1::uuid IS NULL OR d2.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d2.manager_id = $2::uuid OR d2.manager_id IS NULL)
                                                  AND d2.outcome <> 'lost'${andLive('d2')})), 0) AS paid
           FROM deal_charges ch
           JOIN deals d ON d.id = ch.deal_id
          WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL) AND d.outcome <> 'lost'${andLive('d')}
          GROUP BY ch.article`,
        [agentId, managerId],
      ),

      // ─ Что вот-вот придёт в порт: ближайшие две недели и просрочка ─
      query<Record<string, unknown>>(
        `SELECT d.id, d.make_model, d.year, d.port_eta, d.lot_number,
                c.full_name AS client_name
           FROM deals d JOIN clients c ON c.id = d.client_id
          WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
            AND d.port_eta IS NOT NULL AND d.port_arrived_at IS NULL
            AND d.outcome = 'active'
            AND d.port_eta <= current_date + 30${andLive('d')}
          ORDER BY d.port_eta
          LIMIT 8`,
        [agentId, managerId],
      ),

      // ─ Последние движения: что происходило в системе ─
      query<Record<string, unknown>>(
        `SELECT h.created_at, h.from_stage, h.to_stage,
                d.id AS deal_id, d.make_model, d.year,
                c.full_name AS client_name
           FROM deal_stage_history h
           JOIN deals d ON d.id = h.deal_id
           JOIN clients c ON c.id = d.client_id
          WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)${andLive('d')}
          ORDER BY h.created_at DESC
          LIMIT 8`,
        [agentId, managerId],
      ),

      // ─ Откуда приходят люди: куда имеет смысл вкладываться ─
      query<Record<string, unknown>>(
        `SELECT source, count(*) AS count
           FROM clients c
          WHERE ($1::uuid IS NULL OR c.agent_id = $1::uuid) AND ($2::uuid IS NULL OR c.manager_id = $2::uuid OR c.manager_id IS NULL)${andLive('c')}
          GROUP BY source ORDER BY count DESC LIMIT 8`,
        [agentId, managerId],
      ),

      // ─ Что возят чаще всего ─
      query<Record<string, unknown>>(
        `SELECT split_part(make_model, ' ', 1) AS make, count(*) AS count
           FROM deals d
          WHERE ($1::uuid IS NULL OR d.agent_id = $1::uuid) AND ($2::uuid IS NULL OR d.manager_id = $2::uuid OR d.manager_id IS NULL)
            AND make_model IS NOT NULL AND make_model <> ''${andLive('d')}
          GROUP BY 1 ORDER BY count DESC LIMIT 6`,
        [agentId, managerId],
      ),
    ]);

    const plannedUsd = Number(totals?.['planned_usd'] ?? 0);
    const paidUsd = Number(totals?.['paid_usd'] ?? 0);

    return {
      totals: {
        clientsTotal: Number(totals?.['clients_total'] ?? 0),
        clientsReturning: Number(totals?.['clients_returning'] ?? 0),
        dealsActive: Number(totals?.['deals_active'] ?? 0),
        dealsDelivered: Number(totals?.['deals_delivered'] ?? 0),
        leadsNew: Number(totals?.['leads_new'] ?? 0),
        plannedUsd,
        paidUsd,
        debtUsd: plannedUsd - paidUsd,
      },
      stages: stages.map((s) => ({
        stage: s['stage'] as string,
        deals: Number(s['deals'] ?? 0),
        amountUsd: Number(s['amount'] ?? 0),
      })),
      months: months.map((m) => ({
        month: m['month'] as string,
        newClients: Number(m['new_clients'] ?? 0),
        returningClients: Number(m['returning_clients'] ?? 0),
        deals: Number(m['deals'] ?? 0),
        paidUsd: Number(m['paid_usd'] ?? 0),
      })),
      articles: articles.map((a) => ({
        article: a['article'] as string,
        plannedUsd: Number(a['planned'] ?? 0),
        paidUsd: Number(a['paid'] ?? 0),
      })),
      upcoming: upcoming.map((u) => ({
        id: u['id'] as string,
        makeModel: (u['make_model'] as string | null) ?? null,
        year: (u['year'] as number | null) ?? null,
        lotNumber: (u['lot_number'] as string | null) ?? null,
        clientName: u['client_name'] as string,
        portEta: u['port_eta'] ? (u['port_eta'] as Date).toISOString().slice(0, 10) : null,
      })),
      recent: recent.map((r) => ({
        dealId: r['deal_id'] as string,
        makeModel: (r['make_model'] as string | null) ?? null,
        year: (r['year'] as number | null) ?? null,
        clientName: r['client_name'] as string,
        fromStage: (r['from_stage'] as string | null) ?? null,
        toStage: r['to_stage'] as string,
        createdAt: (r['created_at'] as Date).toISOString(),
      })),
      sources: sources.map((s) => ({
        source: s['source'] as string,
        count: Number(s['count'] ?? 0),
      })),
      topCars: topCars.map((t) => ({
        make: t['make'] as string,
        count: Number(t['count'] ?? 0),
      })),
    };
  });
}
