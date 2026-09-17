import { useState, type FormEvent } from 'react';

interface LeadFormProps {
  /** Авто з вітрини, якщо заявка з конкретної картки */
  showcaseItemId?: string | null;
  source?: string;
  compact?: boolean;
}

/**
 * Заявка з сайту. Єдина форма на весь сайт: у підвалі, у фінальному заклику
 * і на картці авто — щоб не плодити різні поведінки для однієї дії.
 */
export function LeadForm({ showcaseItemId = null, source = 'site', compact = false }: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('sending');
    setError(null);

    try {
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          comment: comment || null,
          showcaseItemId,
          source,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Не вдалося надіслати заявку');
      }

      setState('sent');
      setName('');
      setPhone('');
      setComment('');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати заявку');
    }
  }

  if (state === 'sent') {
    return (
      <div className="notice" role="status">
        Дякуємо! Менеджер зателефонує найближчим часом і порахує вартість під ваш лот.
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={submit}>
      <label>
        <span className="sr-only">Ваше ім’я</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ваше ім’я"
          autoComplete="name"
          required
          minLength={2}
        />
      </label>

      <label>
        <span className="sr-only">Телефон</span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+380 __ ___ __ __"
          autoComplete="tel"
          required
          minLength={6}
        />
      </label>

      {!compact && (
        <label style={{ gridColumn: '1 / -1' }}>
          <span className="sr-only">Коментар</span>
          <textarea
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Яке авто шукаєте або номер лоту"
          />
        </label>
      )}

      <button type="submit" className="btn btn-accent" disabled={state === 'sending'}>
        {state === 'sending' ? 'Надсилаю…' : 'Замовити розрахунок'}
      </button>

      {error && (
        <div role="alert" style={{ gridColumn: '1 / -1', color: '#c0503f', fontSize: 14 }}>
          {error}
        </div>
      )}
    </form>
  );
}
