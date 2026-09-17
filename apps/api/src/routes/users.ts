import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool, query, queryOne } from '../db/pool.js';
import { requireAdmin } from '../lib/auth.js';
import { conflict, notFound } from '../lib/errors.js';
import { hashPassword } from '../lib/password.js';
import { logChange, logFieldDiff } from '../services/changelog.js';

const createSchema = z.object({
  login: z
    .string()
    .min(3, 'Логин не короче 3 символов')
    .max(60)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Только латиница, цифры, точка, дефис и подчёркивание'),
  fullName: z.string().min(2, 'Укажите имя').max(120),
  password: z.string().min(8, 'Пароль не короче 8 символов').max(200),
  role: z.enum(['admin', 'manager']).default('manager'),
  deliveryDiscountPercent: z.number().min(-100).max(100).default(0),
});

const updateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  role: z.enum(['admin', 'manager']).optional(),
  deliveryDiscountPercent: z.number().min(-100).max(100).optional(),
  isActive: z.boolean().optional(),
  /** Сброс пароля администратором */
  password: z.string().min(8).max(200).optional(),
});

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/', async () => {
    const rows = await query<Record<string, unknown>>(
      `SELECT id, login, full_name, role, delivery_discount_percent, is_active, created_at
         FROM users ORDER BY role, full_name`,
    );
    return { items: rows.map(mapUser) };
  });

  app.post('/', async (request, reply) => {
    const body = createSchema.parse(request.body);
    const actor = request.user!;

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE lower(login) = lower($1)',
      [body.login],
    );
    if (existing) throw conflict('Такой логин уже занят');

    const row = await queryOne<Record<string, unknown>>(
      `INSERT INTO users (login, full_name, password_hash, role, delivery_discount_percent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, login, full_name, role, delivery_discount_percent, is_active, created_at`,
      [
        body.login,
        body.fullName,
        await hashPassword(body.password),
        body.role,
        body.deliveryDiscountPercent,
      ],
    );

    await logChange({
      entity: 'user',
      entityId: String(row!['id']),
      entityLabel: `Пользователь ${body.fullName}`,
      action: 'create',
      field: 'role',
      oldValue: null,
      newValue: body.role,
      userId: actor.id,
      userName: actor.fullName,
    });

    reply.code(201);
    return { item: mapUser(row!) };
  });

  app.patch('/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const actor = request.user!;

    const before = await queryOne<Record<string, unknown>>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    if (!before) throw notFound('Пользователь не найден');

    // Последнего активного администратора нельзя разжаловать или отключить —
    // иначе в систему больше никто не войдёт.
    const losesAdmin =
      (body.role !== undefined && body.role !== 'admin') || body.isActive === false;
    if (before['role'] === 'admin' && losesAdmin) {
      const others = await queryOne<{ count: number }>(
        `SELECT count(*)::int AS count FROM users
          WHERE role = 'admin' AND is_active AND id <> $1`,
        [id],
      );
      if ((others?.count ?? 0) === 0) {
        throw conflict('Это последний активный администратор — сначала назначьте другого');
      }
    }

    const next = {
      fullName: body.fullName ?? before['full_name'],
      role: body.role ?? before['role'],
      deliveryDiscountPercent:
        body.deliveryDiscountPercent ?? Number(before['delivery_discount_percent']),
      isActive: body.isActive ?? before['is_active'],
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (body.password) {
        // Смена пароля гасит все выданные пользователю токены
        await client.query(
          `UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2`,
          [await hashPassword(body.password), id],
        );
        await logChange(
          {
            entity: 'user',
            entityId: id,
            entityLabel: `Пользователь ${next.fullName}`,
            action: 'update',
            field: 'password',
            oldValue: '••••••',
            newValue: 'сброшен администратором',
            userId: actor.id,
            userName: actor.fullName,
          },
          client,
        );
      }

      // Деактивация тоже должна немедленно выкидывать из системы
      const bumpVersion = body.isActive === false;
      await client.query(
        `UPDATE users
            SET full_name = $1, role = $2, delivery_discount_percent = $3, is_active = $4,
                token_version = token_version + $5, updated_at = now()
          WHERE id = $6`,
        [next.fullName, next.role, next.deliveryDiscountPercent, next.isActive, bumpVersion ? 1 : 0, id],
      );

      await logFieldDiff(
        {
          entity: 'user',
          entityId: id,
          entityLabel: `Пользователь ${next.fullName}`,
          userId: actor.id,
          userName: actor.fullName,
        },
        {
          fullName: before['full_name'],
          role: before['role'],
          deliveryDiscountPercent: Number(before['delivery_discount_percent']),
          isActive: before['is_active'],
        },
        next,
        ['fullName', 'role', 'deliveryDiscountPercent', 'isActive'],
        client,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const updated = await queryOne<Record<string, unknown>>(
      `SELECT id, login, full_name, role, delivery_discount_percent, is_active, created_at
         FROM users WHERE id = $1`,
      [id],
    );
    return { item: mapUser(updated!) };
  });
}

function mapUser(row: Record<string, unknown>) {
  return {
    id: row['id'] as string,
    login: row['login'] as string,
    fullName: row['full_name'] as string,
    role: row['role'] as 'admin' | 'manager',
    deliveryDiscountPercent: Number(row['delivery_discount_percent']),
    isActive: Boolean(row['is_active']),
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}
