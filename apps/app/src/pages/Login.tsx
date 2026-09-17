import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { InfoIcon, KeyMark } from '@/components/Icons';
import { useAuth } from '@/state/auth';

export function Login() {
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(loginValue, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-brand">
        <div className="brand" style={{ padding: 0 }}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}>
            <KeyMark size={24} />
          </span>
          Авто<em>Ключ</em>
          <span className="key" style={{ marginLeft: 8 }}>ВНУТРЕННЯЯ СИСТЕМА</span>
        </div>

        <div className="stack" style={{ gap: 24, maxWidth: 560 }}>
          <span style={{ color: 'var(--accent)' }}>
            <KeyMark size={64} />
          </span>
          <h1 className="login-quote">
            «Один расчёт — от ставки на аукционе до цены клиенту.»
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
            Платформа расчёта стоимости доставки и растаможки авто с Copart и IAAI под ключ.
            Тарифы, история изменений и роли — в одном месте.
          </p>
        </div>

        <div className="mono faint" style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} АвтоКлюч · доступ только для сотрудников
        </div>
      </div>

      <div className="login-form-panel">
        <form className="stack" style={{ gap: 32, width: 360, maxWidth: '100%' }} onSubmit={onSubmit}>
          <div className="stack" style={{ gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Вход в систему</h2>
            <p className="muted" style={{ margin: 0 }}>Логин выдаёт администратор.</p>
          </div>

          <div className="stack" style={{ gap: 18 }}>
            <label className="field">
              <span>Логин</span>
              <input
                type="text"
                value={loginValue}
                onChange={(event) => setLoginValue(event.target.value)}
                placeholder="i.ivanenko"
                autoComplete="username"
                autoFocus
                required
                style={{ padding: '13px 14px' }}
              />
            </label>

            <label className="field">
              <div className="spread">
                <span className="field-label">Пароль</span>
                {/*
                  В макете здесь была ссылка «Забыли пароль?». Почтового
                  сервера у системы нет, а ссылка в никуда хуже её отсутствия:
                  пароль сбрасывает администратор в разделе «Настройки».
                */}
                <span className="faint" style={{ fontSize: 12 }}>
                  Забыли — сбросит администратор
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{ padding: '13px 14px' }}
              />
            </label>

            {error && (
              <div role="alert" className="field-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{ padding: 14, fontSize: 14 }}
            >
              {busy ? 'Проверяю…' : 'Войти'}
            </button>
          </div>

          <div className="banner">
            <InfoIcon />
            <span>Доступ только для менеджеров и администратора. Клиентского входа нет.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
