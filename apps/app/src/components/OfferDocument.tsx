import { forwardRef } from 'react';
import {
  CLIENT_STRINGS,
  formatMoney,
  fuelLabel,
  groupLabel,
  PLATFORM_LABELS,
  type CalcResult,
  type ClientLocale,
  type FxRates,
  type LotInfo,
} from '@avtoklyuch/shared';
import { KeyMark } from './Icons';

interface OfferDocumentProps {
  result: CalcResult;
  lot: LotInfo;
  locale: ClientLocale;
  fx: FxRates;
  /** Менеджер, который ведёт сделку */
  managerName: string;
  contacts: { phone: string; email: string };
  /** Сколько дней действует предложение */
  validDays?: number;
}

/**
 * Коммерческое предложение для клиента — полноразмерный документ формата A4.
 *
 * Отрисовывается за пределами экрана и превращается в PDF одной кнопкой.
 * Здесь действуют те же два правила, что и в карточке клиента: никакой
 * внутренней кухни и всегда светлая палитра, независимо от темы приложения.
 *
 * Ширина 794px — это A4 при 96 DPI, поэтому пропорции в PDF не плывут.
 */
export const OfferDocument = forwardRef<HTMLDivElement, OfferDocumentProps>(
  ({ result, lot, locale, fx, managerName, contacts, validDays = 3 }, ref) => {
    const t = CLIENT_STRINGS[locale];
    const dateLocale = locale === 'uk' ? 'uk-UA' : 'ru-RU';

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const specs: [string, string][] = [
      [t.vehicle, [lot.year, lot.makeModel].filter(Boolean).join(' ') || '—'],
      [t.lot, [lot.lotNumber, lot.vin].filter(Boolean).join(' · ') || '—'],
      [t.fuel, fuelLabel(lot.fuel, locale)],
      [
        t.volume,
        lot.fuel === 'electric'
          ? lot.batteryPower
            ? `${lot.batteryPower} кВт·год`
            : '—'
          : lot.engineVolume
            ? `${String(lot.engineVolume).replace('.', ',')} л`
            : '—',
      ],
      [
        t.location,
        [PLATFORM_LABELS[lot.platform], lot.location].filter(Boolean).join(' · ') || '—',
      ],
    ];

    return (
      <div className="offer-doc" ref={ref}>
        <header className="offer-head">
          <div className="offer-brand">
            <span style={{ color: '#8C6A34', display: 'flex' }}>
              <KeyMark size={26} />
            </span>
            <span className="offer-wordmark">
              Авто<em>Ключ</em>
            </span>
          </div>
          <div className="offer-meta">
            <div>{new Date().toLocaleDateString(dateLocale)}</div>
            <div>
              {t.validUntil} {validUntil.toLocaleDateString(dateLocale)}
            </div>
          </div>
        </header>

        <h1 className="offer-title">{t.offerTitle}</h1>

        <section className="offer-specs">
          {specs.map(([label, value]) => (
            <div className="offer-spec" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="offer-breakdown">
          <h2>{t.breakdown}</h2>
          {result.clientBreakdown.map((row) => (
            <div className="offer-row" key={row.group}>
              <span>{groupLabel(row.group, locale)}</span>
              <span className="offer-amount">{formatMoney(row.amount)}</span>
            </div>
          ))}
          <div className="offer-total">
            <span>{t.total}</span>
            <span className="offer-total-amount">{formatMoney(result.clientTotal)}</span>
          </div>
          <div className="offer-rate">
            {t.rate}: {fx.usdUah.toFixed(2).replace('.', ',')} ₴/$ ·{' '}
            {formatMoney(result.clientTotal * fx.usdUah, 'UAH')}
          </div>
        </section>

        <p className="offer-disclaimer">{t.disclaimer}</p>

        <footer className="offer-foot">
          <div>
            <div className="offer-foot-label">{t.contacts}</div>
            <div className="offer-foot-value">{managerName}</div>
            <div className="offer-foot-value">{contacts.phone}</div>
            <div className="offer-foot-value">{contacts.email}</div>
          </div>
          <div className="offer-foot-mark">
            <KeyMark size={18} />
          </div>
        </footer>
      </div>
    );
  },
);

OfferDocument.displayName = 'OfferDocument';
