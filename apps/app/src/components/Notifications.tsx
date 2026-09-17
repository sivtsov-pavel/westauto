import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Колокольчик уведомлений.
 *
 * Уведомления живут внутри приложения, а не уходят письмами: почтового
 * сервера у системы нет, и обещать письма, которые некому слать, было бы
 * нечестно. Пока менеджер работает, этого достаточно.
 */
export function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>(
        '/api/watchlist/notifications',
      );
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Не смогли — молчим: это фоновая вещь, она не должна мешать работе
    }
  }, []);

  useEffect(() => {
    void load();
    // Раз в минуту: ставки на аукционе не меняются чаще, чем раз в минуты
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  // Закрываем по клику вне списка — иначе он перекрывает интерфейс
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await api.post('/api/watchlist/notifications/read').catch(() => undefined);
      setUnread(0);
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    }
  }

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => void toggle()}
        aria-label={unread > 0 ? `Уведомления, непрочитанных: ${unread}` : 'Уведомления'}
        aria-expanded={open}
        style={{ width: 30, height: 30, position: 'relative' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="notif-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="notif-list" role="region" aria-label="Уведомления">
          {items.length === 0 ? (
            <div className="muted" style={{ padding: '14px 4px', fontSize: 13 }}>
              Уведомлений пока нет
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="notif-item"
                onClick={() => {
                  if (item.link) navigate(item.link);
                  setOpen(false);
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</span>
                {item.body && (
                  <span className="muted" style={{ fontSize: 12 }}>{item.body}</span>
                )}
                <span className="faint" style={{ fontSize: 11 }}>
                  {new Date(item.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
