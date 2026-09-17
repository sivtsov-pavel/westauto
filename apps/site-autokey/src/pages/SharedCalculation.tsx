import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatMoney } from '@avtoklyuch/shared';
import { ArrowRight, KeyMark } from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BRAND } from '@/config';

interface SharedData {
  makeModel: string | null;
  year: number | null;
  fuel: string;
  engineVolume: number | null;
  batteryPower: number | null;
  platform: string;
  location: string;
  locale: 'ru' | 'uk';
  breakdown: { label: string; amount: number }[];
  total: number;
  usdUah: number | null;
  createdAt: string;
  expiresAt: string | null;
}

const T = {
  uk: {
    title: 'Ваш розрахунок',
    total: 'Разом під ключ',
    includes:
      'Ціна включає ставку на аукціоні, доставку, збори, розмитнення та оформлення. Без доплат на митниці.',
    rate: 'Курс розрахунку',
    valid: 'Розрахунок дійсний до',
    made: 'Розраховано',
    questions: 'Залишились питання?',
    questionsText: 'Залиште контакти — менеджер передзвонить і відповість.',
    gone: 'Посилання більше не діє',
    goneText: 'Попросіть менеджера надіслати актуальний розрахунок.',
    home: 'На головну',
    fuel: { petrol: 'Бензин', diesel: 'Дизель', electric: 'Електро', hybrid: 'Гібрид' },
  },
  ru: {
    title: 'Ваш расчёт',
    total: 'Итого под ключ',
    includes:
      'Цена включает ставку на аукционе, доставку, сборы, растаможку и оформление. Без доплат на таможне.',
    rate: 'Курс расчёта',
    valid: 'Расчёт действителен до',
    made: 'Рассчитано',
    questions: 'Остались вопросы?',
    questionsText: 'Оставьте контакты — менеджер перезвонит и ответит.',
    gone: 'Ссылка больше не действует',
    goneText: 'Попросите менеджера прислать актуальный расчёт.',
    home: 'На главную',
    fuel: { petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид' },
  },
} as const;

/**
 * Страница расчёта по ссылке от менеджера.
 *
 * Клиент попадает сюда без входа в систему и видит только свою цену.
 * Никаких внутренних данных здесь нет и быть не может: сервер отдаёт
 * отдельный, заранее очищенный набор полей.
 */
export function SharedCalculation() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'gone'>('loading');

  const t = T[data?.locale ?? 'uk'];

  useDocumentTitle(
    data ? `${t.title} — ${formatMoney(data.total)} · ${BRAND.full}` : `${BRAND.full}`,
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    void fetch(`/api/public/calculation/${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('gone');
        return (await response.json()) as { calculation: SharedData };
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload.calculation);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('gone');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === 'loading') {
    return <div className="empty-state">…</div>;
  }

  if (state === 'gone' || !data) {
    return (
      <div className="empty-state">
        <h1 className="serif" style={{ fontSize: 28, marginBottom: 12 }}>{t.gone}</h1>
        <p style={{ marginTop: 0 }}>{t.goneText}</p>
        <Link className="btn btn-outline btn-sm" to="/">
          {t.home} <ArrowRight />
        </Link>
      </div>
    );
  }

  const dateLocale = data.locale === 'uk' ? 'uk-UA' : 'ru-RU';
  const vehicle = [data.year, data.makeModel].filter(Boolean).join(' ');
  const specs = [
    (t.fuel as Record<string, string>)[data.fuel] ?? data.fuel,
    data.fuel === 'electric'
      ? data.batteryPower
        ? `${data.batteryPower} кВт·год`
        : null
      : data.engineVolume
        ? `${String(data.engineVolume).replace('.', ',')} л`
        : null,
    [data.platform === 'copart' ? 'Copart' : 'IAAI', data.location].filter(Boolean).join(' · '),
  ].filter(Boolean) as string[];

  return (
    <section className="section shared-calc">
      <div className="shared-card">
        <header className="spread" style={{ alignItems: 'flex-start' }}>
          <div className="logo">
            <span style={{ color: 'var(--accent-deep)', display: 'flex' }}>
              <KeyMark size={22} />
            </span>
            <span className="logo-text">
              <b style={{ fontSize: 17 }}>{BRAND.prefix}</b>
              <em style={{ fontSize: 19 }}>{BRAND.accent}</em>
            </span>
          </div>
          <div className="mono muted" style={{ fontSize: 11.5, textAlign: 'right', lineHeight: 1.7 }}>
            <div>
              {t.made} {new Date(data.createdAt).toLocaleDateString(dateLocale)}
            </div>
            {data.expiresAt && (
              <div>
                {t.valid} {new Date(data.expiresAt).toLocaleDateString(dateLocale)}
              </div>
            )}
          </div>
        </header>

        <div className="stack" style={{ gap: 8 }}>
          <h1 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.1 }}>
            {vehicle || t.title}
          </h1>
          <div className="car-specs">
            {specs.map((spec) => (
              <span key={spec}>{spec}</span>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          {data.breakdown.map((row) => (
            <div className="price-row" key={row.label}>
              <span>{row.label}</span>
              <span className="mono">{formatMoney(row.amount)}</span>
            </div>
          ))}
          <div className="price-total">
            <span style={{ fontSize: 16, fontWeight: 600 }}>{t.total}</span>
            <span className="amount" style={{ fontSize: 'clamp(26px, 4vw, 34px)' }}>
              {formatMoney(data.total)}
            </span>
          </div>
          {data.usdUah && (
            <div className="mono muted" style={{ fontSize: 12 }}>
              {t.rate}: {data.usdUah.toFixed(2).replace('.', ',')} ₴/$ ·{' '}
              {formatMoney(data.total * data.usdUah, 'UAH')}
            </div>
          )}
        </div>

        <p className="notice" style={{ margin: 0 }}>{t.includes}</p>

        <div className="stack" style={{ gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{t.questions}</div>
            <div className="muted" style={{ fontSize: 14 }}>{t.questionsText}</div>
          </div>
          <LeadForm source={`shared:${token ?? ''}`} compact />
        </div>
      </div>
    </section>
  );
}
