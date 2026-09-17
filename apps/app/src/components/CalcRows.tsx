import { useState } from 'react';
import { formatMoney, type CalcLine, type LineKey, type LineSource } from '@avtoklyuch/shared';
import { MoneyInput } from './MoneyInput';
import { CheckIcon, PencilIcon, RefreshIcon } from './Icons';

interface CalcRowsProps {
  lines: CalcLine[];
  /** Маржа и себестоимость видны только сотрудникам */
  showInternal: boolean;
  onOverride: (key: LineKey, value: number | null) => void;
  onToggle: (key: LineKey) => void;
}

const SOURCE_DOT: Record<LineSource, string> = {
  input: 'dot-manual',
  tariff: 'dot-tariff',
  settings: 'dot-tariff',
  computed: 'dot-tariff',
  api: 'dot-api',
  'api-cached': 'dot-estimate',
  estimate: 'dot-estimate',
  manual: 'dot-manual',
};

const SOURCE_TITLE: Record<LineSource, string> = {
  input: 'Введено вручную',
  tariff: 'Из таблицы тарифов',
  settings: 'Из настроек по умолчанию',
  computed: 'Вычислено формулой',
  api: 'Актуальный ответ baza-gai.com.ua',
  'api-cached': 'Кешированный ответ API — не обновлено',
  estimate: 'Оценка по локальной формуле',
  manual: 'Исправлено вручную',
};

export function CalcRows({ lines, showInternal, onOverride, onToggle }: CalcRowsProps) {
  const [editing, setEditing] = useState<LineKey | null>(null);
  const visible = lines.filter((line) => showInternal || !line.internalOnly);

  return (
    <div>
      {visible.map((line) => {
        const isEditing = editing === line.key;
        const wasChanged = line.source === 'manual' && line.baseAmount !== null;

        return (
          <div
            key={line.key}
            className={`calc-row ${line.enabled ? '' : 'disabled'}`}
          >
            <span className="calc-label">
              {line.label}
              {line.internalOnly && (
                <span className="badge badge-muted" style={{ marginLeft: 8 }}>
                  внутреннее
                </span>
              )}
              <span
                className={`dot ${SOURCE_DOT[line.source]}`}
                title={SOURCE_TITLE[line.source]}
              />
              {line.note && <span className="calc-note">{line.note}</span>}
              {wasChanged && (
                <span className="calc-note">
                  было {formatMoney(line.baseAmount ?? 0)} → стало {formatMoney(line.amount)}
                </span>
              )}
            </span>

            {isEditing ? (
              <MoneyInput
                value={line.amount}
                onChange={(value) => onOverride(line.key, value)}
                formatted={false}
                className="calc-value-input"
                ariaLabel={`${line.label}, сумма`}
                autoFocus
              />
            ) : (
              <span className="calc-value">{formatMoney(line.amount)}</span>
            )}

            <span className="calc-actions">
              {line.editable && (
                <button
                  type="button"
                  className={`icon-btn ${isEditing ? 'active' : ''}`}
                  onClick={() => setEditing(isEditing ? null : line.key)}
                  aria-label={isEditing ? `Закончить правку: ${line.label}` : `Править: ${line.label}`}
                  title={isEditing ? 'Готово' : 'Исправить вручную'}
                >
                  {isEditing ? <CheckIcon /> : <PencilIcon />}
                </button>
              )}

              {line.source === 'manual' && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    onOverride(line.key, null);
                    setEditing(null);
                  }}
                  aria-label={`Вернуть исходное значение: ${line.label}`}
                  title="Вернуть значение из тарифа / настроек"
                >
                  <RefreshIcon size={12} />
                </button>
              )}

              {/* Ставку выключить нельзя — без неё расчёта нет */}
              {line.key !== 'bid' && (
                <label
                  className="icon-btn"
                  title={line.enabled ? 'Исключить из расчёта' : 'Вернуть в расчёт'}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={() => onToggle(line.key)}
                    style={{ width: 13, height: 13, padding: 0, margin: 0 }}
                  />
                  <span className="sr-only">
                    {line.enabled ? `Исключить ${line.label}` : `Вернуть ${line.label}`}
                  </span>
                </label>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
