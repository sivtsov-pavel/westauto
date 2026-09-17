import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  calculate,
  calculateCommission,
  can,
  carTypeFor,
  findAuctionFee,
  findDeliveryTariff,
  type CalcInput,
  type CalcResult,
  type CalcSettings,
  type FxRates,
  type LineKey,
  type CommissionType,
  type LotInfo,
} from '@avtoklyuch/shared';
import { pool, query, queryOne } from '../db/pool.js';
import { requireAuth, type SessionUser } from '../lib/auth.js';
import { HttpError, notFound } from '../lib/errors.js';
import { customsMode, getCustomsQuote } from '../services/customs.js';
import { getFxRates } from '../services/fx.js';
import { getSettings } from '../services/settings.js';

const platformEnum = z.enum(['copart', 'iaai', 'copart_uk', 'copart_ca', 'iaai_ca', 'manheim']);
const fuelEnum = z.enum(['petrol', 'diesel', 'electric', 'hybrid']);
const vehicleKindEnum = z.enum([
  'sedan', 'suv', 'pickup', 'coupe', 'minivan', 'motorcycle', 'truck',
]);
const lineKeyEnum = z.enum([
  'bid', 'delivery', 'auctionFee', 'portHandling', 'freightInsurance',
  'customs', 'ecoFee', 'complex', 'certification', 'commission', 'swift', 'margin',
]);

const lotSchema = z.object({
  lotNumber: z.string().max(40).nullable().default(null),
  vin: z.string().max(40).nullable().default(null),
  makeModel: z.string().max(200).nullable().default(null),
  year: z.number().int().min(1950).max(2100).nullable().default(null),
  engineVolume: z.number().positive().max(20).nullable().default(null),
  batteryPower: z.number().positive().max(1000).nullable().default(null),
  fuel: fuelEnum.default('petrol'),
  platform: platformEnum.default('copart'),
  location: z.string().max(120).default(''),
  vehicleKind: vehicleKindEnum.default('sedan'),
});

const fxSchema = z.object({
  usdUah: z.number().positive(),
  eurUah: z.number().positive(),
  eurUsd: z.number().positive(),
  fetchedAt: z.string(),
  source: z.string(),
  pinned: z.boolean().default(false),
});

/** То, что фронт держит в состоянии калькулятора и присылает на сервер. */
const statePayloadSchema = z.object({
  lot: lotSchema,
  bid: z.number().nonnegative().default(0),
  overrides: z.record(lineKeyEnum, z.number()).default({}),
  disabled: z.array(lineKeyEnum).default([]),
  /** Последнее значение растаможки, полученное фронтом */
  customs: z
    .object({
      amount: z.number().nonnegative(),
      source: z.enum(['api', 'api-cached', 'estimate']),
    })
    .nullable()
    .default(null),
  /** Зафиксированный менеджером курс — иначе берём актуальный */
  fx: fxSchema.nullable().default(null),
});

type StatePayload = z.infer<typeof statePayloadSchema>;

