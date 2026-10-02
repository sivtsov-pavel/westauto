import { useState, type FormEvent } from 'react';
import { api, ApiError } from '@/api/client';
import { InfoIcon, KeyMark } from '@/components/Icons';
import { useAuth } from '@/state/auth';

/**
 * Обязательная смена выданного пароля.
 *
 * Это экран, а не окно поверх приложения, намеренно: окно закрывается — и
 * человек продолжает работать под паролем, который знает ещё кто-то. Сервер
 * всё равно отдаст 403 на каждый запрос, так что приложение за этим экраном
 * показывать просто нечем (apps/api/src/lib/password-policy.ts).
 *
 * Разметка повторяет экран входа: человек попадает сюда сразу после него, и
 * смена оформления на полпути выглядела бы как переход на другой сайт.
 */

const MIN_LENGTH = 8;

export function ChangePassword() {
  const { user, logout, refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    // Проверки, которые видно без обращения к серверу, делаем здесь: ответ
    // по сети на опечатку в повторе пароля — лишнее ожидание
    if (newPassword.length < MIN_LENGTH) {
      setError(`Новый пароль — не короче ${MIN_LENGTH} символов`);
      return;
    }
    if (newPassword !== repeatPassword) {
      setError('Новый пароль и повтор не совпадают');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Новый пароль совпадает с выданным — придумайте другой');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      // Сервер выдал новую сессию и снял флаг. Перечитываем профиль —
      // после этого App сам покажет приложение вместо этого экрана
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сменить пароль');
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
          <span className="key" style={{ marginLeft: 8 }}>ПЕРВЫЙ ВХОД</span>
        </div>

        <div className="stack" style={{ gap: 24, maxWidth: 560 }}>
          <span style={{ color: 'var(--accent)' }}>
            <KeyMark size={64} />
          </span>
          <h1 className="login-quote">«Свой пароль знаете только вы.»</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
            Дальше в системе каждое действие подписано именем — кто поправил тариф, кто
            передвинул сделку. Это имеет смысл только с паролем, который знаете вы один.
          </p>
        </div>

        <div className="mono faint" style={{ fontSize: 12 }}>
          {user ? `${user.fullName} · ${user.login}` : ''}
        </div>
      </div>

      <div className="login-form-panel">
        <form className="stack" style={{ gap: 28, width: 360, maxWidth: '100%' }} onSubmit={onSubmit}>
          <div className="stack" style={{ gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Смените пароль</h2>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
              Пароль, с которым вы вошли, придумали не вы — его знает ещё один человек.
              Придумайте свой: старый перестанет работать сразу.
            </p>
          </div>

          <div className="stack" style={{ gap: 18 }}>
            <label className="field">
              <span>Выданный пароль</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="тот, с которым вошли"
                autoComplete="current-password"
                autoFocus
                required
                style={{ padding: '13px 14px' }}
              />
            </label>

            <label className="field">
              <span>Новый пароль</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={`минимум ${MIN_LENGTH} символов`}
                autoComplete="new-password"
                required
                style={{ padding: '13px 14px' }}
              />
            </label>

            <label className="field">
              <span>Повторите новый</span>
              <input
                type="password"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
                placeholder="ещё раз, чтобы не было опечатки"
                autoComplete="new-password"
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
              {busy ? 'Меняю…' : 'Сменить пароль и войти'}
            </button>

            {/*
              Выход обязателен: без него экран становится тупиком для того, кто
              вошёл не под своей учётной записью или потерял выданный пароль.
            */}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void logout()}
              disabled={busy}
            >
              Выйти
            </button>
          </div>

          <div className="banner">
            <InfoIcon />
            <span>
              После смены все остальные входы в систему завершатся — это нормально.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
