import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * scrypt из стандартной библиотеки Node: никаких нативных зависимостей,
 * а значит образ собирается без компилятора и не ломается при обновлении Node.
 * Параметры — рекомендованные OWASP для интерактивного логина.
 */
const PARAMS = { N: 2 ** 16, r: 8, p: 1, maxmem: 128 * 2 ** 16 * 8 * 2 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(normalize(plain), salt, KEY_LENGTH, PARAMS);
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(saltRaw ?? '', 'base64url');
  const expected = Buffer.from(hashRaw ?? '', 'base64url');
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await scrypt(normalize(plain), salt, expected.length, {
    N,
    r,
    p,
    maxmem: 128 * N * r * 2,
  });

  // Длины совпадают по построению, но timingSafeEqual падает при расхождении
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** NFKC — чтобы визуально одинаковые пароли из разных раскладок совпадали. */
function normalize(password: string): string {
  return password.normalize('NFKC');
}
