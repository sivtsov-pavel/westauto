import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type { LeadRow } from '@/api/types';
import { CheckIcon } from '@/components/Icons';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';

/**
 * Клиенты, пришедшие с сайта.
 *
 * Агент видит здесь только тех, кого привёл сам: заявка закрепляется за ним
 * по его домену или по метке в ссылке. Администратор видит всех и от кого
 * каждый пришёл.
 */
export function Leads() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: LeadRow[] }>('/api/leads');
      setItems(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const isAgent = user?.role === 'agent';
  const newCount = items.filter((l) => !l.isProcessed).length;

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {isAgent ? 'Мои клиенты' : 'Заявки с сайта'}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            {isAgent
              ? 'Клиенты, пришедшие по вашей ссылке или с вашего сайта'
              : 'Заявки с публичных сайтов, с указанием агента'}
          </div>
        </div>
        {newCount > 0 && <span className="badge badge-accent">новых: {newCount}</span>}
      </header>

      <div className="page">
        <section className="card">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Когда</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  {!isAgent && <th>Агент</th>}
                  <th>Авто</th>
                  <th>Комментарий</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => (
                  <tr key={lead.id} style={{ opacity: lead.isProcessed ? 0.5 : 1 }}>
                    <td className="nowrap">{new Date(lead.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{lead.name}</td>
                    <td className="mono nowrap">
                      <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>
                    </td>
                    {!isAgent && (
                      <td className="nowrap">
                        {lead.agentName ? (
                          <span className="badge badge-teal">{lead.agentName}</span>
                        ) : (
                          <span className="faint">напрямую</span>
                        )}
                      </td>
                    )}
                    <td>{lead.itemTitle ?? '—'}</td>
                    <td className="muted">{lead.comment ?? '—'}</td>
                    <td>
                      {!lead.isProcessed && (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Отметить обработанной"
                          aria-label="Отметить обработанной"
                          onClick={() => {
                            void api
                              .patch(`/api/leads/${lead.id}`, { isProcessed: true })
                              .then(load)
                              .catch(() => toast.error('Не удалось отметить'));
                          }}
                        >
                          <CheckIcon size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <div className="empty">Загружаю…</div>}
          {!loading && items.length === 0 && (
            <div className="empty">
              {isAgent
                ? 'Заявок пока нет. Делитесь своей ссылкой — клиенты по ней закрепляются за вами автоматически.'
                : 'Заявок пока нет.'}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
