import { Link } from 'react-router-dom';
import { formatMoney } from '@avtoklyuch/shared';
import { CarCard, type CarSummary } from '@/components/CarCard';
import {
  ArrowRight,
  DocIcon,
  GavelIcon,
  PlateIcon,
  SearchIcon,
  ShieldCheck,
  ShipIcon,
} from '@/components/Icons';
import { AgentCard } from '@/components/AgentCard';
import { LeadForm } from '@/components/LeadForm';
import { PublicCalculator } from '@/components/PublicCalculator';
import { VideoCard } from '@/components/VideoCard';
import { ARTICLES } from '@/content/articles';
import { REVIEWS, STATS, VIDEOS } from '@/content/brand';
import type { DictKey } from '@/content/dict';
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

const STEPS = Array.from({ length: 10 }, (_, i) => i + 1);

export function Home() {
  const { t, href, tag, locale } = useI18n();
  const { data } = useRouteData<{ items: CarSummary[] }>('/', () =>
    fetch('/api/public/showcase?limit=8').then((r) => (r.ok ? r.json() : { items: [] })),
  );
  const cars = data?.items ?? [];

  return (
    <>
      {/* ─── Хиро ──────────────────────────────────────────────────────── */}
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
      <section className="section" style={{ paddingTop: 'clamp(40px, 5vw, 72px)', paddingBottom: 0 }}>
        <div className="wrap">
          <div className="stats">
            {STATS.map((stat) => (
              <div className="stat" key={stat.labelKey}>
                <div className="stat-value">
                  {'prefix' in stat && stat.prefix ? <span>{stat.prefix}</span> : null}
                  {Number(stat.value).toLocaleString(tag)}
                  {'suffix' in stat && stat.suffix ? <span>{stat.suffix}</span> : null}
                </div>
                <div className="stat-label">{t(stat.labelKey as DictKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Услуги ────────────────────────────────────────────────────── */}
      <section className="section" id="services">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('services.eyebrow')}</div>
              <h2 className="display h2 rule">{t('services.title')}</h2>
              <p className="lead">{t('services.lead')}</p>
            </div>
          </div>

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
      <section className="section section-navy" id="steps">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('steps.eyebrow')}</div>
              <h2 className="display h2 rule">{t('steps.title')}</h2>
              <p className="lead" style={{ color: '#9fb2c0' }}>{t('steps.lead')}</p>
            </div>
          </div>

          <div className="steps">
            {STEPS.map((n) => (
              <div className="step" key={n}>
                <div className="step-num">{String(n).padStart(2, '0')}</div>
                <h3>{t(`step.${n}` as DictKey)}</h3>
                <p>{t(`step.${n}d` as DictKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Калькулятор ───────────────────────────────────────────────── */}
      <section className="section" id="calculator">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('pc.eyebrow')}</div>
              <h2 className="display h2 rule">{t('pc.title')}</h2>
              <p className="lead">{t('pc.lead')}</p>
            </div>
          </div>
          <PublicCalculator />
        </div>
      </section>

      {/* ─── Авто ──────────────────────────────────────────────────────── */}
      <section className="section section-sand" id="cars">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('cars.eyebrow')}</div>
              <h2 className="display h2 rule">{t('cars.title')}</h2>
              <p className="lead">{t('cars.lead')}</p>
            </div>
            <Link className="btn btn-outline" to={href('/auto')}>
              {t('cars.all')} <ArrowRight />
            </Link>
          </div>

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
      <section className="section section-sand" id="reviews">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('reviews.eyebrow')}</div>
              <h2 className="display h2 rule">{t('reviews.title')}</h2>
            </div>
          </div>

          <div className="reviews">
            {REVIEWS.map((review) => (
              <div className="review" key={review.name}>
                <p>{t(review.textKey as DictKey)}</p>
                <div className="review-author">
                  <span className="review-avatar">{review.name.charAt(0)}</span>
                  <span className="stack" style={{ gap: 1 }}>
                    <strong style={{ fontSize: 14.5 }}>{review.name}</strong>
                    <span className="faint" style={{ fontSize: 13 }}>{review.car}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Видео ─────────────────────────────────────────────────────── */}
      <section className="section" id="videos">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('videos.eyebrow')}</div>
              <h2 className="display h2 rule">{t('videos.title')}</h2>
              <p className="lead">{t('videos.lead')}</p>
            </div>
          </div>

          <div className="videos">
            {VIDEOS.map((video) => (
              <VideoCard key={video.id} id={video.id} titleKey={video.titleKey} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Статьи ────────────────────────────────────────────────────── */}
      <section className="section section-sand" id="blog">
        <div className="wrap">
          <div className="section-head">
            <div className="stack">
              <div className="eyebrow">{t('blog.eyebrow')}</div>
              <h2 className="display h2 rule">{t('blog.title')}</h2>
              <p className="lead">{t('blog.lead')}</p>
            </div>
            <Link className="btn btn-outline" to={href('/blog')}>
              {t('blog.all')} <ArrowRight />
            </Link>
          </div>

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
            <p className="lead" style={{ color: '#9fb2c0', maxWidth: 620 }}>{t('lead.lead')}</p>
            <div style={{ width: '100%', marginTop: 12 }}>
              <LeadForm source="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
