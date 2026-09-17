import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculate,
  findAuctionFee,
  findDeliveryTariff,
  type CalcResult,
  type LineKey,
  type LotInfo,
} from '@avtoklyuch/shared';
import type { FxRates } from '@avtoklyuch/shared';
import { api, ApiError } from '@/api/client';
import type { BootstrapResponse, CalcState } from '@/api/types';

const EMPTY_LOT: LotInfo = {
  lotNumber: null,
  vin: null,
  makeModel: null,
  year: null,
  engineVolume: null,
  batteryPower: null,
  fuel: 'petrol',
  platform: 'copart',
  location: '',
  vehicleKind: 'sedan',
};

export const EMPTY_STATE: CalcState = {
  lot: EMPTY_LOT,
  bid: 0,
  overrides: {},
  disabled: [],
  customs: null,
  fx: null,
};

export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'error'; message: string };

interface UseCalculatorOptions {
  bootstrap: BootstrapResponse;
  initialState?: CalcState | null;
  /** Черновик не сохраняется, когда открыт старый расчёт из истории */
  autosave?: boolean;
}

/**
 * Состояние калькулятора.
 *
 * Расчёт считается локально тем же движком, что и на сервере, поэтому
 * итоговая сумма меняется в тот же кадр, что и поле — кнопки «Пересчитать»
 * нет и быть не должно. К серверу ходим только за тем, что локально
 * посчитать нельзя: растаможка (ключ API) и автосохранение черновика.
 */
export function useCalculator({
  bootstrap,
  initialState = null,
  autosave = true,
}: UseCalculatorOptions) {
  const [state, setState] = useState<CalcState>(initialState ?? EMPTY_STATE);
  const [customsLoading, setCustomsLoading] = useState(false);
  const [customsWarning, setCustomsWarning] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });

  // ── Мгновенный пересчёт ───────────────────────────────────────────────────
  const result: CalcResult = useMemo(() => {
    const deliveryTariff = findDeliveryTariff(bootstrap.deliveryTariffs, state.lot);
    const auctionFeeTariff = findAuctionFee(bootstrap.auctionFees, state.lot, state.bid);

    return calculate({
      lot: state.lot,
      bid: state.bid,
      deliveryTariff,
      auctionFeeTariff,
      customs: state.customs,
      deliveryDiscountPercent: bootstrap.user.deliveryDiscountPercent,
      settings: bootstrap.settings,
      overrides: state.overrides,
      disabled: state.disabled,
    });
  }, [state, bootstrap]);

  // ── Изменение полей ───────────────────────────────────────────────────────
  const patchLot = useCallback((patch: Partial<LotInfo>) => {
    setState((current) => ({ ...current, lot: { ...current.lot, ...patch } }));
  }, []);

  const setBid = useCallback((bid: number) => {
    setState((current) => ({ ...current, bid }));
  }, []);

  const setOverride = useCallback((key: LineKey, value: number | null) => {
    setState((current) => {
      const overrides = { ...current.overrides };
      if (value === null) delete overrides[key];
      else overrides[key] = value;
      return { ...current, overrides };
    });
  }, []);

  const toggleLine = useCallback((key: LineKey) => {
    setState((current) => ({
      ...current,
      disabled: current.disabled.includes(key)
        ? current.disabled.filter((k) => k !== key)
        : [...current.disabled, key],
    }));
  }, []);

  /**
   * Зафиксировать курс на этот расчёт (null — вернуться к курсу НБУ).
   * Зафиксированный курс уезжает в снимок вместе с расчётом.
   */
  const setFx = useCallback((fx: FxRates | null) => {
    setState((current) => ({ ...current, fx }));
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY_STATE);
    setCustomsWarning(null);
    setSaveStatus({ kind: 'idle' });
  }, []);

  const replace = useCallback((next: CalcState) => {
    setState(next);
    setSaveStatus({ kind: 'idle' });
  }, []);

  // ── Растаможка: тянем с сервера, когда меняются влияющие поля ────────────
  // Ключ намеренно узкий: правка комиссии не должна дёргать внешний API.
  const customsKey = [
    state.bid,
    state.lot.year,
    state.lot.fuel,
    state.lot.engineVolume,
    state.lot.batteryPower,
    state.lot.vehicleKind,
  ].join('|');

  const customsKeyRef = useRef<string>('');

  useEffect(() => {
    if (state.bid <= 0) return;
    if (customsKeyRef.current === customsKey) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCustomsLoading(true);
      try {
        const data = await api.post<{
          quote: { totalFees: number; source: 'api' | 'api-cached' | 'estimate'; warning: string | null };
        }>('/api/calculations/customs', { lot: state.lot, bid: state.bid }, controller.signal);

        customsKeyRef.current = customsKey;
        setCustomsWarning(data.quote.warning);
        setState((current) => ({
          ...current,
          customs: { amount: data.quote.totalFees, source: data.quote.source },
        }));
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setCustomsWarning(
          error instanceof ApiError
            ? `Растаможка не обновлена: ${error.message}`
            : 'Растаможка не обновлена',
        );
      } finally {
        setCustomsLoading(false);
      }
      // 500 мс: менеджер успевает дописать сумму до конца, а API не дёргается
      // на каждую цифру
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [customsKey, state.bid, state.lot]);

  // ── Автосохранение черновика ──────────────────────────────────────────────
  const firstRender = useRef(true);

  useEffect(() => {
    if (!autosave) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.bid <= 0 && !state.lot.makeModel) return;

    const timer = window.setTimeout(async () => {
      setSaveStatus({ kind: 'saving' });
      try {
        await api.put('/api/calculations/draft', state);
        setSaveStatus({ kind: 'saved', at: new Date() });
      } catch (error) {
        setSaveStatus({
          kind: 'error',
          message: error instanceof ApiError ? error.message : 'Черновик не сохранён',
        });
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [state, autosave]);

  return {
    state,
    result,
    customsLoading,
    customsWarning,
    saveStatus,
    patchLot,
    setBid,
    setOverride,
    setFx,
    toggleLine,
    reset,
    replace,
  };
}
