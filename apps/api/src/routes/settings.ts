import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin, requirePermission } from '../lib/auth.js';
import { getSettings, updateSettings } from '../services/settings.js';

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
  }));

  app.patch('/', { preHandler: requireAdmin }, async (request) => {
    const patch = patchSchema.parse(request.body);
    const settings = await updateSettings(patch, request.user!);
    return { settings };
  });
}
