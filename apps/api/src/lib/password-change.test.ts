import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { assertPasswordChanged } from './password-policy.js';
import { HttpError } from './errors.js';

const settled = { mustChangePassword: false };
const pending = { mustChangePassword: true };

test('сменивший пароль ходит куда угодно', () => {
  assertPasswordChanged({ url: '/api/deals' }, settled);
  assertPasswordChanged({ url: '/api/settings' }, settled);
});

test('не сменивший не попадает в рабочие разделы', () => {
  for (const url of ['/api/deals', '/api/clients', '/api/settings', '/api/users']) {
    assert.throws(
      () => assertPasswordChanged({ url }, pending),
      (error: unknown) => {
        assert.ok(error instanceof HttpError);
        assert.equal(error.statusCode, 403);
        // Интерфейс опознаёт случай по коду, а не по тексту сообщения
        assert.deepEqual(error.details, { code: 'password_change_required' });
        return true;
      },
      `${url} должен быть закрыт`,
    );
  }
});

test('смена пароля и выход остаются доступны — иначе выйти из тупика нечем', () => {
  assertPasswordChanged({ url: '/api/auth/change-password' }, pending);
  assertPasswordChanged({ url: '/api/auth/logout' }, pending);
  assertPasswordChanged({ url: '/api/auth/me' }, pending);
});

test('строка запроса не обходит проверку', () => {
  // Путь сравнивается без параметров: иначе «/api/deals?x=1» прошёл бы мимо
  assert.throws(() => assertPasswordChanged({ url: '/api/deals?stage=lead' }, pending), HttpError);
  assertPasswordChanged({ url: '/api/auth/change-password?from=login' }, pending);
});
