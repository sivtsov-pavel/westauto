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

// ─── Клиенты и сделки ───────────────────────────────────────────────────────

/** Этапы сделки — от заявки до выдачи авто. */
export type DealStage =
  | 'lead'
  | 'quoted'
  | 'bidding'
  | 'purchased'
  | 'shipping'
  | 'port'
  | 'customs'
  | 'delivered';

export type DealOutcome = 'active' | 'won' | 'lost';

/** Четыре статьи расходов, по которым клиент платит. */
export type DealArticle = 'lot' | 'delivery' | 'customs' | 'parking';

export type Currency = 'USD' | 'UAH' | 'EUR';

export type { Platform } from '@avtoklyuch/shared';

export interface ClientRow {
  id: string;
  fullName: string;
  phone: string;
  telegram: string | null;
  viber: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  source: string;
  agentId: string | null;
  agentName: string | null;
  managerId: string | null;
  notes: string | null;
  dealsCount: number;
  lastDealAt: string | null;
  createdAt: string;
}

export interface DealRow {
  id: string;
  clientId: string;
  clientName: string | null;
  clientPhone: string | null;
  leadId: string | null;
  calculationId: string | null;
  agentId: string | null;
  agentName: string | null;
  managerId: string | null;
  stage: DealStage;
  outcome: DealOutcome;
  platform: Platform | null;
  lotNumber: string | null;
  vin: string | null;
  makeModel: string | null;
  year: number | null;
  location: string | null;
  purchasePriceUsd: number | null;
  portEta: string | null;
  portArrivedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  /** Итоги в долларах: гривневые суммы уже пересчитаны на стороне базы */
  plannedUsd: number;
  paidUsd: number;
  photosCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealCharge {
  id: string;
  article: DealArticle;
  planned: number;
  currency: Currency;
  comment: string | null;
}

export interface DealPayment {
  id: string;
  article: DealArticle;
  amount: number;
  currency: Currency;
  paidAt: string | null;
  fxRate: number | null;
  method: string | null;
  comment: string | null;
  authorName: string | null;
}

export interface DealPhoto {
  id: string;
  kind: 'auction' | 'port' | 'other';
  url: string | null;
  filePath: string | null;
  caption: string | null;
  createdAt: string;
}

export interface DealComment {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
}

export interface DealStageEvent {
  id: string;
  fromStage: DealStage | null;
  toStage: DealStage;
  authorName: string | null;
  createdAt: string;
}

export interface DealDetails {
  item: DealRow;
  charges: DealCharge[];
  payments: DealPayment[];
  photos: DealPhoto[];
  comments: DealComment[];
  history: DealStageEvent[];
}
