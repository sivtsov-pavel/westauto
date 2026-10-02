import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '@avtoklyuch/shared';
import { CarCard, type CarSummary } from '@/components/CarCard';
import {
  ArrowRight,
  BoltIcon,
  CheckIcon,
  DocIcon,
  GavelIcon,
  PlateIcon,
  PlayIcon,
  SearchIcon,
  ShieldCheck,
  ShipIcon,
} from '@/components/Icons';
import { AgentCard } from '@/components/AgentCard';
import { LeadForm } from '@/components/LeadForm';
import { PublicCalculator } from '@/components/PublicCalculator';
import { SectionHead } from '@/components/SectionHead';
import { Timeline } from '@/components/Timeline';
import { VideoCard } from '@/components/VideoCard';
import { ARTICLES } from '@/content/articles';
import {
  ADVANTAGES,
  BRAND,
  HERO,
  LAYOUT,
  PRICES,
  REVIEWS,
  STATS,
  STEPS_FLOW,
  VIDEOS,
} from '@/content/brand';
import { useI18n } from '@/i18n';
import { useRouteData } from '@/ssr-data';

const SERVICES = [
  { Icon: SearchIcon, key: 'svc.select', descKey: 'svc.selectД' },
  { Icon: GavelIcon, key: 'svc.bid', descKey: 'svc.bidД' },
  { Icon: ShieldCheck, key: 'svc.check', descKey: 'svc.checkД' },
  { Icon: ShipIcon, key: 'svc.ship', descKey: 'svc.shipД' },
  { Icon: DocIcon, key: 'svc.customs', descKey: 'svc.customsД' },
  { Icon: PlateIcon, key: 'svc.cert', descKey: 'svc.certД' },
] as const;

/**
 * Иконки карточек преимуществ — по порядку карточек профиля.
 *
 * В профиле их нет намеренно: иконка это вёрстка, а не свойство бренда.
 * Карточек больше, чем иконок, — лишние получат последнюю, и это лучше, чем
 * пустой квадрат.
 */
const ADVANTAGE_ICONS = [ShipIcon, DocIcon, PlayIcon] as const;

/**
 * Тема вёрстки этого экземпляра.
 *
 * Читается один раз: профиль выбирается при импорте модуля и в течение жизни
 * страницы не меняется. Структурные расхождения ниже — условным рендером по
 * этому признаку, а не второй копией страницы: копия разошлась бы с
 * оригиналом на первой же правке текста.
 */
const IS_LARUS = LAYOUT === 'larus';

/**
 * Самая узкая колонка для сетки этапов.
 *
 * Сетка раскладывает карточки по ширине сама, но auto-fit дорисовывает
 * последний ряд пустотой: шесть этапов в пяти колонках дают 5 + 1 и дыру на
 * четыре ячейки — страница выглядит недоделанной. Поэтому берём делитель
 * количества: тогда последний ряд заполнен целиком.
 *
 * Делителя может не быть (семь этапов, например) — там остаётся прежнее
 * поведение: ровные широкие ряды важнее, чем короткий хвост.
 */
const WIDEST_ROW = 1150;

function stepTrackMin(count: number): string {
  const columns = [5, 4, 3].find((n) => count % n === 0) ?? 5;
  // 1150 / 5 = 230 — ровно та ширина, что стояла в стилях до профилей
  return `${Math.round(WIDEST_ROW / columns)}px`;
}

/**
 * Первый экран классической вёрстки: текст слева, карточка расчёта справа.
 *
 * Разметка перенесена без изменений — выдача боевого сайта остаётся прежней.
 */
