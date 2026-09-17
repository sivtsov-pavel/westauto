import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney, PLATFORM_LABELS, type Platform } from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import { InfoIcon, PlusIcon, RefreshIcon, TrashIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { MoneyInput } from '@/components/MoneyInput';
import { useToast } from '@/state/toast';

interface Watch {
  id: string;
  platform: Platform;
  lotNumber: string;
  title: string | null;
  maxBid: number | null;
  lastBid: number | null;
  previousBid: number | null;
  delta: number | null;
  overMax: boolean;
  isActive: boolean;
  lastCheckedAt: string | null;
  lastError: string | null;
  history: { bid: number; seenAt: string }[];
}

/**
 * Наблюдение за лотами, на которые ещё идут торги.
 *
 * Список честно показывает, когда данные последний раз удалось прочитать
 * и почему не удалось в последний раз: молчание площадки не должно
 * выглядеть как «ставка не растёт».
 */
export function Watchlist() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: Watch[] }>('/api/watchlist');
      setItems(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить список');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function checkNow() {
    setChecking(true);
    try {
      const result = await api.post<{ checked: number; changed: number }>(
        '/api/watchlist/check-now',
      );
      toast.success(
        result.checked === 0
          ? 'Все лоты проверены недавно — новых данных нет'
          : `Проверено лотов: ${result.checked}, изменилось ставок: ${result.changed}`,
      );
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Проверка не удалась');
    } finally {
      setChecking(false);
    }
  }

  async function remove(item: Watch) {
    if (!window.confirm(`Снять лот ${item.lotNumber} с наблюдения?`)) return;
    try {
      await api.delete(`/api/watchlist/${item.id}`);
      void load();
    } catch {
      toast.error('Не удалось удалить');
    }
  }

  async function toggle(item: Watch) {
    try {
      await api.patch(`/api/watchlist/${item.id}`, { isActive: !item.isActive });
      void load();
    } catch {
      toast.error('Не удалось изменить');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Наблюдение за лотами</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Ставки проверяются раз в 15 минут, изменения приходят в уведомления
          </div>
        </div>
        <div className="row-flex" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void checkNow()}
            disabled={checking || items.length === 0}
          >
            <RefreshIcon /> {checking ? 'Проверяю…' : 'Проверить сейчас'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <PlusIcon /> Добавить лот
          </button>
        </div>
      </header>

      <div className="page">
        <div className="banner">
          <InfoIcon />
          <span>
            У Copart и IAAI нет публичного API, поэтому ставка читается с публичной страницы
            лота и <strong>читается не всегда</strong>. Колонка «Проверено» показывает, когда
            данные получены в последний раз — ориентируйтесь на неё, а не только на сумму.
          </span>
        </div>

        {loading && <div className="empty">Загружаю…</div>}

        {!loading && items.length === 0 && (
          <div className="card">
            <div className="empty">
              Список пуст. Добавьте лот, на который идут торги, укажите свой потолок — система
              предупредит, когда ставка его превысит.
            </div>
          </div>
        )}

        {items.length > 0 && (
          <section className="card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Лот</th>
                    <th>Площадка</th>
                    <th>Текущая ставка</th>
                    <th>Изменение</th>
                    <th>Потолок</th>
                    <th>Проверено</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.5 }}>
                      <td>
                        <div className="stack" style={{ gap: 2 }}>
                          <span className="mono">{item.lotNumber}</span>
                          {item.title && (
                            <span className="faint" style={{ fontSize: 11.5 }}>{item.title}</span>
                          )}
                        </div>
                      </td>
                      <td>{PLATFORM_LABELS[item.platform]}</td>
                      <td className="mono nowrap">
                        {item.lastBid === null ? (
                          <span className="faint">—</span>
                        ) : (
                          <span style={item.overMax ? { color: 'var(--danger)' } : undefined}>
                            {formatMoney(item.lastBid)}
                          </span>
                        )}
                      </td>
                      <td className="mono nowrap">
                        {item.delta === null || item.delta === 0 ? (
                          <span className="faint">—</span>
                        ) : (
                          <span style={{ color: item.delta > 0 ? 'var(--warning)' : 'var(--teal)' }}>
                            {item.delta > 0 ? '+' : ''}
                            {formatMoney(item.delta)}
                          </span>
                        )}
                      </td>
                      <td className="mono nowrap">
                        {item.maxBid === null ? (
                          <span className="faint">—</span>
                        ) : (
                          formatMoney(item.maxBid)
                        )}
                        {item.overMax && (
                          <span className="badge badge-warn" style={{ marginLeft: 8 }}>
                            превышен
                          </span>
                        )}
                      </td>
                      <td className="nowrap" style={{ fontSize: 12.5 }}>
                        {item.lastCheckedAt ? (
                          <span className="muted">
                            {new Date(item.lastCheckedAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="faint">ещё не проверялся</span>
                        )}
                        {item.lastError && (
                          <div className="faint" style={{ fontSize: 11, maxWidth: 200 }}>
                            {item.lastError}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="row-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          {item.lastBid !== null && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() =>
                                navigate('/', {
                                  state: {
                                    state: {
                                      lot: {
                                        lotNumber: item.lotNumber,
                                        vin: null,
                                        makeModel: item.title,
                                        year: null,
                                        engineVolume: null,
                                        batteryPower: null,
                                        fuel: 'petrol',
                                        platform: item.platform,
                                        location: '',
                                        vehicleKind: 'sedan',
                                      },
                                      bid: item.lastBid,
                                      overrides: {},
                                      disabled: [],
                                      customs: null,
                                      fx: null,
                                    },
                                  },
                                })
                              }
                              title="Посчитать по текущей ставке"
                            >
                              Посчитать
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => void toggle(item)}
                            title={item.isActive ? 'Приостановить' : 'Возобновить'}
                            aria-label={item.isActive ? 'Приостановить' : 'Возобновить'}
                          >
                            {item.isActive ? '❙❙' : '▶'}
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => void remove(item)}
                            aria-label="Снять с наблюдения"
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {adding && (
        <AddWatchModal
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            void load();
          }}
        />
      )}
    </>
  );
}

function AddWatchModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const toast = useToast();
  const [platform, setPlatform] = useState<Platform>('copart');
  const [lotNumber, setLotNumber] = useState('');
  const [title, setTitle] = useState('');
  const [maxBid, setMaxBid] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.post('/api/watchlist', {
        platform,
        lotNumber: lotNumber.trim(),
        title: title.trim() || null,
        maxBid: maxBid > 0 ? maxBid : null,
      });
      toast.success('Лот добавлен — первая проверка в течение 15 минут');
      onAdded();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось добавить');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Добавить лот в наблюдение"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void submit()}
            disabled={busy || lotNumber.trim().length < 4}
          >
            {busy ? 'Добавляю…' : 'Добавить'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <div className="grid-2">
          <label className="field">
            <span>Площадка</span>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value as Platform)}
            >
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Номер лота</span>
            <input
              type="text"
              className="mono"
              value={lotNumber}
              onChange={(event) => setLotNumber(event.target.value)}
              placeholder="47281905"
              autoFocus
            />
          </label>
        </div>

        <label className="field">
          <span>Название <span className="faint">— для себя, необязательно</span></span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tesla Model 3 для Петренко"
          />
        </label>

        <label className="field">
          <span>Потолок ставки, $ <span className="faint">— 0, если без потолка</span></span>
          <MoneyInput
            value={maxBid}
            onChange={setMaxBid}
            formatted={false}
            ariaLabel="Потолок ставки"
          />
          <span className="faint" style={{ fontSize: 11.5 }}>
            Когда ставка превысит потолок, придёт уведомление
          </span>
        </label>
      </div>
    </Modal>
  );
}
