import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatMoney,
  FUEL_LABELS,
  PLATFORM_LABELS,
  SHOWCASE_STATUS_LABELS,
  VEHICLE_KIND_LABELS,
  type FuelType,
  type Platform,
  type ShowcaseStatus,
  type VehicleKind,
} from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import type { CalculationRecord, ShowcaseItemRow } from '@/api/types';
import { PencilIcon, PlusIcon, TrashIcon, UploadIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { MoneyInput } from '@/components/MoneyInput';
import { useToast } from '@/state/toast';

const STATUS_BADGE: Record<ShowcaseStatus, string> = {
  available: 'badge-teal',
  at_auction: 'badge-accent',
  delivered_case: 'badge-muted',
};

/** Русские подписи статусов для приложения — на сайте они украинские. */
const STATUS_RU: Record<ShowcaseStatus, string> = {
  available: 'В пути / в наличии',
  at_auction: 'Сейчас на торгах',
  delivered_case: 'Привезено — кейс',
};

export function Showcase() {
  const toast = useToast();
  const [items, setItems] = useState<ShowcaseItemRow[]>([]);
  const [editing, setEditing] = useState<ShowcaseItemRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<{ items: ShowcaseItemRow[] }>('/api/showcase');
      setItems(result.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить витрину');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublished(item: ShowcaseItemRow) {
    try {
      await api.patch(`/api/showcase/${item.id}`, { isPublished: !item.isPublished });
      toast.success(item.isPublished ? 'Снято с сайта' : 'Опубликовано на сайте');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось изменить');
    }
  }

  async function remove(item: ShowcaseItemRow) {
    if (!window.confirm(`Удалить «${item.title}» из витрины? Фото тоже удалятся.`)) return;
    try {
      await api.delete(`/api/showcase/${item.id}`);
      toast.success('Удалено');
      void load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось удалить');
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Витрина на сайте</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Клиент видит только цену «под ключ» и крупные статьи — маржа и себестоимость сюда
            не попадают никогда
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setPublishing(true)}>
          <PlusIcon /> Опубликовать расчёт
        </button>
      </header>

      <div className="page">
        {loading && <div className="empty">Загружаю…</div>}

        {!loading && items.length === 0 && (
          <div className="card">
            <div className="empty">
              Витрина пуста. Нажмите «Опубликовать расчёт» — карточка соберётся из готового
              расчёта, останется добавить фото и пробег.
            </div>
          </div>
        )}

        {items.length > 0 && (
          <section className="card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Авто</th>
                    <th>Статус</th>
                    <th>Цена под ключ</th>
                    <th>Фото</th>
                    <th>На сайте</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="stack" style={{ gap: 2 }}>
                          <span>{item.title}</span>
                          <span className="faint mono" style={{ fontSize: 11 }}>
                            {[
                              PLATFORM_LABELS[item.platform],
                              item.location,
                              item.lotNumber,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[item.status]}`}>
                          {STATUS_RU[item.status]}
                        </span>
                      </td>
                      <td className="mono nowrap">{formatMoney(item.turnkeyPriceUsd)}</td>
                      <td className="mono">{item.photos.length}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${item.isPublished ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => void togglePublished(item)}
                        >
                          {item.isPublished ? 'Опубликовано' : 'Черновик'}
                        </button>
                      </td>
                      <td>
                        <div className="row-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setEditing(item)}
                            aria-label={`Править ${item.title}`}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => void remove(item)}
                            aria-label={`Удалить ${item.title}`}
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {publishing && (
        <PublishFromCalculationModal
          onClose={() => setPublishing(false)}
          onPublished={() => {
            setPublishing(false);
            void load();
          }}
        />
      )}

      {editing && (
        <EditItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </>
  );
}

function PublishFromCalculationModal({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished: () => void;
}) {
  const toast = useToast();
  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [status, setStatus] = useState<ShowcaseStatus>('available');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api
      .get<{ items: CalculationRecord[] }>('/api/calculations', { period: 'quarter', limit: 100 })
      .then((result) => {
        setCalculations(result.items);
        setSelected(result.items[0]?.id ?? '');
      })
      .catch(() => toast.error('Не удалось загрузить расчёты'));
  }, [toast]);

  async function publish() {
    if (!selected) return;
    setBusy(true);
    try {
      await api.post(`/api/showcase/from-calculation/${selected}`, { status, publishNow: false });
      toast.success('Карточка создана — добавьте фото и опубликуйте');
      onPublished();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось опубликовать');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Опубликовать расчёт в витрину"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void publish()}
            disabled={busy || !selected}
          >
            {busy ? 'Создаю…' : 'Создать карточку'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <label className="field">
          <span>Расчёт</span>
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {calculations.map((calc) => (
              <option key={calc.id} value={calc.id}>
                {[calc.makeModel, calc.year].filter(Boolean).join(' ')} ·{' '}
                {formatMoney(calc.clientTotalUsd)} ·{' '}
                {new Date(calc.createdAt).toLocaleDateString('ru-RU')}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Статус в витрине</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ShowcaseStatus)}
          >
            {Object.entries(STATUS_RU).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <div className="banner">
          В карточку перенесётся цена клиенту и её крупные статьи. Внутренние строки —
          маржа, себестоимость, источники значений — на сайт не уходят.
          Карточка создастся черновиком: добавьте фото и нажмите «Опубликовать».
        </div>

        {calculations.length === 0 && (
          <div className="banner warn">
            Сохранённых расчётов за квартал нет. Сначала посчитайте и сохраните расчёт.
          </div>
        )}
      </div>
    </Modal>
  );
}

function EditItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: ShowcaseItemRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<ShowcaseItemRow>(item);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save() {
    setBusy(true);
    try {
      await api.patch(`/api/showcase/${item.id}`, {
        status: draft.status,
        title: draft.title,
        makeModel: draft.makeModel,
        year: draft.year,
        fuel: draft.fuel,
        engineVolume: draft.engineVolume,
        vehicleKind: draft.vehicleKind,
        platform: draft.platform,
        location: draft.location,
        lotNumber: draft.lotNumber,
        mileage: draft.mileage,
        damage: draft.damage,
        turnkeyPriceUsd: draft.turnkeyPriceUsd,
        description: draft.description,
        sortOrder: draft.sortOrder,
      });
      toast.success('Карточка сохранена');
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    try {
      const result = await api.upload<{ photo: { id: string; url: string; sortOrder: number } }>(
        `/api/showcase/${item.id}/photos`,
        file,
      );
      setDraft((current) => ({ ...current, photos: [...current.photos, result.photo] }));
      toast.success('Фото загружено');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось загрузить фото');
    }
  }

  async function removePhoto(photoId: string) {
    try {
      await api.delete(`/api/showcase/${item.id}/photos/${photoId}`);
      setDraft((current) => ({
        ...current,
        photos: current.photos.filter((p) => p.id !== photoId),
      }));
    } catch {
      toast.error('Не удалось удалить фото');
    }
  }

  return (
    <Modal
      title={draft.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
            {busy ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <label className="field">
          <span>Заголовок на сайте</span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>

        <div className="grid-2">
          <label className="field">
            <span>Статус</span>
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as ShowcaseStatus })}
            >
              {Object.entries(STATUS_RU).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Цена под ключ, $</span>
            <MoneyInput
              value={draft.turnkeyPriceUsd}
              onChange={(value) => setDraft({ ...draft, turnkeyPriceUsd: value })}
              formatted={false}
              ariaLabel="Цена под ключ"
            />
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Марка / модель</span>
            <input
              type="text"
              value={draft.makeModel}
              onChange={(event) => setDraft({ ...draft, makeModel: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Год</span>
            <input
              type="text"
              inputMode="numeric"
              className="mono"
              value={draft.year ?? ''}
              onChange={(event) => {
                const year = Number.parseInt(event.target.value, 10);
                setDraft({ ...draft, year: Number.isFinite(year) ? year : null });
              }}
            />
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Топливо</span>
            <select
              value={draft.fuel}
              onChange={(event) => setDraft({ ...draft, fuel: event.target.value as FuelType })}
            >
              {Object.entries(FUEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Вид авто</span>
            <select
              value={draft.vehicleKind}
              onChange={(event) =>
                setDraft({ ...draft, vehicleKind: event.target.value as VehicleKind })
              }
            >
              {Object.entries(VEHICLE_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Пробег, миль</span>
            <input
              type="text"
              inputMode="numeric"
              className="mono"
              value={draft.mileage ?? ''}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value.replace(/\D/g, ''), 10);
                setDraft({ ...draft, mileage: Number.isFinite(value) ? value : null });
              }}
              placeholder="42 000"
            />
          </label>
          <label className="field">
            <span>Площадка</span>
            <select
              value={draft.platform}
              onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform })}
            >
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Повреждения</span>
          <input
            type="text"
            value={draft.damage ?? ''}
            onChange={(event) => setDraft({ ...draft, damage: event.target.value || null })}
            placeholder="Передний удар, подушки целы"
          />
        </label>

        <label className="field">
          <span>Описание для сайта</span>
          <textarea
            rows={3}
            value={draft.description ?? ''}
            onChange={(event) => setDraft({ ...draft, description: event.target.value || null })}
            placeholder="Что важно знать клиенту об этом авто"
          />
        </label>

        <div className="field">
          <span className="field-label">Фотографии</span>
          <div className="row-flex" style={{ gap: 8 }}>
            {draft.photos.map((photo) => (
              <div key={photo.id} style={{ position: 'relative' }}>
                <img
                  src={photo.url}
                  alt=""
                  style={{ width: 84, height: 60, objectFit: 'cover', borderRadius: 8 }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => void removePhoto(photo.id)}
                  aria-label="Удалить фото"
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20 }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
              <UploadIcon /> Добавить
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadPhoto(file);
                event.target.value = '';
              }}
            />
          </div>
          <span className="faint" style={{ fontSize: 11.5 }}>
            JPG, PNG, WebP или AVIF, до 8 МБ. Первое фото станет обложкой.
          </span>
        </div>

        <div className="banner">
          Публичная ссылка: <span className="mono">/auto/{draft.slug}</span>
          {' · '}
          статус на сайте: {SHOWCASE_STATUS_LABELS[draft.status]}
        </div>
      </div>
    </Modal>
  );
}
