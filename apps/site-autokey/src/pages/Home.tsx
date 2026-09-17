
import { Link } from 'react-router-dom';
import { formatMoney } from '@avtoklyuch/shared';
import { CarCard, type CarSummary } from '@/components/CarCard';
import {
  ArrowRight,
  DocIcon,
  LayersIcon,
  PersonIcon,
  ShieldIcon,
  TruckIcon,
} from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import { STATS } from '@/config';
import { useRouteData } from '@/ssr-data';

const STEPS = [
  ['01', 'Обираємо лот', 'За номером лоту або VIN на Copart та IAAI.'],
  ['02', 'Рахуємо «під ключ»', 'Ставка, доставка, збори та розмитнення — однією сумою.'],
  ['03', 'Торгуємось і викуповуємо', 'Від вашого імені, в межах узгодженого бюджету.'],
  ['04', 'Веземо і розмитнюємо', 'Логістика зі США, оформлення на митниці.'],
  ['05', 'Ключі у вас', 'Авто на обліку, сертифіковане, готове до їзди.'],
];

const SERVICES = [
  [LayersIcon, 'Підбір і торги', 'Шукаємо лот і ведемо торги на Copart та IAAI.'],
  [TruckIcon, 'Логістика', 'Ro-Ro та контейнерна доставка зі США.'],
  [DocIcon, 'Розмитнення', 'Під ключ, за офіційним курсом і ставками.'],
  [ShieldIcon, 'Сертифікація', 'Постановка на облік, документи, страхування.'],
  [PersonIcon, 'Особистий менеджер', 'Одна людина — від лоту до ключів.'],
] as const;

const ADVANTAGES = [
  [`${STATS.years} років`, 'Досвіду на американських автоаукціонах.'],
  [STATS.carsThisYear, 'Автомобілів, доставлених цього року.'],
  ['Фікс. ціна', 'Розмитнення за офіційним держкурсом, без переплат.'],
  ['Прозоро', 'Бачите розрахунок за кожною статтею, а не підсумкову цифру.'],
];

