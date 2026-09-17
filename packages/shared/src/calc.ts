import { round0, round2 } from './money.js';
import {
  LINE_GROUP_COLORS,
  LINE_GROUP_LABELS,
  LINE_GROUP_OF,
  LINE_LABELS,
  LINE_ORDER,
  VEHICLE_KIND_LABELS,
  type CalcInput,
  type CalcLine,
  type CalcResult,
  type CompositionSegment,
  type LineGroup,
  type LineKey,
  type LineSource,
  type ClientLocale,
  CLIENT_STRINGS,
  groupLabel,
} from './types.js';

/**
 * Чистая функция расчёта. Одна и та же и на фронте (мгновенный пересчёт при
 * каждом нажатии клавиши), и на бэкенде (авторитетный пересчёт при сохранении).
 * Никаких обращений к сети и к дате — всё приходит во входных данных.
 */
export function calculate(input: CalcInput): CalcResult {
  const { settings, overrides, deliveryDiscountPercent } = input;
  const disabled = new Set<LineKey>(input.disabled);

  /** Значение строки: ручная правка всегда побеждает. */
  const resolve = (
    key: LineKey,
    base: number | null,
    baseSource: LineSource,
  ): { amount: number; baseAmount: number | null; source: LineSource } => {
    const override = overrides[key];
    if (override !== undefined && override !== null && Number.isFinite(override)) {
      return { amount: round2(override), baseAmount: base === null ? null : round2(base), source: 'manual' };
    }
    return { amount: round2(base ?? 0), baseAmount: base === null ? null : round2(base), source: baseSource };
  };

  const lines: CalcLine[] = [];
  const push = (
    key: LineKey,
    resolved: { amount: number; baseAmount: number | null; source: LineSource },
    opts: { editable?: boolean; internalOnly?: boolean; note?: string | null } = {},
  ) => {
    lines.push({
      key,
      label: LINE_LABELS[key],
      group: LINE_GROUP_OF[key],
      source: resolved.source,
      amount: resolved.amount,
      baseAmount: resolved.baseAmount,
      enabled: !disabled.has(key),
      editable: opts.editable ?? true,
      internalOnly: opts.internalOnly ?? false,
      note: opts.note ?? null,
    });
  };

  // ── Ставка ────────────────────────────────────────────────────────────────
  const bidResolved = resolve('bid', input.bid, 'input');
  push('bid', bidResolved, { editable: true });
  const bid = disabled.has('bid') ? 0 : bidResolved.amount;

  // ── Доставка: тариф, затем персональная скидка менеджера ─────────────────
  const tariffAmount = input.deliveryTariff?.amount ?? null;
  const discountFactor = 1 - deliveryDiscountPercent / 100;
  const discountedDelivery =
    tariffAmount === null ? null : round2(tariffAmount * discountFactor);

  const deliveryNoteParts: string[] = [];
  if (input.deliveryTariff) {
    deliveryNoteParts.push(input.deliveryTariff.label);
  } else {
    deliveryNoteParts.push('тариф не найден — впишите вручную');
  }
  if (deliveryDiscountPercent !== 0 && tariffAmount !== null) {
    const sign = deliveryDiscountPercent > 0 ? '−' : '+';
    deliveryNoteParts.push(
      `тариф $${tariffAmount} · ${sign}${Math.abs(deliveryDiscountPercent)}%`,
    );
  }
  const deliveryResolved = resolve(
    'delivery',
    discountedDelivery,
    tariffAmount === null ? 'manual' : 'tariff',
  );
  push('delivery', deliveryResolved, { note: deliveryNoteParts.join(' · ') });

  // ── Аукционный сбор ───────────────────────────────────────────────────────
  const auctionFeeResolved = resolve(
    'auctionFee',
    input.auctionFeeTariff?.amount ?? null,
    input.auctionFeeTariff ? 'tariff' : 'manual',
  );
  push('auctionFee', auctionFeeResolved, {
    note: input.auctionFeeTariff?.label ?? 'диапазон не найден — впишите вручную',
  });
  const auctionFee = disabled.has('auctionFee') ? 0 : auctionFeeResolved.amount;

  // ── Портовые расходы ──────────────────────────────────────────────────────
  push('portHandling', resolve('portHandling', settings.portHandling, 'settings'), {
    note: 'хендлинг в порту, отдельно от доставки',
  });

  // ── Страховка фрахта: % от ставки ─────────────────────────────────────────
  const insuranceBase = round2((bid * settings.freightInsurancePercent) / 100);
  push('freightInsurance', resolve('freightInsurance', insuranceBase, 'computed'), {
    note: `${fmtPct(settings.freightInsurancePercent)} от ставки`,
  });

  // ── Растаможка ────────────────────────────────────────────────────────────
  const customsResolved = resolve(
    'customs',
    input.customs?.amount ?? null,
    input.customs?.source ?? 'manual',
  );
  push('customs', customsResolved, { note: customsNote(input.customs?.source ?? null) });

  // ── Экологический сбор ────────────────────────────────────────────────────
  push('ecoFee', resolve('ecoFee', settings.ecoFee, 'settings'), {
    note: 'проверьте, не учтён ли он уже внутри растаможки',
  });

  // ── Услуги компании ───────────────────────────────────────────────────────
  push('complex', resolve('complex', settings.complex, 'settings'));
  push('certification', resolve('certification', settings.certification, 'settings'));
  push('commission', resolve('commission', settings.commission, 'settings'));

  // ── Swift: % от (ставка + аукционный сбор) ───────────────────────────────
  const swiftBase = round2(((bid + auctionFee) * settings.swiftPercent) / 100);
  push('swift', resolve('swift', swiftBase, 'computed'), {
    note: `${fmtPct(settings.swiftPercent)} от (ставка + сбор)`,
  });

  // ── Маржа: только для сотрудников, в карточку клиента не выводится ───────
  push('margin', resolve('margin', settings.marginDefault, 'settings'), {
    internalOnly: true,
    note: 'не попадает в карточку клиента',
  });

  // ── Итоги ─────────────────────────────────────────────────────────────────
  const byKey = new Map(lines.map((l) => [l.key, l]));
  const active = (key: LineKey): number => {
    const line = byKey.get(key);
    return line && line.enabled ? line.amount : 0;
  };

  const cost = round2(
    LINE_ORDER.filter((k) => k !== 'margin').reduce((sum, k) => sum + active(k), 0),
  );
  const margin = active('margin');
  const clientTotal = round2(cost + margin);

  // ── Состав итоговой суммы: по группам, для сегментированной шкалы ─────────
  const groupTotals = new Map<LineGroup, number>();
  for (const line of lines) {
    if (!line.enabled) continue;
    groupTotals.set(line.group, round2((groupTotals.get(line.group) ?? 0) + line.amount));
  }

  const denominator = clientTotal > 0 ? clientTotal : 1;
  const composition: CompositionSegment[] = (
    ['bid', 'deliveryAndFees', 'customs', 'services'] as LineGroup[]
  )
    .map((group) => {
      const amount = groupTotals.get(group) ?? 0;
      return {
        group,
        label: LINE_GROUP_LABELS[group],
        amount,
        percent: round2((amount / denominator) * 100),
        color: LINE_GROUP_COLORS[group],
      };
    })
    .filter((segment) => segment.amount > 0);

  const clientBreakdown = composition.map((segment) => ({
    group: segment.group,
    label: LINE_GROUP_LABELS[segment.group],
    amount: segment.amount,
  }));

  return { lines, cost, margin, clientTotal, composition, clientBreakdown };
}

