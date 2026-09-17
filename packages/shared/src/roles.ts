/**
 * Роли и права.
 *
 * Агент — партнёр, который приводит клиентов. От менеджера он отличается
 * не объёмом прав, а тем, ЧТО ему видно: агент не должен знать закупочные
 * тарифы, маржу и себестоимость. Узнав внутреннюю кухню, он перестанет
 * нуждаться в компании.
 *
 * Права собраны в одном месте намеренно: разбросанные по коду проверки
 * `role === 'admin'` рано или поздно расходятся, и кто-то видит лишнее.
 */

export type Role = 'admin' | 'manager' | 'agent';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  agent: 'Агент',
};

export interface Permissions {
  /** Править тарифы, настройки и пользователей */
  manageSettings: boolean;
  /** Видеть таблицы тарифов и журнал правок */
  viewTariffs: boolean;
  /** Видеть маржу, себестоимость и источники значений строк */
  viewInternals: boolean;
  /** Видеть чужие расчёты и заявки */
  viewOthersWork: boolean;
  /** Управлять витриной сайта */
  manageShowcase: boolean;
  /** Вести наблюдение за лотами */
  useWatchlist: boolean;
  /** Видеть своё вознаграждение */
  viewCommission: boolean;
}

const PERMISSIONS: Record<Role, Permissions> = {
  admin: {
    manageSettings: true,
    viewTariffs: true,
    viewInternals: true,
    viewOthersWork: true,
    manageShowcase: true,
    useWatchlist: true,
    viewCommission: false,
  },
  manager: {
    manageSettings: false,
    viewTariffs: true,
    viewInternals: true,
    viewOthersWork: false,
    manageShowcase: true,
    useWatchlist: true,
    viewCommission: false,
  },
  agent: {
    manageSettings: false,
    // Закупочные тарифы — коммерческая тайна компании
    viewTariffs: false,
    // Маржа и себестоимость агенту не показываются никогда
    viewInternals: false,
    viewOthersWork: false,
    manageShowcase: false,
    useWatchlist: false,
    viewCommission: true,
  },
};

export function can(role: Role, permission: keyof Permissions): boolean {
  return PERMISSIONS[role][permission];
}

export function permissionsFor(role: Role): Permissions {
  return PERMISSIONS[role];
}

// ─── Вознаграждение агента ───────────────────────────────────────────────────

export type CommissionType = 'fixed' | 'percent_of_margin';

export const COMMISSION_LABELS: Record<CommissionType, string> = {
  fixed: 'Фиксированная сумма за авто',
  percent_of_margin: 'Процент от маржи компании',
};

export interface AgentTerms {
  commissionType: CommissionType;
  commissionValue: number;
}

/**
 * Сколько агент заработал на конкретной сделке.
 *
 * Считается один раз — в момент, когда сделка отмечена выигранной, — и
 * записывается в расчёт. Если условия агента потом поменяются, уже
 * начисленное вознаграждение не должно переписываться задним числом.
 */
export function calculateCommission(terms: AgentTerms, marginUsd: number): number {
  if (terms.commissionValue <= 0) return 0;

  if (terms.commissionType === 'fixed') {
    return round2(terms.commissionValue);
  }

  // Процент от маржи. Отрицательная маржа вознаграждения не порождает:
  // агент не должен платить компании за убыточную сделку.
  if (marginUsd <= 0) return 0;
  return round2((marginUsd * terms.commissionValue) / 100);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Реферальная метка: латиница, цифры, дефис. Из имени — транслитом. */
export function normalizeReferralCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}
