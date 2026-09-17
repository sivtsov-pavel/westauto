import { useCallback, useEffect, useState } from 'react';
import {
  formatMoney,
  PLATFORM_LABELS,
  toCsv,
  VEHICLE_KIND_LABELS,
  type Platform,
  type VehicleKind,
} from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import type { AuctionFeeRow, DeliveryTariffRow, HistoryEntry } from '@/api/types';
import { DownloadIcon, PencilIcon, PlusIcon, TrashIcon, UploadIcon } from '@/components/Icons';
import { TariffImport } from '@/components/TariffImport';
import { Modal } from '@/components/Modal';
import { MoneyInput } from '@/components/MoneyInput';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';

type DeliveryDraft = Omit<DeliveryTariffRow, 'id' | 'updatedAt' | 'updatedByName'> & {
  id?: string;
};
type AuctionDraft = Omit<AuctionFeeRow, 'id' | 'updatedAt' | 'updatedByName'> & { id?: string };

const EMPTY_DELIVERY: DeliveryDraft = {
  platform: 'copart',
  location: '',
  vehicleKind: 'sedan',
  amountUsd: 0,
  isActive: true,
};

const EMPTY_AUCTION: AuctionDraft = {
  platform: 'copart',
  bidFrom: 0,
  bidTo: null,
  feeAmount: 0,
  feePercent: 0,
  isActive: true,
};

