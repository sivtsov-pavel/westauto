import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { OWNER_OF, ownerScopeSql, type ScopeUser } from './scope.js';

const admin: ScopeUser = { id: 'u-admin', role: 'admin' };
const manager: ScopeUser = { id: 'u-manager', role: 'manager' };
const agent: ScopeUser = { id: 'u-agent', role: 'agent' };

/** Колонки владельца как у таблиц clients и deals. */
const bothColumns = { agent: 'c.agent_id', manager: 'c.manager_id' } as const;

test('администратор видит всё — условия нет', () => {
  const params: unknown[] = [];
  assert.equal(ownerScopeSql(admin, bothColumns, params), null);
  assert.deepEqual(params, [], 'параметры не добавляются');
});

test('агент видит строго свои записи', () => {
  const params: unknown[] = [];
  const sql = ownerScopeSql(agent, bothColumns, params);

  assert.equal(sql, 'c.agent_id = $1');
  assert.deepEqual(params, ['u-agent']);
});

test('менеджер видит свои и ничьи, но не чужие', () => {
  const params: unknown[] = [];
  const sql = ownerScopeSql(manager, bothColumns, params);

  // Нераспределённые записи нужны менеджеру: клиент, пришедший с сайта,
  // ещё ничей, и без него входящий поток был бы не виден никому.
  assert.equal(sql, '(c.manager_id = $1 OR c.manager_id IS NULL)');
  assert.deepEqual(params, ['u-manager']);
});

test('номер параметра продолжает уже набранные', () => {
  const params: unknown[] = ['saved', 42];
  const sql = ownerScopeSql(agent, bothColumns, params);

  assert.equal(sql, 'c.agent_id = $3', 'берётся следующий свободный номер');
  assert.deepEqual(params, ['saved', 42, 'u-agent']);
});

test('общая таблица: для роли без своей колонки условия нет', () => {
  const params: unknown[] = [];
  // Заявки с сайта приходят в общий поток: владельца-менеджера у них нет
  const columns = { agent: 'l.agent_id', manager: 'shared' } as const;

  assert.equal(ownerScopeSql(manager, columns, params), null);
  assert.deepEqual(params, []);

  // Агента это не касается — он по-прежнему видит только свои заявки
  assert.equal(ownerScopeSql(agent, columns, params), 'l.agent_id = $1');
  assert.deepEqual(params, ['u-agent']);
});

test('расчёты: у менеджера владелец — автор расчёта', () => {
  const params: unknown[] = [];
  const columns = {
    agent: 'c.agent_id',
    manager: 'c.user_id',
    // user_id в расчётах NOT NULL, ничьих расчётов не бывает — значит и
    // послабления «или ничей» здесь быть не должно
    managerSeesUnassigned: false,
  } as const;

  assert.equal(ownerScopeSql(manager, columns, params), 'c.user_id = $1');
  assert.deepEqual(params, ['u-manager']);
});

test('своё видно каждому: id подставляется именно вызывающего', () => {
  const first: unknown[] = [];
  const second: unknown[] = [];

  ownerScopeSql({ id: 'manager-one', role: 'manager' }, bothColumns, first);
  ownerScopeSql({ id: 'manager-two', role: 'manager' }, bothColumns, second);

  assert.deepEqual(first, ['manager-one']);
  assert.deepEqual(second, ['manager-two']);
});

test('без алиаса колонки идут без точки — для UPDATE и DELETE', () => {
  const params: unknown[] = [];
  const sql = ownerScopeSql(agent, OWNER_OF.clients(''), params);

  assert.equal(sql, 'agent_id = $1');
});

test('карта таблиц: заявки для менеджера общие, расчёты — нет', () => {
  const p1: unknown[] = [];
  assert.equal(ownerScopeSql(manager, OWNER_OF.leads(), p1), null);

  const p2: unknown[] = [];
  assert.equal(ownerScopeSql(manager, OWNER_OF.calculations(), p2), 'c.user_id = $1');
});
