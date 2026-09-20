import { useCallback, useEffect, useState } from 'react';
import {
  COMMISSION_LABELS,
  formatMoney,
  normalizeReferralCode,
  type AgentProfile,
  type AgentStats,
  type CommissionType,
} from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import { CopyIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { MoneyInput } from '@/components/MoneyInput';
import { useToast } from '@/state/toast';

type AgentRow = AgentProfile & { stats: AgentStats };

type Draft = Partial<AgentProfile> & { password?: string };

/**
 * Агентская сеть.
 *
 * Агент — партнёр на комиссии, а не сотрудник. Поэтому у него отдельная
 * роль: он не видит закупочные тарифы, маржу и чужие сделки. Здесь
 * администратор заводит агентов, задаёт условия и закрывает выплаты.
 */
export function Agents() {
  const toast = useToast();
  const [items, setItems] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [domainsFor, setDomainsFor] = useState<AgentRow | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: AgentRow[] }>('/api/agents');
      setItems(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить агентов');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    try {
      if (draft.id) {
        await api.patch(`/api/agents/${draft.id}`, {
          fullName: draft.fullName,
          publicName: draft.publicName,
          phone: draft.phone,
          telegram: draft.telegram,
          referralCode: draft.referralCode,
          commissionType: draft.commissionType,
          commissionValue: draft.commissionValue,
          isActive: draft.isActive,
          ...(draft.password ? { password: draft.password } : {}),
        });
      } else {
        await api.post('/api/agents', {
          login: draft.login,
          fullName: draft.fullName,
          password: draft.password,
          publicName: draft.publicName ?? draft.fullName,
          phone: draft.phone ?? null,
          telegram: draft.telegram ?? null,
          referralCode: draft.referralCode ?? null,
          commissionType: draft.commissionType ?? 'fixed',
          commissionValue: draft.commissionValue ?? 0,
        });
      }
      setDraft(null);
      toast.success('Агент сохранён');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Агентская сеть</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Агент не видит закупочные тарифы, маржу и чужие сделки — только своих клиентов
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDraft({ commissionType: 'fixed', commissionValue: 0, isActive: true })}
        >
          <PlusIcon /> Добавить агента
        </button>
      </header>

      <div className="page">
        {loading && <div className="empty">Загружаю…</div>}

        {!loading && items.length === 0 && (
          <div className="card">
            <div className="empty">
              Агентов пока нет. Заведите первого — он получит доступ в систему,
              личную ссылку и, при желании, отдельный домен под свой сайт.
            </div>
          </div>
        )}

        {items.length > 0 && (
          <section className="card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Агент</th>
                    <th>Условия</th>
                    <th>Клиентов</th>
                    <th>Сделок</th>
                    <th>Заработал</th>
                    <th>К выплате</th>
                    <th>Домены</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((agent) => (
                    <tr key={agent.id} style={{ opacity: agent.isActive ? 1 : 0.5 }}>
                      <td>
                        <div className="stack" style={{ gap: 2 }}>
                          <span>{agent.fullName}</span>
                          <span className="faint mono" style={{ fontSize: 11 }}>
                            {agent.login}
                            {agent.referralCode && ` · ?ref=${agent.referralCode}`}
                          </span>
                        </div>
                      </td>
                      <td className="nowrap" style={{ fontSize: 13 }}>
                        {agent.commissionType === 'fixed'
                          ? `${formatMoney(agent.commissionValue)} за авто`
                          : `${String(agent.commissionValue).replace('.', ',')}% от маржи`}
                      </td>
                      <td className="mono">
                        {agent.stats.leadsTotal}
                        {agent.stats.leadsNew > 0 && (
                          <span className="badge badge-accent" style={{ marginLeft: 6 }}>
                            +{agent.stats.leadsNew}
                          </span>
                        )}
                      </td>
                      <td className="mono">{agent.stats.dealsWon}</td>
                      <td className="mono nowrap">{formatMoney(agent.stats.commissionEarned)}</td>
                      <td className="mono nowrap">
                        {agent.stats.commissionPending > 0 ? (
                          <span style={{ color: 'var(--accent)' }}>
                            {formatMoney(agent.stats.commissionPending)}
                          </span>
                        ) : (
                          <span className="faint">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => setDomainsFor(agent)}
                        >
                          {agent.domains.length || '+'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setDraft(agent)}
                          aria-label={`Править ${agent.fullName}`}
                        >
                          <PencilIcon />
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
          title={draft.id ? `Агент: ${draft.fullName}` : 'Новый агент'}
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
            {!draft.id && (
              <label className="field">
                <span>Логин</span>
                <input
                  type="text"
                  className="mono"
                  value={draft.login ?? ''}
                  onChange={(e) => setDraft({ ...draft, login: e.target.value })}
                  placeholder="ivan"
                />
              </label>
            )}

            <label className="field">
              <span>Имя и фамилия</span>
              <input
                type="text"
                value={draft.fullName ?? ''}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                placeholder="Іван Коваленко"
              />
            </label>

            <label className="field">
              <span>Имя для сайта <span className="faint">— его увидит клиент</span></span>
              <input
                type="text"
                value={draft.publicName ?? ''}
                onChange={(e) => setDraft({ ...draft, publicName: e.target.value })}
                placeholder={draft.fullName ?? ''}
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
                  placeholder="+380 __ ___ __ __"
                />
              </label>
              <label className="field">
                <span>Telegram</span>
                <input
                  type="text"
                  value={draft.telegram ?? ''}
                  onChange={(e) => setDraft({ ...draft, telegram: e.target.value })}
                  placeholder="@nickname"
                />
              </label>
            </div>

            <label className="field">
              <span>Метка для ссылки <span className="faint">— ?ref=…</span></span>
              <input
                type="text"
                className="mono"
                value={draft.referralCode ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, referralCode: normalizeReferralCode(e.target.value) })
                }
                placeholder={draft.login ?? 'ivan'}
              />
              <span className="faint" style={{ fontSize: 11.5 }}>
                Клиент по такой ссылке автоматически закрепляется за агентом
              </span>
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Вознаграждение</span>
                <select
                  value={draft.commissionType ?? 'fixed'}
                  onChange={(e) =>
                    setDraft({ ...draft, commissionType: e.target.value as CommissionType })
                  }
                >
                  {Object.entries(COMMISSION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>
                  {draft.commissionType === 'percent_of_margin' ? 'Процент от маржи' : 'Сумма, $'}
                </span>
                <MoneyInput
                  value={draft.commissionValue ?? 0}
                  onChange={(value) => setDraft({ ...draft, commissionValue: value })}
                  formatted={false}
                  ariaLabel="Вознаграждение"
                />
              </label>
            </div>

            <label className="field">
              <span>{draft.id ? 'Новый пароль (пусто — не менять)' : 'Пароль'}</span>
              <input
                type="password"
                value={draft.password ?? ''}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                autoComplete="new-password"
                placeholder="минимум 8 символов"
              />
            </label>

            {draft.id && (
              <label className="row-flex" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.isActive ?? true}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13 }}>Доступ в систему разрешён</span>
              </label>
            )}

            <div className="banner">
              Вознаграждение фиксируется в момент, когда сделка отмечена
              состоявшейся. Изменение условий не переписывает уже начисленное.
            </div>
          </div>
        </Modal>
      )}

      {domainsFor && (
        <DomainsModal
          agent={domainsFor}
          onClose={() => setDomainsFor(null)}
          onChanged={() => void load()}
        />
      )}
    </>
  );
}

