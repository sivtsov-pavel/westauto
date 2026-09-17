import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type { ClientRow } from '@/api/types';
import { PlusIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { SOURCES, ago, sourceLabel } from './deals/dictionary';

/**
 * Клиенты — все, кто обращался: с сайта, из мессенджеров, по звонку.
 *
 * Заявка с сайта попадает сюда сама, остальных заводят руками — иначе учёт
 * неполон, а половина людей пишет в Telegram, а не заполняет форму.
 */
export function Clients() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Partial<ClientRow> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: ClientRow[] }>('/api/clients');
      setItems(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить клиентов');
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
    return items.filter(
      (c) =>
        c.fullName.toLowerCase().includes(term)
        || (c.telegram ?? '').toLowerCase().includes(term)
        || (c.city ?? '').toLowerCase().includes(term)
        || (digits.length > 2 && c.phone.replace(/\D/g, '').includes(digits)),
    );
  }, [items, search]);

  // Вернувшийся — тот, у кого больше одной сделки. Главный показатель:
  // в перевозке авто повторное обращение стоит дороже любой рекламы
  const returning = items.filter((c) => c.dealsCount > 1).length;

  async function save() {
    if (!draft) return;
    try {
      if (draft.id) {
        await api.patch(`/api/clients/${draft.id}`, draft);
      } else {
        await api.post('/api/clients', draft);
      }
      setDraft(null);
      toast.success('Клиент сохранён');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Клиенты</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {loading
              ? 'Загружаю…'
              : `${items.length} всего${returning > 0 ? ` · ${returning} вернулись за вторым авто` : ''}`}
          </div>
        </div>

        <div className="row-flex" style={{ gap: 8 }}>
          <input
            type="search"
            placeholder="Имя, телефон, город…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setDraft({ source: 'telegram' })}
          >
            <PlusIcon /> Добавить клиента
          </button>
        </div>
      </header>

      <div className="page">
        {loading && <div className="empty">Загружаю…</div>}

        {!loading && items.length === 0 && (
          <div className="card">
            <div className="empty">
              Клиентов пока нет. Заявки с сайта попадут сюда сами, а тех, кто
              написал в мессенджер или позвонил, добавьте кнопкой выше —
              иначе половина обращений не попадёт в учёт.
            </div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <section className="card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Связь</th>
                    <th>Откуда</th>
                    <th>Город</th>
                    {user?.role !== 'agent' && <th>Агент</th>}
                    <th style={{ textAlign: 'center' }}>Сделок</th>
                    <th>Последняя</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="stack" style={{ gap: 1 }}>
                          <span>{client.fullName}</span>
                          <span className="faint" style={{ fontSize: 11 }}>
                            с нами {ago(client.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="stack" style={{ gap: 1 }}>
                          <a href={`tel:${client.phone.replace(/[^\d+]/g, '')}`} className="mono" style={{ fontSize: 12 }}>
                            {client.phone}
                          </a>
                          {client.telegram && (
                            <span className="faint" style={{ fontSize: 11 }}>{client.telegram}</span>
                          )}
                        </div>
                      </td>
                      <td className="faint">{sourceLabel(client.source)}</td>
                      <td className="faint">{client.city ?? '—'}</td>
                      {user?.role !== 'agent' && (
                        <td className="faint">{client.agentName ?? '—'}</td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        {client.dealsCount > 1 ? (
                          <span className="returning-chip" title="Вернулся за вторым авто">
                            {client.dealsCount}
                          </span>
                        ) : (
                          client.dealsCount || '—'
                        )}
                      </td>
                      <td className="faint">{client.lastDealAt ? ago(client.lastDealAt) : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setDraft(client)}
                        >
                          Изменить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {draft && (
        <Modal
          title={draft.id ? 'Клиент' : 'Новый клиент'}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void save()}>
                Сохранить
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 14 }}>
            <label className="field">
              <span>Имя и фамилия</span>
              <input
                type="text"
                value={draft.fullName ?? ''}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                placeholder="Олександр Петренко"
              />
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Телефон</span>
                <input
                  type="tel"
                  className="mono"
                  value={draft.phone ?? ''}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="+380 67 123 45 67"
                />
                <span className="faint" style={{ fontSize: 11 }}>
                  По номеру система узнаёт, что клиент уже обращался
                </span>
              </label>
              <label className="field">
                <span>Откуда пришёл</span>
                <select
                  value={draft.source ?? 'site'}
                  onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{sourceLabel(s)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid-2">
              <label className="field">
                <span>Telegram</span>
                <input
                  type="text"
                  value={draft.telegram ?? ''}
                  onChange={(e) => setDraft({ ...draft, telegram: e.target.value })}
                  placeholder="@nickname"
                />
              </label>
              <label className="field">
                <span>Город</span>
                <input
                  type="text"
                  value={draft.city ?? ''}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  placeholder="Київ"
                />
              </label>
            </div>

            <div className="grid-2">
              <label className="field">
                <span>Viber</span>
                <input
                  type="text"
                  value={draft.viber ?? ''}
                  onChange={(e) => setDraft({ ...draft, viber: e.target.value })}
                />
              </label>
              <label className="field">
                <span>WhatsApp</span>
                <input
                  type="text"
                  value={draft.whatsapp ?? ''}
                  onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Заметки</span>
              <textarea
                rows={3}
                value={draft.notes ?? ''}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Что ищет, бюджет, договорённости"
              />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
