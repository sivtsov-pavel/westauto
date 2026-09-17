import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type {
  Currency,
  DealArticle,
  DealDetails,
  DealStage,
} from '@/api/types';
import { Modal } from '@/components/Modal';
import { useToast } from '@/state/toast';
import {
  ARTICLE_LABELS,
  ARTICLES,
  STAGE_COLORS,
  STAGE_LABELS,
  STAGES,
  ago,
  money,
  shortDate,
} from './dictionary';

interface Props {
  dealId: string;
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Карточка сделки.
 *
 * Здесь менеджер проводит основное время, поэтому порядок блоков не
 * случайный: сверху этап (его меняют чаще всего), затем деньги (о них
 * спрашивает клиент), затем фото и переписка.
 */
export function DealCard({ dealId, onClose, onChanged }: Props) {
  const toast = useToast();
  const [data, setData] = useState<DealDetails | null>(null);
  const [tab, setTab] = useState<'money' | 'photos' | 'talk'>('money');

  const load = useCallback(async () => {
    try {
      setData(await api.get<DealDetails>(`/api/deals/${dealId}`));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось открыть сделку');
      onClose();
    }
  }, [dealId, toast, onClose]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStage(stage: DealStage) {
    try {
      await api.patch(`/api/deals/${dealId}`, { stage });
      await load();
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сменить этап');
    }
  }

  if (!data) {
    return (
      <Modal title="Сделка" onClose={onClose}>
        <div className="empty">Загружаю…</div>
      </Modal>
    );
  }

  const { item } = data;
  const debt = item.plannedUsd - item.paidUsd;
  const title = [item.makeModel, item.year].filter(Boolean).join(' · ') || 'Сделка';

  return (
    <Modal title={title} onClose={onClose}>
      <div className="stack" style={{ gap: 16 }}>
        {/* ─── Кто и что ─── */}
        <div className="deal-head">
          <div className="stack" style={{ gap: 2, minWidth: 0 }}>
            <strong style={{ fontSize: 15 }}>{item.clientName}</strong>
            <span className="faint mono" style={{ fontSize: 12 }}>{item.clientPhone}</span>
          </div>
          <div className="stack" style={{ gap: 2, textAlign: 'right' }}>
            {item.lotNumber && (
              <span className="mono" style={{ fontSize: 12 }}>лот {item.lotNumber}</span>
            )}
            {item.vin && <span className="faint mono" style={{ fontSize: 11 }}>{item.vin}</span>}
          </div>
        </div>

        {/* ─── Этапы: щёлкнул — сделка поехала дальше ─── */}
        <div className="stage-track">
          {STAGES.map((stage) => {
            const done = STAGES.indexOf(stage) <= STAGES.indexOf(item.stage);
            return (
              <button
                key={stage}
                type="button"
                className={`stage-step${stage === item.stage ? ' stage-now' : ''}${done ? ' stage-done' : ''}`}
                style={{ '--stage': STAGE_COLORS[stage] } as React.CSSProperties}
                onClick={() => void setStage(stage)}
                title={STAGE_LABELS[stage]}
              >
                <span className="stage-bar" />
                <span className="stage-name">{STAGE_LABELS[stage]}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Три цифры, которые спрашивают чаще всего ─── */}
        <div className="deal-figures">
          <Figure label="Покупка" value={item.purchasePriceUsd ? money(item.purchasePriceUsd) : '—'} />
          <Figure label="Начислено" value={money(item.plannedUsd)} />
          <Figure
            label={debt > 0 ? 'Клиент должен' : 'Оплачено полностью'}
            value={debt > 0 ? money(debt) : money(item.paidUsd)}
            danger={debt > 0}
          />
        </div>

        {(item.portEta || item.location) && (
          <div className="faint" style={{ fontSize: 12 }}>
            {item.location && <>Откуда: {item.location}. </>}
            {item.portEta && (
              <>
                Порт по плану {shortDate(item.portEta)}
                {item.portArrivedAt ? `, пришло ${shortDate(item.portArrivedAt)}` : ''}.
              </>
            )}
          </div>
        )}

        <div className="seg">
          <button type="button" className={tab === 'money' ? 'seg-on' : ''} onClick={() => setTab('money')}>
            Деньги
          </button>
          <button type="button" className={tab === 'photos' ? 'seg-on' : ''} onClick={() => setTab('photos')}>
            Фото {data.photos.length > 0 && `· ${data.photos.length}`}
          </button>
          <button type="button" className={tab === 'talk' ? 'seg-on' : ''} onClick={() => setTab('talk')}>
            Комментарии {data.comments.length > 0 && `· ${data.comments.length}`}
          </button>
        </div>

        {tab === 'money' && <MoneyTab data={data} onChanged={() => { void load(); onChanged(); }} />}
        {tab === 'photos' && <PhotosTab data={data} onChanged={() => void load()} />}
        {tab === 'talk' && <TalkTab data={data} onChanged={() => void load()} />}
      </div>
    </Modal>
  );
}

function Figure({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="deal-figure">
      <span className="faint" style={{ fontSize: 11 }}>{label}</span>
      <strong style={{ fontSize: 17, color: danger ? 'var(--danger)' : undefined }}>{value}</strong>
    </div>
  );
}

// ─── Деньги ───────────────────────────────────────────────────────────────────

function MoneyTab({ data, onChanged }: { data: DealDetails; onChanged: () => void }) {
  const toast = useToast();
  const dealId = data.item.id;
  const [paying, setPaying] = useState<DealArticle | null>(null);

  async function saveCharge(article: DealArticle, planned: string, currency: Currency) {
    try {
      await api.put(`/api/deals/${dealId}/charges/${article}`, {
        planned: Number(planned || 0),
        currency,
      });
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {ARTICLES.map((article) => {
        const charge = data.charges.find((c) => c.article === article);
        const payments = data.payments.filter((p) => p.article === article);
        // Складываем в валюте начисления: в одной статье валюта обычно одна,
        // а смешивать гривну с долларом в строке — верный способ запутаться
        const paid = payments
          .filter((p) => p.currency === (charge?.currency ?? 'USD'))
          .reduce((sum, p) => sum + p.amount, 0);
        const planned = charge?.planned ?? 0;
        const currency = charge?.currency ?? 'USD';
        const rest = planned - paid;

        return (
          <div className="charge-row" key={article}>
            <div className="charge-head">
              <strong style={{ fontSize: 13 }}>{ARTICLE_LABELS[article]}</strong>
              {planned > 0 && (
                <span
                  className={rest > 0 ? 'charge-rest' : 'charge-ok'}
                  style={{ fontSize: 12 }}
                >
                  {rest > 0 ? `осталось ${money(rest, currency)}` : 'оплачено'}
                </span>
              )}
            </div>

            <div className="charge-inputs">
              <ChargeInput
                planned={planned}
                currency={currency}
                onSave={(value, cur) => void saveCharge(article, value, cur)}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPaying(article)}
                disabled={planned <= 0}
                title={planned <= 0 ? 'Сначала укажите, сколько клиент должен' : undefined}
              >
                + платёж
              </button>
            </div>

            {payments.length > 0 && (
              <div className="stack" style={{ gap: 3, marginTop: 6 }}>
                {payments.map((p) => (
                  <div className="payment-line" key={p.id}>
                    <span className="mono">{money(p.amount, p.currency)}</span>
                    <span className="faint">{shortDate(p.paidAt)}</span>
                    {p.method && <span className="faint">· {p.method}</span>}
                    <button
                      type="button"
                      className="link-danger"
                      onClick={async () => {
                        try {
                          await api.delete(`/api/deals/${dealId}/payments/${p.id}`);
                          onChanged();
                        } catch {
                          toast.error('Не удалось удалить платёж');
                        }
                      }}
                    >
                      удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {paying && (
        <PaymentForm
          dealId={dealId}
          article={paying}
          defaultCurrency={
            data.charges.find((c) => c.article === paying)?.currency ?? 'USD'
          }
          onClose={() => setPaying(null)}
          onSaved={() => {
            setPaying(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

/** Сумма начисления: сохраняем по уходу из поля, без лишней кнопки. */
function ChargeInput({
  planned,
  currency,
  onSave,
}: {
  planned: number;
  currency: Currency;
  onSave: (value: string, currency: Currency) => void;
}) {
  const [value, setValue] = useState(planned ? String(planned) : '');
  const [cur, setCur] = useState<Currency>(currency);

  return (
    <>
      <input
        type="number"
        className="mono"
        value={value}
        placeholder="сколько должен"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (Number(value || 0) !== planned) onSave(value, cur);
        }}
      />
      <select
        value={cur}
        onChange={(e) => {
          const next = e.target.value as Currency;
          setCur(next);
          if (value) onSave(value, next);
        }}
      >
        <option value="USD">$</option>
        <option value="UAH">₴</option>
        <option value="EUR">€</option>
      </select>
    </>
  );
}

function PaymentForm({
  dealId,
  article,
  defaultCurrency,
  onClose,
  onSaved,
}: {
  dealId: string;
  article: DealArticle;
  defaultCurrency: Currency;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!amount || Number(amount) <= 0) {
      toast.error('Укажите сумму платежа');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/deals/${dealId}/payments`, {
        article,
        amount: Number(amount),
        currency,
        paidAt,
        method: method.trim() || null,
        comment: comment.trim() || null,
      });
      toast.success('Платёж записан');
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось записать платёж');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Платёж · ${ARTICLE_LABELS[article]}`} onClose={onClose}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="grid-2">
          <label className="field">
            <span>Сумма</span>
            <input
              type="number"
              className="mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
            />
          </label>
          <label className="field">
            <span>Валюта</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="USD">Доллар</option>
              <option value="UAH">Гривна</option>
              <option value="EUR">Евро</option>
            </select>
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Дата платежа</span>
            <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </label>
          <label className="field">
            <span>Как заплатил</span>
            <input
              type="text"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="банк, наличные, карта"
            />
          </label>
        </div>

        <label className="field">
          <span>Комментарий</span>
          <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>

        {currency !== 'USD' && (
          <div className="banner">
            Курс запишется на дату платежа. В отчётах сумма пересчитается именно
            по нему, а не по сегодняшнему — иначе итог сделки менялся бы каждый день.
          </div>
        )}

        <div className="row-flex" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Записываю…' : 'Записать'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Фото ─────────────────────────────────────────────────────────────────────

function PhotosTab({ data, onChanged }: { data: DealDetails; onChanged: () => void }) {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<'auction' | 'port' | 'other'>('auction');
  const [caption, setCaption] = useState('');

  async function add() {
    if (!url.trim()) return;
    try {
      await api.post(`/api/deals/${data.item.id}/photos`, {
        kind,
        url: url.trim(),
        caption: caption.trim() || null,
      });
      setUrl('');
      setCaption('');
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось добавить ссылку');
    }
  }

  const groups: { key: 'auction' | 'port' | 'other'; label: string }[] = [
    { key: 'auction', label: 'С аукциона' },
    { key: 'port', label: 'Из порта' },
    { key: 'other', label: 'Прочее' },
  ];

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="stack" style={{ gap: 8 }}>
        <div className="charge-inputs">
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="auction">С аукциона</option>
            <option value="port">Из порта</option>
            <option value="other">Прочее</option>
          </select>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void add(); }}
            placeholder="Ссылка на альбом в облаке"
          />
          <button type="button" className="btn btn-ghost" onClick={() => void add()}>
            Добавить
          </button>
        </div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Подпись — например «после выгрузки, 12 снимков»"
        />
      </div>

      {data.photos.length === 0 && (
        <div className="faint" style={{ fontSize: 12.5 }}>
          Ссылок пока нет. Держать сотни снимков у себя незачем — облачный
          альбом открывается так же быстро, а сервер остаётся чистым.
        </div>
      )}

      {groups.map((group) => {
        const list = data.photos.filter((p) => p.kind === group.key);
        if (list.length === 0) return null;
        return (
          <div className="stack" style={{ gap: 6 }} key={group.key}>
            <span className="faint" style={{ fontSize: 11.5 }}>{group.label}</span>
            {list.map((photo) => (
              <div className="payment-line" key={photo.id}>
                <a href={photo.url ?? '#'} target="_blank" rel="noreferrer noopener">
                  {photo.caption || photo.url}
                </a>
                <span className="faint">{ago(photo.createdAt)}</span>
                <button
                  type="button"
                  className="link-danger"
                  onClick={async () => {
                    try {
                      await api.delete(`/api/deals/${data.item.id}/photos/${photo.id}`);
                      onChanged();
                    } catch {
                      toast.error('Не удалось удалить');
                    }
                  }}
                >
                  удалить
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Комментарии и история ────────────────────────────────────────────────────

function TalkTab({ data, onChanged }: { data: DealDetails; onChanged: () => void }) {
  const toast = useToast();
  const [body, setBody] = useState('');

  async function send() {
    if (!body.trim()) return;
    try {
      await api.post(`/api/deals/${data.item.id}/comments`, { body: body.trim() });
      setBody('');
      onChanged();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    }
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="charge-inputs">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void send(); }}
          placeholder="Что обсудили с клиентом"
        />
        <button type="button" className="btn btn-ghost" onClick={() => void send()}>
          Записать
        </button>
      </div>

      {data.comments.map((c) => (
        <div className="comment" key={c.id}>
          <div className="row-flex" style={{ gap: 8 }}>
            <strong style={{ fontSize: 12.5 }}>{c.authorName ?? 'Кто-то'}</strong>
            <span className="faint" style={{ fontSize: 11 }}>{ago(c.createdAt)}</span>
          </div>
          <div style={{ fontSize: 13 }}>{c.body}</div>
        </div>
      ))}

      {data.history.length > 0 && (
        <div className="stack" style={{ gap: 4 }}>
          <span className="faint" style={{ fontSize: 11.5 }}>Как шла сделка</span>
          {data.history.map((h) => (
            <div className="faint" style={{ fontSize: 11.5 }} key={h.id}>
              {ago(h.createdAt)} — {h.fromStage ? `${STAGE_LABELS[h.fromStage]} → ` : ''}
              {STAGE_LABELS[h.toStage]}
              {h.authorName ? `, ${h.authorName}` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
