import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, onPasswordChangeRequired } from '@/api/client';
import type { SessionUser } from '@/api/types';

interface AuthContextValue {
  user: SessionUser | null;
  /** Первая проверка сессии ещё идёт — не показываем ни приложение, ни вход */
  loading: boolean;
  /**
   * Выданный пароль ещё не сменён — вместо приложения показываем экран смены.
   *
   * Складывается из двух источников: поля сессии и ответа 403 от сервера.
   * Второй нужен потому, что флаг могли поставить, пока человек работал,
   * и до следующей проверки сессии приложение об этом не узнало бы.
   */
  mustChangePassword: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Требование, пришедшее ответом 403 посреди работы. Держим отдельно от
  // пользователя: сессия в этот момент ещё старая, с флагом false
  const [forcedByServer, setForcedByServer] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: SessionUser | null }>('/api/auth/me');
      setUser(data.user);
      // Свежий профиль — источник правды: если сервер больше не требует
      // смены, снимаем и подозрение, поднятое ответом 403
      if (!data.user?.mustChangePassword) setForcedByServer(false);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Страховка на случай, когда пароль сбросили во время работы: любой запрос
  // вернёт 403 с кодом, и приложение переедет на экран смены само
  useEffect(() => onPasswordChangeRequired(() => setForcedByServer(true)), []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const data = await api.post<{ user: SessionUser }>('/api/auth/login', {
      login: loginValue,
      password,
    });
    setUser(data.user);
    setForcedByServer(false);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    setForcedByServer(false);
  }, []);

  const mustChangePassword = user !== null && (user.mustChangePassword || forcedByServer);

  const value = useMemo(
    () => ({ user, loading, mustChangePassword, login, logout, refresh }),
    [user, loading, mustChangePassword, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth вызван вне AuthProvider');
  return context;
}