function ClassicHero() {
  const { t } = useI18n();

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="stack" style={{ gap: 26 }}>
          <div className="eyebrow">{t('hero.eyebrow')}</div>
          <h1 className="display">
            {t('hero.title1')} <em>{t('hero.title2')}</em> {t('hero.title3')}
          </h1>
          <p className="lead" style={{ maxWidth: 560 }}>{t('hero.lead')}</p>

          <div className="row" style={{ gap: 14, marginTop: 4 }}>
            <a className="btn btn-red btn-lg" href="#lead">{t('hero.cta')}</a>
            <a className="btn btn-outline btn-lg" href="#steps">
              {t('hero.cta2')} <ArrowRight />
            </a>
          </div>

          <AgentCard />

          <div className="hero-badges" style={{ marginTop: 10 }}>
            <span className="badge badge-red">{t('hero.badge1')}</span>
            <span className="badge">{t('hero.badge2')}</span>
            <span className="badge">{t('hero.badge3')}</span>
          </div>
        </div>

        {/* Карточка расчёта — тот же формат, что менеджер отправляет клиенту */}
        <div className="calc-card">
          <div className="calc-card-head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{t('calc.title')}</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Jeep Compass Latitude, 2016</div>
            </div>
            <span className="badge" style={{ fontSize: 11.5 }}>Copart · TX</span>
          </div>

          <div className="stack" style={{ gap: 11 }}>
            <div className="calc-row"><span>{t('calc.bid')}</span><span className="mono">$7 400</span></div>
            <div className="calc-row"><span>{t('calc.delivery')}</span><span className="mono">$2 180</span></div>
            <div className="calc-row"><span>{t('calc.customs')}</span><span className="mono">$3 120</span></div>
            <div className="calc-row"><span>{t('calc.services')}</span><span className="mono">$860</span></div>
          </div>

          <div className="calc-total">
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('calc.total')}</span>
            <span className="calc-total-amount">{formatMoney(13560)}</span>
          </div>

          <p className="muted" style={{ fontSize: 13 }}>{t('calc.note')}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Первый экран темы larus: тёмно-синее полотно с полосой показателей.
 *
 * Фотографии здесь нет намеренно. У клиента в этом месте его собственная
 * съёмка грузовика с контейнером — чужой снимок брать нельзя, поэтому
 * настроение держит градиент с диагональной геометрией из CSS.
 *
 * Кнопки две: зелёная ведёт в калькулятор, прозрачная — к этапам доставки.
 * Отслеживания по VIN, которое есть у них, у нас нет: статус живёт внутри
 * сделки в CRM и наружу не отдаётся, а кнопка в никуда хуже её отсутствия.
 */
