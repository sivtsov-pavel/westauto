import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@avtoklyuch/shared';
import type { DictKey } from '@/content/dict';
import { useI18n } from '@/i18n';
import { ArrowRight } from './Icons';
import { LeadForm } from './LeadForm';

interface Quote {
  breakdown: { label: string; group: string; amount: number }[];
  total: number;
  totalUah: number;
  usdUah: number;
  approximate: boolean;
}

const FUELS = ['petrol', 'diesel', 'hybrid', 'electric'] as const;
const KINDS = ['sedan', 'suv', 'pickup', 'minivan'] as const;

/**
 * Живий калькулятор на сайті.
 *
 * Відповідає на головне питання відвідувача — «скільки вийде під ключ» —
 * не змушуючи телефонувати. Рахує той самий рушій, що й у менеджера, тож
 * цифра на сайті не розійдеться з тією, яку назвуть у розмові.
 *
 * Запит іде із затримкою: людина ще дописує суму, а ми вже не смикаємо
 * сервер на кожну цифру.
 */
export function PublicCalculator() {
  const { t, locale } = useI18n();

  const [bid, setBid] = useState(9000);
  const [year, setYear] = useState(2019);
  const [fuel, setFuel] = useState<(typeof FUELS)[number]>('petrol');
  const [volume, setVolume] = useState(2.0);
  const [battery, setBattery] = useState(60);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('sedan');
  const [location, setLocation] = useState('Texas');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);

  const wantLead = useRef<HTMLDivElement>(null);

  // Список локацій тягнемо один раз — з нього ж беремо тарифи доставки
  useEffect(() => {
    void fetch('/api/public/quote/locations')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: { location: string }[] }) => {
        const unique = [...new Set(d.items.map((i) => i.location))];
        setLocations(unique);
        if (unique.length > 0 && !unique.includes('Texas')) setLocation(unique[0]!);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (bid <= 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setBusy(true);
      setFailed(false);
      void fetch('/api/public/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          bid,
          year,
          fuel,
          engineVolume: fuel === 'electric' ? null : volume,
          batteryPower: fuel === 'electric' ? battery : null,
          vehicleKind: kind,
          location,
          locale,
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error('quote failed');
          return r.json() as Promise<Quote>;
        })
        .then(setQuote)
        .catch((error) => {
          if ((error as Error).name === 'AbortError') return;
          setFailed(true);
        })
        .finally(() => setBusy(false));
    }, 550);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [bid, year, fuel, volume, battery, kind, location, locale]);

  const years = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="pubcalc">
      <div className="pubcalc-form">
        <label className="pubcalc-field">
          <span>{t('pc.bid')}</span>
          <div className="pubcalc-money">
            <span className="mono">$</span>
            <input
              type="number"
              min={500}
              step={100}
              value={bid}
              onChange={(e) => setBid(Number(e.target.value) || 0)}
              className="mono"
              inputMode="numeric"
            />
          </div>
          <input
            type="range"
            min={2000}
            max={40000}
            step={500}
            value={Math.min(Math.max(bid, 2000), 40000)}
            onChange={(e) => setBid(Number(e.target.value))}
            aria-label={t('pc.bid')}
            className="pubcalc-range"
          />
        </label>

        <div className="pubcalc-grid">
          <label className="pubcalc-field">
            <span>{t('pc.year')}</span>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>

          <label className="pubcalc-field">
            <span>{t('pc.fuel')}</span>
            <select value={fuel} onChange={(e) => setFuel(e.target.value as typeof fuel)}>
              {FUELS.map((f) => (
                <option key={f} value={f}>{t(`fuel.${f}` as DictKey)}</option>
              ))}
            </select>
          </label>

          <label className="pubcalc-field">
            <span>{fuel === 'electric' ? t('pc.battery') : t('pc.volume')}</span>
            {fuel === 'electric' ? (
              <input
                type="number"
                min={10}
                max={200}
                step={1}
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value) || 0)}
                className="mono"
                inputMode="decimal"
              />
            ) : (
              <input
                type="number"
                min={0.8}
                max={7}
                step={0.1}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value) || 0)}
                className="mono"
                inputMode="decimal"
              />
            )}
          </label>

          <label className="pubcalc-field">
            <span>{t('pc.kind')}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>{t(`kind.${k}` as DictKey)}</option>
              ))}
            </select>
          </label>

          {locations.length > 0 && (
            <label className="pubcalc-field" style={{ gridColumn: '1 / -1' }}>
              <span>{t('pc.location')}</span>
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="pubcalc-result">
        {failed && <div className="notice">{t('pc.failed')}</div>}

        {!failed && quote && (
          <>
            <div className="stack" style={{ gap: 11 }}>
              {quote.breakdown.map((row) => (
                <div className="calc-row" key={row.group}>
                  <span>{row.label}</span>
                  <span className="mono">{formatMoney(row.amount)}</span>
                </div>
              ))}
            </div>

            <div className="calc-total">
              <span style={{ fontWeight: 700, fontSize: 16 }}>{t('cars.turnkey')}</span>
              <span className="calc-total-amount">{formatMoney(quote.total)}</span>
            </div>

            <div className="mono muted" style={{ fontSize: 12.5 }}>
              ≈ {formatMoney(quote.totalUah, 'UAH')} · {quote.usdUah.toFixed(2).replace('.', ',')} ₴/$
            </div>

            <p className="muted" style={{ fontSize: 13 }}>
              {quote.approximate ? t('pc.approx') : t('calc.note')}
            </p>

            <button
              type="button"
              className="btn btn-red"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => wantLead.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              {t('pc.cta')} <ArrowRight />
            </button>
          </>
        )}

        {!quote && !failed && (
          <div className="muted" style={{ fontSize: 14.5 }}>
            {busy ? t('common.loading') : t('pc.hint')}
          </div>
        )}
      </div>

      <div ref={wantLead} className="pubcalc-lead">
        <strong style={{ fontSize: 16 }}>{t('pc.leadTitle')}</strong>
        <p className="muted" style={{ fontSize: 14 }}>{t('pc.leadText')}</p>
        <LeadForm source="calculator" compact />
      </div>
    </div>
  );
}
