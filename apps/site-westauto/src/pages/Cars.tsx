import { useState } from 'react';
import type { ShowcaseStatus } from '@avtoklyuch/shared';
import { CarCard, type CarSummary } from '@/components/CarCard';
import { LeadForm } from '@/components/LeadForm';
import type { DictKey } from '@/content/dict';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';
import { useRouteData } from '@/ssr-data';

const FILTERS: { value: ShowcaseStatus | 'all'; key: DictKey }[] = [
  { value: 'all', key: 'cars.filterAll' },
  { value: 'available', key: 'cars.available' },
  { value: 'at_auction', key: 'cars.atAuction' },
  { value: 'delivered_case', key: 'cars.delivered' },
];

/*
 * Сколько карточек показываем сразу.
 *
 * Восемь — это два полных ряда на широком экране и ровный низ страницы.
 * Остальные подгружаются кнопкой: вываливать сразу полсотни авто значит
 * заставить человека прокручивать то, что он не просил.
 */
const PAGE_SIZE = 8;

export function Cars() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<ShowcaseStatus | 'all'>('all');
  const [shown, setShown] = useState(PAGE_SIZE);

  useDocumentTitle(`${t('cars.title')} — WestAuto`);

  const { data, state } = useRouteData<{ items: CarSummary[] }>('/auto', () =>
    fetch('/api/public/showcase?limit=60').then((r) => (r.ok ? r.json() : { items: [] })),
  );

  const all = data?.items ?? [];
  // Фильтруем на месте: переключение категорий не должно ждать сеть
  const matching = filter === 'all' ? all : all.filter((car) => car.status === filter);
  const cars = matching.slice(0, shown);
  const rest = matching.length - cars.length;

  return (
    <>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="wrap">
          <div className="stack" style={{ gap: 16, maxWidth: 720, marginBottom: 32 }}>
            <div className="eyebrow">{t('cars.eyebrow')}</div>
            <h1 className="display h1 rule">{t('cars.title')}</h1>
            <p className="lead">{t('cars.lead')}</p>
          </div>

          <div className="row" role="group" aria-label={t('cars.filterAll')}>
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`btn btn-sm ${filter === item.value ? 'btn-navy' : 'btn-outline'}`}
                aria-pressed={filter === item.value}
                onClick={() => {
                  setFilter(item.value);
                  // Новая категория — снова с первой порции
                  setShown(PAGE_SIZE);
                }}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {state === 'loading' && <div className="empty-state">{t('common.loading')}</div>}

          {state !== 'loading' && cars.length === 0 && (
            <div className="empty-state">
              <p style={{ marginBottom: 28 }}>{t('cars.empty')}</p>
              <LeadForm source="cars-empty" compact />
            </div>
          )}

          {cars.length > 0 && (
            <>
              <div className="cars">
                {cars.map((car) => <CarCard key={car.id} car={car} />)}
              </div>

              {rest > 0 && (
                <div className="cars-more">
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={() => setShown((n) => n + PAGE_SIZE)}
                  >
                    {t('cars.more')}
                    <span className="cars-more-count">+{Math.min(rest, PAGE_SIZE)}</span>
                  </button>
                  <span className="muted" style={{ fontSize: 13.5 }}>
                    {t('cars.shown')} {cars.length} {t('cars.of')} {matching.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
