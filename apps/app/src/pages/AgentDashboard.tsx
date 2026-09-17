import { useCallback, useEffect, useState } from 'react';
import { formatMoney, COMMISSION_LABELS, type AgentProfile, type AgentStats } from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import { CopyIcon } from '@/components/Icons';
import { useToast } from '@/state/toast';

interface Deal {
  id: string;
  makeModel: string | null;
  year: number | null;
  clientTotalUsd: number;
  commissionUsd: number;
  outcome: 'won' | 'lost';
  outcomeAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

/**
 * Кабинет агента.
 *
 * Показывает ровно то, что агенту положено: его клиенты, его сделки и его
 * вознаграждение. Тарифов, маржи и чужих цифр здесь нет — это не «урезанный
 * кабинет менеджера», а отдельный экран для партнёра.
 */
export function AgentDashboard() {
  const toast = useToast();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ agent: AgentProfile | null; stats: AgentStats | null; deals: Deal[] }>(
        '/api/agent/summary',
      );
      setAgent(data.agent);
      setStats(data.stats);
      setDeals(data.deals);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить кабинет');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="empty">Загружаю…</div>;
  if (!agent || !stats) return <div className="empty">Кабинет доступен только агентам.</div>;

  const primaryDomain = agent.domains.find((d) => d.isActive)?.host;
  const refLink = agent.referralCode
    ? `https://westauto.seoshkin.tools/?ref=${agent.referralCode}`
    : null;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Ссылка скопирована');
    } catch {
      toast.push(text);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Мой кабинет</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {COMMISSION_LABELS[agent.commissionType]}:{' '}
            <strong>
              {agent.commissionType === 'fixed'
                ? formatMoney(agent.commissionValue)
                : `${String(agent.commissionValue).replace('.', ',')}%`}
            </strong>
          </div>
        </div>
      </header>

      <div className="page">
        <div className="grid-4">
          <StatCard label="Клиентов приведено" value={String(stats.leadsTotal)} />
          <StatCard label="Из них новых" value={String(stats.leadsNew)} accent={stats.leadsNew > 0} />
          <StatCard label="Сделок закрыто" value={String(stats.dealsWon)} />
          <StatCard label="К выплате" value={formatMoney(stats.commissionPending)} accent />
        </div>

        {/* Ссылки, по которым приходят клиенты агента */}
        <section className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Мои ссылки</div>
          <div className="stack" style={{ gap: 14 }}>
            {primaryDomain && (
              <div className="stack" style={{ gap: 6 }}>
                <span className="muted" style={{ fontSize: 12.5 }}>Персональный сайт</span>
                <div className="share-box">
                  <span className="mono grow" style={{ fontSize: 13 }}>https://{primaryDomain}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => void copy(`https://${primaryDomain}`)}
                    aria-label="Скопировать адрес сайта"
                  >
                    <CopyIcon size={12} />
                  </button>
                </div>
              </div>
            )}

            {refLink && (
              <div className="stack" style={{ gap: 6 }}>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  Ссылка с меткой — работает без своего домена
                </span>
                <div className="share-box">
                  <span className="mono grow" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>
                    {refLink}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => void copy(refLink)}
                    aria-label="Скопировать ссылку"
                  >
                    <CopyIcon size={12} />
                  </button>
                </div>
              </div>
            )}

            <div className="banner">
              Клиент, пришедший по вашей ссылке или с вашего сайта, автоматически
              закрепляется за вами. Заявки видны в разделе «Клиенты».
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>
            Мои сделки
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Авто</th>
                  <th>Цена клиенту</th>
                  <th>Моё вознаграждение</th>
                  <th>Статус</th>
                  <th>Выплата</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id}>
                    <td>{[deal.year, deal.makeModel].filter(Boolean).join(' ') || '—'}</td>
                    <td className="mono nowrap">{formatMoney(deal.clientTotalUsd)}</td>
                    <td className="mono nowrap">
                      {deal.outcome === 'won' ? formatMoney(deal.commissionUsd) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${deal.outcome === 'won' ? 'badge-teal' : 'badge-muted'}`}>
                        {deal.outcome === 'won' ? 'Сделка состоялась' : 'Не состоялась'}
                      </span>
                    </td>
                    <td className="nowrap">
                      {deal.paidAt ? (
                        <span className="muted">
                          {new Date(deal.paidAt).toLocaleDateString('ru-RU')}
                        </span>
                      ) : deal.outcome === 'won' ? (
                        <span className="badge badge-accent">ожидает</span>
                      ) : (
                        <span className="faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {deals.length === 0 && (
            <div className="empty">
              Закрытых сделок пока нет. Считайте стоимость на вкладке «Расчёт» и
              отправляйте клиентам ссылку на расчёт.
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Всего заработано</div>
          <div className="grid-3">
            <StatCard label="Начислено" value={formatMoney(stats.commissionEarned)} />
            <StatCard label="Выплачено" value={formatMoney(stats.commissionPaid)} />
            <StatCard label="Ожидает выплаты" value={formatMoney(stats.commissionPending)} accent />
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="stack" style={{ gap: 4 }}>
        <span className="muted" style={{ fontSize: 12 }}>{label}</span>
        <span
          className="mono"
          style={{ fontSize: 24, fontWeight: 600, color: accent ? 'var(--accent)' : undefined }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
