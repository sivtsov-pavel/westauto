import {
  ArrowRight,
  BoltIcon,
  CheckIcon,
  DocIcon,
  LockIcon,
  PlateIcon,
  SearchIcon,
  ShieldCheck,
  ShipIcon,
} from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import { SectionHead } from '@/components/SectionHead';
import { Timeline } from '@/components/Timeline';
import { BRAND } from '@/content/brand';
import type { BrandStep } from '@/content/brands/types';
import type { DictKey } from '@/content/texts';
import { useI18n } from '@/i18n';

/**
 * «Стати партнером» — главная страница поддомена partners.*
 *
 * Читает её человек, который возит одну-две машины в месяц или держит поток
 * клиентов, и решает, работать ли с нами. Поэтому страница про инструменты, а
 * не про «унікальні можливості»: кабинет, калькулятор, расчёт ссылкой, своя
 * страница, нарисованное вознаграждение и видимый статус авто — всё это в
 * системе уже есть, и каждое утверждение здесь можно показать на экране.
 *
 * Чего в системе нет — мобильного приложения партнёра, выплат онлайн,
 * автоматических уведомлений клиенту, API — на странице нет ни словом.
 * Обещание, которого не видно в кабинете, стоит дороже, чем недосказанность:
 * оно выясняется на первой же сделке.
 *
 * Вёрстка целиком на классах темы larus: тёмный первый экран с диагональю,
 * центрированные заголовки, карточки услуг, таймлайн, кремовые карточки
 * преимуществ. Своих стилей страница не добавляет — её визуальный язык обязан
 * совпадать с главной, иначе поддомен читается как чужой сайт.
 */

/** Что получает партнёр — карточками с иконками. */
const TOOLS: readonly { Icon: typeof LockIcon; key: DictKey; descKey: DictKey }[] = [
  { Icon: LockIcon, key: 'partners.tool.cabinet', descKey: 'partners.tool.cabinetD' },
  { Icon: SearchIcon, key: 'partners.tool.calc', descKey: 'partners.tool.calcD' },
  { Icon: DocIcon, key: 'partners.tool.quote', descKey: 'partners.tool.quoteD' },
  { Icon: PlateIcon, key: 'partners.tool.page', descKey: 'partners.tool.pageD' },
  { Icon: ShieldCheck, key: 'partners.tool.reward', descKey: 'partners.tool.rewardD' },
  { Icon: ShipIcon, key: 'partners.tool.status', descKey: 'partners.tool.statusD' },
  { Icon: BoltIcon, key: 'partners.tool.leads', descKey: 'partners.tool.leadsD' },
];

/** Два варианта условий. Конкретных ставок нет намеренно — они индивидуальны. */
const REWARDS: readonly { key: DictKey; descKey: DictKey }[] = [
  { key: 'partners.reward.fixed', descKey: 'partners.reward.fixedD' },
  { key: 'partners.reward.share', descKey: 'partners.reward.shareD' },
];

/** Короткие пункты под карточками условий. */
const REWARD_POINTS: readonly DictKey[] = [
  'partners.reward.p1',
  'partners.reward.p2',
  'partners.reward.p3',
];

/**
 * Путь партнёра от заявки до первой сделки.
 *
 * Той же формы, что шаги доставки в профиле бренда, — и рисуется тем же
 * таймлайном, что на главной: человек уже видел этот приём на главной
 * странице и читает его без усилия.
 */
const START_STEPS: readonly BrandStep[] = [
  { titleKey: 'partners.start.1', descKey: 'partners.start.1d' },
  { titleKey: 'partners.start.2', descKey: 'partners.start.2d' },
  { titleKey: 'partners.start.3', descKey: 'partners.start.3d' },
  { titleKey: 'partners.start.4', descKey: 'partners.start.4d' },
];

export function Partners() {
  const { t } = useI18n();

  return (
    <>
      {/* ─── Первый экран ──────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="stack" style={{ gap: 24 }}>
            <span className="hero-pill">
              <ShieldCheck size={16} /> {t('partners.hero.badge')}
            </span>

            <h1 className="display">{t('partners.hero.title')}</h1>

            <p className="lead">{t('partners.hero.lead')}</p>

            <p className="hero-hint">
              <BoltIcon /> {t('partners.hero.hint')}
            </p>

            <div className="row" style={{ gap: 14, marginTop: 4 }}>
              <a className="btn btn-red btn-lg" href="#partner-lead">
                {t('partners.hero.cta')}
              </a>
              <a className="btn btn-outline btn-lg" href="#tools">
                {t('partners.hero.cta2')} <ArrowRight />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Что получает партнёр ──────────────────────────────────────── */}
      {/* Главный блок страницы: человек решает по нему, а не по заголовку */}
      <section className="section" id="tools">
        <div className="wrap">
          <SectionHead
            eyebrow="partners.tools.eyebrow"
            title="partners.tools.title"
            lead="partners.tools.lead"
          />

          <div className="services">
            {TOOLS.map(({ Icon, key, descKey }) => (
              <div className="service" key={key}>
                <span className="service-icon"><Icon size={22} /></span>
                <h3>{t(key)}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Условия вознаграждения ────────────────────────────────────── */}
      <section className="section section-sand" id="reward">
        <div className="wrap">
          <SectionHead
            eyebrow="partners.reward.eyebrow"
            title="partners.reward.title"
            lead="partners.reward.lead"
          />

          <div className="advantages">
            {REWARDS.map(({ key, descKey }) => (
              <div className="advantage" key={key}>
                <span className="advantage-icon"><CheckIcon size={20} /></span>
                <h3>{t(key)}</h3>
                <p className="muted" style={{ fontSize: 14.5 }}>{t(descKey)}</p>
              </div>
            ))}

            {/* Тёмная карточка-призыв замыкает ряд — как на главной */}
            <div className="advantage advantage-dark">
              <h3>{BRAND.name}</h3>
              <p>{t('partners.reward.promo')}</p>
              <a className="btn btn-red" href="#partner-lead">
                {t('partners.reward.promoCta')}
              </a>
            </div>
          </div>

          <ul className="advantage-points">
            {REWARD_POINTS.map((point) => (
              <li key={point}>
                <span className="advantage-check"><CheckIcon size={13} /></span>
                {t(point)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Как начать ────────────────────────────────────────────────── */}
      <section className="section" id="start">
        <div className="wrap">
          <SectionHead
            eyebrow="partners.start.eyebrow"
            title="partners.start.title"
            lead="partners.start.lead"
          />
          <Timeline steps={START_STEPS} />
        </div>
      </section>

      {/* ─── Заявка ────────────────────────────────────────────────────── */}
      {/* Та же форма и тот же механизм, что на главной: заявка уходит в CRM.
          Метка источника своя — менеджеру видно, что человек пришёл за
          партнёрством, а не за машиной */}
      <section className="section section-navy" id="partner-lead">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="stack" style={{ gap: 20, textAlign: 'center', alignItems: 'center' }}>
            <div className="eyebrow">{t('partners.lead.eyebrow')}</div>
            <h2 className="display h2">{t('partners.lead.title')}</h2>
            <p className="lead" style={{ color: 'var(--on-dark-soft)', maxWidth: 620 }}>
              {t('partners.lead.lead')}
            </p>
            <div style={{ width: '100%', marginTop: 12 }}>
              <LeadForm
                source="partners"
                cityKey="partners.lead.city"
                commentKey="partners.lead.about"
                submitKey="partners.lead.submit"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
