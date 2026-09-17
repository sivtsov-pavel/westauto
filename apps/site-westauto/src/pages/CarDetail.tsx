import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatMoney, PLATFORM_LABELS, type Platform, type ShowcaseStatus } from '@avtoklyuch/shared';
import { ArrowRight } from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import type { DictKey } from '@/content/dict';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';
import { useRouteData } from '@/ssr-data';

interface CarDetail {
  id: string;
  slug: string;
  status: ShowcaseStatus;
  title: string;
  makeModel: string;
  year: number | null;
  fuel: string;
  engineVolume: number | null;
  batteryPower?: number | null;
  location: string;
  platform: Platform;
  lotNumber: string | null;
  mileage: number | null;
  damage: string | null;
  turnkeyPriceUsd: number;
  breakdown: { label: string; amount: number }[];
  description: string | null;
  photos: { id: string; url: string }[];
}

const STATUS_KEY: Record<ShowcaseStatus, DictKey> = {
  available: 'cars.available',
  at_auction: 'cars.atAuction',
  delivered_case: 'cars.delivered',
};

export function CarDetail() {
  const { t, href } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const [activePhoto, setActivePhoto] = useState(0);

  const { data, state } = useRouteData<{ item: CarDetail }>(`/auto/${slug ?? ''}`, () =>
    fetch(`/api/public/showcase/${encodeURIComponent(slug ?? '')}`).then(async (r) => {
      if (!r.ok) throw new Error('not found');
      return (await r.json()) as { item: CarDetail };
    }),
  );

  const car = data?.item ?? null;

  useDocumentTitle(
    car ? `${car.title} — ${formatMoney(car.turnkeyPriceUsd)} | WestAuto` : 'WestAuto',
  );

  if (state === 'loading') return <div className="empty-state">{t('common.loading')}</div>;

  if (state === 'error' || !car) {
    return (
      <div className="empty-state">
        <h1 className="display h2" style={{ marginBottom: 14 }}>{t('cars.gone')}</h1>
        <Link className="btn btn-outline btn-sm" to={href('/auto')}>
          {t('cars.back')} <ArrowRight />
        </Link>
      </div>
    );
  }

  const cover = car.photos[activePhoto] ?? car.photos[0];

  const specs: [string, string][] = [
    [t('cars.year'), car.year ? String(car.year) : '—'],
    [t('cars.fuel'), t(`fuel.${car.fuel}` as DictKey)],
    [
      t('cars.engine'),
      car.fuel === 'electric'
        ? car.batteryPower ? `${car.batteryPower} kWh` : '—'
        : car.engineVolume ? `${String(car.engineVolume).replace('.', ',')} L` : '—',
    ],
    [t('cars.mileage'), car.mileage ? `${car.mileage.toLocaleString('uk-UA')} ${t('cars.miles')}` : '—'],
    [t('cars.platform'), [PLATFORM_LABELS[car.platform], car.location].filter(Boolean).join(' · ') || '—'],
    [t('cars.lotNo'), car.lotNumber ?? '—'],
  ];

  return (
    <section className="section">
      <div className="wrap">
        <Link to={href('/auto')} className="muted" style={{ fontSize: 14.5, display: 'inline-block', marginBottom: 28 }}>
          ← {t('cars.back')}
        </Link>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
            gap: 'clamp(28px, 4vw, 56px)',
            alignItems: 'start',
          }}
          className="car-detail-grid"
        >
          <div className="stack">
            <div
              className="car-photo"
              style={{ borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}
            >
              {cover ? (
                <img src={cover.url} alt={car.title} />
              ) : (
                <span className="car-photo-empty">WESTAUTO</span>
              )}
              <span className="car-status">{t(STATUS_KEY[car.status])}</span>
            </div>

            {car.photos.length > 1 && (
              <div className="row" style={{ gap: 10 }}>
                {car.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhoto(index)}
                    aria-label={`${index + 1}`}
                    aria-current={index === activePhoto}
                    style={{
                      padding: 0,
                      width: 92,
                      height: 66,
                      borderRadius: 10,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'none',
                      border: index === activePhoto
                        ? '2px solid var(--red)'
                        : '1px solid var(--line)',
                    }}
                  >
                    <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {car.description && <p className="lead">{car.description}</p>}
          </div>

          <div className="stack" style={{ gap: 24 }}>
            <div className="stack" style={{ gap: 10 }}>
              <h1 className="display h2">{car.title}</h1>
              {car.damage && <p className="muted">{car.damage}</p>}
            </div>

            <div className="calc-card" style={{ boxShadow: 'var(--shadow)' }}>
              <div className="stack" style={{ gap: 11 }}>
                {car.breakdown.map((row) => (
                  <div className="calc-row" key={row.label}>
                    <span>{row.label}</span>
                    <span className="mono">{formatMoney(row.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="calc-total">
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t('cars.turnkey')}</span>
                <span className="calc-total-amount">{formatMoney(car.turnkeyPriceUsd)}</span>
              </div>
              <p className="muted" style={{ fontSize: 13 }}>{t('calc.note')}</p>
            </div>

            <div className="stack" style={{ gap: 0 }}>
              {specs.map(([label, value]) => (
                <div
                  key={label}
                  className="spread"
                  style={{ padding: '11px 0', borderBottom: '1px solid var(--line)', fontSize: 14.5 }}
                >
                  <span className="muted">{label}</span>
                  <span className="mono">{value}</span>
                </div>
              ))}
            </div>

            <div className="stack" style={{ gap: 12 }}>
              <strong style={{ fontSize: 16 }}>{t('cars.want')}</strong>
              <LeadForm showcaseItemId={car.id} source={`car:${car.slug}`} compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
