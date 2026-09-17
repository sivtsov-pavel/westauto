import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/api/client';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import {
  ARTICLE_LABELS,
  STAGE_COLORS,
  STAGE_LABELS,
  STAGES,
  ago,
  money,
  shortDate,
  sourceLabel,
} from './deals/dictionary';
import type { DealArticle, DealStage } from '@/api/types';

interface Summary {
  totals: {
    clientsTotal: number;
    clientsReturning: number;
    dealsActive: number;
    dealsDelivered: number;
    leadsNew: number;
    plannedUsd: number;
    paidUsd: number;
    debtUsd: number;
  };
  stages: { stage: DealStage; deals: number; amountUsd: number }[];
  months: { month: string; newClients: number; returningClients: number; deals: number; paidUsd: number }[];
  articles: { article: DealArticle; plannedUsd: number; paidUsd: number }[];
  upcoming: {
    id: string;
    makeModel: string | null;
    year: number | null;
    lotNumber: string | null;
    clientName: string;
    portEta: string | null;
  }[];
  recent: {
    dealId: string;
    makeModel: string | null;
    year: number | null;
    clientName: string;
    fromStage: DealStage | null;
    toStage: DealStage;
    createdAt: string;
  }[];
  sources: { source: string; count: number }[];
  topCars: { make: string; count: number }[];
}

/**
 * Сводка — первое, что видит человек, открыв систему.
 *
 * Отвечает на четыре вопроса в порядке их важности: сколько денег ждём от
 * клиентов, что происходит с машинами прямо сейчас, растём ли мы и
 * возвращаются ли люди. Всё остальное — на своих экранах.
 *
 * Графики нарисованы разметкой и SVG, без библиотек: здесь нужны четыре
 * простые формы, а лишняя зависимость в бандле стоит дороже.
 */
