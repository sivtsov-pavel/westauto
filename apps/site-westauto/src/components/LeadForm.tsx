import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n';

interface LeadFormProps {
  showcaseItemId?: string | null;
  source?: string;
  compact?: boolean;
}

/**
 * Заявка с сайта. Уходит в ту же CRM, что и заявки второго сайта —
 * поле source показывает менеджеру, откуда пришёл человек.
 */
/** Метка агента из ссылки — её запомнила карточка менеджера. */
function readRef(): string | null {
  try {
    return (
      new URLSearchParams(window.location.search).get('ref') ??
      sessionStorage.getItem('avk-ref')
    );
  } catch {
    return null;
  }
}

export function LeadForm({ showcaseItemId = null, source = 'westauto', compact = false }: LeadFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('sending');
    try {
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          comment: comment || null,
          showcaseItemId,
          source: `westauto:${source}`,
          // Метка агента: клиент по его ссылке закрепляется за ним
          ref: readRef(),
        }),
      });
      if (!response.ok) throw new Error('failed');
      setState('sent');
      setName('');
      setPhone('');
      setComment('');
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return <div className="notice" role="status">{t('lead.done')}</div>;
  }

  return (
    <form className="lead-form" onSubmit={submit}>
      <label>
        <span className="sr-only">{t('lead.name')}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('lead.name')}
          autoComplete="name"
          required
          minLength={2}
        />
      </label>

      <label>
        <span className="sr-only">{t('lead.phone')}</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+380 __ ___ __ __"
          autoComplete="tel"
          required
          minLength={6}
        />
      </label>

      {!compact && (
        <label style={{ gridColumn: '1 / -1' }}>
          <span className="sr-only">{t('lead.comment')}</span>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('lead.comment')}
          />
        </label>
      )}

      <button type="submit" className="btn btn-red" disabled={state === 'sending'}>
        {state === 'sending' ? t('lead.sending') : t('lead.submit')}
      </button>

      {state === 'error' && (
        <div role="alert" style={{ gridColumn: '1 / -1', color: '#e22131', fontSize: 14 }}>
          {t('lead.error')}
        </div>
      )}
    </form>
  );
}
