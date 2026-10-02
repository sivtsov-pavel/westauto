import { useState, type FormEvent } from 'react';
import { brandFooter } from '@avtoklyuch/shared';
import { ApiError } from '@/api/client';
import { BrandMarkIcon, BrandName } from '@/components/Brand';
import { InfoIcon } from '@/components/Icons';
import { useAuth } from '@/state/auth';
import { useBrand } from '@/state/brand';

export function Login() {
  const { login } = useAuth();
  /*
   * Бренд экземпляра. Пока он не приехал, на экране нет ни чужого имени, ни
   * чужой цитаты: система ставится разным клиентам одним образом, и мелькнувшее
   * на миг название конкурента запоминается лучше, чем правильное.
   */
  const brand = useBrand();
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
      {/*
        Фон панели задаём backgroundColor, а не background: сокращённое
        свойство сбросило бы background-image с двумя световыми пятнами,
        и панель стала бы плоской заливкой.
      */}
      <div
        className="login-brand"
        style={brand?.darkPanel ? { backgroundColor: brand.darkPanel } : undefined}
      >
        <div className="brand" style={{ padding: 0 }}>
          {brand && (
            <span style={{ color: 'var(--accent)', display: 'flex' }}>
              <BrandMarkIcon brand={brand} size={24} />
            </span>
          )}
          <BrandName brand={brand} />
          <span className="key" style={{ marginLeft: 8 }}>ВНУТРЕННЯЯ СИСТЕМА</span>
        </div>

        <div className="stack" style={{ gap: 24, maxWidth: 560 }}>
          {brand && (
            <span style={{ color: 'var(--accent)' }}>
              <BrandMarkIcon brand={brand} size={64} />
            </span>
          )}
          {/* Цитата и описание — слова клиента о его деле. Чужих здесь быть
              не должно, поэтому до ответа блоки просто не рисуются */}
          {brand && <h1 className="login-quote">{brand.quote}</h1>}
          {brand && (
            <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              {brand.intro}
            </p>
          )}
        </div>

        <div className="mono faint" style={{ fontSize: 12 }}>
          {brand
            ? brandFooter(brand, new Date().getFullYear())
            : 'Доступ только для сотрудников'}
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
