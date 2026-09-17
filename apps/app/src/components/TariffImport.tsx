import { useMemo, useRef, useState } from 'react';
import {
  looksLikeHeader,
  parseDelimited,
  parseNumericCell,
  PLATFORM_LABELS,
  VEHICLE_KIND_LABELS,
  type Platform,
  type VehicleKind,
} from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import { Modal } from '@/components/Modal';
import { UploadIcon } from '@/components/Icons';
import { useToast } from '@/state/toast';

type Kind = 'delivery' | 'auction';

interface ParsedRow {
  line: number;
  raw: string[];
  /** Готовая к отправке строка или причина, по которой она не годится */
  value: Record<string, unknown> | null;
  error: string | null;
}

const PLATFORM_ALIASES: Record<string, Platform> = {
  copart: 'copart',
  копарт: 'copart',
  iaai: 'iaai',
  иаи: 'iaai',
  иааи: 'iaai',
};

const KIND_ALIASES: Record<string, VehicleKind> = {
  седан: 'sedan', sedan: 'sedan',
  внедорожник: 'suv', джип: 'suv', кроссовер: 'suv', suv: 'suv',
  пикап: 'pickup', пікап: 'pickup', pickup: 'pickup',
  купе: 'coupe', coupe: 'coupe',
  минивэн: 'minivan', мінівен: 'minivan', minivan: 'minivan', van: 'minivan',
  мотоцикл: 'motorcycle', motorcycle: 'motorcycle',
  грузовик: 'truck', вантажівка: 'truck', truck: 'truck',
};

const TEMPLATES: Record<Kind, { header: string; example: string }> = {
  delivery: {
    header: 'Площадка;Локация;Тип авто;Стоимость',
    example: 'Copart;Texas;Седан;1640\nIAAI;New Jersey;Внедорожник;1940',
  },
  auction: {
    header: 'Площадка;Ставка от;Ставка до;Сбор;Процент',
    example: 'Copart;0;10000;400;0\nCopart;10000;;540;0',
  },
};

/**
 * Импорт тарифов из таблицы.
 *
 * Принимает файл CSV и вставку прямо из Excel или Google Sheets — при
 * копировании ячеек в буфер попадает TSV, поэтому ничего конвертировать
 * вручную не нужно.
 *
 * Разбор показывается построчно ДО отправки: менеджер видит, что именно
 * заедет в таблицу, и какие строки система не поняла. Молча проглотить
 * половину файла — верный способ потом неделю искать, откуда взялась
 * неправильная цена в расчёте.
 */