function DomainsModal({
  agent,
  onClose,
  onChanged,
}: {
  agent: AgentRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [domains, setDomains] = useState(agent.domains);
  const [host, setHost] = useState('');

  async function add() {
    const clean = host.trim().toLowerCase();
    if (clean.length < 4) return;
    try {
      const data = await api.post<{ domain: { id: string; host: string; isActive: boolean } }>(
        `/api/agents/${agent.id}/domains`,
        { host: clean },
      );
      setDomains([...domains, data.domain]);
      setHost('');
      onChanged();
      toast.success('Домен закреплён за агентом');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось добавить домен');
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/api/agents/${agent.id}/domains/${id}`);
      setDomains(domains.filter((d) => d.id !== id));
      onChanged();
    } catch {
      toast.error('Не удалось удалить');
    }
  }

  return (
    <Modal title={`Домены: ${agent.fullName}`} onClose={onClose}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="banner">
          Заявка с этого домена автоматически закрепляется за агентом. Домен должен
          указывать на этот же сервер — сайт отвечает на любое имя.
        </div>

        {domains.map((domain) => (
          <div className="share-box" key={domain.id}>
            <span className="mono grow" style={{ fontSize: 13 }}>{domain.host}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void navigator.clipboard.writeText(`https://${domain.host}`)}
              aria-label="Скопировать"
            >
              <CopyIcon size={12} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void remove(domain.id)}
              aria-label="Удалить домен"
            >
              <TrashIcon size={12} />
            </button>
          </div>
        ))}

        {domains.length === 0 && (
          <div className="muted" style={{ fontSize: 13.5 }}>
            Доменов пока нет. Агент может работать по ссылке с меткой{' '}
            <span className="mono">?ref={agent.referralCode}</span>.
          </div>
        )}

        <div className="row-flex" style={{ gap: 8 }}>
          <input
            type="text"
            className="mono grow"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void add(); }}
            placeholder="ivan.westauto.com.ua"
          />
          <button type="button" className="btn btn-sm btn-primary" onClick={() => void add()}>
            Добавить
          </button>
        </div>
      </div>
    </Modal>
  );
}
