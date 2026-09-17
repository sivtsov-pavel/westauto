import { useState } from 'react';
import { convert, formatMoney, type FxRates } from '@avtoklyuch/shared';
import { CheckIcon, PencilIcon, RefreshIcon } from './Icons';

interface FxPanelProps {
  /** Актуальный курс НБУ */
  live: FxRates;
  /** Курс, зафиксированный менеджером на этот расчёт */
  pinned: FxRates | null;
  /** Итог в долларах — его и переводим */
  totalUsd: number;
  onPin: (fx: FxRates | null) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

/**
 * Курс валют для расчёта.
 *
 * По ТЗ курс тянется автоматически (НБУ) и при этом должен фиксироваться
 * вручную на конкретный расчёт: клиенту называют цену по курсу, который был
 * в момент разговора, и через неделю она не должна «поехать» сама.
 *
 * Зафиксированный курс уезжает в снимок расчёта — открытый через месяц
 * расчёт сходится с тем, что клиент видел на скриншоте.
 */
export function FxPanel({ live, pinned, totalUsd, onPin, onRefresh, refreshing }: FxPanelProps) {
  const [editing, setEditing] = useState(false);
  const active = pinned ?? live;

  const uah = convert(totalUsd, 'USD', 'UAH', active);
  const eur = convert(totalUsd, 'USD', 'EUR', active);

  return (
    <div className="fx-panel">
      <div className="fx-rates">
        <span className="muted" style={{ fontSize: 12 }}>Курс расчёта</span>

        {editing ? (
          <RateEditor
            initial={active}
            onCancel={() => setEditing(false)}
            onSave={(next) => {
              onPin(next);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <span className="mono" style={{ fontSize: 13 }}>
              {fmtRate(active.usdUah)} ₴/$
            </span>
            <span className="faint">·</span>
            <span className="mono" style={{ fontSize: 13 }}>
              {fmtRate(active.eurUah)} ₴/€
            </span>

            {pinned ? (
              <span className="badge badge-accent">зафиксирован вручную</span>
            ) : (
              <span className="faint" style={{ fontSize: 11.5 }}>{live.source}</span>
            )}

            <button
              type="button"
              className="icon-btn"
              onClick={() => setEditing(true)}
              title="Зафиксировать курс вручную на этот расчёт"
              aria-label="Зафиксировать курс вручную"
            >
              <PencilIcon />
            </button>

            {pinned ? (
              <button
                type="button"
                className="icon-btn"
                onClick={() => onPin(null)}
                title="Вернуться к курсу НБУ"
                aria-label="Вернуться к курсу НБУ"
              >
                <RefreshIcon size={12} />
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn"
                onClick={onRefresh}
                disabled={refreshing}
                title="Обновить курс НБУ"
                aria-label="Обновить курс НБУ"
              >
                <RefreshIcon size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {totalUsd > 0 && (
        <div className="fx-converted">
          <span className="mono">{formatMoney(uah, 'UAH')}</span>
          <span className="faint">·</span>
          <span className="mono">{formatMoney(eur, 'EUR')}</span>
        </div>
      )}
    </div>
  );
}

function RateEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: FxRates;
  onSave: (fx: FxRates) => void;
  onCancel: () => void;
}) {
  const [usd, setUsd] = useState(String(initial.usdUah).replace('.', ','));
  const [eur, setEur] = useState(String(initial.eurUah).replace('.', ','));

  function commit() {
    const usdUah = Number.parseFloat(usd.replace(',', '.'));
    const eurUah = Number.parseFloat(eur.replace(',', '.'));
    // Мусор не фиксируем: пустой или нулевой курс сломал бы все пересчёты
    if (!Number.isFinite(usdUah) || !Number.isFinite(eurUah) || usdUah <= 0 || eurUah <= 0) {
      onCancel();
      return;
    }
    onSave({
      usdUah,
      eurUah,
      eurUsd: eurUah / usdUah,
      fetchedAt: new Date().toISOString(),
      source: 'зафиксирован менеджером',
      pinned: true,
    });
  }

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        className="mono fx-input"
        value={usd}
        onChange={(event) => setUsd(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') onCancel();
        }}
        aria-label="Курс гривны к доллару"
        autoFocus
      />
      <span className="faint" style={{ fontSize: 12 }}>₴/$</span>

      <input
        type="text"
        inputMode="decimal"
        className="mono fx-input"
        value={eur}
        onChange={(event) => setEur(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') onCancel();
        }}
        aria-label="Курс гривны к евро"
      />
      <span className="faint" style={{ fontSize: 12 }}>₴/€</span>

      <button type="button" className="icon-btn active" onClick={commit} aria-label="Зафиксировать">
        <CheckIcon />
      </button>
      <button type="button" className="icon-btn" onClick={onCancel} aria-label="Отмена">
        ✕
      </button>
    </>
  );
}

function fmtRate(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
