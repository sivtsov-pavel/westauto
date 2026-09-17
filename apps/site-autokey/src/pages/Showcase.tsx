import { useState } from 'react';
import { SHOWCASE_STATUS_LABELS, type ShowcaseStatus } from '@avtoklyuch/shared';
import { CarCard, type CarSummary } from '@/components/CarCard';
import { LeadForm } from '@/components/LeadForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRouteData } from '@/ssr-data';

const FILTERS: { value: ShowcaseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Усі авто' },
  { value: 'available', label: SHOWCASE_STATUS_LABELS.available },
  { value: 'at_auction', label: SHOWCASE_STATUS_LABELS.at_auction },
  { value: 'delivered_case', label: SHOWCASE_STATUS_LABELS.delivered_case },
];

export function Showcase() {
  const [filter, setFilter] = useState<ShowcaseStatus | 'all'>('all');

  useDocumentTitle('Авто в наявності та на торгах — АвтоКлюч');

  // Первый показ приезжает с сервера — фильтрацию делаем на месте, чтобы
  // переключение категорий не ждало сеть
  const { data, state } = useRouteData<{ items: CarSummary[] }>('/auto', () =>
    fetch('/api/public/showcase').then((r) => (r.ok ? r.json() : { items: [] })),
  );

  const all = data?.items ?? [];
  const cars = filter === 'all' ? all : all.filter((car) => car.status === filter);
  const loading = state === 'loading';

  return (
    <>
      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="stack" style={{ gap: 16, maxWidth: 680, marginBottom: 32 }}>
          <div className="section-eyebrow">Вітрина</div>
          <h1 className="section-title" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 4.4vw, 46px)' }}>
            Авто в наявності, в дорозі та на торгах
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Ціна біля кожного авто — підсумкова, «під ключ в Україні»: ставка, доставка, збори,
            розмитнення й оформлення разом. Це той самий розрахунок, який веде менеджер, а не
            рекламна цифра.
          </p>
        </div>

        <div className="showcase-filters" role="group" aria-label="Фільтр за статусом">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className="filter-chip"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        {loading && <div className="empty-state">Завантажую…</div>}

        {!loading && cars.length === 0 && (
          <div className="empty-state">
            <p style={{ marginTop: 0 }}>
              У цій категорії зараз немає авто. Напишіть, яке шукаєте — підберемо лот і порахуємо
              вартість під ключ.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <LeadForm source="showcase-empty" />
            </div>
          </div>
        )}

        {cars.length > 0 && (
          <div className="cars-grid">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