function fmtPct(value: number): string {
  return `${String(value).replace('.', ',')}%`;
}

function customsNote(source: LineSource | null): string {
  switch (source) {
    case 'api':
      return 'baza-gai.com.ua · актуальный ответ';
    case 'api-cached':
      return 'baza-gai.com.ua · не обновлено, показан последний успешный ответ';
    case 'estimate':
      return 'оценка по локальной формуле — API недоступен, проверьте перед отправкой клиенту';
    default:
      return 'впишите вручную';
  }
}

/**
 * Текстовая разбивка для кнопки «Скопировать» — то, что менеджер кидает
 * клиенту в мессенджер, если скриншот не нужен. Язык тот же, что и
 * у карточки клиента.
 */
export function breakdownToText(
  result: CalcResult,
  lot: { makeModel: string | null; year: number | null },
  locale: ClientLocale = 'uk',
): string {
  const t = CLIENT_STRINGS[locale];
  const head = [lot.makeModel, lot.year].filter(Boolean).join(' · ');
  const rows = result.clientBreakdown.map(
    (row) => `${groupLabel(row.group, locale)}: $${formatPlain(row.amount)}`,
  );
  return [
    head || t.offerTitle,
    ...rows,
    '—'.repeat(20),
    `${t.total}: $${formatPlain(result.clientTotal)}`,
  ].join('\n');
}

function formatPlain(value: number): string {
  return round0(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Подбор тарифа доставки под лот. Возвращает и человекочитаемую подпись. */
export function findDeliveryTariff<
  T extends { platform: string; location: string; vehicleKind: string; amountUsd: number; isActive: boolean },
>(
  tariffs: T[],
  lot: { platform: string; location: string; vehicleKind: string },
): { amount: number; label: string } | null {
  const match = tariffs.find(
    (t) =>
      t.isActive &&
      t.platform === lot.platform &&
      normalize(t.location) === normalize(lot.location) &&
      t.vehicleKind === lot.vehicleKind,
  );
  if (!match) return null;
  const kindLabel =
    VEHICLE_KIND_LABELS[lot.vehicleKind as keyof typeof VEHICLE_KIND_LABELS] ?? lot.vehicleKind;
  return { amount: match.amountUsd, label: `${match.location}, ${kindLabel.toLowerCase()}` };
}

/** Подбор аукционного сбора по площадке и диапазону ставки. */
export function findAuctionFee<
  T extends {
    platform: string;
    bidFrom: number;
    bidTo: number | null;
    feeAmount: number;
    feePercent: number;
    isActive: boolean;
  },
>(
  tariffs: T[],
  lot: { platform: string },
  bid: number,
): { amount: number; label: string } | null {
  const match = tariffs.find(
    (t) =>
      t.isActive &&
      t.platform === lot.platform &&
      bid >= t.bidFrom &&
      (t.bidTo === null || bid < t.bidTo),
  );
  if (!match) return null;
  const amount = round2(match.feeAmount + (bid * match.feePercent) / 100);
  const range =
    match.bidTo === null
      ? `от $${formatPlain(match.bidFrom)}`
      : `$${formatPlain(match.bidFrom)}–$${formatPlain(match.bidTo)}`;
  const percentPart = match.feePercent > 0 ? ` + ${fmtPct(match.feePercent)}` : '';
  return { amount, label: `${range}${percentPart}` };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