export function Tariffs() {
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const [delivery, setDelivery] = useState<DeliveryTariffRow[]>([]);
  const [auction, setAuction] = useState<AuctionFeeRow[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft | null>(null);
  const [auctionDraft, setAuctionDraft] = useState<AuctionDraft | null>(null);
  const [importing, setImporting] = useState<'delivery' | 'auction' | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, a, h] = await Promise.all([
        api.get<{ items: DeliveryTariffRow[] }>('/api/tariffs/delivery'),
        api.get<{ items: AuctionFeeRow[] }>('/api/tariffs/auction-fees'),
        api.get<{ items: HistoryEntry[] }>('/api/tariffs/history', { limit: 25 }),
      ]);
      setDelivery(d.items);
      setAuction(a.items);
      setHistory(h.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить тарифы');
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDelivery(draft: DeliveryDraft) {
    try {
      if (draft.id) {
        await api.patch(`/api/tariffs/delivery/${draft.id}`, draft);
      } else {
        await api.post('/api/tariffs/delivery', draft);
      }
      setDeliveryDraft(null);
      toast.success('Тариф доставки сохранён');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  async function saveAuction(draft: AuctionDraft) {
    try {
      if (draft.id) {
        await api.patch(`/api/tariffs/auction-fees/${draft.id}`, draft);
      } else {
        await api.post('/api/tariffs/auction-fees', draft);
      }
      setAuctionDraft(null);
      toast.success('Аукционный сбор сохранён');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  /**
   * Выгрузка в CSV с разделителем «;» — Excel открывает такой файл двойным
   * щелчком, без диалога импорта. BOM в начале нужен, чтобы кириллица
   * не превратилась в кракозябры.
   */
  function exportCsv(kind: 'delivery' | 'auction') {
    const rows: (string | number | null)[][] =
      kind === 'delivery'
        ? [
            ['Площадка', 'Локация', 'Тип авто', 'Стоимость'],
            ...delivery.map((r) => [
              PLATFORM_LABELS[r.platform],
              r.location,
              VEHICLE_KIND_LABELS[r.vehicleKind],
              r.amountUsd,
            ]),
          ]
        : [
            ['Площадка', 'Ставка от', 'Ставка до', 'Сбор', 'Процент'],
            ...auction.map((r) => [
              PLATFORM_LABELS[r.platform],
              r.bidFrom,
              r.bidTo,
              r.feeAmount,
              r.feePercent,
            ]),
          ];

    const blob = new Blob(['\uFEFF', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      kind === 'delivery' ? 'tarify-dostavki.csv' : 'aukcionnye-sbory.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Файл выгружен');
  }

  async function remove(kind: 'delivery' | 'auction-fees', id: string, label: string) {
    if (!window.confirm(`Удалить «${label}»? Действие попадёт в журнал правок.`)) return;
    try {
      await api.delete(`/api/tariffs/${kind}/${id}`);
      toast.success('Удалено');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось удалить');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Тарифы</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Каждая правка попадает в журнал: кто, когда, старое значение → новое
          </div>
        </div>
        {canEdit && (
          <div className="row-flex" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setAuctionDraft({ ...EMPTY_AUCTION })}
            >
              <PlusIcon /> Аукционный сбор
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setDeliveryDraft({ ...EMPTY_DELIVERY })}
            >
              <PlusIcon /> Тариф доставки
            </button>
          </div>
        )}
      </header>

      <div className="page">
        {!canEdit && (
          <div className="banner">
            Тарифы доступны только для просмотра — правит их администратор.
          </div>
        )}

        <section className="card">
          <div className="card-head">
            <div className="section-title">Тарифы доставки</div>
            <div className="row-flex" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => exportCsv('delivery')}
                disabled={delivery.length === 0}
              >
                <DownloadIcon /> Выгрузить CSV
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setImporting('delivery')}
                >
                  <UploadIcon /> Импорт из таблицы
                </button>
              )}
            </div>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Площадка</th>
                  <th>Локация / штат</th>
                  <th>Тип авто</th>
                  <th>Стоимость</th>
                  <th>Изменил · когда</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {delivery.map((row) => (
                  <tr key={row.id} style={{ opacity: row.isActive ? 1 : 0.5 }}>
                    <td>{PLATFORM_LABELS[row.platform]}</td>
                    <td>{row.location}</td>
                    <td>{VEHICLE_KIND_LABELS[row.vehicleKind]}</td>
                    <td className="mono nowrap">{formatMoney(row.amountUsd)}</td>
                    <td className="muted nowrap">
                      {row.updatedByName ?? '—'} · {relativeTime(row.updatedAt)}
                    </td>
                    <td>
                      {canEdit && (
                        <div className="row-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setDeliveryDraft(row)}
                            aria-label={`Править тариф ${row.location}`}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() =>
                              void remove('delivery', row.id, `${row.location}, ${VEHICLE_KIND_LABELS[row.vehicleKind]}`)
                            }
                            aria-label={`Удалить тариф ${row.location}`}
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {delivery.length === 0 && <div className="empty">Тарифов доставки пока нет.</div>}
        </section>

        <section className="card">
          <div className="card-head">
            <div className="section-title">Аукционный сбор</div>
            <div className="row-flex" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => exportCsv('auction')}
                disabled={auction.length === 0}
              >
                <DownloadIcon /> Выгрузить CSV
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setImporting('auction')}
                >
                  <UploadIcon /> Импорт из таблицы
                </button>
              )}
            </div>
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Площадка</th>
                  <th>Диапазон ставки</th>
                  <th>Сбор</th>
                  <th>Изменил · когда</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {auction.map((row) => (
                  <tr key={row.id} style={{ opacity: row.isActive ? 1 : 0.5 }}>
                    <td>{PLATFORM_LABELS[row.platform]}</td>
                    <td className="mono nowrap">
                      {formatMoney(row.bidFrom)} – {row.bidTo === null ? '∞' : formatMoney(row.bidTo)}
                    </td>
                    <td className="mono nowrap">
                      {formatMoney(row.feeAmount)}
                      {row.feePercent > 0 && ` + ${String(row.feePercent).replace('.', ',')}%`}
                    </td>
                    <td className="muted nowrap">
                      {row.updatedByName ?? '—'} · {relativeTime(row.updatedAt)}
                    </td>
                    <td>
                      {canEdit && (
                        <div className="row-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setAuctionDraft(row)}
                            aria-label="Править диапазон"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() =>
                              void remove('auction-fees', row.id, `${PLATFORM_LABELS[row.platform]} ${row.bidFrom}+`)
                            }
                            aria-label="Удалить диапазон"
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {auction.length === 0 && <div className="empty">Диапазонов сбора пока нет.</div>}
        </section>

        <section className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Журнал правок</div>
          <div className="stack" style={{ gap: 0 }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                className="stack"
                style={{ gap: 3, padding: '10px 0', borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ fontSize: 13 }}>{entry.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {entry.action === 'create' && 'создано · '}
                  {entry.action === 'delete' && 'удалено · '}
                  {entry.oldValue !== null && (
                    <span className="mono faint" style={{ textDecoration: 'line-through' }}>
                      {entry.oldValue}
                    </span>
                  )}
                  {entry.oldValue !== null && entry.newValue !== null && ' → '}
                  {entry.newValue !== null && (
                    <span className="mono" style={{ color: 'var(--accent)' }}>{entry.newValue}</span>
                  )}
                  {' · '}
                  {entry.userName} · {relativeTime(entry.createdAt)}
                </div>
              </div>
            ))}
          </div>
          {history.length === 0 && <div className="empty">Правок пока не было.</div>}
        </section>
      </div>

      {importing && (
        <TariffImport
          kind={importing}
          onClose={() => setImporting(null)}
          onImported={() => {
            setImporting(null);
            void load();
          }}
        />
      )}

      {deliveryDraft && (
        <Modal
          title={deliveryDraft.id ? 'Правка тарифа доставки' : 'Новый тариф доставки'}
          onClose={() => setDeliveryDraft(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDeliveryDraft(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void saveDelivery(deliveryDraft)}
              >
                Сохранить
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 14 }}>
            <div className="grid-2">
              <label className="field">
                <span>Площадка</span>
                <select
                  value={deliveryDraft.platform}
                  onChange={(event) =>
                    setDeliveryDraft({ ...deliveryDraft, platform: event.target.value as Platform })
                  }
                >
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Тип авто</span>
                <select
                  value={deliveryDraft.vehicleKind}
                  onChange={(event) =>
                    setDeliveryDraft({
                      ...deliveryDraft,
                      vehicleKind: event.target.value as VehicleKind,
                    })
                  }
                >
                  {Object.entries(VEHICLE_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Локация / штат</span>
              <input
                type="text"
                value={deliveryDraft.location}
                onChange={(event) =>
                  setDeliveryDraft({ ...deliveryDraft, location: event.target.value })
                }
                placeholder="Texas"
              />
            </label>

            <label className="field">
              <span>Стоимость доставки, $</span>
              <MoneyInput
                value={deliveryDraft.amountUsd}
                onChange={(value) => setDeliveryDraft({ ...deliveryDraft, amountUsd: value })}
                formatted={false}
                ariaLabel="Стоимость доставки"
              />
            </label>

            <label className="row-flex" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={deliveryDraft.isActive}
                onChange={(event) =>
                  setDeliveryDraft({ ...deliveryDraft, isActive: event.target.checked })
                }
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13 }}>Используется в расчётах</span>
            </label>
          </div>
        </Modal>
      )}

      {auctionDraft && (
        <Modal
          title={auctionDraft.id ? 'Правка аукционного сбора' : 'Новый диапазон сбора'}
          onClose={() => setAuctionDraft(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setAuctionDraft(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void saveAuction(auctionDraft)}
              >
                Сохранить
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 14 }}>
            <label className="field">
              <span>Площадка</span>
              <select
                value={auctionDraft.platform}
                onChange={(event) =>
                  setAuctionDraft({ ...auctionDraft, platform: event.target.value as Platform })
                }
              >
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Ставка от, $</span>
                <MoneyInput
                  value={auctionDraft.bidFrom}
                  onChange={(value) => setAuctionDraft({ ...auctionDraft, bidFrom: value })}
                  formatted={false}
                  ariaLabel="Ставка от"
                />
              </label>
              <label className="field">
                <span>Ставка до, $ <span className="faint">пусто = и выше</span></span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="mono"
                  value={auctionDraft.bidTo ?? ''}
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value.replace(/[^\d.]/g, ''));
                    setAuctionDraft({
                      ...auctionDraft,
                      bidTo: Number.isFinite(value) ? value : null,
                    });
                  }}
                  placeholder="∞"
                />
              </label>
            </div>

            <div className="grid-2">
              <label className="field">
                <span>Сбор, $</span>
                <MoneyInput
                  value={auctionDraft.feeAmount}
                  onChange={(value) => setAuctionDraft({ ...auctionDraft, feeAmount: value })}
                  formatted={false}
                  ariaLabel="Сумма сбора"
                />
              </label>
              <label className="field">
                <span>Плюс % от ставки</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="mono"
                  value={auctionDraft.feePercent}
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value.replace(',', '.'));
                    setAuctionDraft({
                      ...auctionDraft,
                      feePercent: Number.isFinite(value) ? value : 0,
                    });
                  }}
                  placeholder="0"
                />
              </label>
            </div>

            <div className="banner">
              Диапазоны не должны пересекаться — иначе один лот получит разный сбор в зависимости
              от порядка строк. Сервер это проверит при сохранении.
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/** «2 дня назад» — так журнал читается быстрее, чем по датам. */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  if (days < 31) return `${Math.round(days / 7)} нед назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}
