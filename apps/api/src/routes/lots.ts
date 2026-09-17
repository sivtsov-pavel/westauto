import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { classifyIdentifier, fetchLot, isLotFetcherEnabled } from '../services/lot-fetcher/index.js';

export async function lotRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  /**
   * «Подтянуть данные». Никогда не отвечает ошибкой: если не вышло —
   * возвращает ok: false с текстом, интерфейс предлагает ручной ввод.
   */
  app.post('/fetch', {
    config: {
      // Площадки не любят частых обращений — и нам незачем
      rateLimit: { max: 20, timeWindow: '1 minute' },
    },
    handler: async (request) => {
      const body = z
        .object({
          identifier: z.string().min(1).max(40),
          platform: z.enum(['copart', 'iaai', 'copart_uk', 'copart_ca', 'iaai_ca', 'manheim']).nullable().default(null),
        })
        .parse(request.body);

      const kind = classifyIdentifier(body.identifier);
      const result = await fetchLot(body);

      if (!result.ok) {
        return {
          ok: false as const,
          identifierKind: kind,
          message: result.reason,
          hint: 'Не удалось получить автоматически, заполните поля вручную',
        };
      }

      return { ok: true as const, identifierKind: kind, data: result.data, source: result.source };
    },
  });

  app.get('/status', async () => ({
    enabled: isLotFetcherEnabled(),
  }));
}
