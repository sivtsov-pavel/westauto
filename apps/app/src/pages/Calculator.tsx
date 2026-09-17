import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import {
  breakdownToText,
  can,
  formatMoney,
  FUEL_LABELS,
  PLATFORM_LABELS,
  VEHICLE_KIND_LABELS,
  type FuelType,
  type Platform,
  type VehicleKind,
} from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import type { BootstrapResponse, CalcState } from '@/api/types';
import type { ClientLocale, FxRates } from '@avtoklyuch/shared';
import { CalcRows } from '@/components/CalcRows';
import { ClientCard } from '@/components/ClientCard';
import { OfferDocument } from '@/components/OfferDocument';
import { CompositionBar } from '@/components/CompositionBar';
import { FxPanel } from '@/components/FxPanel';
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  InfoIcon,
  MoonIcon,
  RefreshIcon,
  SearchIcon,
  SunIcon,
} from '@/components/Icons';
import { MoneyInput } from '@/components/MoneyInput';
import { Notifications } from '@/components/Notifications';
import { useCalculator } from '@/state/calculator';
import { useToast } from '@/state/toast';
import { useTheme } from '@/state/theme';

interface CalculatorProps {
  bootstrap: BootstrapResponse;
  onBootstrapReload: () => void;
}

export function Calculator({ bootstrap, onBootstrapReload }: CalculatorProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Расчёт, открытый из истории кнопкой «Скопировать в новый»
  const seeded = (location.state as { state?: CalcState } | null)?.state ?? null;

  const [initialState, setInitialState] = useState<CalcState | null>(seeded);
  const [restoring, setRestoring] = useState(!seeded);

  // Восстанавливаем черновик, чтобы после перезагрузки страницы
  // менеджер продолжил ровно с того места, где остановился
  useEffect(() => {
    if (seeded) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.get<{ draft: { state: CalcState } | null }>(
          '/api/calculations/draft',
        );
        if (!cancelled && data.draft) setInitialState(data.draft.state);
      } catch {
        // черновика нет — начинаем с чистого листа
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seeded]);

  if (restoring) {
    return <div className="empty">Загружаю черновик…</div>;
  }

  return (
    <CalculatorBody
      key={initialState ? 'restored' : 'blank'}
      bootstrap={bootstrap}
      initialState={initialState}
      onBootstrapReload={onBootstrapReload}
      onSaved={() => {
        toast.success('Расчёт сохранён в историю');
        navigate('/history');
      }}
    />
  );
}

