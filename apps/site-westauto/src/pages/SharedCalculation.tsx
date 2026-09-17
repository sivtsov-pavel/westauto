import { Link, useParams } from 'react-router-dom';
import { formatMoney } from '@avtoklyuch/shared';
import { ArrowRight } from '@/components/Icons';
import { LeadForm } from '@/components/LeadForm';
import { BRAND } from '@/content/brand';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';
import { useRouteData } from '@/ssr-data';

interface SharedData {
  makeModel: string | null;
  year: number | null;
  breakdown: { label: string; amount: number }[];
  total: number;
  usdUah: number | null;
  createdAt: string;
  expiresAt: string | null;
}

/** Расчёт, отправленный менеджером клиенту. Ничего внутреннего здесь нет. */
export function SharedCalculation() {
  const { t, href, tag } = useI18n();
  const { token } = useParams<{ token: string }>();

  const { data, state } = useRouteData<{ calculation: SharedData }>(`/rozrahunok/${token ?? ''}`, () =>
    fetch(`/api/public/calculation/${encodeURIComponent(token ?? '')}`).then(async (r) => {
      if (!r.ok) throw new Error('gone');
      return (await r.json()) as { calculation: SharedData };
    }),
  );

  const calc = data?.calculation ?? null;
  useDocumentTitle(calc ? `${t('shared.title')} — ${formatMoney(calc.total)}` : BRAND.name);

  if (state === 'loading') return <div className="empty-state">{t('common.loading')}</div>;

  if (state === 'error' || !calc) {
    return (
      <div className="empty-state">
        <h1 className="display h2" style={{ marginBottom: 12 }}>{t('shared.gone')}</h1>
        <p style={{ marginBottom: 24 }}>{t('shared.goneText')}</p>
        <Link className="btn btn-outline btn-sm" to={href('/')}>
          {t('shared.home')} <ArrowRight />
        </Link>
      </div>
    );
  }

  const vehicle = [calc.year, calc.makeModel].filter(Boolean).join(' ');

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 680 }}>
        <div className="calc-card" style={{ gap: 26 }}>
          <div className="calc-card-head">
            <img src={BRAND.logo} alt={BRAND.name} width={180} height={36} style={{ height: 36, width: 'auto' }} />
            <div className="mono faint" style={{ fontSize: 11.5, textAlign: 'right', lineHeight: 1.7 }}>
              <div>{t('shared.made')} {new Date(calc.createdAt).toLocaleDateString(tag)}</div>
              {calc.expiresAt && (
                <div>{t('shared.valid')} {new Date(calc.expiresAt).toLocaleDateString(tag)}</div>
              )}
            </div>
          </div>

          <h1 className="display h2">{vehicle || t('shared.title')}</h1>

          <div className="stack" style={{ gap: 11 }}>
            {calc.breakdown.map((row) => (
              <div className="calc-row" key={row.label}>
                <span>{row.label}</span>
                <span className="mono">{formatMoney(row.amount)}</span>
              </div>
            ))}
          </div>

          <div className="calc-total">
            <span style={{ fontWeight: 700, fontSize: 17 }}>{t('cars.turnkey')}</span>
            <span className="calc-total-amount">{formatMoney(calc.total)}</span>
          </div>

          {calc.usdUah && (
            <div className="mono muted" style={{ fontSize: 12.5 }}>
              {t('shared.rate')}: {calc.usdUah.toFixed(2).replace('.', ',')} ₴/$ ·{' '}
              {formatMoney(calc.total * calc.usdUah, 'UAH')}
            </div>
          )}

          <p className="notice" style={{ margin: 0 }}>{t('calc.note')}</p>

          <div className="stack" style={{ gap: 12 }}>
            <strong>{t('shared.questions')}</strong>
            <span className="muted" style={{ fontSize: 14.5 }}>{t('shared.questionsText')}</span>
            <LeadForm source={`shared:${token ?? ''}`} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
