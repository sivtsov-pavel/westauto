import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type { ClientRow, DealRow, DealStage } from '@/api/types';
import { PlusIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { DealCard } from './deals/DealCard';
import { DealForm } from './deals/DealForm';
import {
  ARTICLE_LABELS,
  STAGE_COLORS,
  STAGE_HINTS,
  STAGE_LABELS,
  STAGES,
  money,
  shortDate,
} from './deals/dictionary';

/**
 * Сделки — одно авто от заявки до выдачи ключей.
 *
 * Два вида на одни и те же данные. Доска отвечает на вопрос «где что стоит
 * и сколько денег в каждом этапе», таблица — на «найди мне вот эту машину».
 * Менеджер живёт в первом, бухгалтерия во втором.
 */
export function Deals() {
  const toast = useToast();
  const { user } = useAuth();

  const [items, setItems] = useState<DealRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'board' | 'table'>('board');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [deals, clientList] = await Promise.all([
        api.get<{ items: DealRow[] }>('/api/deals'),
        api.get<{ items: ClientRow[] }>('/api/clients'),
      ]);
      setItems(deals.items);
      setClients(clientList.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить сделки');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    const digits = term.replace(/\D/g, '');
    return items.filter((d) =>
      [d.clientName, d.makeModel, d.lotNumber, d.vin, d.location]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
      || (digits.length > 2 && (d.clientPhone ?? '').replace(/\D/g, '').includes(digits)),
    );
  }, [items, search]);

  const active = visible.filter((d) => d.outcome === 'active');

  // Итоги показываем по живым сделкам: проигранные и выданные в «деньгах
  // в работе» только мешают — их уже не собрать и не потратить
  const inWork = active.filter((d) => d.stage !== 'delivered');
  const totalPlanned = inWork.reduce((sum, d) => sum + d.plannedUsd, 0);
  const totalPaid = inWork.reduce((sum, d) => sum + d.paidUsd, 0);
  const debt = totalPlanned - totalPaid;

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Сделки</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {loading
              ? 'Загружаю…'
              : `${active.length} в работе · ${money(totalPlanned)} начислено · ${money(debt)} ждём от клиентов`}
          </div>
        </div>

        <div className="row-flex" style={{ gap: 8 }}>
          <input
            type="search"
            placeholder="Клиент, VIN, лот, авто…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 210 }}
          />
          <div className="seg">
            <button
              type="button"
              className={view === 'board' ? 'seg-on' : ''}
              onClick={() => setView('board')}
            >
              Доска
            </button>
            <button
              type="button"
              className={view === 'table' ? 'seg-on' : ''}
              onClick={() => setView('table')}
            >
              Таблица
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <PlusIcon /> Новая сделка
          </button>
        </div>
      </header>

      <div className="page">
        {loading && <div className="empty">Загружаю…</div>}

        {!loading && items.length === 0 && (
          <div className="card">
            <div className="empty">
              Сделок пока нет. Заведите первую — или откройте «Заявки» и
              превратите в сделку обращение с сайта, чтобы не перепечатывать
              имя и телефон.
            </div>
          </div>
        )}

        {!loading && items.length > 0 && view === 'board' && (
          <Board deals={visible} onOpen={setOpenId} />
        )}

        {!loading && items.length > 0 && view === 'table' && (
          <Table deals={visible} onOpen={setOpenId} />
        )}
      </div>

      {creating && (
        <Modal title="Новая сделка" onClose={() => setCreating(false)}>
          <DealForm
            clients={clients}
            canPickAgent={user?.role !== 'agent'}
            onDone={(id) => {
              setCreating(false);
              void load();
              setOpenId(id);
            }}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}

      {openId && (
        <DealCard
          dealId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => void load()}
        />
      )}
    </>
  );
}

// ─── Доска ────────────────────────────────────────────────────────────────────