function CalculatorBody({
  bootstrap,
  initialState,
  onBootstrapReload,
  onSaved,
}: {
  bootstrap: BootstrapResponse;
  initialState: CalcState | null;
  onBootstrapReload: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { theme, toggle: toggleTheme } = useTheme();
  const calc = useCalculator({ bootstrap, initialState });
  const { state, result } = calc;

  const [identifier, setIdentifier] = useState(state.lot.lotNumber ?? '');
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [liveFx, setLiveFx] = useState<FxRates>(bootstrap.fx);
  const [fxRefreshing, setFxRefreshing] = useState(false);

  const [clientLocale, setClientLocale] = useState<ClientLocale>('uk');
  const [exportingPdf, setExportingPdf] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);

  // ─── Подтянуть данные лота ───────────────────────────────────────────────
  const fetchLot = useCallback(async () => {
    if (!identifier.trim()) {
      searchRef.current?.focus();
      return;
    }
    setFetching(true);
    setFetchNote(null);
    try {
      const data = await api.post<
        | { ok: true; data: Record<string, unknown> }
        | { ok: false; message: string; hint: string }
      >('/api/lots/fetch', { identifier: identifier.trim(), platform: state.lot.platform });

      if (!data.ok) {
        // Ровно то поведение, которое требует ТЗ: не ошибка, а мягкий переход
        // на ручной ввод — менеджер не теряет ни секунды
        setFetchNote(data.hint);
        calc.patchLot({ lotNumber: identifier.trim() });
        return;
      }

      const lot = data.data as {
        lotNumber: string | null;
        vin: string | null;
        makeModel: string | null;
        year: number | null;
        engineVolume: number | null;
        fuel: FuelType | null;
        location: string | null;
        vehicleKind: VehicleKind | null;
        platform: Platform;
        currentBid: number | null;
      };

      calc.patchLot({
        lotNumber: lot.lotNumber ?? identifier.trim(),
        vin: lot.vin,
        makeModel: lot.makeModel,
        year: lot.year,
        engineVolume: lot.engineVolume,
        platform: lot.platform,
        ...(lot.fuel ? { fuel: lot.fuel } : {}),
        ...(lot.location ? { location: lot.location } : {}),
        ...(lot.vehicleKind ? { vehicleKind: lot.vehicleKind } : {}),
      });
      if (lot.currentBid && state.bid === 0) calc.setBid(lot.currentBid);

      setFetchNote('Данные подтянуты — проверьте поля перед расчётом');
    } catch (error) {
      setFetchNote(
        error instanceof ApiError ? error.message : 'Не удалось получить, заполните вручную',
      );
    } finally {
      setFetching(false);
    }
  }, [identifier, state.lot.platform, state.bid, calc]);

  // ─── Курс валют ──────────────────────────────────────────────────────────
  const refreshFx = useCallback(async () => {
    setFxRefreshing(true);
    try {
      const data = await api.get<{ fx: FxRates }>('/api/calculations/fx');
      setLiveFx(data.fx);
      toast.success(`Курс обновлён: ${data.fx.source}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Курс не обновился');
    } finally {
      setFxRefreshing(false);
    }
  }, [toast]);

  // ─── Копирование итоговой разбивки ───────────────────────────────────────
  const copyBreakdown = useCallback(async () => {
    const text = breakdownToText(result, state.lot, clientLocale);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Разбивка скопирована');
    } catch {
      toast.error('Браузер не дал доступ к буферу обмена');
    }
  }, [result, state.lot, clientLocale, toast]);

  // ─── Сохранение PNG карточки ─────────────────────────────────────────────
  const savePng = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        // Двойное разрешение: скриншот остаётся чётким в мессенджере
        pixelRatio: 2,
        backgroundColor: '#FBF8F2',
        cacheBust: true,
      });
      const link = document.createElement('a');
      const name = [state.lot.makeModel, state.lot.year].filter(Boolean).join('-') || 'raschet';
      link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('PNG сохранён');
    } catch {
      toast.error('Не удалось собрать PNG');
    }
  }, [state.lot, toast]);

  // ─── Коммерческое предложение в PDF ─────────────────────────────────────
  const saveOfferPdf = useCallback(async () => {
    if (!offerRef.current) return;
    setExportingPdf(true);
    try {
      // jsPDF грузим по требованию: библиотека тяжёлая, а нужна далеко не
      // в каждом сеансе работы с калькулятором
      const { jsPDF } = await import('jspdf');

      const dataUrl = await toPng(offerRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FBF8F2',
        cacheBust: true,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Вписываем картинку в страницу, сохраняя пропорции документа
      const props = pdf.getImageProperties(dataUrl);
      const ratio = Math.min(pageWidth / props.width, pageHeight / props.height);
      const width = props.width * ratio;
      const height = props.height * ratio;

      pdf.addImage(dataUrl, 'PNG', (pageWidth - width) / 2, 0, width, height);

      const name = [state.lot.makeModel, state.lot.year].filter(Boolean).join('-') || 'kp';
      pdf.save(`${name.replace(/\s+/g, '-').toLowerCase()}-kp.pdf`);
      toast.success('Коммерческое предложение сохранено');
    } catch {
      toast.error('Не удалось собрать PDF');
    } finally {
      setExportingPdf(false);
    }
  }, [state.lot, toast]);

  // ─── Сохранение расчёта ──────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (state.bid <= 0) {
      toast.error('Укажите ставку — без неё расчёт не сохранить');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/calculations', state);
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }, [state, toast, onSaved]);

  // ─── Горячие клавиши ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      } else if (event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void copyBreakdown();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [save, copyBreakdown]);

  const discount = bootstrap.user.deliveryDiscountPercent;
  // Агент видит цену клиенту, но не видит, из чего она сложилась внутри
  const showInternal = can(bootstrap.user.role, 'viewInternals');

  return (
    <>
      <header className="topbar">
        <div className="row-flex" style={{ gap: 12 }}>
          <label
            className="row-flex"
            style={{
              gap: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: '9px 12px',
              width: 300,
              maxWidth: '100%',
            }}
          >
            <span className="muted" style={{ display: 'flex' }}>
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void fetchLot();
              }}
              placeholder="Номер лота или VIN"
              aria-label="Номер лота или VIN"
              className="mono"
              style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 13 }}
            />
            <kbd>⌘K</kbd>
          </label>

          <button type="button" className="btn" onClick={() => void fetchLot()} disabled={fetching}>
            {fetching ? 'Тяну…' : 'Подтянуть данные'}
          </button>

          {fetchNote && (
            <span className="muted" style={{ fontSize: 12 }}>
              {fetchNote}
            </span>
          )}
        </div>

        <div className="row-flex" style={{ gap: 14 }}>
          <DraftStatus status={calc.saveStatus} />

          <Notifications />

          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            style={{ width: 30, height: 30 }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <span className="badge badge-teal mono" style={{ padding: '7px 12px', fontSize: 12.5 }}>
            {bootstrap.user.role === 'admin'
              ? 'Администратор'
              : `Менеджер${discount ? ` · ${discount > 0 ? '−' : '+'}${Math.abs(discount)}%` : ''}`}
          </span>
        </div>
      </header>

      <div className="page">
        {showInternal && bootstrap.customsMode === 'estimate' && (
          <div className="banner warn">
            <InfoIcon />
            <span>
              Ключ baza-gai.com.ua не задан — растаможка считается{' '}
              <strong>локальной оценочной формулой</strong>. Бесплатный ключ (1000 запросов/мес)
              запрашивается формой на baza-gai.com.ua, затем добавляется в <code>BAZA_GAI_API_KEY</code>.
            </span>
          </div>
        )}

        {calc.customsWarning && (
          <div className="banner warn">
            <InfoIcon />
            <span>{calc.customsWarning}</span>
          </div>
        )}

        <div className="calc-layout">
          {/* ─── Данные лота ─────────────────────────────────────────────── */}
          <section className="card stack" style={{ gap: 14 }}>
            <div className="section-title">Данные лота</div>

            <label className="field">
              <span>№ лота / VIN</span>
              <input
                type="text"
                className="mono"
                value={[state.lot.lotNumber, state.lot.vin].filter(Boolean).join(' · ')}
                onChange={(event) => {
                  const [lot, vin] = event.target.value.split('·').map((s) => s.trim());
                  calc.patchLot({ lotNumber: lot || null, vin: vin || null });
                }}
                placeholder="47281905"
              />
            </label>

            <label className="field">
              <span>Марка / модель</span>
              <input
                type="text"
                value={state.lot.makeModel ?? ''}
                onChange={(event) => calc.patchLot({ makeModel: event.target.value || null })}
                placeholder="Tesla Model 3"
              />
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Год</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="mono"
                  value={state.lot.year ?? ''}
                  onChange={(event) => {
                    const year = Number.parseInt(event.target.value, 10);
                    calc.patchLot({ year: Number.isFinite(year) ? year : null });
                  }}
                  placeholder="2021"
                />
              </label>

              <label className="field">
                <span>{state.lot.fuel === 'electric' ? 'Батарея, кВт·ч' : 'Объём, л'}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="mono"
                  value={
                    state.lot.fuel === 'electric'
                      ? (state.lot.batteryPower ?? '')
                      : (state.lot.engineVolume ?? '')
                  }
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value.replace(',', '.'));
                    const parsed = Number.isFinite(value) ? value : null;
                    calc.patchLot(
                      state.lot.fuel === 'electric'
                        ? { batteryPower: parsed }
                        : { engineVolume: parsed },
                    );
                  }}
                  placeholder={state.lot.fuel === 'electric' ? '75' : '2.0'}
                />
              </label>
            </div>

            <label className="field">
              <span>Топливо</span>
              <select
                value={state.lot.fuel}
                onChange={(event) => calc.patchLot({ fuel: event.target.value as FuelType })}
              >
                {Object.entries(FUEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid-2">
              <label className="field">
                <span>Площадка</span>
                <select
                  value={state.lot.platform}
                  onChange={(event) => calc.patchLot({ platform: event.target.value as Platform })}
                >
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Локация</span>
                <input
                  type="text"
                  list="avk-locations"
                  value={state.lot.location}
                  onChange={(event) => calc.patchLot({ location: event.target.value })}
                  placeholder="Texas"
                />
                <datalist id="avk-locations">
                  {[...new Set(bootstrap.deliveryTariffs.map((t) => t.location))].map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="field">
              <span>
                Вид авто <span className="faint">— влияет на доставку</span>
              </span>
              <select
                value={state.lot.vehicleKind}
                onChange={(event) =>
                  calc.patchLot({ vehicleKind: event.target.value as VehicleKind })
                }
              >
                {Object.entries(VEHICLE_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field" style={{ marginTop: 2 }}>
              <span>
                Ставка, $ <span style={{ color: 'var(--accent)' }}>*</span>
              </span>
              <MoneyInput
                value={state.bid}
                onChange={calc.setBid}
                className="input-bid"
                ariaLabel="Ставка на аукционе в долларах"
                placeholder="14 200"
              />
            </label>

            <div className="row-flex" style={{ marginTop: 4 }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={calc.reset}>
                Очистить
              </button>
              {showInternal && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={onBootstrapReload}
                  title="Перечитать тарифы и настройки"
                >
                  <RefreshIcon size={12} /> Обновить тарифы
                </button>
              )}
            </div>
          </section>

          {/* ─── Правая колонка ──────────────────────────────────────────── */}
          <div className="stack" style={{ gap: 20 }}>
            <section className="card">
              <div className="card-head">
                <div className="section-title">Расчёт стоимости</div>
                {showInternal && (
                  <div className="row-flex" style={{ gap: 14, fontSize: 11 }}>
                    <span className="muted"><i className="dot dot-tariff" style={{ marginLeft: 0, marginRight: 5 }} />тариф</span>
                    <span className="muted"><i className="dot dot-api" style={{ marginLeft: 0, marginRight: 5 }} />API</span>
                    <span className="muted"><i className="dot dot-estimate" style={{ marginLeft: 0, marginRight: 5 }} />оценка</span>
                    <span className="muted"><i className="dot dot-manual" style={{ marginLeft: 0, marginRight: 5 }} />вручную</span>
                  </div>
                )}
              </div>

              <CalcRows
                lines={result.lines}
                showInternal={showInternal}
                onOverride={calc.setOverride}
                onToggle={calc.toggleLine}
              />

              <CompositionBar segments={result.composition} />

              {showInternal && result.margin !== 0 && (
                <div
                  className="spread"
                  style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}
                >
                  <span className="muted" style={{ fontSize: 13 }}>
                    Себестоимость <span className="faint">· без маржи, внутреннее</span>
                  </span>
                  <span className="mono" style={{ fontSize: 15 }}>{formatMoney(result.cost)}</span>
                </div>
              )}

              <div className="calc-total">
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  {result.margin !== 0 ? 'Цена клиенту' : 'Итого под ключ'}
                </span>
                <span className="amount">{formatMoney(result.clientTotal)}</span>
              </div>

              <FxPanel
                live={liveFx}
                pinned={state.fx}
                totalUsd={result.clientTotal}
                onPin={calc.setFx}
                onRefresh={() => void refreshFx()}
                refreshing={fxRefreshing}
              />

              <div className="row-flex" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void save()}
                  disabled={saving || state.bid <= 0}
                >
                  {saving ? 'Сохраняю…' : 'Сохранить расчёт'} <kbd style={{ color: 'inherit' }}>⌘S</kbd>
                </button>
                {calc.customsLoading && (
                  <span className="muted" style={{ fontSize: 12 }}>Обновляю растаможку…</span>
                )}
              </div>
            </section>

            {/* ─── Карточка для клиента ──────────────────────────────────── */}
            <section className="stack" style={{ gap: 10 }}>
              <div className="card-head" style={{ marginBottom: 0 }}>
                <div className="section-title">Карточка для клиента · готова к скриншоту</div>
                <div className="row-flex" style={{ gap: 8 }}>
                  {/* Язык документов для клиента — отдельно от языка интерфейса */}
                  <div className="locale-switch" role="group" aria-label="Язык документов для клиента">
                    <button
                      type="button"
                      aria-pressed={clientLocale === 'uk'}
                      onClick={() => setClientLocale('uk')}
                    >
                      UA
                    </button>
                    <button
                      type="button"
                      aria-pressed={clientLocale === 'ru'}
                      onClick={() => setClientLocale('ru')}
                    >
                      RU
                    </button>
                  </div>
                  <button type="button" className="btn btn-sm" onClick={() => void copyBreakdown()}>
                    <CopyIcon /> Копировать <kbd>⌘⇧C</kbd>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void saveOfferPdf()}
                    disabled={exportingPdf || state.bid <= 0}
                    title="Полноразмерное коммерческое предложение на A4"
                  >
                    <DownloadIcon /> {exportingPdf ? 'Собираю…' : 'КП в PDF'}
                  </button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => void savePng()}>
                    <DownloadIcon /> Сохранить PNG
                  </button>
                </div>
              </div>
              <ClientCard ref={cardRef} result={result} lot={state.lot} locale={clientLocale} />

              {/*
                Документ КП живёт за пределами экрана: на вид он не нужен,
                нужен только как источник для PDF.
              */}
              <div className="offer-stage" aria-hidden="true">
                <OfferDocument
                  ref={offerRef}
                  result={result}
                  lot={state.lot}
                  locale={clientLocale}
                  fx={state.fx ?? liveFx}
                  managerName={bootstrap.user.fullName}
                  contacts={{ phone: '[+380 __ ___ __ __]', email: '[email@avtoklyuch.ua]' }}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function DraftStatus({ status }: { status: ReturnType<typeof useCalculator>['saveStatus'] }) {
  if (status.kind === 'idle') return null;

  if (status.kind === 'saving') {
    return <span className="muted" style={{ fontSize: 12 }}>Сохраняю черновик…</span>;
  }

  if (status.kind === 'error') {
    return <span style={{ fontSize: 12, color: 'var(--danger)' }}>{status.message}</span>;
  }

  return (
    <span className="row-flex muted" style={{ gap: 6, fontSize: 12 }}>
      <span style={{ color: 'var(--teal)', display: 'flex' }}>
        <CheckIcon />
      </span>
      Черновик сохранён · {status.at.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
