import { useEffect, useState } from 'react';
import { formatMoney, parseMoneyInput } from '@avtoklyuch/shared';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Показывать значение как $14 200, пока поле не в фокусе */
  formatted?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
}

/**
 * Денежное поле. Пока идёт ввод — показываем ровно то, что набрал человек;
 * как только фокус ушёл — форматируем в $14 200.
 *
 * Так менеджер может спокойно вставить «14,200.00» из письма, и поле не
 * начнёт переписывать текст под курсором прямо во время набора.
 */
export function MoneyInput({
  value,
  onChange,
  formatted = true,
  className = '',
  placeholder,
  ariaLabel,
  autoFocus,
  disabled,
  id,
}: MoneyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  // Значение сменилось снаружи (сброс, загрузка расчёта) — отпускаем черновик
  useEffect(() => {
    setDraft(null);
  }, [value]);

  const display =
    draft ?? (formatted ? formatMoney(value, 'USD') : value === 0 ? '' : String(value));

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={`mono ${className}`}
      value={display}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        const parsed = parseMoneyInput(next);
        if (parsed !== null) onChange(parsed);
        else if (next.trim() === '') onChange(0);
      }}
      onFocus={(event) => {
        setDraft(value === 0 ? '' : String(value));
        // Выделяем всё: чаще всего сумму заменяют целиком, а не дописывают
        requestAnimationFrame(() => event.target.select());
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
