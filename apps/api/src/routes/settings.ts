import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin, requirePermission } from '../lib/auth.js';
import {
  getSettings,
  isDemoHidden,
  setDemoHidden,
  updateSettings,
} from '../services/settings.js';

const patchSchema = z.object({
  complex: z.number().nonnegative().optional(),
  certification: z.number().nonnegative().optional(),
  commission: z.number().nonnegative().optional(),
  swiftPercent: z.number().nonnegative().max(100).optional(),
  freightInsurancePercent: z.number().nonnegative().max(100).optional(),
  portHandling: z.number().nonnegative().optional(),
  ecoFee: z.number().nonnegative().optional(),
  marginDefault: z.number().optional(),
});

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  /*
   * Настройки содержат маржу по умолчанию и внутренние суммы компании.
   * Агенту они не показываются: расчёт для него всё равно считается на
   * сервере, а знать нашу экономику ему незачем.
   */
  app.get('/', { preHandler: requirePermission('viewInternals') }, async () => ({
    settings: await getSettings(),
    hideDemoData: await isDemoHidden(),
  }));

  app.patch('/', { preHandler: requireAdmin }, async (request) => {
    const patch = patchSchema.parse(request.body);
    const settings = await updateSettings(patch, request.user!);
    return { settings };
  });

  /*
   * Видимость учебных данных — отдельный маршрут, а не ещё одно поле в
   * patchSchema: там числа калькулятора, здесь переключатель интерфейса, и
   * смешивать их в одном обработчике значит каждый раз выяснять, какие поля
   * из присланного относятся к деньгам, а какие нет.
   *
   * Право manageSettings, а не проверка роли: роли меняются, право остаётся.
   */
  app.patch(
    '/demo-visibility',
    { preHandler: requirePermission('manageSettings') },
    async (request) => {
      const body = z.object({ hideDemoData: z.boolean() }).parse(request.body);
      return { hideDemoData: await setDemoHidden(body.hideDemoData, request.user!) };
    },
  );
}
