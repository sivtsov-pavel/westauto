import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { calculate, findAuctionFee, findDeliveryTariff } from './calc.js';
import { estimateCustoms } from './customs-estimate.js';
import { formatMoney, parseMoneyInput } from './money.js';
import { DEFAULT_SETTINGS, type CalcInput, type LotInfo } from './types.js';

const lot: LotInfo = {
  lotNumber: '47281905',
  vin: null,
  makeModel: 'Tesla Model 3',
  year: 2021,
  engineVolume: null,
  batteryPower: 75,
  fuel: 'electric',
  platform: 'copart',
  location: 'Texas',
  vehicleKind: 'sedan',
};

function baseInput(over: Partial<CalcInput> = {}): CalcInput {
  return {
    lot,
    bid: 14200,
    deliveryTariff: { amount: 1640, label: 'Texas, седан' },
    auctionFeeTariff: { amount: 540, label: '$10 000–$20 000' },
    customs: { amount: 2480, source: 'api' },
    deliveryDiscountPercent: 0,
    settings: { ...DEFAULT_SETTINGS, freightInsurancePercent: 0 },
    overrides: {},
    disabled: [],
    ...over,
  };
}

test('складывает все строки в себестоимость', () => {
  const r = calculate(baseInput());
  // 14200 + 1640 + 540 + 0 портовые + 0 страховка + 2480 + 0 эко
  // + 180 + 150 + 280 + swift 1.5% от (14200+540)=221.1
  assert.equal(r.cost, 19691.1);
  assert.equal(r.margin, 0);
  assert.equal(r.clientTotal, 19691.1);
});

test('персональная скидка менеджера уменьшает доставку', () => {
  const r = calculate(baseInput({ deliveryDiscountPercent: 5 }));
  const delivery = r.lines.find((l) => l.key === 'delivery');
  assert.equal(delivery?.amount, 1558); // 1640 − 5%
  assert.equal(delivery?.source, 'tariff');
  assert.match(delivery?.note ?? '', /−5%/);
});

test('наценка (отрицательная скидка) увеличивает доставку', () => {
  const r = calculate(baseInput({ deliveryDiscountPercent: -10 }));
  assert.equal(r.lines.find((l) => l.key === 'delivery')?.amount, 1804);
});

test('ручная правка побеждает тариф и помечается как manual', () => {
  const r = calculate(baseInput({ overrides: { delivery: 1900 } }));
  const delivery = r.lines.find((l) => l.key === 'delivery');
  assert.equal(delivery?.amount, 1900);
  assert.equal(delivery?.source, 'manual');
  assert.equal(delivery?.baseAmount, 1640, 'базовое значение сохраняется для «было → стало»');
});

test('выключенная строка не попадает в итог', () => {
  const withInsurance = baseInput({
    settings: { ...DEFAULT_SETTINGS, freightInsurancePercent: 1.5 },
  });
  const on = calculate(withInsurance);
  const off = calculate({ ...withInsurance, disabled: ['freightInsurance'] });
  assert.equal(on.clientTotal - off.clientTotal, 213); // 1.5% от 14200
  assert.equal(off.lines.find((l) => l.key === 'freightInsurance')?.enabled, false);
});

test('swift считается от ставки плюс аукционный сбор', () => {
  const r = calculate(baseInput());
  assert.equal(r.lines.find((l) => l.key === 'swift')?.amount, 221.1);
});

test('маржа не входит в себестоимость, но входит в цену клиенту', () => {
  const r = calculate(
    baseInput({ settings: { ...DEFAULT_SETTINGS, freightInsurancePercent: 0, marginDefault: 800 } }),
  );
  assert.equal(r.cost, 19691.1);
  assert.equal(r.margin, 800);
  assert.equal(r.clientTotal, 20491.1);
});

test('маржа помечена internalOnly и не видна в клиентской разбивке', () => {
  const r = calculate(
    baseInput({ settings: { ...DEFAULT_SETTINGS, freightInsurancePercent: 0, marginDefault: 800 } }),
  );
  assert.equal(r.lines.find((l) => l.key === 'margin')?.internalOnly, true);
  const labels = r.clientBreakdown.map((b) => b.label);
  assert.ok(!labels.includes('Маржа'));
  // но сумма клиенту сходится: сумма групп = цена клиенту
  const sum = r.clientBreakdown.reduce((s, b) => s + b.amount, 0);
  assert.equal(Math.round(sum * 100) / 100, r.clientTotal);
});

test('состав итога в процентах сходится к 100', () => {
  const r = calculate(baseInput());
  const total = r.composition.reduce((s, c) => s + c.percent, 0);
  assert.ok(Math.abs(total - 100) < 0.05, `получили ${total}`);
});

test('нет тарифа — строка пустая, но расчёт не падает', () => {
  const r = calculate(baseInput({ deliveryTariff: null, auctionFeeTariff: null, customs: null }));
  assert.equal(r.lines.find((l) => l.key === 'delivery')?.amount, 0);
  assert.match(r.lines.find((l) => l.key === 'delivery')?.note ?? '', /вручную/);
  assert.ok(Number.isFinite(r.clientTotal));
});

test('подбор тарифа доставки по площадке, локации и виду авто', () => {
  const tariffs = [
    { platform: 'copart', location: 'Texas', vehicleKind: 'sedan', amountUsd: 1640, isActive: true },
    { platform: 'copart', location: 'Texas', vehicleKind: 'suv', amountUsd: 1890, isActive: true },
  ];
  assert.equal(
    findDeliveryTariff(tariffs, { platform: 'copart', location: ' texas ', vehicleKind: 'suv' })?.amount,
    1890,
  );
  assert.equal(
    findDeliveryTariff(tariffs, { platform: 'iaai', location: 'Texas', vehicleKind: 'suv' }),
    null,
  );
});

test('аукционный сбор выбирается по диапазону ставки', () => {
  const fees = [
    { platform: 'copart', bidFrom: 0, bidTo: 10000, feeAmount: 400, feePercent: 0, isActive: true },
    { platform: 'copart', bidFrom: 10000, bidTo: null, feeAmount: 540, feePercent: 0, isActive: true },
  ];
  assert.equal(findAuctionFee(fees, { platform: 'copart' }, 5000)?.amount, 400);
  assert.equal(findAuctionFee(fees, { platform: 'copart' }, 14200)?.amount, 540);
  assert.equal(findAuctionFee(fees, { platform: 'copart' }, 10000)?.amount, 540, 'границы не пересекаются');
});

test('оценка растаможки для электро считает акциз от ёмкости батареи', () => {
  const q = estimateCustoms(
    { carType: 'electric', price: 14200, currency: 'USD', power: 75 },
    { currentYear: 2026, usdUah: 41.5, eurUah: 45 },
  );
  assert.equal(q.source, 'estimate');
  assert.ok(q.warning);
  assert.equal(q.duty, 1420); // 10%
  assert.ok(q.excise > 0 && q.excise < 200, `акциз ${q.excise}`);
  assert.ok(q.nds > 3000);
});

test('форматирование и разбор денег', () => {
  assert.equal(formatMoney(19690), '$19 690');
  assert.equal(formatMoney(-120), '−$120');
  assert.equal(parseMoneyInput('$14 200'), 14200);
  assert.equal(parseMoneyInput('14,5'), 14.5);
  assert.equal(parseMoneyInput('абв'), null);
});
