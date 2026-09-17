import { forwardRef } from 'react';
import {
  CLIENT_STRINGS,
  formatMoney,
  groupLabel,
  type CalcResult,
  type ClientLocale,
  type LotInfo,
} from '@avtoklyuch/shared';
import { KeyMark } from './Icons';

interface ClientCardProps {
  result: CalcResult;
  lot: LotInfo;
  /** Язык документа для клиента — не зависит от языка интерфейса */
  locale?: ClientLocale;
  brandName?: { prefix: string; accent: string };
}

/**
 * Карточка для клиента — то, что менеджер снимает скриншотом и отправляет.
 *
 * Два правила, которые нельзя нарушать:
 *  1. Никакой внутренней кухни: ни маржи, ни себестоимости, ни источников
 *     значений, ни пометок «оценка» — только цена и её крупные статьи.
 *  2. Всегда светлая палитра, независимо от темы приложения: скриншот должен
 *     выглядеть одинаково и не зависеть от того, как настроен менеджер.
 */
export const ClientCard = forwardRef<HTMLDivElement, ClientCardProps>(
  ({ result, lot, locale = 'uk', brandName = { prefix: 'Авто', accent: 'Ключ' } }, ref) => {
    const subtitle = [lot.makeModel, lot.year].filter(Boolean).join(' · ');
    const t = CLIENT_STRINGS[locale];

    return (
      <div className="client-card" ref={ref}>
        <div className="spread">
          <div className="row-flex" style={{ gap: 8 }}>
            <span style={{ color: '#8C6A34', display: 'flex' }}>
              <KeyMark size={18} />
            </span>
            <span className="brand" style={{ padding: 0, color: '#1B1D1F', fontSize: 14 }}>
              {brandName.prefix}
              <em>{brandName.accent}</em>
            </span>
          </div>
          {subtitle && (
            <span className="mono" style={{ fontSize: 11.5, color: '#746C5F' }}>
              {subtitle}
            </span>
          )}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          {result.clientBreakdown.map((row) => (
            <div className="row" key={row.group}>
              <span>{groupLabel(row.group, locale)}</span>
              <span className="mono">{formatMoney(row.amount)}</span>
            </div>
          ))}
        </div>

        <div className="total">
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t.total}</span>
          <span className="amount">{formatMoney(result.clientTotal)}</span>
        </div>
      </div>
    );
  },
);

ClientCard.displayName = 'ClientCard';
