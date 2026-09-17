import type { FastifyReply, FastifyRequest } from 'fastify';
import { SignJWT, jwtVerify } from 'jose';
import { can, type Permissions, type Role } from '@avtoklyuch/shared';
import { queryOne } from '../db/pool.js';
import { config, isProduction } from './env.js';
import { HttpError } from './errors.js';

const SECRET = new TextEncoder().encode(config.JWT_SECRET);
const ISSUER = 'avtoklyuch';
export const SESSION_COOKIE = 'avk_session';

export interface SessionUser {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  deliveryDiscountPercent: number;
}

interface TokenClaims {
  sub: string;
  ver: number;
}

export async function issueSession(
  reply: FastifyReply,
  user: { id: string; tokenVersion: number },
): Promise<void> {
  const token = await new SignJWT({ ver: user.tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${config.SESSION_TTL_HOURS}h`)
    .sign(SECRET);

  reply.setCookie(SESSION_COOKIE, token, {
    // httpOnly: токен недоступен из JS, значит XSS не уводит сессию
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: config.SESSION_TTL_HOURS * 3600,
  });
}

export function clearSession(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

/**
 * Проверяет токен и сверяет token_version с базой: смена пароля или
 * деактивация пользователя гасит все ранее выданные токены немедленно,
 * не дожидаясь истечения срока.
 */
export async function resolveSession(
  request: FastifyRequest,
): Promise<SessionUser | null> {
  const raw = request.cookies[SESSION_COOKIE];
  if (!raw) return null;

  let claims: TokenClaims;
  try {
    const { payload } = await jwtVerify(raw, SECRET, { issuer: ISSUER });
    claims = { sub: String(payload.sub), ver: Number(payload.ver) };
  } catch {
    return null;
  }

  const row = await queryOne<{
    id: string;
    login: string;
    full_name: string;
    role: Role;
    delivery_discount_percent: number;
    token_version: number;
    is_active: boolean;
  }>(
    `SELECT id, login, full_name, role, delivery_discount_percent, token_version, is_active
       FROM users WHERE id = $1`,
    [claims.sub],
  );

  if (!row || !row.is_active || row.token_version !== claims.ver) return null;

  return {
    id: row.id,
    login: row.login,
    fullName: row.full_name,
    role: row.role,
    deliveryDiscountPercent: row.delivery_discount_percent,
  };
}

/** Хук для защищённых маршрутов: кладёт пользователя в request.user. */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const user = await resolveSession(request);
  if (!user) throw new HttpError(401, 'Нужно войти в систему');
  request.user = user;
}

/**
 * Хук, требующий конкретного права. Проверка одна на все маршруты —
 * разбросанные по коду сравнения `role === 'admin'` рано или поздно
 * расходятся, и кто-то видит лишнее.
 */
export function requirePermission(permission: keyof Permissions) {
  return async function check(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await requireAuth(request, reply);
    if (!can(request.user!.role, permission)) {
      throw new HttpError(403, 'Недостаточно прав для этого раздела');
    }
  };
}

/** Хук поверх requireAuth: только для администратора. */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  if (request.user?.role !== 'admin') {
    throw new HttpError(403, 'Доступ только для администратора');
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}
