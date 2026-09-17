import type {
  CalcResult,
  CalcSettings,
  FxRates,
  FuelType,
  LineKey,
  LotInfo,
  Platform,
  Role,
  ShowcaseStatus,
  VehicleKind,
} from '@avtoklyuch/shared';

export interface SessionUser {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  deliveryDiscountPercent: number;
}

export interface DeliveryTariffRow {
  id: string;
  platform: Platform;
  location: string;
  vehicleKind: VehicleKind;
  amountUsd: number;
  isActive: boolean;
  updatedAt: string;
  updatedByName: string | null;
}

export interface AuctionFeeRow {
  id: string;
  platform: Platform;
  bidFrom: number;
  bidTo: number | null;
  feeAmount: number;
  feePercent: number;
  isActive: boolean;
  updatedAt: string;
  updatedByName: string | null;
}

export interface BootstrapResponse {
  user: SessionUser;
  settings: CalcSettings;
  customsMode: 'api' | 'estimate';
  deliveryTariffs: Pick<
    DeliveryTariffRow,
    'id' | 'platform' | 'location' | 'vehicleKind' | 'amountUsd' | 'isActive'
  >[];
  auctionFees: Pick<
    AuctionFeeRow,
    'id' | 'platform' | 'bidFrom' | 'bidTo' | 'feeAmount' | 'feePercent' | 'isActive'
  >[];
  fx: FxRates;
}

/** Состояние калькулятора — им же обмениваемся с сервером. */
export interface CalcState {
  lot: LotInfo;
  bid: number;
  overrides: Partial<Record<LineKey, number>>;
  disabled: LineKey[];
  customs: { amount: number; source: 'api' | 'api-cached' | 'estimate' } | null;
  fx: FxRates | null;
}

export interface CalculationRecord {
  id: string;
  userId: string;
  userName: string | null;
  status: 'draft' | 'saved';
  lotNumber: string | null;
  vin: string | null;
  makeModel: string | null;
  year: number | null;
  engineVolume: number | null;
  batteryPower: number | null;
  fuel: FuelType;
  platform: Platform;
  location: string;
  vehicleKind: VehicleKind;
  bid: number;
  state: CalcState;
  result: CalcResult;
  /** Курс на момент расчёта — снимок, а не текущий курс */
  fx: FxRates | null;
  costUsd: number;
  marginUsd: number;
  clientTotalUsd: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: number;
  entity: string;
  label: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  userName: string;
  createdAt: string;
}

export interface UserRow {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  deliveryDiscountPercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface ShowcaseItemRow {
  id: string;
  slug: string;
  status: ShowcaseStatus;
  title: string;
  makeModel: string;
  year: number | null;
  fuel: FuelType;
  engineVolume: number | null;
  vehicleKind: VehicleKind;
  platform: Platform;
  location: string;
  lotNumber: string | null;
  mileage: number | null;
  damage: string | null;
  turnkeyPriceUsd: number;
  breakdown: { label: string; amount: number }[];
  description: string | null;
  photos: { id: string; url: string; sortOrder: number }[];
  isPublished: boolean;
  sortOrder: number;
  calculationId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  comment: string | null;
  itemTitle: string | null;
  agentName: string | null;
  source: string;
  isProcessed: boolean;
  createdAt: string;
}
