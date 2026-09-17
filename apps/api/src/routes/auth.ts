import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { queryOne } from '../db/pool.js';
import { clearSession, issueSession, requireAuth, resolveSession } from '../lib/auth.js';
import { HttpError } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

const loginSchema = z.object({
  login: z.string().min(1, 'Введите логин').max(120),
  password: z.string().min(1, 'Введите пароль').max(200),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Пароль не короче 8 символов').max(200),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', {
    config: {
      // Перебор паролей режем на уровне маршрута, а не всего API
      rateLimit: { max: 10, timeWindow: '5 minutes' },
    },
    handler: async (request, reply) => {
      const body = loginSchema.parse(request.body);

      const row = await queryOne<{
        id: string;
        login: string;
        full_name: string;
        role: 'admin' | 'manager';
        password_hash: string;
        delivery_discount_percent: number;
        token_version: number;
        is_active: boolean;
      }>(
        `SELECT id, login, full_name, role, password_hash,
                delivery_discount_percent, token_version, is_active
           FROM users WHERE lower(login) = lower($1)`,
        [body.login],
      );

      // Один и тот же текст и время ответа для «нет такого логина» и «пароль
      // не тот» — иначе форма превращается в проверялку существующих логинов.
      const passwordOk = row
        ? await verifyPassword(body.password, row.password_hash)
        : await verifyPassword(body.password, DUMMY_HASH);

      if (!row || !passwordOk || !row.is_active) {
        throw new HttpError(401, 'Неверный логин или пароль');
      }

      await issueSession(reply, { id: row.id, tokenVersion: row.token_version });

      return {
        user: {
          id: row.id,
          login: row.login,
          fullName: row.full_name,
          role: row.role,
          deliveryDiscountPercent: row.delivery_discount_percent,
        },
      };
    },
  });

  app.post('/logout', async (_request, reply) => {
    clearSession(reply);
    return { ok: true };
  });

  app.get('/me', async (request) => {
    const user = await resolveSession(request);
    return { user };
  });

  app.post('/change-password', { preHandler: requireAuth }, async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    const actor = request.user!;

    const row = await queryOne<{ password_hash: string; token_version: number }>(
      'SELECT password_hash, token_version FROM users WHERE id = $1',
      [actor.id],
    );
    if (!row) throw new HttpError(404, 'Пользователь не найден');

    if (!(await verifyPassword(body.currentPassword, row.password_hash))) {
      throw new HttpError(400, 'Текущий пароль указан неверно');
    }

    const hash = await hashPassword(body.newPassword);
    // token_version++ гасит все ранее выданные сессии, включая чужие устройства
    await queryOne(
      `UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = now()
         WHERE id = $2 RETURNING id`,
      [hash, actor.id],
    );

    await issueSession(reply, { id: actor.id, tokenVersion: row.token_version + 1 });
    return { ok: true };
  });
}

/**
 * Хеш заведомо недостижимого пароля. Прогоняем через verify, когда логина не
 * существует, чтобы ответ занимал столько же времени, сколько при реальной
 * проверке, и не выдавал существующие логины по таймингу.
 */
const DUMMY_HASH =
  'scrypt$65536$8$1$AAAAAAAAAAAAAAAAAAAAAA$' +
  'ZHVtbXlfaGFzaF9uZXZlcl9tYXRjaGVzX2FueV9yZWFsX3Bhc3N3b3JkX2lucHV0X3ZhbHVlXw';
