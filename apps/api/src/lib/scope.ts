import { can, type Role } from '@avtoklyuch/shared';

/**
 * Чьи записи видит пользователь.
 *
 * Право `viewOthersWork` было объявлено в roles.ts с самого начала, но до
 * запросов не доезжало: фильтр стоял только на роли агента, и менеджер видел
 * всех клиентов и все сделки компании. Объявленное право, которое никто не
 * проверяет, хуже отсутствующего — на него полагаются, рассчитывая на защиту,
 * которой нет.
 *
 * Поэтому условие видимости считается здесь, одной функцией на все таблицы.
 * Разбросанные по роутам сравнения `role === 'agent'` рано или поздно
 * расходятся, и кто-то видит лишнее — ровно это с нами и случилось.
 */
export interface ScopeUser {
  id: string;
  role: Role;
}

/** Имя колонки-владельца или `shared`, если таблица для этой роли общая. */
export type OwnerColumn = string;

export const SHARED: OwnerColumn = 'shared';

export interface OwnerColumns {
  /** Колонка агента. Агент видит строго свои записи. */
  agent: OwnerColumn;
  /** Колонка менеджера. */
  manager: OwnerColumn;
  /**
   * Видны ли менеджеру нераспределённые записи (колонка IS NULL).
   *
   * По умолчанию да: клиент, пришедший с сайта, ещё ничей, и без этого
   * послабления входящий поток не увидел бы никто, кроме администратора.
   * Для таблиц, где владелец NOT NULL (расчёты — там user_id обязателен),
   * передавайте false: ничьих записей не бывает, а лишнее `OR IS NULL`
   * мешает планировщику выбрать индекс.
   */
  managerSeesUnassigned?: boolean;
}

/**
 * Условие видимости для WHERE или null, если ограничивать нечего.
 *
 * Параметр запроса дописывается в переданный массив — нумерация продолжает
 * уже набранные, поэтому вызывать можно в любом месте сборки запроса.
 */
export function ownerScopeSql(
  user: ScopeUser,
  columns: OwnerColumns,
  params: unknown[],
): string | null {
  // Администратору видно всё — он отвечает за компанию целиком
  if (can(user.role, 'viewOthersWork')) return null;

  const column = user.role === 'agent' ? columns.agent : columns.manager;

  // Таблица общая для этой роли: заявки с сайта приходят в единый поток,
  // владельца-менеджера у них нет вовсе
  if (column === SHARED) return null;

  params.push(user.id);
  const n = params.length;

  // Агент видит строго своё: клиенты компании, которых он не приводил, —
  // не его дело, и «ничьи» ему тоже не показываются
  if (user.role === 'agent') return `${column} = $${n}`;

  const seesUnassigned = columns.managerSeesUnassigned ?? true;
  return seesUnassigned ? `(${column} = $${n} OR ${column} IS NULL)` : `${column} = $${n}`;
}

/**
 * Условие «без учебных записей» или null, если скрывать не просили.
 *
 * Учебные данные нужны и на демо-стендах (пустая система ничего не
 * показывает), и на боевом стенде заказчика — он на них учился. Удалять их
 * нельзя: к учебному клиенту уже привязана настоящая сделка. Поэтому они
 * скрываются, а не удаляются, и выключателем служит настройка hide_demo_data.
 *
 * Параметр в запрос не добавляется намеренно: `is_demo` — колонка boolean,
 * сравнивать её не с чем. Значит нумерация $N у вызывающего не сдвигается, и
 * условие можно дописать в любой запрос, не пересчитывая остальные — включая
 * сводку, где позиционные параметры повторяются по десять раз в одном SQL.
 */
export function demoScopeSql(hideDemo: boolean, alias = ''): string | null {
  if (!hideDemo) return null;
  return alias ? `NOT ${alias}.is_demo` : 'NOT is_demo';
}

/**
 * Можно ли пользователю трогать конкретную запись.
 *
 * Для одиночных запросов (открыть сделку, изменить клиента) условие в WHERE
 * неудобно: нужно отличать «нет такой записи» от «не ваша». Снаружи обе
 * ситуации должны выглядеть одинаково — иначе по ответу можно перебором
 * узнать, какие записи существуют у других.
 */
export function ownsRecord(
  user: ScopeUser,
  record: { agentId?: string | null; managerId?: string | null },
): boolean {
  if (can(user.role, 'viewOthersWork')) return true;
  if (user.role === 'agent') return record.agentId === user.id;
  return record.managerId === user.id || record.managerId == null;
}

/**
 * Колонки владельца по таблицам — единственное место, где они перечислены.
 *
 * Алиас передаётся потому, что в разных запросах одна таблица зовётся
 * по-разному; значения по умолчанию совпадают с принятыми в роутах.
 * Пустой алиас — для UPDATE и DELETE, где таблица одна и алиаса нет.
 */
const col = (alias: string, name: string): string => (alias ? `${alias}.${name}` : name);

export const OWNER_OF = {
  clients: (alias = 'c'): OwnerColumns => ({
    agent: col(alias, 'agent_id'),
    manager: col(alias, 'manager_id'),
  }),

  deals: (alias = 'd'): OwnerColumns => ({
    agent: col(alias, 'agent_id'),
    manager: col(alias, 'manager_id'),
  }),

  /**
   * Заявки с сайта — общий входящий поток: колонки менеджера у них нет вовсе.
   * Разбирать их должны все менеджеры, иначе заявка повиснет непрочитанной.
   */
  leads: (alias = 'l'): OwnerColumns => ({
    agent: col(alias, 'agent_id'),
    manager: SHARED,
  }),

  /** В расчётах владелец — автор (user_id, NOT NULL), ничьих не бывает. */
  calculations: (alias = 'c'): OwnerColumns => ({
    agent: col(alias, 'agent_id'),
    manager: col(alias, 'user_id'),
    managerSeesUnassigned: false,
  }),
} as const;
