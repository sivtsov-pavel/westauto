import { useEffect, useState } from 'react';
import type { ClientLocale } from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import { CopyIcon, TrashIcon } from '@/components/Icons';
import { useToast } from '@/state/toast';

interface ShareState {
  token: string;
  path: string;
  expiresAt: string | null;
  locale: ClientLocale;
  views: number;
  lastSeen: string | null;
}

/**
 * Ссылка на расчёт для клиента.
 *
 * Тем самым закрывается пункт ТЗ про роль «клиент, видит только итоговую
 * цену»: заводить клиентам учётные записи не нужно — менеджер отправляет
 * ссылку, клиент открывает страницу со своей ценой. Ссылку видно, сколько
 * раз открывали, и её можно отозвать одним нажатием.
 */
export function ShareLink({ calculationId }: { calculationId: string }) {
  const toast = useToast();
  const [share, setShare] = useState<ShareState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<ClientLocale>('uk');
  const [days, setDays] = useState(14);

  useEffect(() => {
    let cancelled = false;
    void api
      .get<{ share: ShareState | null }>(`/api/share/${calculationId}`)
      .then((data) => {
        if (cancelled) return;
        setShare(data.share);
        if (data.share) setLocale(data.share.locale);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [calculationId]);

  async function create() {
    try {
      const data = await api.post<ShareState>(`/api/share/${calculationId}`, { locale, days });
      setShare({ ...data, views: share?.views ?? 0, lastSeen: share?.lastSeen ?? null });
      await copy(data.path);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось создать ссылку');
    }
  }

  async function revoke() {
    if (!window.confirm('Отозвать ссылку? У клиента она перестанет открываться сразу.')) return;
    try {
      await api.delete(`/api/share/${calculationId}`);
      setShare(null);
      toast.success('Ссылка отозвана');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось отозвать');
    }
  }

  async function copy(path: string) {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована — можно отправлять клиенту');
    } catch {
      // Буфер закрыт политикой браузера — показываем ссылку, скопируют руками
      toast.push(url);
    }
  }

  if (loading) return null;

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="section-title">Ссылка для клиента</div>

      {share ? (
        <>
          <div className="share-box">
            <span className="mono grow" style={{ fontSize: 12.5, overflowWrap: 'anywhere' }}>
              {window.location.origin}
              {share.path}
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void copy(share.path)}
              aria-label="Скопировать ссылку"
              title="Скопировать"
            >
              <CopyIcon size={12} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void revoke()}
              aria-label="Отозвать ссылку"
              title="Отозвать"
            >
              <TrashIcon size={12} />
            </button>
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            {share.views > 0
              ? `Открывали ${share.views} ${plural(share.views, 'раз', 'раза', 'раз')}`
              : 'Клиент ещё не открывал'}
            {share.lastSeen && ` · последний раз ${new Date(share.lastSeen).toLocaleString('ru-RU')}`}
            {' · '}
            {share.expiresAt
              ? `действует до ${new Date(share.expiresAt).toLocaleDateString('ru-RU')}`
              : 'бессрочная'}
            {' · '}
            язык: {share.locale === 'uk' ? 'українська' : 'русский'}
          </div>
        </>
      ) : (
        <>
          <div className="row-flex" style={{ gap: 8 }}>
            <label className="row-flex" style={{ gap: 6, fontSize: 12.5 }}>
              <span className="muted">Язык</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as ClientLocale)}
                style={{ width: 'auto', padding: '6px 8px', fontSize: 12.5 }}
              >
                <option value="uk">Українська</option>
                <option value="ru">Русский</option>
              </select>
            </label>

            <label className="row-flex" style={{ gap: 6, fontSize: 12.5 }}>
              <span className="muted">Срок</span>
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                style={{ width: 'auto', padding: '6px 8px', fontSize: 12.5 }}
              >
                <option value={3}>3 дня</option>
                <option value={7}>неделя</option>
                <option value={14}>2 недели</option>
                <option value={30}>месяц</option>
                <option value={0}>бессрочно</option>
              </select>
            </label>

            <button type="button" className="btn btn-sm btn-primary" onClick={() => void create()}>
              Создать ссылку
            </button>
          </div>

          <div className="muted" style={{ fontSize: 12 }}>
            Клиент откроет страницу с ценой и крупными статьями. Внутренние строки —
            маржа, себестоимость, тарифы — на неё не попадают.
          </div>
        </>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