export function Dashboard() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Summary | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get<Summary>('/api/dashboard'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить сводку');
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return (
      <>
        <header className="topbar">
          <div style={{ fontSize: 18, fontWeight: 600 }}>Сводка</div>
        </header>
        <div className="page"><div className="empty">Считаю…</div></div>
      </>
    );
  }

  const { totals } = data;
  const empty = totals.clientsTotal === 0 && totals.dealsActive === 0;

  // Доля оплаченного — на неё смотрят первым делом: это деньги, которые
  // уже в кассе, против тех, что ещё предстоит собрать
  const paidShare = totals.plannedUsd > 0 ? totals.paidUsd / totals.plannedUsd : 0;
  const returnShare =
    totals.clientsTotal > 0 ? totals.clientsReturning / totals.clientsTotal : 0;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const firstName = (user?.fullName ?? '').split(' ')[0];

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {empty
              ? 'Данных пока нет — заведите первого клиента и сделку'
              : `${totals.dealsActive} сделок в работе · ${totals.leadsNew} новых заявок`}
          </div>
        </div>
        <div className="row-flex" style={{ gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/deals')}>
            Все сделки
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/calc')}>
            Новый расчёт
          </button>
        </div>
      </header>

      <div className="page">
        {empty ? (
          <div className="card">
            <div className="empty">
              Как только появятся клиенты и сделки, здесь будут деньги в работе,
              движение по этапам и рост по месяцам.
            </div>
          </div>
        ) : (
          <div className="dash">
            {/* ─── Деньги: главная плитка ─── */}
            <section className="card dash-money">
              <div className="card-head">
                <span>Деньги в работе</span>
                <span className="faint" style={{ fontSize: 11.5 }}>
                  без проигранных сделок
                </span>
              </div>

              <div className="dash-money-figures">
                <div className="stack" style={{ gap: 2 }}>
                  <span className="faint" style={{ fontSize: 11 }}>Начислено клиентам</span>
                  <strong style={{ fontSize: 26 }}>{money(totals.plannedUsd)}</strong>
                </div>
                <div className="stack" style={{ gap: 2 }}>
                  <span className="faint" style={{ fontSize: 11 }}>Уже оплачено</span>
                  <strong style={{ fontSize: 26, color: 'var(--teal)' }}>
                    {money(totals.paidUsd)}
                  </strong>
                </div>
                <div className="stack" style={{ gap: 2 }}>
                  <span className="faint" style={{ fontSize: 11 }}>Ждём от клиентов</span>
                  <strong style={{ fontSize: 26, color: 'var(--danger)' }}>
                    {money(totals.debtUsd)}
                  </strong>
                </div>
              </div>

              <div className="dash-bar">
                <span style={{ width: `${paidShare * 100}%` }} />
              </div>
              <div className="faint" style={{ fontSize: 11.5 }}>
                Собрано {Math.round(paidShare * 100)}% от начисленного
              </div>

              {/* Долг по статьям: видно, где именно висят деньги */}
              <div className="dash-articles">
                {data.articles
                  .filter((a) => a.plannedUsd > 0)
                  .map((a) => {
                    const rest = a.plannedUsd - a.paidUsd;
                    const share = a.plannedUsd > 0 ? Math.min(1, a.paidUsd / a.plannedUsd) : 0;
                    return (
                      <div className="dash-article" key={a.article}>
                        <div className="row-flex" style={{ justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12 }}>{ARTICLE_LABELS[a.article]}</span>
                          <span className="mono" style={{ fontSize: 11.5, color: rest > 1 ? 'var(--warning)' : 'var(--teal)' }}>
                            {rest > 1 ? `−${money(rest)}` : 'закрыто'}
                          </span>
                        </div>
                        <div className="dash-bar dash-bar-thin">
                          <span style={{ width: `${share * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* ─── Воронка по этапам ─── */}
            <section className="card">
              <div className="card-head">
                <span>Где сейчас машины</span>
              </div>
              <div className="stack" style={{ gap: 7 }}>
                {STAGES.map((stage) => {
                  const row = data.stages.find((s) => s.stage === stage);
                  const count = row?.deals ?? 0;
                  const max = Math.max(1, ...data.stages.map((s) => s.deals));
                  return (
                    <button
                      type="button"
                      className="funnel-row"
                      key={stage}
                      onClick={() => navigate('/deals')}
                    >
                      <span className="funnel-name">{STAGE_LABELS[stage]}</span>
                      <span className="funnel-track">
                        <span
                          className="funnel-fill"
                          style={{
                            width: `${(count / max) * 100}%`,
                            background: STAGE_COLORS[stage],
                            opacity: count ? 1 : 0.25,
                          }}
                        />
                      </span>
                      <span className="funnel-count mono">{count || '—'}</span>
                      <span className="funnel-money mono faint">
                        {row && row.amountUsd > 0 ? money(row.amountUsd) : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ─── Клиенты по месяцам ─── */}
            <section className="card dash-wide">
              <div className="card-head">
                <span>Клиенты по месяцам</span>
                <span className="faint" style={{ fontSize: 11.5 }}>
                  {totals.clientsTotal} всего · {totals.clientsReturning} вернулись
                  {returnShare > 0 ? ` (${Math.round(returnShare * 100)}%)` : ''}
                </span>
              </div>
              <MonthsChart months={data.months} />
            </section>

            {/* ─── Скоро в порту ─── */}
            <section className="card">
              <div className="card-head">
                <span>Ждём в порту</span>
              </div>
              {data.upcoming.length === 0 ? (
                <div className="faint" style={{ fontSize: 12.5 }}>
                  Ближайший месяц никто не приходит.
                </div>
              ) : (
                <div className="stack" style={{ gap: 8 }}>
                  {data.upcoming.map((u) => {
                    const late = u.portEta !== null && new Date(u.portEta).getTime() < Date.now();
                    return (
                      <button
                        type="button"
                        className="dash-line"
                        key={u.id}
                        onClick={() => navigate('/deals')}
                      >
                        <div className="stack" style={{ gap: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5 }}>
                            {u.makeModel ?? 'Авто'}{u.year ? ` · ${u.year}` : ''}
                          </span>
                          <span className="faint" style={{ fontSize: 11 }}>{u.clientName}</span>
                        </div>
                        <span
                          className="mono"
                          style={{ fontSize: 11.5, color: late ? 'var(--danger)' : 'var(--text-soft)' }}
                        >
                          {shortDate(u.portEta)}{late ? ' · опаздывает' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ─── Откуда приходят ─── */}
            <section className="card">
              <div className="card-head">
                <span>Откуда приходят клиенты</span>
              </div>
              <div className="stack" style={{ gap: 7 }}>
                {data.sources.map((s) => {
                  const max = Math.max(1, ...data.sources.map((x) => x.count));
                  return (
                    <div className="funnel-row" key={s.source}>
                      <span className="funnel-name">{sourceLabel(s.source)}</span>
                      <span className="funnel-track">
                        <span
                          className="funnel-fill"
                          style={{ width: `${(s.count / max) * 100}%`, background: 'var(--accent)' }}
                        />
                      </span>
                      <span className="funnel-count mono">{s.count}</span>
                    </div>
                  );
                })}
              </div>
              {data.topCars.length > 0 && (
                <>
                  <div className="card-head" style={{ marginTop: 16 }}>
                    <span>Чаще всего возим</span>
                  </div>
                  <div className="chip-row">
                    {data.topCars.map((c) => (
                      <span className="car-chip" key={c.make}>
                        {c.make} <span className="faint">{c.count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* ─── Что происходило ─── */}
            <section className="card">
              <div className="card-head">
                <span>Последние движения</span>
              </div>
              {data.recent.length === 0 ? (
                <div className="faint" style={{ fontSize: 12.5 }}>Пока тихо.</div>
              ) : (
                <div className="stack" style={{ gap: 8 }}>
                  {data.recent.map((r, index) => (
                    <div className="dash-line" key={`${r.dealId}-${index}`}>
                      <div className="stack" style={{ gap: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12.5 }}>
                          {r.makeModel ?? 'Авто'} — {STAGE_LABELS[r.toStage]}
                        </span>
                        <span className="faint" style={{ fontSize: 11 }}>
                          {r.clientName}
                          {r.fromStage ? ` · было «${STAGE_LABELS[r.fromStage]}»` : ''}
                        </span>
                      </div>
                      <span className="faint" style={{ fontSize: 11 }}>{ago(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Столбики по месяцам: новые клиенты и вернувшиеся друг на друге.
 *
 * Вернувшиеся показаны отдельным цветом сверху — так видно не только рост
 * потока, но и то, какую его часть даёт сарафанное радио. Для перевозки авто
 * это важнее общего числа: повторный клиент обходится дешевле любой рекламы.
 */
function MonthsChart({ months }: { months: Summary['months'] }) {
  const max = Math.max(1, ...months.map((m) => m.newClients + m.returningClients));
  const maxPaid = Math.max(1, ...months.map((m) => m.paidUsd));

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="months-chart">
        {months.map((m) => {
          const total = m.newClients + m.returningClients;
          const [year, mon] = m.month.split('-');
          const label = new Date(Number(year), Number(mon) - 1, 1)
            .toLocaleDateString('ru-RU', { month: 'short' });

          return (
            <div className="month-col" key={m.month} title={`${total} клиентов, оплачено ${money(m.paidUsd)}`}>
              <span className="month-value">{total || ''}</span>
              <div className="month-stack">
                {/* Линия денег за месяц идёт фоном: видно, совпадает ли поток
                    клиентов с поступлениями — они запаздывают на месяц-два */}
                <span
                  className="month-cash"
                  style={{ height: `${(m.paidUsd / maxPaid) * 100}%` }}
                />
                <span
                  className="month-bar month-returning"
                  style={{ height: `${(m.returningClients / max) * 100}%` }}
                />
                <span
                  className="month-bar month-new"
                  style={{ height: `${(m.newClients / max) * 100}%` }}
                />
              </div>
              <span className="month-label">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="row-flex" style={{ gap: 14, fontSize: 11.5 }}>
        <span className="legend"><i style={{ background: 'var(--accent)' }} /> новые</span>
        <span className="legend"><i style={{ background: 'var(--teal)' }} /> вернулись</span>
        <span className="legend"><i style={{ background: 'var(--surface-3)' }} /> поступления</span>
      </div>
    </div>
  );
}