export function TariffImport({
  kind,
  onClose,
  onImported,
}: {
  kind: Kind;
  onClose: () => void;
  onImported: () => void;
}) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [replaceAll, setReplaceAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseRows(kind, text), [kind, text]);
  const valid = parsed.filter((r) => r.value !== null);
  const invalid = parsed.filter((r) => r.value === null);

  async function submit() {
    if (valid.length === 0) return;
    setBusy(true);
    try {
      const path = kind === 'delivery' ? 'delivery' : 'auction-fees';
      const result = await api.post<{
        created: number;
        updated: number;
        removed: number;
      }>(`/api/tariffs/${path}/import`, {
        rows: valid.map((r) => r.value),
        replaceAll,
      });

      toast.success(
        `Импорт завершён: добавлено ${result.created}, обновлено ${result.updated}` +
          (result.removed ? `, удалено ${result.removed}` : ''),
      );
      onImported();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Импорт не удался');
    } finally {
      setBusy(false);
    }
  }

  const template = TEMPLATES[kind];

  return (
    <Modal
      title={kind === 'delivery' ? 'Импорт тарифов доставки' : 'Импорт аукционных сборов'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void submit()}
            disabled={busy || valid.length === 0}
          >
            {busy ? 'Загружаю…' : `Загрузить ${valid.length} строк`}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <div className="banner">
          Вставьте ячейки прямо из Excel или Google Sheets (Ctrl+V) либо выберите файл CSV.
          <br />
          Ожидаемые столбцы: <code>{template.header}</code>
          {kind === 'auction' && <><br />Пустая «Ставка до» означает «и выше».</>}
        </div>

        <div className="row-flex" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            <UploadIcon /> Выбрать файл CSV
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setText(`${template.header}\n${template.example}`)}
          >
            Подставить образец
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void file.text().then(setText);
              event.target.value = '';
            }}
          />
        </div>

        <label className="field">
          <span>Данные таблицы</span>
          <textarea
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`${template.header}\n${template.example}`}
            className="mono"
            style={{ fontSize: 12.5 }}
          />
        </label>

        {parsed.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <div className="row-flex" style={{ gap: 10 }}>
              <span className="badge badge-teal">распознано: {valid.length}</span>
              {invalid.length > 0 && (
                <span className="badge badge-warn">не понято: {invalid.length}</span>
              )}
            </div>

            <div className="import-preview">
              {parsed.slice(0, 40).map((row) => (
                <div
                  key={row.line}
                  className={`import-row ${row.value ? '' : 'bad'}`}
                >
                  <span className="mono faint">{row.line}</span>
                  <span className="mono">{row.raw.join(' · ')}</span>
                  <span className={row.value ? 'muted' : 'import-error'}>
                    {row.value ? describe(kind, row.value) : row.error}
                  </span>
                </div>
              ))}
              {parsed.length > 40 && (
                <div className="muted" style={{ padding: '8px 0', fontSize: 12 }}>
                  …и ещё {parsed.length - 40} строк
                </div>
              )}
            </div>
          </div>
        )}

        <label className="row-flex" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={replaceAll}
            onChange={(event) => setReplaceAll(event.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13 }}>
            Заменить таблицу целиком
            <span className="faint"> — существующие строки будут удалены</span>
          </span>
        </label>

        {replaceAll && (
          <div className="banner warn">
            Таблица будет очищена перед загрузкой. Удаление попадёт в журнал правок,
            но отменить его одной кнопкой нельзя.
          </div>
        )}

        {kind === 'auction' && !replaceAll && (
          <div className="banner">
            Диапазоны по площадкам из файла будут перезаписаны целиком — иначе они
            неминуемо пересекутся с существующими.
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Разбор ─────────────────────────────────────────────────────────────────

function parseRows(kind: Kind, text: string): ParsedRow[] {
  const rows = parseDelimited(text);
  if (rows.length === 0) return [];

  // Первая строка похожа на заголовок — пропускаем её, а не пытаемся импортировать
  const body = rows.length > 1 && looksLikeHeader(rows[0]!) ? rows.slice(1) : rows;
  const offset = body.length === rows.length ? 1 : 2;

  return body.map((raw, index) => {
    const line = index + offset;
    const parsed = kind === 'delivery' ? parseDeliveryRow(raw) : parseAuctionRow(raw);
    return { line, raw, ...parsed };
  });
}

function parseDeliveryRow(raw: string[]): { value: Record<string, unknown> | null; error: string | null } {
  const [platformRaw, location, kindRaw, amountRaw] = raw;

  const platform = PLATFORM_ALIASES[(platformRaw ?? '').trim().toLowerCase()];
  if (!platform) return { value: null, error: `площадка «${platformRaw ?? ''}» не распознана` };

  if (!location?.trim()) return { value: null, error: 'пустая локация' };

  const vehicleKind = KIND_ALIASES[(kindRaw ?? '').trim().toLowerCase()];
  if (!vehicleKind) return { value: null, error: `тип авто «${kindRaw ?? ''}» не распознан` };

  const amountUsd = parseNumericCell(amountRaw ?? '');
  if (amountUsd === null || amountUsd < 0) {
    return { value: null, error: `сумма «${amountRaw ?? ''}» не число` };
  }

  return {
    value: { platform, location: location.trim(), vehicleKind, amountUsd, isActive: true },
    error: null,
  };
}

function parseAuctionRow(raw: string[]): { value: Record<string, unknown> | null; error: string | null } {
  const [platformRaw, fromRaw, toRaw, feeRaw, percentRaw] = raw;

  const platform = PLATFORM_ALIASES[(platformRaw ?? '').trim().toLowerCase()];
  if (!platform) return { value: null, error: `площадка «${platformRaw ?? ''}» не распознана` };

  const bidFrom = parseNumericCell(fromRaw ?? '');
  if (bidFrom === null || bidFrom < 0) {
    return { value: null, error: `«ставка от» не число` };
  }

  // Пустая верхняя граница — это «и выше», а не ошибка
  const bidTo = (toRaw ?? '').trim() === '' ? null : parseNumericCell(toRaw ?? '');
  if (bidTo !== null && (bidTo <= bidFrom)) {
    return { value: null, error: 'верхняя граница не больше нижней' };
  }

  const feeAmount = parseNumericCell(feeRaw ?? '') ?? 0;
  const feePercent = parseNumericCell(percentRaw ?? '') ?? 0;

  if (feeAmount < 0 || feePercent < 0) return { value: null, error: 'отрицательный сбор' };

  return {
    value: { platform, bidFrom, bidTo, feeAmount, feePercent, isActive: true },
    error: null,
  };
}

function describe(kind: Kind, value: Record<string, unknown>): string {
  if (kind === 'delivery') {
    return `${PLATFORM_LABELS[value['platform'] as Platform]} · ${value['location']} · ${
      VEHICLE_KIND_LABELS[value['vehicleKind'] as VehicleKind]
    } · $${value['amountUsd']}`;
  }
  const to = value['bidTo'] === null ? '∞' : `$${value['bidTo']}`;
  return `${PLATFORM_LABELS[value['platform'] as Platform]} · $${value['bidFrom']}–${to} · $${value['feeAmount']}`;
}
