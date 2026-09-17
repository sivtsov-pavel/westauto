import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  formatMoney,
  SHOWCASE_STATUS_LABELS,
  type ShowcaseStatus,
} from '@avtoklyuch/shared';
import { ArrowRight } from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRouteData } from '@/ssr-data';

interface CarDetailData {
  id: string;
  slug: string;
  status: ShowcaseStatus;
  title: string;
  makeModel: string;
  year: number | null;
  fuel: string;
  engineVolume: number | null;
  location: string;
  platform: string;
  lotNumber: string | null;
  mileage: number | null;
  damage: string | null;
  turnkeyPriceUsd: number;
  breakdown: { label: string; amount: number }[];
  description: string | null;
  photos: { id: string; url: string }[];
}

const FUEL_UA: Record<string, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Електро',
  hybrid: 'Гібрид',
};

export function CarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [activePhoto, setActivePhoto] = useState(0);

  const { data, state } = useRouteData<{ item: CarDetailData }>(`/auto/${slug ?? ''}`, () =>
    fetch(`/api/public/showcase/${encodeURIComponent(slug ?? '')}`).then(async (response) => {
      if (!response.ok) throw new Error('not found');
      return (await response.json()) as { item: CarDetailData };
    }),
  );

  const car = data?.item ?? null;

  useDocumentTitle(car ? `${car.title} — під ключ ${formatMoney(car.turnkeyPriceUsd)}` : 'Авто');

  if (state === 'loading') return <div className="empty-state">Завантажую…</div>;

  if (state === 'error' || !car) {
    return (
      <div className="empty-state">
        <p>Такого авто вже немає у вітрині — можливо, його вже купили.</p>
        <Link className="btn btn-outline btn-sm" to="/auto">
          Подивитись інші авто <ArrowRight />
        </Link>
      </div>
    );
  }

  const specs: [string, string][] = [
    ['Рік випуску', car.year ? String(car.year) : '—'],
    ['Пальне', FUEL_UA[car.fuel] ?? car.fuel],
    ['Об’єм двигуна', car.engineVolume ? `${String(car.engineVolume).replace('.', ',')} л` : '—'],
    ['Пробіг', car.mileage ? `${car.mileage.toLocaleString('uk-UA')} миль` : '—'],
    ['Майданчик', `${car.platform === 'copart' ? 'Copart' : 'IAAI'}${car.location ? ` · ${car.location}` : ''}`],
    ['Номер лоту', car.lotNumber ?? '—'],
  ];

  const cover = car.photos[activePhoto] ?? car.photos[0];

  return (
    <>
      <section className="section" style={{ paddingBottom: 24 }}>
        <Link to="/auto" className="muted" style={{ fontSize: 14 }}>
          ← Усі авто
        </Link>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 'clamp(24px, 4vw, 48px)',
            alignItems: 'start',
          }}
          className="car-detail-grid"
        >
          <div className="stack" style={{ gap: 16 }}>
            <div className="hero-photo" style={{ aspectRatio: '4 / 3', borderStyle: 'solid', borderColor: 'var(--line)' }}>
              {cover ? <img src={cover.url} alt={car.title} /> : <span>ФОТО НЕЗАБАРОМ</span>}
            </div>

            {car.photos.length > 1 && (
              <div className="row" style={{ gap: 8 }}>
                {car.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhoto(index)}
                    aria-label={`Фото ${index + 1}`}
                    aria-current={index === activePhoto}
                    style={{
                      padding: 0,
                      border: index === activePhoto ? '2px solid var(--accent)' : '1px solid var(--line)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'none',
                      width: 84,
                      height: 60,
                    }}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {car.description && (
              <p className="muted" style={{ margin: 0 }}>{car.description}</p>
            )}
          </div>

          <div className="stack" style={{ gap: 20 }}>
            <div className="stack" style={{ gap: 10 }}>
              <span className="pill pill-teal" style={{ alignSelf: 'flex-start' }}>
                {SHOWCASE_STATUS_LABELS[car.status]}
              </span>
              <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', lineHeight: 1.1 }}>
                {car.title}
              </h1>
              {car.damage && <p className="muted" style={{ margin: 0 }}>{car.damage}</p>}
            </div>

            <div className="hero-card" style={{ boxShadow: 'none' }}>
              <div className="stack" style={{ gap: 10 }}>
                {car.breakdown.map((row) => (
                  <div className="price-row" key={row.label}>
                    <span>{row.label}</span>
                    <span className="mono">{formatMoney(row.amount)}</span>
                  </div>
                ))}
                <div className="price-total">
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Разом під ключ</span>
                  <span className="amount" style={{ fontSize: 26 }}>
                    {formatMoney(car.turnkeyPriceUsd)}
                  </span>
                </div>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Ціна включає доставку, збори, розмитнення та оформлення. Без доплат на митниці.
              </p>
            </div>

            <div className="stack" style={{ gap: 0 }}>
              {specs.map(([label, value]) => (
                <div
                  className="spread"
                  key={label}
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}
                >
                  <span className="muted">{label}</span>
                  <span className="mono">{value}</span>
                </div>
              ))}
            </div>

            <div className="stack" style={{ gap: 12 }}>
              <div style={{ fontWeight: 600 }}>Хочу це авто</div>
              <LeadForm showcaseItemId={car.id} source={`car:${car.slug}`} compact />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
