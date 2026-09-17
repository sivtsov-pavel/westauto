import { formatMoney, type CompositionSegment } from '@avtoklyuch/shared';

/**
 * Из чего сложился итог — сегментированная шкала вместо очередного столбца
 * цифр. Менеджер с одного взгляда видит, что в этом лоте половина суммы это
 * растаможка, а не ставка.
 */
export function CompositionBar({ segments }: { segments: CompositionSegment[] }) {
  if (segments.length === 0) return null;

  const total = segments.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="composition">
      <div
        className="composition-bar"
        role="img"
        aria-label={`Состав суммы: ${segments
          .map((s) => `${s.label} ${Math.round(s.percent)} процентов`)
          .join(', ')}`}
      >
        {segments.map((segment) => (
          <span
            key={segment.group}
            style={{
              width: `${(segment.amount / (total || 1)) * 100}%`,
              background: segment.color,
            }}
            title={`${segment.label}: ${formatMoney(segment.amount)}`}
          />
        ))}
      </div>
      <div className="composition-legend">
        {segments.map((segment) => (
          <span key={segment.group}>
            <i style={{ background: segment.color }} />
            {segment.label} {Math.round(segment.percent)}%
          </span>
        ))}
      </div>
    </div>
  );
}
