import { useCallback, useEffect, useState } from 'react';
import { type CalcSettings } from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import type { LeadRow, UserRow } from '@/api/types';
import { CheckIcon, PencilIcon, PlusIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { MoneyInput } from '@/components/MoneyInput';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';

const MONEY_FIELDS: [keyof CalcSettings, string, string][] = [
  ['complex', 'Комплекс', 'Стандартный комплекс услуг'],
  ['certification', 'Сертификация', 'Постановка на учёт и документы'],
  ['commission', 'Комиссия', 'Комиссия компании'],
  ['portHandling', 'Портовые расходы', 'Хендлинг в порту, отдельно от доставки'],
  ['ecoFee', 'Экологический сбор', 'Проверьте, не учтён ли он уже внутри растаможки'],
  ['marginDefault', 'Маржа по умолчанию', 'Скрытая строка — в карточку клиента не попадает'],
];

const PERCENT_FIELDS: [keyof CalcSettings, string, string][] = [
  ['swiftPercent', 'Swift, %', 'От суммы (ставка + аукционный сбор)'],
  ['freightInsurancePercent', 'Страховка фрахта, %', 'От ставки на аукционе'],
];

export function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';

  const [settings, setSettings] = useState<CalcSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [userDraft, setUserDraft] = useState<Partial<UserRow> & { password?: string } | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([
        api.get<{ settings: CalcSettings }>('/api/settings'),
        api.get<{ items: LeadRow[] }>('/api/leads'),
      ]);
      setSettings(s.settings);
      setLeads(l.items);

      if (canEdit) {
        const u = await api.get<{ items: UserRow[] }>('/api/users');
        setUsers(u.items);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить настройки');
    }
  }, [toast, canEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await api.patch<{ settings: CalcSettings }>('/api/settings', settings);
      setSettings(result.settings);
      setDirty(false);
      toast.success('Настройки сохранены — правка попала в журнал');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function saveUser() {
    if (!userDraft) return;
    try {
      if (userDraft.id) {
        await api.patch(`/api/users/${userDraft.id}`, {
          fullName: userDraft.fullName,
          role: userDraft.role,
          deliveryDiscountPercent: userDraft.deliveryDiscountPercent,
          isActive: userDraft.isActive,
          ...(userDraft.password ? { password: userDraft.password } : {}),
        });
      } else {
        await api.post('/api/users', {
          login: userDraft.login,
          fullName: userDraft.fullName,
          password: userDraft.password,
          role: userDraft.role ?? 'manager',
          deliveryDiscountPercent: userDraft.deliveryDiscountPercent ?? 0,
        });
      }
      setUserDraft(null);
      toast.success('Пользователь сохранён');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  function update(field: keyof CalcSettings, value: number) {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
    setDirty(true);
  }

  if (!settings) return <div className="empty">Загружаю…</div>;

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Настройки</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Значения по умолчанию для новых расчётов — в существующих останутся прежние
          </div>
        </div>
        <div className="row-flex" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => setPasswordModal(true)}>
            Сменить пароль
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void saveSettings()}
              disabled={!dirty || saving}
            >
              {saving ? 'Сохраняю…' : dirty ? 'Сохранить изменения' : 'Всё сохранено'}
            </button>
          )}
        </div>
      </header>

      <div className="page">
        {!canEdit && (
          <div className="banner">
            Настройки доступны только для просмотра. В конкретном расчёте любую строку
            можно поправить вручную.
          </div>
        )}

        <section className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Суммы по умолчанию</div>
          <div className="grid-3">
            {MONEY_FIELDS.map(([field, label, hint]) => (
              <label className="field" key={field}>
                <span>{label}</span>
                <MoneyInput
                  value={settings[field]}
                  onChange={(value) => update(field, value)}
                  formatted={false}
                  disabled={!canEdit}
                  ariaLabel={label}
                />
                <span className="faint" style={{ fontSize: 11.5 }}>{hint}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Проценты</div>
          <div className="grid-3">
            {PERCENT_FIELDS.map(([field, label, hint]) => (
              <label className="field" key={field}>
                <span>{label}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="mono"
                  value={String(settings[field]).replace('.', ',')}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value.replace(',', '.'));
                    update(field, Number.isFinite(value) ? value : 0);
                  }}
                  aria-label={label}
                />
                <span className="faint" style={{ fontSize: 11.5 }}>{hint}</span>
              </label>
            ))}
          </div>
        </section>

        {canEdit && (
          <section className="card">
            <div className="card-head">
              <div className="section-title">Пользователи и роли</div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setUserDraft({ role: 'manager', deliveryDiscountPercent: 0, isActive: true })}
              >
                <PlusIcon /> Добавить
              </button>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Логин</th>
                    <th>Роль</th>
                    <th>Скидка на доставку</th>
                    <th>Статус</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id}>
                      <td>{row.fullName}</td>
                      <td className="mono">{row.login}</td>
                      <td>
                        <span className={`badge ${row.role === 'admin' ? 'badge-accent' : 'badge-teal'}`}>
                          {row.role === 'admin' ? 'Администратор' : 'Менеджер'}
                        </span>
                      </td>
                      <td className="mono">
                        {row.deliveryDiscountPercent === 0
                          ? '—'
                          : `${row.deliveryDiscountPercent > 0 ? '−' : '+'}${Math.abs(row.deliveryDiscountPercent)}%`}
                      </td>
                      <td style={{ color: row.isActive ? 'var(--teal)' : 'var(--text-faint)' }}>
                        {row.isActive ? 'Активен' : 'Отключён'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setUserDraft(row)}
                          aria-label={`Править ${row.fullName}`}
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

        <section className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>
            Заявки с сайта {leads.filter((l) => !l.isProcessed).length > 0 && (
              <span className="badge badge-accent" style={{ marginLeft: 8 }}>
                новых: {leads.filter((l) => !l.isProcessed).length}
              </span>
            )}
          </div>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Когда</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Авто из витрины</th>
                  <th>Комментарий</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ opacity: lead.isProcessed ? 0.5 : 1 }}>
                    <td className="nowrap">{new Date(lead.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{lead.name}</td>
                    <td className="mono nowrap">{lead.phone}</td>
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
          {leads.length === 0 && <div className="empty">Заявок пока нет.</div>}
        </section>
      </div>

      {userDraft && (
        <Modal
          title={userDraft.id ? `Пользователь: ${userDraft.fullName}` : 'Новый пользователь'}
          onClose={() => setUserDraft(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setUserDraft(null)}>
                Отмена
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void saveUser()}>
                Сохранить
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 14 }}>
            {!userDraft.id && (
              <label className="field">
                <span>Логин</span>
                <input
                  type="text"
                  className="mono"
                  value={userDraft.login ?? ''}
                  onChange={(event) => setUserDraft({ ...userDraft, login: event.target.value })}
                  placeholder="i.ivanenko"
                />
              </label>
            )}

            <label className="field">
              <span>Имя и фамилия</span>
              <input
                type="text"
                value={userDraft.fullName ?? ''}
                onChange={(event) => setUserDraft({ ...userDraft, fullName: event.target.value })}
                placeholder="Ірина Іваненко"
              />
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Роль</span>
                <select
                  value={userDraft.role ?? 'manager'}
                  onChange={(event) =>
                    setUserDraft({ ...userDraft, role: event.target.value as 'admin' | 'manager' })
                  }
                >
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </label>

              <label className="field">
                <span>Скидка к доставке, %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="mono"
                  value={userDraft.deliveryDiscountPercent ?? 0}
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value.replace(',', '.'));
                    setUserDraft({
                      ...userDraft,
                      deliveryDiscountPercent: Number.isFinite(value) ? value : 0,
                    });
                  }}
                />
                <span className="faint" style={{ fontSize: 11.5 }}>
                  Положительное — скидка, отрицательное — наценка
                </span>
              </label>
            </div>

            <label className="field">
              <span>{userDraft.id ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}</span>
              <input
                type="password"
                value={userDraft.password ?? ''}
                onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })}
                autoComplete="new-password"
                placeholder="минимум 8 символов"
              />
            </label>

            {userDraft.id && (
              <label className="row-flex" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={userDraft.isActive ?? true}
                  onChange={(event) => setUserDraft({ ...userDraft, isActive: event.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13 }}>Доступ в систему разрешён</span>
              </label>
            )}
          </div>
        </Modal>
      )}

      {passwordModal && <ChangePasswordModal onClose={() => setPasswordModal(false)} />}
    </>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      toast.success('Пароль изменён — остальные сессии завершены');
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сменить пароль');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Смена пароля"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={busy}>
            {busy ? 'Меняю…' : 'Сменить'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <label className="field">
          <span>Текущий пароль</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label className="field">
          <span>Новый пароль</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
            placeholder="минимум 8 символов"
          />
        </label>
        <div className="banner">
          После смены пароля все остальные входы в систему завершатся — это нормально.
        </div>
      </div>
    </Modal>
  );
}
