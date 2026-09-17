import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api, ApiError } from '@/api/client';
import type { BootstrapResponse } from '@/api/types';
import { Sidebar } from '@/components/Layout';
import { AgentDashboard } from '@/pages/AgentDashboard';
import { Agents } from '@/pages/Agents';
import { Calculator } from '@/pages/Calculator';
import { Clients } from '@/pages/Clients';
import { Dashboard } from '@/pages/Dashboard';
import { Deals } from '@/pages/Deals';
import { Docs } from '@/pages/Docs';
import { History } from '@/pages/History';
import { Login } from '@/pages/Login';
import { Settings } from '@/pages/Settings';
import { Showcase } from '@/pages/Showcase';
import { Leads } from '@/pages/Leads';
import { Tariffs } from '@/pages/Tariffs';
import { Watchlist } from '@/pages/Watchlist';
import { useAuth } from '@/state/auth';
import { useTheme } from '@/state/theme';

export function App() {
  const { user, loading } = useAuth();
  // Тема применяется до отрисовки экранов, иначе на входе мелькает чужой фон
  useTheme();

  if (loading) {
    return <div className="empty" style={{ paddingTop: 120 }}>Проверяю сессию…</div>;
  }

  if (!user) return <Login />;

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<BootstrapResponse>('/api/calculations/bootstrap');
      setBootstrap(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="empty" style={{ paddingTop: 120 }}>
        {error}
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn" onClick={() => void load()}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return <div className="empty" style={{ paddingTop: 120 }}>Загружаю тарифы…</div>;
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Routes>
          {/* Сводка на главной: открыв систему, человек первым делом видит
              деньги и движение машин, а не пустую форму расчёта */}
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/calc"
            element={<Calculator bootstrap={bootstrap} onBootstrapReload={() => void load()} />}
          />
          <Route path="/history" element={<History />} />
          <Route path="/cabinet" element={<AgentDashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/showcase" element={<Showcase />} />
          <Route path="/tariffs" element={<Tariffs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
