import { useState } from 'react';
import { api, ApiError } from '@/api/client';
import { PLATFORM_LABELS, type Platform } from '@avtoklyuch/shared';
import type { ClientRow, DealRow, DealStage } from '@/api/types';
import { useToast } from '@/state/toast';
import { STAGE_LABELS, STAGES } from './dictionary';

interface Props {
  clients: ClientRow[];
  canPickAgent: boolean;
  /** Правим существующую — или заводим новую */
  deal?: DealRow;
  /** Когда сделку заводят прямо из заявки, клиент уже известен */
  presetClientId?: string;
  onDone: (id: string) => void;
  onCancel: () => void;
}

// Площадок шесть, включая канадские и британскую — список и подписи берём
// из общего пакета, чтобы они не разошлись с калькулятором
const PLATFORMS = Object.keys(PLATFORM_LABELS) as Platform[];

/**
 * Заведение и правка сделки.
 *
 * Обязателен только клиент: остальное дописывается по мере того, как сделка
 * идёт. Требовать VIN на этапе заявки бессмысленно — машина ещё не выбрана,
 * а менеджер начнёт выдумывать заглушки, лишь бы форма сохранилась.
 */
export function DealForm({
  clients,
  canPickAgent,
  deal,
  presetClientId,
  onDone,
  onCancel,
}: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState(deal?.clientId ?? presetClientId ?? '');
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? 'lead');
  const [platform, setPlatform] = useState<Platform | ''>(deal?.platform ?? '');
  const [lotNumber, setLotNumber] = useState(deal?.lotNumber ?? '');
  const [vin, setVin] = useState(deal?.vin ?? '');
  const [makeModel, setMakeModel] = useState(deal?.makeModel ?? '');
  const [year, setYear] = useState(deal?.year ? String(deal.year) : '');
  const [location, setLocation] = useState(deal?.location ?? '');
  const [price, setPrice] = useState(deal?.purchasePriceUsd ? String(deal.purchasePriceUsd) : '');
  const [portEta, setPortEta] = useState(deal?.portEta ?? '');
  const [portArrivedAt, setPortArrivedAt] = useState(deal?.portArrivedAt ?? '');
  const [deliveredAt, setDeliveredAt] = useState(deal?.deliveredAt ?? '');
  const [notes, setNotes] = useState(deal?.notes ?? '');

  async function save() {
    if (!clientId) {
      toast.error('Выберите клиента — сделка всегда чья-то');
      return;
    }

    const payload = {
      clientId,
      stage,
      platform: platform || null,
      lotNumber: lotNumber.trim() || null,
      // VIN в базе живёт как есть, но набирают его вразнобой — приводим к
      // верхнему регистру, иначе поиск по нему работает через раз
      vin: vin.trim().toUpperCase() || null,
      makeModel: makeModel.trim() || null,
      year: year ? Number(year) : null,
      location: location.trim() || null,
      purchasePriceUsd: price ? Number(price) : null,
      portEta: portEta || null,
      portArrivedAt: portArrivedAt || null,
      deliveredAt: deliveredAt || null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      if (deal) {
        await api.patch(`/api/deals/${deal.id}`, payload);
        toast.success('Сделка сохранена');
        onDone(deal.id);
      } else {
        const created = await api.post<{ item: { id: string } }>('/api/deals', payload);
        toast.success('Сделка заведена');
        onDone(created.item.id);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <label className="field">
        <span>Клиент</span>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={Boolean(deal) || Boolean(presetClientId)}
        >
          <option value="">— выберите —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} · {c.phone}
            </option>
          ))}
        </select>
        {!deal && !presetClientId && clients.length === 0 && (
          <span className="faint" style={{ fontSize: 11.5 }}>
            Клиентов пока нет — заведите первого в разделе «Клиенты»
          </span>
        )}
      </label>

      <div className="grid-2">
        <label className="field">
          <span>Этап</span>
          <select value={stage} onChange={(e) => setStage(e.target.value as DealStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Аукцион</span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform | '')}>
            <option value="">— не выбран —</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span>Номер лота</span>
          <input
            type="text"
            className="mono"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            placeholder="47281905"
          />
        </label>
        <label className="field">
          <span>VIN</span>
          <input
            type="text"
            className="mono"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="1C4PJMCB5GW123456"
          />
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span>Марка и модель</span>
          <input
            type="text"
            value={makeModel}
            onChange={(e) => setMakeModel(e.target.value)}
            placeholder="Jeep Compass Latitude"
          />
        </label>
        <label className="field">
          <span>Год</span>
          <input
            type="number"
            className="mono"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2018"
          />
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span>Локация <span className="faint">— откуда едет</span></span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="TX — Dallas"
          />
        </label>
        <label className="field">
          <span>Цена покупки, $</span>
          <input
            type="number"
            className="mono"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="7400"
          />
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span>Порт по плану</span>
          <input type="date" value={portEta} onChange={(e) => setPortEta(e.target.value)} />
        </label>
        <label className="field">
          <span>Пришло в порт</span>
          <input
            type="date"
            value={portArrivedAt}
            onChange={(e) => setPortArrivedAt(e.target.value)}
          />
        </label>
      </div>

      {(stage === 'delivered' || deliveredAt) && (
        <label className="field">
          <span>Выдано клиенту</span>
          <input
            type="date"
            value={deliveredAt}
            onChange={(e) => setDeliveredAt(e.target.value)}
          />
        </label>
      )}

      <label className="field">
        <span>Заметки по сделке</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Договорённости, особенности, что обещали клиенту"
        />
      </label>

      {canPickAgent && deal?.agentName && (
        <div className="banner">Сделку привёл агент: {deal.agentName}</div>
      )}

      <div className="row-flex" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void save()}
          disabled={saving}
        >
          {saving ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