export async function calculationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  /**
   * Всё, что нужно калькулятору для мгновенного пересчёта на клиенте.
   * Один запрос при открытии — дальше расчёт идёт локально тем же движком,
   * что и здесь, без обращений к серверу на каждое нажатие клавиши.
   */
  app.get('/bootstrap', async (request) => {
    const [settings, deliveryTariffs, auctionFees, fx] = await Promise.all([
      getSettings(),
      query(
        `SELECT id, platform, location, vehicle_kind, amount_usd, is_active
           FROM delivery_tariffs WHERE is_active ORDER BY platform, location`,
      ),
      query(
        `SELECT id, platform, bid_from, bid_to, fee_amount, fee_percent, is_active
           FROM auction_fee_tariffs WHERE is_active ORDER BY platform, bid_from`,
      ),
      getFxRates(),
    ]);

    const viewer = request.user!;

    /*
     * Агенту таблицы тарифов не отдаются: по ним он посчитает нашу
     * себестоимость и поймёт, что может работать напрямую. Он получает
     * пустые списки — калькулятор всё равно считает на сервере.
     */
    if (!can(viewer.role, 'viewTariffs')) {
      return {
        user: viewer,
        settings: { ...settings, marginDefault: 0 },
        customsMode,
        deliveryTariffs: [],
        auctionFees: [],
        fx,
      };
    }

    return {
      user: request.user,
      settings,
      customsMode,
      deliveryTariffs: deliveryTariffs.map((r) => ({
        id: r['id'],
        platform: r['platform'],
        location: r['location'],
        vehicleKind: r['vehicle_kind'],
        amountUsd: Number(r['amount_usd']),
        isActive: Boolean(r['is_active']),
      })),
      auctionFees: auctionFees.map((r) => ({
        id: r['id'],
        platform: r['platform'],
        bidFrom: Number(r['bid_from']),
        bidTo: r['bid_to'] === null ? null : Number(r['bid_to']),
        feeAmount: Number(r['fee_amount']),
        feePercent: Number(r['fee_percent']),
        isActive: Boolean(r['is_active']),
      })),
      fx,
    };
  });

  /** Растаможка. Ключ API живёт только на сервере. */
  app.post('/customs', async (request) => {
    const body = z
      .object({
        lot: lotSchema,
        bid: z.number().nonnegative(),
      })
      .parse(request.body);

    const quote = await getCustomsQuote({
      carType: carTypeFor(body.lot.fuel, body.lot.vehicleKind),
      price: body.bid,
      currency: 'USD',
      volume: body.lot.engineVolume,
      motor: body.lot.fuel === 'diesel' ? 'diesel' : 'petrol',
      year: body.lot.year,
      power: body.lot.batteryPower,
    });

    return { quote };
  });

  /** Курс валют: кнопка «обновить» рядом с зафиксированным курсом. */
  app.get('/fx', async () => ({ fx: await getFxRates(true) }));

  /**
   * Авторитетный пересчёт на сервере. Фронт считает тем же движком мгновенно,
   * но в базу уходит только то, что сервер пересчитал сам по своим тарифам —
   * иначе сохранённый расчёт можно подделать запросом мимо интерфейса.
   */
  app.post('/preview', async (request) => {
    const payload = statePayloadSchema.parse(request.body);
    const { result, fx } = await computeAuthoritative(payload, request.user!);
    return { result, fx };
  });

  /** Текущий черновик менеджера — открывается при входе в калькулятор. */
  app.get('/draft', async (request) => {
    const row = await queryOne<Record<string, unknown>>(
      `SELECT * FROM calculations WHERE user_id = $1 AND status = 'draft'`,
      [request.user!.id],
    );
    return { draft: row ? mapCalculation(row) : null };
  });

  /** Автосохранение черновика. Один черновик на менеджера — просто перезаписываем. */
  app.put('/draft', async (request) => {
    const payload = statePayloadSchema.parse(request.body);
    const user = request.user!;
    const { result, input, fx } = await computeAuthoritative(payload, user);

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO calculations (
         user_id, status, lot_number, vin, make_model, year, engine_volume, battery_power,
         fuel, platform, location, vehicle_kind, bid,
         input_snapshot, result_snapshot, fx_snapshot, agent_id,
         cost_usd, margin_usd, client_total_usd, updated_at
       ) VALUES ($1, 'draft', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, now())
       ON CONFLICT (user_id) WHERE status = 'draft' DO UPDATE SET
         lot_number = EXCLUDED.lot_number, vin = EXCLUDED.vin,
         make_model = EXCLUDED.make_model, year = EXCLUDED.year,
         engine_volume = EXCLUDED.engine_volume, battery_power = EXCLUDED.battery_power,
         fuel = EXCLUDED.fuel, platform = EXCLUDED.platform,
         location = EXCLUDED.location, vehicle_kind = EXCLUDED.vehicle_kind,
         bid = EXCLUDED.bid, input_snapshot = EXCLUDED.input_snapshot,
         result_snapshot = EXCLUDED.result_snapshot, fx_snapshot = EXCLUDED.fx_snapshot,
         agent_id = EXCLUDED.agent_id,
         cost_usd = EXCLUDED.cost_usd, margin_usd = EXCLUDED.margin_usd,
         client_total_usd = EXCLUDED.client_total_usd, updated_at = now()
       RETURNING *`,
      calcParams(user.id, payload, input, result, fx, user.role === 'agent' ? user.id : null),
    );

    return { draft: mapCalculation(row!), result, fx, savedAt: new Date().toISOString() };
  });

  /** Сохранить расчёт: черновик превращается в запись истории. */
  app.post('/', async (request, reply) => {
    const payload = statePayloadSchema.parse(request.body);
    const user = request.user!;
    const { result, input, fx } = await computeAuthoritative(payload, user);

    const saved = await pool.connect().then(async (client) => {
      try {
        await client.query('BEGIN');
        const inserted = await client.query<Record<string, unknown>>(
          `INSERT INTO calculations (
             user_id, status, lot_number, vin, make_model, year, engine_volume, battery_power,
             fuel, platform, location, vehicle_kind, bid,
             input_snapshot, result_snapshot, fx_snapshot, agent_id,
             cost_usd, margin_usd, client_total_usd
           ) VALUES ($1, 'saved', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           RETURNING *`,
          calcParams(user.id, payload, input, result, fx, user.role === 'agent' ? user.id : null) as never[],
        );
        // Черновик отработал — убираем, чтобы следующий расчёт начинался с чистого
        await client.query(
          `DELETE FROM calculations WHERE user_id = $1 AND status = 'draft'`,
          [user.id],
        );
        await client.query('COMMIT');
        return inserted.rows[0]!;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    reply.code(201);
    return { calculation: mapCalculation(saved), result };
  });

  /** История расчётов с поиском и фильтрами. */
  app.get('/', async (request) => {
    const q = z
      .object({
        search: z.string().max(120).optional(),
        userId: z.string().uuid().optional(),
        period: z.enum(['week', 'month', 'quarter', 'all']).default('month'),
        limit: z.coerce.number().int().min(1).max(200).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(request.query);

    const where: string[] = [`c.status = 'saved'`];
    const params: unknown[] = [];

    // Агент видит только свои расчёты — чужие сделки его не касаются
    if (request.user!.role === 'agent') {
      params.push(request.user!.id);
      where.push(`c.agent_id = $${params.length}`);
    }

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(c.make_model ILIKE $${params.length} OR c.lot_number ILIKE $${params.length} OR c.vin ILIKE $${params.length})`,
      );
    }
    if (q.userId) {
      params.push(q.userId);
      where.push(`c.user_id = $${params.length}`);
    }
    if (q.period !== 'all') {
      const interval = { week: '7 days', month: '1 month', quarter: '3 months' }[q.period];
      where.push(`c.created_at >= now() - interval '${interval}'`);
    }

    params.push(q.limit, q.offset);

    const rows = await query<Record<string, unknown>>(
      `SELECT c.*, u.full_name AS user_name, a.full_name AS agent_name
         FROM calculations c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN users a ON a.id = c.agent_id
        WHERE ${where.join(' AND ')}
        ORDER BY c.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const totals = await queryOne<{ count: number; avg_total: number | null }>(
      `SELECT count(*)::int AS count, avg(client_total_usd) AS avg_total
         FROM calculations c WHERE ${where.join(' AND ')}`,
      params.slice(0, params.length - 2),
    );

    const managers = await queryOne<{ count: number }>(
      `SELECT count(DISTINCT user_id)::int AS count FROM calculations
        WHERE status = 'saved' AND created_at >= now() - interval '1 month'`,
    );

    return {
      items: rows.map(mapCalculation),
      stats: {
        count: totals?.count ?? 0,
        averageTotal: totals?.avg_total ? Math.round(totals.avg_total) : 0,
        activeManagers: managers?.count ?? 0,
      },
    };
  });

  app.get('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const row = await queryOne<Record<string, unknown>>(
      `SELECT c.*, u.full_name AS user_name
         FROM calculations c JOIN users u ON u.id = c.user_id
        WHERE c.id = $1`,
      [id],
    );
    if (!row) throw notFound('Расчёт не найден');
    return { calculation: mapCalculation(row) };
  });

  /**
   * «Скопировать в новый»: берём поля старого расчёта, но пересчитываем по
   * текущим тарифам и настройкам — ровно то, зачем эта кнопка нужна.
   */
  app.post('/:id/duplicate', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM calculations WHERE id = $1',
      [id],
    );
    if (!row) throw notFound('Расчёт не найден');

    const snapshot = row['input_snapshot'] as StatePayload;
    const payload = statePayloadSchema.parse({
      ...snapshot,
      // курс и растаможку берём заново — в этом и смысл пересчёта
      fx: null,
      customs: null,
    });

    const { result } = await computeAuthoritative(payload, request.user!);
    return { state: payload, result };
  });

  /**
   * Отметить исход сделки.
   *
   * Вознаграждение агента считается один раз — здесь — и записывается
   * в расчёт. Если условия агента потом поменяются, начисленное задним
   * числом не перепишется: спорить с партнёром об уже заработанном нельзя.
   */
  app.post('/:id/outcome', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({ outcome: z.enum(['won', 'lost']).nullable() }).parse(request.body);
    const user = request.user!;

    // Исход сделки проставляет компания, а не агент
    if (user.role === 'agent') {
      throw new HttpError(403, 'Исход сделки отмечает менеджер компании');
    }

    const calc = await queryOne<{
      agent_id: string | null;
      margin_usd: number;
      commission_paid_at: Date | null;
    }>('SELECT agent_id, margin_usd, commission_paid_at FROM calculations WHERE id = $1', [id]);
    if (!calc) throw notFound('Расчёт не найден');

    if (calc.commission_paid_at) {
      throw new HttpError(409, 'Вознаграждение уже выплачено — исход не меняется');
    }

    let commission: number | null = null;

    if (body.outcome === 'won' && calc.agent_id) {
      const agent = await queryOne<{ commission_type: CommissionType; commission_value: number }>(
        'SELECT commission_type, commission_value FROM users WHERE id = $1',
        [calc.agent_id],
      );
      if (agent) {
        commission = calculateCommission(
          {
            commissionType: agent.commission_type,
            commissionValue: Number(agent.commission_value),
          },
          Number(calc.margin_usd),
        );
      }
    }

    await pool.query(
      `UPDATE calculations
          SET outcome = $1,
              outcome_at = CASE WHEN $1::text IS NULL THEN NULL ELSE now() END,
              commission_usd = $2,
              updated_at = now()
        WHERE id = $3`,
      [body.outcome, commission, id],
    );

    return { ok: true, outcome: body.outcome, commissionUsd: commission };
  });

  app.delete('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const user = request.user!;

    // Менеджер удаляет только свои расчёты, администратор — любые
    const row = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM calculations WHERE id = $1',
      [id],
    );
    if (!row) throw notFound('Расчёт не найден');
    if (user.role !== 'admin' && row.user_id !== user.id) {
      throw notFound('Расчёт не найден');
    }

    await pool.query('DELETE FROM calculations WHERE id = $1', [id]);
    return { ok: true };
  });
}

/**
 * Собирает CalcInput из присланного состояния, подставляя актуальные тарифы,
 * настройки и персональную скидку менеджера из базы, и считает общим движком.
 */
async function computeAuthoritative(
  payload: StatePayload,
  user: SessionUser,
): Promise<{ result: CalcResult; input: CalcInput; settings: CalcSettings; fx: FxRates }> {
  const [settings, deliveryRows, auctionRows] = await Promise.all([
    getSettings(),
    query<Record<string, unknown>>(
      `SELECT platform, location, vehicle_kind, amount_usd, is_active
         FROM delivery_tariffs WHERE is_active`,
    ),
    query<Record<string, unknown>>(
      `SELECT platform, bid_from, bid_to, fee_amount, fee_percent, is_active
         FROM auction_fee_tariffs WHERE is_active`,
    ),
  ]);

  const fx = payload.fx ?? (await getFxRates());
  const lot = payload.lot as LotInfo;

  const deliveryTariffs = deliveryRows.map((r) => ({
    platform: String(r['platform']),
    location: String(r['location']),
    vehicleKind: String(r['vehicle_kind']),
    amountUsd: Number(r['amount_usd']),
    isActive: Boolean(r['is_active']),
  }));

  const auctionFees = auctionRows.map((r) => ({
    platform: String(r['platform']),
    bidFrom: Number(r['bid_from']),
    bidTo: r['bid_to'] === null ? null : Number(r['bid_to']),
    feeAmount: Number(r['fee_amount']),
    feePercent: Number(r['fee_percent']),
    isActive: Boolean(r['is_active']),
  }));

  const input: CalcInput = {
    lot,
    bid: payload.bid,
    deliveryTariff: findDeliveryTariff(deliveryTariffs, lot),
    auctionFeeTariff: findAuctionFee(auctionFees, lot, payload.bid),
    customs: payload.customs,
    deliveryDiscountPercent: user.deliveryDiscountPercent,
    settings,
    overrides: payload.overrides as Partial<Record<LineKey, number>>,
    disabled: payload.disabled as LineKey[],
  };

  const result = calculate(input);

  /*
   * Что видит агент.
   *
   * Маржа компании ОСТАЁТСЯ в цене: иначе агент назовёт клиенту сумму ниже
   * нашей и сорвёт экономику сделки. Но отдельной строкой он её не видит —
   * ровно как клиент в карточке расчёта, где маржа растворена в услугах.
   *
   * Себестоимость приравниваем к цене клиенту: разница между ними и есть
   * маржа, и оставлять её вычисляемой значило бы показать то же самое
   * другими словами.
   *
   * Подписи строк убираем: в них видны тарифы и их источники — это карта
   * нашей закупки.
   */
  if (!can(user.role, 'viewInternals')) {
    const withoutMargin = result.lines.filter((line) => !line.internalOnly);
    const marginAmount = result.margin;

    const commissionLine = withoutMargin.find((line) => line.key === 'commission');
    if (commissionLine && marginAmount !== 0) {
      commissionLine.amount = Math.round((commissionLine.amount + marginAmount) * 100) / 100;
    }

    result.lines = withoutMargin.map((line) => ({
      ...line,
      note: null,
      baseAmount: null,
      source: 'settings' as const,
    }));

    result.cost = result.clientTotal;
    result.margin = 0;
  }

  return { result, input, settings, fx };
}

function calcParams(
  userId: string,
  payload: StatePayload,
  input: CalcInput,
  result: CalcResult,
  fx: FxRates,
  agentId: string | null = null,
): unknown[] {
  return [
    userId,
    payload.lot.lotNumber,
    payload.lot.vin,
    payload.lot.makeModel,
    payload.lot.year,
    payload.lot.engineVolume,
    payload.lot.batteryPower,
    payload.lot.fuel,
    payload.lot.platform,
    payload.lot.location,
    payload.lot.vehicleKind,
    payload.bid,
    // В снимок кладём и применённые тарифы, и настройки: старый расчёт должен
    // открываться ровно таким, каким был, даже если тарифы с тех пор уехали
    JSON.stringify({ ...payload, resolved: { delivery: input.deliveryTariff, auctionFee: input.auctionFeeTariff }, settings: input.settings }),
    JSON.stringify(result),
    // Курс на момент расчёта, а не на момент просмотра: открытый через месяц
    // расчёт обязан сходиться с тем, что клиент видел на скриншоте.
    // pinned означает, что менеджер зафиксировал курс руками.
    JSON.stringify({ ...fx, pinned: payload.fx !== null }),
    agentId,
    result.cost,
    result.margin,
    result.clientTotal,
  ];
}

function mapCalculation(row: Record<string, unknown>) {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    userName: (row['user_name'] as string | undefined) ?? null,
    status: row['status'] as 'draft' | 'saved',
    lotNumber: row['lot_number'] as string | null,
    vin: row['vin'] as string | null,
    makeModel: row['make_model'] as string | null,
    year: row['year'] as number | null,
    engineVolume: row['engine_volume'] === null ? null : Number(row['engine_volume']),
    batteryPower: row['battery_power'] === null ? null : Number(row['battery_power']),
    fuel: row['fuel'] as string,
    platform: row['platform'] as string,
    location: row['location'] as string,
    vehicleKind: row['vehicle_kind'] as string,
    bid: Number(row['bid']),
    state: row['input_snapshot'],
    result: row['result_snapshot'],
    fx: row['fx_snapshot'],
    outcome: (row['outcome'] as 'won' | 'lost' | null) ?? null,
    commissionUsd: row['commission_usd'] === null || row['commission_usd'] === undefined
      ? null
      : Number(row['commission_usd']),
    agentName: (row['agent_name'] as string | undefined) ?? null,
    costUsd: Number(row['cost_usd']),
    marginUsd: Number(row['margin_usd']),
    clientTotalUsd: Number(row['client_total_usd']),
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}
