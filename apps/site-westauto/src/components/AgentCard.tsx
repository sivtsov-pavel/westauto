import { useEffect, useState } from 'react';
import type { AgentPublicCard } from '@avtoklyuch/shared';
import { useI18n } from '@/i18n';
import { PhoneIcon, TelegramIcon } from './Icons';

/**
 * Персональный менеджер на сайте агента.
 *
 * Если сайт открыт на домене агента или по ссылке с его меткой, клиент
 * видит имя и контакты конкретного человека, а не безликую компанию.
 * Это и есть главный смысл персонального сайта для партнёра.
 *
 * На общем сайте компании блок просто не появляется.
 */
export function AgentCard() {
  const { t } = useI18n();
  const [agent, setAgent] = useState<AgentPublicCard | null>(null);

  useEffect(() => {
    // Метку из ссылки запоминаем: клиент может уйти на другую страницу,
    // а закрепление за агентом должно сохраниться
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      try {
        sessionStorage.setItem('avk-ref', ref);
      } catch {
        // приватный режим — обойдёмся без запоминания
      }
    }

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem('avk-ref');
    } catch {
      stored = null;
    }

    const query = stored ? `?ref=${encodeURIComponent(stored)}` : '';
    void fetch(`/api/public/agent${query}`)
      .then((r) => (r.ok ? r.json() : { agent: null }))
      .then((d: { agent: AgentPublicCard | null }) => setAgent(d.agent))
      .catch(() => setAgent(null));
  }, []);

  if (!agent) return null;

  return (
    <div className="agent-card">
      <div className="agent-avatar">{agent.publicName.charAt(0)}</div>
      <div className="stack" style={{ gap: 2, minWidth: 0 }}>
        <span className="agent-role">{t('agent.yourManager')}</span>
        <strong style={{ fontSize: 15.5 }}>{agent.publicName}</strong>
      </div>
      <div className="agent-links">
        {agent.phone && (
          <a href={`tel:${agent.phone.replace(/[^\d+]/g, '')}`} className="agent-link">
            <PhoneIcon size={15} /> {agent.phone}
          </a>
        )}
        {agent.telegram && (
          <a
            href={`https://t.me/${agent.telegram.replace('@', '')}`}
            className="agent-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon size={15} /> {agent.telegram}
          </a>
        )}
      </div>
    </div>
  );
}
