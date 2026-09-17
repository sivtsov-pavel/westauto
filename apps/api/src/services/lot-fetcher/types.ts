import type { FuelType, Platform, VehicleKind } from '@avtoklyuch/shared';

export interface LotQuery {
  /** Номер лота (8 цифр) или VIN */
  identifier: string;
  /** Подсказка площадки; если не задана — пробуем обе */
  platform?: Platform | null;
}

export interface LotData {
  platform: Platform;
  lotNumber: string | null;
  vin: string | null;
  makeModel: string | null;
  year: number | null;
  engineVolume: number | null;
  fuel: FuelType | null;
  location: string | null;
  vehicleKind: VehicleKind | null;
  /** Текущая ставка, если удалось прочитать — предзаполняет поле «Ставка» */
  currentBid: number | null;
}

export type LotFetchResult =
  | { ok: true; data: LotData; source: string }
  | { ok: false; reason: string };

export interface LotFetcher {
  readonly platform: Platform;
  fetch(query: LotQuery): Promise<LotFetchResult>;
}
