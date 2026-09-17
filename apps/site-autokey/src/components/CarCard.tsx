import { Link } from 'react-router-dom';
import {
  formatMoney,
  FUEL_LABELS,
  SHOWCASE_STATUS_LABELS,
  type ShowcaseStatus,
} from '@avtoklyuch/shared';

export interface CarSummary {
  id: string;
  slug: string;
  status: ShowcaseStatus;
  title: string;
  makeModel: string;
  year: number | null;
  fuel: keyof typeof FUEL_LABELS;
  engineVolume: number | null;
  location: string;
  mileage: number | null;
  damage: string | null;
  turnkeyPriceUsd: number;
  photos: { id: string; url: string }[];
}

const STATUS_PILL: Record<ShowcaseStatus, string> = {
  available: 'pill-teal',
  at_auction: 'pill-accent',
  delivered_case: 'pill-teal',
};

/** Українські підписи типів пального — на сайті все українською. */
const FUEL_UA: Record<string, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Електро',
  hybrid: 'Гібрид',
};

export function CarCard({ car }: { car: CarSummary }) {
  const cover = car.photos[0];
  const specs = [
    car.year ? String(car.year) : null,
    FUEL_UA[car.fuel] ?? car.fuel,
    car.engineVolume ? `${String(car.engineVolume).replace('.', ',')} л` : null,
    car.mileage ? `${car.mileage.toLocaleString('uk-UA')} миль` : null,
  ].filter(Boolean) as string[];

  return (
    <Link to={`/auto/${car.slug}`} className="car-card">
      <div className="car-photo">
        {cover ? (
          <img src={cover.url} alt={car.title} loading="lazy" />
        ) : (
          <span>ФОТО НЕЗАБАРОМ</span>
        )}
        <span className={`pill ${STATUS_PILL[car.status]}`}>
          {SHOWCASE_STATUS_LABELS[car.status]}
        </span>
      </div>

      <div className="car-body">
        <h3 style={{ fontSize: 17, fontWeight: 600 }}>{car.title}</h3>

        <div className="car-specs">
          {specs.map((spec) => (
            <span key={spec}>{spec}</span>
          ))}
        </div>

        {car.damage && (
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            {car.damage}
          </p>
        )}

        <div className="car-price">
          <span className="muted" style={{ fontSize: 13.5 }}>Під ключ в Україні</span>
          <span className="amount">{formatMoney(car.turnkeyPriceUsd)}</span>
        </div>
      </div>
    </Link>
  );
}
