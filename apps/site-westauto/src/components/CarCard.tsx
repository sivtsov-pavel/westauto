import { Link } from 'react-router-dom';
import { formatMoney, type ShowcaseStatus } from '@avtoklyuch/shared';
import { useI18n } from '@/i18n';
import type { DictKey } from '@/content/dict';

export interface CarSummary {
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
  mileage: number | null;
  damage: string | null;
  turnkeyPriceUsd: number;
  photos: { id: string; url: string }[];
}

const STATUS_CLASS: Record<ShowcaseStatus, string> = {
  available: '',
  at_auction: 'auction',
  delivered_case: 'delivered',
};

const STATUS_KEY: Record<ShowcaseStatus, DictKey> = {
  available: 'cars.available',
  at_auction: 'cars.atAuction',
  delivered_case: 'cars.delivered',
};

export function CarCard({ car }: { car: CarSummary }) {
  const { t, href } = useI18n();
  const cover = car.photos[0];

  const specs = [
    car.year ? String(car.year) : null,
    t(`fuel.${car.fuel}` as DictKey),
    car.engineVolume ? `${String(car.engineVolume).replace('.', ',')} L` : null,
    car.mileage ? `${car.mileage.toLocaleString('uk-UA')} ${t('cars.miles')}` : null,
  ].filter(Boolean) as string[];

  return (
    <Link to={href(`/auto/${car.slug}`)} className="car">
      <div className="car-photo">
        {cover ? (
          <img src={cover.url} alt={car.title} loading="lazy" />
        ) : (
          <span className="car-photo-empty">WESTAUTO</span>
        )}
        <span className={`car-status ${STATUS_CLASS[car.status]}`}>
          {t(STATUS_KEY[car.status])}
        </span>
      </div>

      <div className="car-body">
        <h3 className="car-title">{car.title}</h3>

        <div className="car-specs">
          {specs.map((spec) => (
            <span className="car-spec" key={spec}>{spec}</span>
          ))}
        </div>

        {car.damage && (
          <p className="muted" style={{ fontSize: 13.5 }}>{car.damage}</p>
        )}

        <div className="car-price">
          <span className="muted" style={{ fontSize: 13 }}>{t('cars.turnkey')}</span>
          <span className="car-price-amount">{formatMoney(car.turnkeyPriceUsd)}</span>
        </div>
      </div>
    </Link>
  );
}