function LarusHero({ hero }: { hero: NonNullable<typeof HERO> }) {
  const { t } = useI18n();

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="stack" style={{ gap: 24 }}>
          <span className="hero-pill">
            <ShipIcon size={16} /> {t(hero.badgeKey)}
          </span>

          <h1 className="display">
            {t('hero.title1')} {t('hero.title2')} {t('hero.title3')}
          </h1>

          <p className="lead">{t('hero.lead')}</p>

          <p className="hero-hint">
            <BoltIcon /> {t(hero.hintKey)}
          </p>

          <div className="row" style={{ gap: 14, marginTop: 4 }}>
            <a className="btn btn-red btn-lg" href="#calculator">{t('hero.cta')}</a>
            <a className="btn btn-outline btn-lg" href="#steps">
              {t('hero.cta2')} <ArrowRight />
            </a>
          </div>

          <AgentCard />
        </div>
      </div>

      {/* Показатели под тонкой разделительной линией — крупное значение
          и мелкая подпись под ним */}
      <div className="hero-figures">
        {hero.stats.map((figure) => (
          <div className="hero-figure" key={figure.labelKey}>
            <div className="hero-figure-value">{t(figure.valueKey)}</div>
            <div className="hero-figure-label">{t(figure.labelKey)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Преимущества: карточки на кремовом фоне, чёрная карточка-призыв в конце
 * ряда и список коротких пунктов под ними.
 */
function Advantages({ advantages }: { advantages: NonNullable<typeof ADVANTAGES> }) {
  const { t } = useI18n();

  return (
    <section className="section" id="advantages">
      <div className="wrap">
        <SectionHead eyebrow="adv.eyebrow" title="adv.title" lead="adv.lead" />

        <div className="advantages">
          {advantages.cards.map((card, index) => {
            // Карточек может быть больше, чем иконок — последняя повторится
            const Icon = ADVANTAGE_ICONS[Math.min(index, ADVANTAGE_ICONS.length - 1)]!;
            return (
              <div className="advantage" key={card.titleKey}>
                <span className="advantage-icon"><Icon size={20} /></span>
                <h3>{t(card.titleKey)}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>{t(card.descKey)}</p>
              </div>
            );
          })}

          {/* Чёрная карточка с названием бренда золотым и широкой кнопкой */}
          <div className="advantage advantage-dark">
            <h3>{BRAND.name}</h3>
            <p>{t(advantages.promo.textKey)}</p>
            <a className="btn btn-red" href="#lead">{t(advantages.promo.ctaKey)}</a>
          </div>
        </div>

        <ul className="advantage-points">
          {advantages.points.map((point) => (
            <li key={point}>
              <span className="advantage-check"><CheckIcon size={13} /></span>
              {t(point)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Прайс: мелкая подпись, очень крупная цена и строка с деталями. */
function Prices({ prices }: { prices: NonNullable<typeof PRICES> }) {
  const { t } = useI18n();

  return (
    <section className="section section-sand" id="prices">
      <div className="wrap">
        <SectionHead eyebrow="price.eyebrow" title="price.title" lead="price.lead" />

        <div className="prices">
          {prices.map((price) => (
            <div className="price" key={price.captionKey}>
              <div className="price-caption">{t(price.captionKey)}</div>
              <div className="price-value">{t(price.valueKey)}</div>
              <p className="price-note">{t(price.noteKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Home() {
  const { t, href, tag, locale } = useI18n();
  const { data } = useRouteData<{ items: CarSummary[] }>('/', () =>
    fetch('/api/public/showcase?limit=8').then((r) => (r.ok ? r.json() : { items: [] })),
  );
  const cars = data?.items ?? [];

  return (
    <>
      {/* ─── Хиро ──────────────────────────────────────────────────────── */}
      {HERO ? <LarusHero hero={HERO} /> : <ClassicHero />}

      {/* ─── Доверие ───────────────────────────────────────────────────── */}
      <div className="trust">
        <div className="trust-inner">
          <span className="muted" style={{ fontSize: 14 }}>{t('trust.title')}</span>
          <span className="trust-sep" />
          <span className="trust-item">COPART</span>
          <span className="trust-sep" />
          <span className="trust-item">IAAI</span>
          <span className="trust-sep" />
          <span className="trust-item">MANHEIM</span>
        </div>
      </div>

      {/* ─── Цифры ─────────────────────────────────────────────────────── */}
      {/* Профиль с первым экраном показывает их там, под разделительной
          линией. Второй такой же полосы на странице быть не должно */}
      {HERO ? null : (
        <section className="section" style={{ paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 0 }}>
          <div className="wrap">
            <div className="stats">
              {STATS.map((stat) => (
                <div className="stat" key={stat.labelKey}>
                  <div className="stat-value">
                    {stat.prefix ? <span>{stat.prefix}</span> : null}
                    {Number(stat.value).toLocaleString(tag)}
                    {stat.suffix ? <span>{stat.suffix}</span> : null}
                  </div>
                  <div className="stat-label">{t(stat.labelKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Услуги ────────────────────────────────────────────────────── */}
      <section className="section" id="services">
        <div className="wrap">
          <SectionHead eyebrow="services.eyebrow" title="services.title" lead="services.lead" />

          <div className="services">
            {SERVICES.map(({ Icon, key, descKey }) => (
              <div className="service" key={key}>
                <span className="service-icon"><Icon size={22} /></span>
                <h3>{t(key)}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Этапы ─────────────────────────────────────────────────────── */}
      {/* Таймлайн темы larus стоит на светлом фоне: белые кружки с синей
          рамкой на тёмно-синем не читаются вовсе */}
      <section className={`section ${IS_LARUS ? 'section-sand' : 'section-navy'}`} id="steps">
        <div className="wrap">
          <SectionHead
            eyebrow="steps.eyebrow"
            title="steps.title"
            lead="steps.lead"
            leadStyle={IS_LARUS ? undefined : { color: 'var(--on-dark-soft)' }}
          />

          {/* Номер рисуем по порядку, а не храним в профиле: у разных клиентов
              разное число шагов, и выпавший из середины этап оставил бы дыру
              в нумерации */}
          {IS_LARUS ? (
            <Timeline steps={STEPS_FLOW} />
          ) : (
            <div
              className="steps"
              style={{ '--step-min': stepTrackMin(STEPS_FLOW.length) } as CSSProperties}
            >
              {STEPS_FLOW.map((step, index) => (
                <div className="step" key={step.titleKey}>
                  <div className="step-num">{String(index + 1).padStart(2, '0')}</div>
                  <h3>{t(step.titleKey)}</h3>
                  <p>{t(step.descKey)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Преимущества ──────────────────────────────────────────────── */}
      {ADVANTAGES ? <Advantages advantages={ADVANTAGES} /> : null}

      {/* ─── Цены ──────────────────────────────────────────────────────── */}
      {PRICES ? <Prices prices={PRICES} /> : null}

      {/* ─── Калькулятор ───────────────────────────────────────────────── */}
      <section className="section" id="calculator">
        <div className="wrap">
          <SectionHead eyebrow="pc.eyebrow" title="pc.title" lead="pc.lead" />
          <PublicCalculator />
        </div>
      </section>

      {/* ─── Авто ──────────────────────────────────────────────────────── */}
      <section className="section section-sand" id="cars">
        <div className="wrap">
          <SectionHead
            eyebrow="cars.eyebrow"
            title="cars.title"
            lead="cars.lead"
            aside={
              <Link className="btn btn-outline" to={href('/auto')}>
                {t('cars.all')} <ArrowRight />
              </Link>
            }
          />

          {cars.length > 0 ? (
            <div className="cars">
              {cars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          ) : (
            <div className="notice">{t('cars.empty')}</div>
          )}
        </div>
      </section>

      {/* ─── О компании ────────────────────────────────────────────────── */}
      <section className="section" id="about">
        <div className="wrap">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'center',
            }}
            className="about-grid"
          >
            <div className="stack">
              <div className="eyebrow">{t('about.eyebrow')}</div>
              <h2 className="display h2 rule">{t('about.title')}</h2>
            </div>
            <div className="stack" style={{ gap: 20 }}>
              <p className="lead" style={{ fontSize: 18, color: 'var(--ink)' }}>{t('about.p1')}</p>
              <p className="lead">{t('about.p2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Отзывы ────────────────────────────────────────────────────── */}
      {/* У нового клиента отзывов в пригодном виде может не быть. Пустая
          секция с заголовком «Что говорят клиенты» читается как обман —
          поэтому скрываем блок целиком, а не только карточки */}
      {REVIEWS.length > 0 ? (
        <section className="section section-sand" id="reviews">
          <div className="wrap">
            <SectionHead eyebrow="reviews.eyebrow" title="reviews.title" />

            <div className="reviews">
              {REVIEWS.map((review) => (
                <div className="review" key={review.textKey}>
                  {/* Звёзды — так отзывы показаны на сайте клиента, откуда
                      они и взяты. Оценка декоративная, поэтому скрыта от
                      экранного диктора: отдельных оценок у нас нет */}
                  {IS_LARUS ? <span className="review-stars" aria-hidden="true">★★★★★</span> : null}
                  <p>{t(review.textKey)}</p>
                  <div className="review-author">
                    <span className="review-avatar">{t(review.nameKey).charAt(0)}</span>
                    <span className="stack" style={{ gap: 1 }}>
                      <strong style={{ fontSize: 14.5 }}>{t(review.nameKey)}</strong>
                      <span className="faint" style={{ fontSize: 13 }}>{t(review.noteKey)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Видео ─────────────────────────────────────────────────────── */}
      {VIDEOS.length > 0 ? (
        <section className="section" id="videos">
          <div className="wrap">
            <SectionHead eyebrow="videos.eyebrow" title="videos.title" lead="videos.lead" />

            <div className="videos">
              {VIDEOS.map((video) => (
                <VideoCard key={video.id} id={video.id} titleKey={video.titleKey} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Статьи ────────────────────────────────────────────────────── */}
      <section className="section section-sand" id="blog">
        <div className="wrap">
          <SectionHead
            eyebrow="blog.eyebrow"
            title="blog.title"
            lead="blog.lead"
            aside={
              <Link className="btn btn-outline" to={href('/blog')}>
                {t('blog.all')} <ArrowRight />
              </Link>
            }
          />

          <div className="articles">
            {ARTICLES.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                to={href(`/blog/${article.slug}`)}
                className="article-card"
              >
                <div className="article-meta">
                  {new Date(article.date).toLocaleDateString(tag, {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </div>
                <h3 className="display">{article.title[locale]}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>
                  {article.excerpt[locale]}
                </p>
                <span className="article-more">{t('blog.readMore')} <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Заявка ────────────────────────────────────────────────────── */}
      <section className="section section-navy" id="lead">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="stack" style={{ gap: 20, textAlign: 'center', alignItems: 'center' }}>
            <div className="eyebrow">{t('nav.calc')}</div>
            <h2 className="display h2">{t('lead.title')}</h2>
            <p className="lead" style={{ color: 'var(--on-dark-soft)', maxWidth: 620 }}>{t('lead.lead')}</p>
            <div style={{ width: '100%', marginTop: 12 }}>
              <LeadForm source="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
