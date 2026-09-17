import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { groupLabel, type CalcResult, type ClientLocale } from '@avtoklyuch/shared';
import { pool, queryOne } from '../db/pool.js';
import { requireAuth } from '../lib/auth.js';
import { notFound } from '../lib/errors.js';

/**
 * Публичная ссылка на расчёт — то, чем закрывается пункт ТЗ про роль «клиент».
 *
 * Клиент открывает страницу без входа в систему и видит ровно то же, что и в
 * карточке для скриншота: крупные статьи и итог. Маржа, себестоимость,
 * тарифы, источники значений и данные менеджера сюда не попадают — страница
 * собирается из отдельного набора полей, а не фильтрацией полного расчёта.
 */

/** 32 байта из криптографического генератора — перебор бессмысленен. */
function makeToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function shareAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  /** Создать или обновить ссылку на расчёт. */
  app.post('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z
      .object({
        locale: z.enum(['ru', 'uk']).default('uk'),
        /** Срок жизни ссылки в днях; 0 — бессрочно */
        days: z.number().int().min(0).max(365).default(14),
      })
      .parse(request.body ?? {});

    const user = request.user!;

    const calc = await queryOne<{ user_id: string; share_token: string | null }>(
      'SELECT user_id, share_token FROM calculations WHERE id = $1',
      [id],
    );
    if (!calc) throw notFound('Расчёт не найден');
    // Менеджер делится только своими расчётами
    if (user.role !== 'admin' && calc.user_id !== user.id) throw notFound('Расчёт не найден');

    // Существующий токен не меняем: разосланная клиенту ссылка не должна
    // протухать оттого, что менеджер second раз нажал «Поделиться»
    const token = calc.share_token ?? makeToken();
    const expiresAt =
      body.days === 0 ? null : new Date(Date.now() + body.days * 86_400_000);

    await pool.query(
      `UPDATE calculations
          SET share_token = $1, share_expires_at = $2, share_locale = $3, updated_at = now()
        WHERE id = $4`,
      [token, expiresAt, body.locale, id],
    );

    return {
      token,
      path: `/rozrahunok/${token}`,
      expiresAt: expiresAt?.toISOString() ?? null,
      locale: body.locale,
    };
  });

  /** Отозвать ссылку — она перестаёт открываться немедленно. */
  app.delete('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const user = request.user!;

    const calc = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM calculations WHERE id = $1',
      [id],
    );
    if (!calc) throw notFound('Расчёт не найден');
    if (user.role !== 'admin' && calc.user_id !== user.id) throw notFound('Расчёт не найден');

    await pool.query(
      `UPDATE calculations
          SET share_token = NULL, share_expires_at = NULL, share_views = 0, share_last_seen = NULL
        WHERE id = $1`,
      [id],
    );

    return { ok: true };
  });

  /** Состояние ссылки: жива ли, сколько раз открывали. */
  app.get('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

    const row = await queryOne<{
      share_token: string | null;
      share_expires_at: Date | null;
      share_locale: string;
      share_views: number;
      share_last_seen: Date | null;
    }>(
      `SELECT share_token, share_expires_at, share_locale, share_views, share_last_seen
         FROM calculations WHERE id = $1`,
      [id],
    );
    if (!row) throw notFound('Расчёт не найден');

    return {
      share: row.share_token
        ? {
            token: row.share_token,
            path: `/rozrahunok/${row.share_token}`,
            expiresAt: row.share_expires_at?.toISOString() ?? null,
            locale: row.share_locale as ClientLocale,
            views: row.share_views,
            lastSeen: row.share_last_seen?.toISOString() ?? null,
          }
        : null,
    };
  });
}

export async function sharePublicRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Страница расчёта для клиента. Без авторизации, с жёстким лимитом:
   * токен длинный, но лимит закрывает даже теоретический перебор.
   */
  app.get('/:token', {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    handler: async (request) => {
      const { token } = z.object({ token: z.string().min(16).max(64) }).parse(request.params);

      const row = await queryOne<{
        id: string;
        make_model: string | null;
        year: number | null;
        fuel: string;
        engine_volume: number | null;
        battery_power: number | null;
        platform: string;
        location: string;
        result_snapshot: CalcResult;
        fx_snapshot: { usdUah?: number } | null;
        client_total_usd: number;
        share_locale: string;
        share_expires_at: Date | null;
        created_at: Date;
      }>(
        `SELECT id, make_model, year, fuel, engine_volume, battery_power,
                platform, location, result_snapshot, fx_snapshot, client_total_usd,
                share_locale, share_expires_at, created_at
           FROM calculations
          WHERE share_token = $1 AND status = 'saved'`,
        [token],
      );

      // Один и тот же ответ для «нет такой ссылки» и «ссылка истекла»:
      // существование чужих расчётов чужим знать незачем
      if (!row || (row.share_expires_at && row.share_expires_at.getTime() < Date.now())) {
        throw notFound('Розрахунок недоступний');
      }

      // Счётчик просмотров — менеджеру полезно знать, открыл ли клиент
      await pool.query(
        `UPDATE calculations
            SET share_views = share_views + 1, share_last_seen = now()
          WHERE share_token = $1`,
        [token],
      );

      const locale = row.share_locale as ClientLocale;
      const result = row.result_snapshot;

      // Собираем ответ полем за полем. Взять снимок и «вырезать лишнее»
      // означало бы, что новое внутреннее поле утечёт клиенту само собой.
      return {
        calculation: {
          makeModel: row.make_model,
          year: row.year,
          fuel: row.fuel,
          engineVolume: row.engine_volume,
          batteryPower: row.battery_power,
          platform: row.platform,
          location: row.location,
          locale,
          breakdown: (result.clientBreakdown ?? []).map((line) => ({
            label: groupLabel(line.group, locale),
            amount: line.amount,
          })),
          total: Number(row.client_total_usd),
          usdUah: row.fx_snapshot?.usdUah ?? null,
          createdAt: row.created_at.toISOString(),
          expiresAt: row.share_expires_at?.toISOString() ?? null,
        },
      };
    },
  });
}