function Board({ deals, onOpen }: { deals: DealRow[]; onOpen: (id: string) => void }) {
  const byStage = useMemo(() => {
    const map = new Map<DealStage, DealRow[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const deal of deals) {
      if (deal.outcome === 'lost') continue;
      map.get(deal.stage)?.push(deal);
    }
    return map;
  }, [deals]);

  return (
    <div className="deal-board">
      {STAGES.map((stage) => {
        const column = byStage.get(stage) ?? [];
        const sum = column.reduce((acc, d) => acc + d.plannedUsd, 0);

        return (
          <section className="deal-column" key={stage}>
            <header className="deal-column-head">
              <span className="deal-dot" style={{ background: STAGE_COLORS[stage] }} />
              <div className="stack" style={{ gap: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 13 }}>{STAGE_LABELS[stage]}</strong>
                <span className="faint" style={{ fontSize: 10.5 }}>{STAGE_HINTS[stage]}</span>
              </div>
              <span className="deal-count">{column.length}</span>
            </header>

            {sum > 0 && (
              <div className="deal-column-sum">{money(sum)}</div>
            )}

            <div className="stack" style={{ gap: 8 }}>
              {column.map((deal) => (
                <DealTile key={deal.id} deal={deal} onOpen={onOpen} />
              ))}
              {column.length === 0 && <div className="deal-empty">пусто</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DealTile({ deal, onOpen }: { deal: DealRow; onOpen: (id: string) => void }) {
  const debt = deal.plannedUsd - deal.paidUsd;
  // Полоса оплаты — самое важное на карточке: сразу видно, кто не доплатил
  const paidShare = deal.plannedUsd > 0 ? Math.min(1, deal.paidUsd / deal.plannedUsd) : 0;

  // Авто ждут в порту к дате. Просрочка — повод звонить, поэтому она красная
  const late =
    deal.portEta !== null
    && deal.portArrivedAt === null
    && new Date(deal.portEta).getTime() < Date.now();

  return (
    <button type="button" className="deal-tile" onClick={() => onOpen(deal.id)}>
      <div className="deal-tile-title">
        {deal.makeModel ?? 'Авто не указано'}
        {deal.year ? <span className="faint"> · {deal.year}</span> : null}
      </div>
      <div className="deal-tile-client">{deal.clientName}</div>

      {deal.lotNumber && (
        <div className="faint mono" style={{ fontSize: 10.5 }}>лот {deal.lotNumber}</div>
      )}

      {deal.plannedUsd > 0 && (
        <>
          <div className="deal-progress">
            <span style={{ width: `${paidShare * 100}%` }} />
          </div>
          <div className="deal-tile-money">
            <span>{money(deal.paidUsd)} из {money(deal.plannedUsd)}</span>
            {debt > 0 && <span className="deal-debt">−{money(debt)}</span>}
          </div>
        </>
      )}

      {deal.portEta && (
        <div className={late ? 'deal-late' : 'faint'} style={{ fontSize: 10.5 }}>
          порт {shortDate(deal.portEta)}{late ? ' · опаздывает' : ''}
        </div>
      )}
    </button>
  );
}

// ─── Таблица ──────────────────────────────────────────────────────────────────

function Table({ deals, onOpen }: { deals: DealRow[]; onOpen: (id: string) => void }) {
  return (
    <section className="card">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Клиент</th>
              <th>Авто</th>
              <th>Лот / VIN</th>
              <th>Локация</th>
              <th>Этап</th>
              <th style={{ textAlign: 'right' }}>Покупка</th>
              <th style={{ textAlign: 'right' }}>Начислено</th>
              <th style={{ textAlign: 'right' }}>Оплачено</th>
              <th style={{ textAlign: 'right' }}>Долг</th>
              <th>Порт</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const debt = deal.plannedUsd - deal.paidUsd;
              return (
                <tr key={deal.id} style={{ opacity: deal.outcome === 'lost' ? 0.45 : 1 }}>
                  <td className="faint">{shortDate(deal.createdAt)}</td>
                  <td>
                    <div className="stack" style={{ gap: 1 }}>
                      <span>{deal.clientName}</span>
                      <span className="faint mono" style={{ fontSize: 11 }}>
                        {deal.clientPhone}
                      </span>
                    </div>
                  </td>
                  <td>
                    {deal.makeModel ?? '—'}
                    {deal.year ? <span className="faint"> · {deal.year}</span> : null}
                  </td>
                  <td className="mono" style={{ fontSize: 11.5 }}>
                    <div className="stack" style={{ gap: 1 }}>
                      <span>{deal.lotNumber ?? '—'}</span>
                      <span className="faint">{deal.vin ?? ''}</span>
                    </div>
                  </td>
                  <td className="faint">{deal.location ?? '—'}</td>
                  <td>
                    <span className="stage-chip" style={{ '--stage': STAGE_COLORS[deal.stage] } as React.CSSProperties}>
                      {STAGE_LABELS[deal.stage]}
                    </span>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {deal.purchasePriceUsd ? money(deal.purchasePriceUsd) : '—'}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{money(deal.plannedUsd)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{money(deal.paidUsd)}</td>
                  <td
                    className="mono"
                    style={{ textAlign: 'right', color: debt > 0 ? 'var(--danger)' : undefined }}
                  >
                    {debt > 0 ? money(debt) : '—'}
                  </td>
                  <td className="faint">{shortDate(deal.portEta)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => onOpen(deal.id)}>
                      Открыть
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="faint" style={{ fontSize: 11.5, marginTop: 10 }}>
        Суммы приведены к доллару: {ARTICLE_LABELS.customs.toLowerCase()} обычно платится
        в гривне и пересчитана по курсу на день платежа.
      </div>
    </section>
  );
}
