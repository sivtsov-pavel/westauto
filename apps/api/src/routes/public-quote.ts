import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  calculate,
  carTypeFor,
  findAuctionFee,
  findDeliveryTariff,
  groupLabel,
  type ClientLocale,
  type LotInfo,
} from '@avtoklyuch/shared';
import { query } from '../db/pool.js';
import { getCustomsQuote } from '../services/customs.js';
import { getFxRates } from '../services/fx.js';
import { getSettings } from '../services/settings.js';

/**
 * Публичный калькулятор для сайта.
 *
 * Отвечает на главный вопрос посетителя — «сколько выйдет под ключ» — не
 * заставляя его звонить. Это самый сильный инструмент превращения
 * посетителя в заявку: человек видит честную цифру и уже понимает, о чём
 * говорить с менеджером.
 *
 * Отдаёт РОВНО то же, что клиент видит в карточке расчёта: четыре крупные
 * статьи и итог. Тарифы, ставки доставки, аукционные сборы, маржа и
 * себестоимость наружу не выходят — ответ собирается полем за полем, а не
 * фильтрацией полного расчёта.
 */
const requestSchema = z.object({
  bid: z.number().positive().max(500_000),
  year: z.number().int().min(1990).max(2100),
  fuel: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  engineVolume: z.number().positive().max(10).nullable().default(null),
  batteryPower: z.number().positive().max(300).nullable().default(null),
  platform: z.enum(['copart', 'iaai']).default('copart'),
  location: z.string().max(120).default(''),
  vehicleKind: z.enum(['sedan', 'suv', 'pickup', 'coupe', 'minivan']).default('sedan'),
  locale: z.enum(['uk', 'ru', 'en']).default('uk'),
});

export async function publicQuoteRoutes(app: FastifyInstance): Promise<void> {
  /** Список локаций для выпадающего списка — без цен. */
  app.get('/locations', async () => {
    const rows = await query<{ platform: string; location: string }>(
      `SELECT DISTINCT platform, location FROM delivery_tariffs
        WHERE is_active AND location <> '' ORDER BY platform, location`,
    );
    return { items: rows };
  });

  app.post('/', {
    // Считаем щедро, но не даём выкачивать тарифы перебором
    config: { rateLimit: { max: 30, timeWindow: '5 minutes' } },
    handler: async (request) => {
      const body = requestSchema.parse(request.body);

      const lot: LotInfo = {
        lotNumber: null,
        vin: null,
        makeModel: null,
        year: body.year,
        engineVolume: body.engineVolume,
        batteryPower: body.batteryPower,
        fuel: body.fuel,
        platform: body.platform,
        location: body.location,
        vehicleKind: body.vehicleKind,
      };

      const [settings, deliveryRows, auctionRows, fx] = await Promise.all([
        getSettings(),
        query<Record<string, unknown>>(
          `SELECT platform, location, vehicle_kind, amount_usd, is_active
             FROM delivery_tariffs WHERE is_active`,
        ),
        query<Record<string, unknown>>(
          `SELECT platform, bid_from, bid_to, fee_amount, fee_percent, is_active
             FROM auction_fee_tariffs WHERE is_active`,
        ),
        getFxRates(),
      ]);

      const customs = await getCustomsQuote({
        carType: carTypeFor(body.fuel, body.vehicleKind),
        price: body.bid,
        currency: 'USD',
        volume: body.engineVolume,
        motor: body.fuel === 'diesel' ? 'diesel' : 'petrol',
        year: body.year,
        power: body.batteryPower,
      });

      const result = calculate({
        lot,
        bid: body.bid,
        deliveryTariff: findDeliveryTariff(
          deliveryRows.map((r) => ({
            platform: String(r['platform']),
            location: String(r['location']),
            vehicleKind: String(r['vehicle_kind']),
            amountUsd: Number(r['amount_usd']),
            isActive: true,
          })),
          lot,
        ),
        auctionFeeTariff: findAuctionFee(
          auctionRows.map((r) => ({
            platform: String(r['platform']),
            bidFrom: Number(r['bid_from']),
            bidTo: r['bid_to'] === null ? null : Number(r['bid_to']),
            feeAmount: Number(r['fee_amount']),
            feePercent: Number(r['fee_percent']),
            isActive: true,
          })),
          lot,
          body.bid,
        ),
        customs: { amount: customs.totalFees, source: customs.source },
        // Публичный расчёт идёт без чьей-либо персональной скидки
        deliveryDiscountPercent: 0,
        settings,
        overrides: {},
        // Маржа — внутреннее дело компании, в публичный расчёт не входит
        disabled: ['margin'],
      });

      /* ClientLocale знает только ru и uk — подписи статей существуют в
         этих двух языках. Для английской версии сайта берём украинские:
         показать «Ставка» уместнее, чем пустую строку. */
      const locale: ClientLocale = body.locale === 'ru' ? 'ru' : 'uk';

      return {
        breakdown: result.clientBreakdown.map((line) => ({
          label: groupLabel(line.group, locale),
          group: line.group,
          amount: Math.round(line.amount),
        })),
        total: Math.round(result.clientTotal),
        totalUah: Math.round(result.clientTotal * fx.usdUah),
        usdUah: fx.usdUah,
        /* Оценочный режим честно помечаем: посетитель должен понимать,
           что точную цифру подтвердит менеджер */
        approximate: customs.source !== 'api',
      };
    },
  });
}
