import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import type { CalculationRecord, CalcState, UserRow } from '@/api/types';
import { ClientCard } from '@/components/ClientCard';
import { ShareLink } from '@/components/ShareLink';
import { CopyIcon, EyeIcon, SearchIcon, TrashIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';

interface HistoryResponse {
  items: CalculationRecord[];
  stats: { count: number; averageTotal: number; activeManagers: number };
}

const PERIODS = [
  ['week', 'За неделю'],
  ['month', 'За месяц'],
  ['quarter', 'За квартал'],
  ['all', 'За всё время'],
] as const;

export function History() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [managers, setManagers] = useState<UserRow[]>([]);
  const [preview, setPreview] = useState<CalculationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<HistoryResponse>('/api/calculations', {
        search: search || undefined,
        userId: userId || undefined,
        period,
      });
      setData(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  }, [search, userId, period, toast]);

  // Поиск с задержкой: печатать и ждать ответа на каждую букву неудобно
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    void api
      .get<{ items: UserRow[] }>('/api/users')
      .then((result) => setManagers(result.items))
      .catch(() => setManagers([]));
  }, [user?.role]);

  async function duplicate(id: string) {
    try {
      const result = await api.post<{ state: CalcState }>(`/api/calculations/${id}/duplicate`);
      // Открываем калькулятор с теми же полями, но пересчитанными по
      // сегодняшним тарифам — в этом весь смысл кнопки
      navigate('/', { state: { state: result.state } });
      toast.success('Расчёт скопирован — пересчитан по текущим тарифам');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось скопировать');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Удалить расчёт из истории? Действие необратимо.')) return;
    try {
      await api.delete(`/api/calculations/${id}`);
      toast.success('Расчёт удалён');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось удалить');
    }
  }

  return (
    <>
      <header className="topbar">
        <div style={{ fontSize: 18, fontWeight: 600 }}>История расчётов</div>
        <div className="row-flex" style={{ gap: 10 }}>
          <label
            className="row-flex"
            style={{
              gap: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: '8px 12px',
              width: 220,
            }}
          >
            <span className="muted" style={{ display: 'flex' }}>
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Марка, VIN, лот…"
              aria-label="Поиск по истории"
              style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 13 }}
            />
          </label>

          {user?.role === 'admin' && (
            <select
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              aria-label="Фильтр по менеджеру"
              style={{ width: 'auto', fontSize: 13, padding: '8px 10px' }}
            >
              <option value="">Менеджер: все</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName}
                </option>
              ))}
            </select>
          )}

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as typeof period)}
            aria-label="Период"
            style={{ width: 'auto', fontSize: 13, padding: '8px 10px' }}
          >
            {PERIODS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="page">
        <div className="grid-3">
          <StatCard label="Расчётов за период" value={String(data?.stats.count ?? 0)} />
          <StatCard
            label="Средний чек «под ключ»"
            value={formatMoney(data?.stats.averageTotal ?? 0)}
          />
          <StatCard label="Активных менеджеров за месяц" value={String(data?.stats.activeManagers ?? 0)} />
        </div>

        <section className="card">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Лот / VIN</th>
                  <th>Марка / модель</th>
                  <th>Менеджер</th>
                  <th>Итого под ключ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => (
                  <tr key={item.id}>
                    <td className="nowrap">
                      {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="mono">{item.lotNumber ?? item.vin ?? '—'}</td>
                    <td>{item.makeModel ?? '—'}</td>
                    <td className="nowrap">{item.userName ?? '—'}</td>
                    <td className="mono nowrap">{formatMoney(item.clientTotalUsd)}</td>
                    <td>
                      <div className="row-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setPreview(item)}
                          aria-label={`Открыть расчёт ${item.makeModel ?? ''}`}
                          title="Посмотреть разбивку"
                        >
                          <EyeIcon size={12} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => void duplicate(item.id)}
                          aria-label="Скопировать в новый расчёт"
                          title="Скопировать в новый — пересчитает по текущим тарифам"
                        >
                          <CopyIcon size={12} />
                        </button>
                        {(user?.role === 'admin' || user?.id === item.userId) && (
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => void remove(item.id)}
                            aria-label="Удалить расчёт"
                            title="Удалить"
                          >
                            <TrashIcon size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && (data?.items.length ?? 0) === 0 && (
            <div className="empty">
              Расчётов не найдено. Измените фильтры или посчитайте первый на вкладке «Расчёт».
            </div>
          )}
          {loading && <div className="empty">Загружаю…</div>}
        </section>
      </div>

      {preview && (
        <Modal title={preview.makeModel ?? 'Расчёт'} onClose={() => setPreview(null)}>
          <div className="stack" style={{ gap: 16 }}>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {new Date(preview.createdAt).toLocaleString('ru-RU')} · {preview.userName}
              {preview.fx?.usdUah ? (
                <>
                  {' · курс на момент расчёта: '}
                  <span className="mono">
                    {preview.fx.usdUah.toFixed(2).replace('.', ',')} ₴/$
                  </span>
                  {preview.fx.pinned && ' (зафиксирован вручную)'}
                </>
              ) : (
                ' · курс не сохранён'
              )}
            </div>

            <ClientCard result={preview.result} lot={preview.state.lot} />

            <ShareLink calculationId={preview.id} />

            <div className="stack" style={{ gap: 4 }}>
              <div className="section-title">Полная разбивка · внутренняя</div>
              {preview.result.lines
                .filter((line) => line.enabled && line.amount !== 0)
                .map((line) => (
                  <div className="spread" key={line.key} style={{ fontSize: 13 }}>
                    <span className="muted">{line.label}</span>
                    <span className="mono">{formatMoney(line.amount)}</span>
                  </div>
                ))}
              <div className="spread" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600 }}>Себестоимость</span>
                <span className="mono">{formatMoney(preview.costUsd)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="stack" style={{ gap: 4 }}>
        <span className="muted" style={{ fontSize: 12 }}>{label}</span>
        <span className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{value}</span>
      </div>
    </div>
  );
}