export function Home() {
  const { data } = useRouteData<{ items: CarSummary[] }>('/', () =>
    fetch('/api/public/showcase?limit=3').then((r) => (r.ok ? r.json() : { items: [] })),
  );
  const cars = data?.items ?? [];

  return (
    <>
      {/* ─── Хіро ──────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="stack" style={{ gap: 26 }}>
          <div className="section-eyebrow">Copart · IAAI · під ключ</div>
          <h1>
            Від ставки на&nbsp;аукціоні — до ключів у&nbsp;руках.
          </h1>
          <p className="hero-lead">
            Підбираємо лот на Copart та IAAI, торгуємось від вашого імені, веземо машину в Україну
            й оформлюємо розмитнення. Одна прозора ціна за кожною статтею витрат — без сюрпризів
            на виході з митниці.
          </p>

          <div className="row" style={{ gap: 28, marginTop: 6 }}>
            <a className="btn btn-ink" href="#calc">
              Розрахувати вартість авто
            </a>
            <a href="#how" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Як це працює <ArrowRight />
            </a>
          </div>

          <div className="hero-stats" style={{ marginTop: 12 }}>
            <span>{STATS.carsThisYear} авто цього року</span>
            <span style={{ color: 'var(--line)' }}>·</span>
            <span>{STATS.years} років на ринку</span>
            <span style={{ color: 'var(--line)' }}>·</span>
            <span>Вся Україна</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-photo">
            {cars[0]?.photos[0] ? (
              <img src={cars[0].photos[0].url} alt={cars[0].title} />
            ) : (
              <span>ФОТО ЛОТУ</span>
            )}
          </div>

          <div className="row" style={{ gap: 8 }}>
            <span className="pill pill-teal">Copart · TX</span>
            <span className="pill pill-accent">2021 · Бензин 2.0</span>
          </div>

          <div className="mono muted" style={{ fontSize: 13, letterSpacing: '0.5px' }}>
            LOT 47281905 · VIN 5YJ3E1EA0LF·····
          </div>

          <div style={{ height: 1, background: 'var(--line)' }} />

          <div className="stack" style={{ gap: 10 }}>
            <div className="price-row"><span>Ставка</span><span className="mono">$14 200</span></div>
            <div className="price-row"><span>Доставка + збори</span><span className="mono">$3 180</span></div>
            <div className="price-row"><span>Розмитнення</span><span className="mono">$2 480</span></div>
            <div className="price-total">
              <span style={{ fontSize: 15, fontWeight: 600 }}>Разом під ключ</span>
              <span className="amount">{formatMoney(19860)}</span>
            </div>
          </div>

          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Приклад розрахунку. Сума всіх статей — без прихованих доплат на митниці.
          </p>
        </div>
      </section>

      {/* ─── Смуга довіри ──────────────────────────────────────────────── */}
      <div className="trust">
        <div className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
          Працюємо напряму з лотами:
        </div>
        <div className="trust-logos">
          <span>Copart</span>
          <i />
          <span>IAAI</span>
          <i />
          <span style={{ fontSize: 14 }}>Ro-Ro доставка</span>
          <i />
          <span style={{ fontSize: 14 }}>baza-gai.com.ua</span>
        </div>
      </div>

      {/* ─── Як це працює ──────────────────────────────────────────────── */}
      <section className="section" id="how">
        <div className="stack" style={{ gap: 12, maxWidth: 640, marginBottom: 56 }}>
          <h2 className="section-title">Як це працює</h2>
          <p className="muted" style={{ margin: 0 }}>
            Від вибору лоту до ключів на руках — п’ять кроків, за якими стежить один і той самий
            розрахунок.
          </p>
        </div>

        <div className="steps">
          {STEPS.map(([number, title, text]) => (
            <div className="stack" style={{ gap: 14 }} key={number}>
              <div className="step-number">{number}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
              <div className="muted" style={{ fontSize: 14 }}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Вітрина ───────────────────────────────────────────────────── */}
      {cars.length > 0 && (
        <section className="section" style={{ background: 'var(--card)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="spread" style={{ marginBottom: 40, alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 12, maxWidth: 560 }}>
              <h2 className="section-title">Авто в наявності та на торгах</h2>
              <p className="muted" style={{ margin: 0 }}>
                Ціна «під ключ» — це підсумок того самого розрахунку, який веде менеджер.
                Нічого не дораховуємо на митниці.
              </p>
            </div>
            <Link className="btn btn-outline btn-sm" to="/auto">
              Всі авто <ArrowRight />
            </Link>
          </div>

          <div className="cars-grid">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Тизер калькулятора ────────────────────────────────────────── */}
      <section className="section calc-teaser" id="calc">
        <div className="spread" style={{ marginBottom: 40, alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 12, maxWidth: 560 }}>
            <div className="section-eyebrow">Один розрахунок</div>
            <h2 className="section-title">Той самий калькулятор, що й у нашого менеджера</h2>
            <p className="muted" style={{ margin: 0 }}>
              Жодних «приблизних» цифр на сайті та інших — у розмові. Розрахунок один,
              стаття за статтею.
            </p>
          </div>
          {/* Кнопка веде до внутрішнього застосунку — вхід лише для співробітників */}
          <a className="btn btn-accent" href="/app/" style={{ whiteSpace: 'nowrap' }}>
            Відкрити калькулятор
          </a>
        </div>

        <div className="calc-teaser-panel">
          <div className="stack" style={{ gap: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text-soft)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Дані лоту
            </div>
            <label className="stack" style={{ gap: 6 }}>
              <span>№ лоту / VIN</span>
              <input className="mono" type="text" value="47281905" readOnly />
            </label>
            <label className="stack" style={{ gap: 6 }}>
              <span>Марка / модель</span>
              <input type="text" value="Tesla Model 3" readOnly />
            </label>
            <label className="stack" style={{ gap: 6 }}>
              <span>Ставка, $</span>
              <input
                className="mono"
                type="text"
                value="14 200"
                readOnly
                style={{ fontSize: 16, fontWeight: 600, color: 'var(--app-accent)' }}
              />
            </label>
          </div>

          <div className="stack" style={{ gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text-soft)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              Розрахунок вартості
            </div>
            <div className="teaser-row"><span>Доставка</span><span className="mono">$1 640</span></div>
            <div className="teaser-row"><span>Аукціонний збір</span><span className="mono">$540</span></div>
            <div className="teaser-row">
              <span>Розмитнення <span className="api-chip">baza-gai API</span></span>
              <span className="mono">$2 480</span>
            </div>
            <div className="teaser-row"><span>Комплекс + сертифікація</span><span className="mono">$610</span></div>
            <div className="teaser-total">
              <span style={{ fontSize: 15, fontWeight: 600 }}>Разом під ключ</span>
              <span className="amount">{formatMoney(19860)}</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <LeadForm source="calc-teaser" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Послуги ───────────────────────────────────────────────────── */}
      <section className="section" id="services">
        <h2 className="section-title" style={{ marginBottom: 48 }}>Послуги</h2>
        <div className="services-grid">
          {SERVICES.map(([Icon, title, text]) => (
            <div className="service-card" key={title}>
              <span style={{ color: 'var(--accent)', display: 'flex' }}>
                <Icon />
              </span>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Чому ми ───────────────────────────────────────────────────── */}
      <section
        className="section"
        id="why"
        style={{ background: 'var(--card)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
      >
        <h2 className="section-title" style={{ marginBottom: 48 }}>Чому АвтоКлюч</h2>
        <div className="stats-grid">
          {ADVANTAGES.map(([number, text]) => (
            <div className="stack" style={{ gap: 10 }} key={number}>
              <div className="stat-number">{number}</div>
              <div className="muted" style={{ fontSize: 14 }}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Фінальний заклик ──────────────────────────────────────────── */}
      <section className="final-cta">
        <h2>Дізнайтеся точну вартість вашого авто за 2 хвилини</h2>
        <LeadForm source="final-cta" />
      </section>
    </>
  );
}
