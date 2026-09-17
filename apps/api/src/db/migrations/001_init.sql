-- ─────────────────────────────────────────────────────────────────────────────
-- 001_init — пользователи, тарифы, настройки, расчёты, история правок
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Пользователи ────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'manager');

CREATE TABLE users (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login                     text NOT NULL UNIQUE,
  full_name                 text NOT NULL,
  password_hash             text NOT NULL,
  role                      user_role NOT NULL DEFAULT 'manager',
  -- Персональная скидка (+) / наценка (−) к доставке, в процентах
  delivery_discount_percent numeric(6, 2) NOT NULL DEFAULT 0,
  is_active                 boolean NOT NULL DEFAULT true,
  -- Растёт при смене пароля и деактивации: разом гасит все выданные токены
  token_version             integer NOT NULL DEFAULT 1,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_active_idx ON users (is_active) WHERE is_active;

-- ─── Справочники ─────────────────────────────────────────────────────────────

CREATE TYPE platform AS ENUM ('copart', 'iaai');

CREATE TYPE vehicle_kind AS ENUM (
  'sedan', 'suv', 'pickup', 'coupe', 'minivan', 'motorcycle', 'truck'
);

CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');

-- ─── Тарифы доставки ─────────────────────────────────────────────────────────

CREATE TABLE delivery_tariffs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      platform NOT NULL,
  location      text NOT NULL,
  vehicle_kind  vehicle_kind NOT NULL,
  amount_usd    numeric(12, 2) NOT NULL CHECK (amount_usd >= 0),
  is_active     boolean NOT NULL DEFAULT true,
  updated_by    uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Одна цена на связку площадка + локация + вид авто
CREATE UNIQUE INDEX delivery_tariffs_key_idx
  ON delivery_tariffs (platform, lower(location), vehicle_kind);

-- ─── Аукционный сбор ─────────────────────────────────────────────────────────

CREATE TABLE auction_fee_tariffs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    platform NOT NULL,
  bid_from    numeric(12, 2) NOT NULL CHECK (bid_from >= 0),
  -- NULL = «и выше»
  bid_to      numeric(12, 2) CHECK (bid_to IS NULL OR bid_to > bid_from),
  fee_amount  numeric(12, 2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  fee_percent numeric(6, 3) NOT NULL DEFAULT 0 CHECK (fee_percent >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  updated_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auction_fee_tariffs_lookup_idx
  ON auction_fee_tariffs (platform, bid_from) WHERE is_active;

-- ─── Настройки: одна строка на ключ ──────────────────────────────────────────

CREATE TABLE settings (
  key         text PRIMARY KEY,
  value       numeric(14, 4) NOT NULL,
  updated_by  uuid REFERENCES users (id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── История изменений тарифов и настроек ────────────────────────────────────
-- Критично по ТЗ: почему расчёт недельной давности отличается от сегодняшнего.

CREATE TABLE change_log (
  id          bigserial PRIMARY KEY,
  entity      text NOT NULL,          -- 'delivery_tariff' | 'auction_fee' | 'setting' | 'user'
  entity_id   text NOT NULL,
  -- Человекочитаемое название: «Доставка Copart · Texas, седан»
  entity_label text NOT NULL,
  action      text NOT NULL,          -- 'create' | 'update' | 'delete'
  field       text,
  old_value   text,
  new_value   text,
  user_id     uuid REFERENCES users (id) ON DELETE SET NULL,
  user_name   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX change_log_recent_idx ON change_log (created_at DESC);
CREATE INDEX change_log_entity_idx ON change_log (entity, entity_id, created_at DESC);

-- ─── Расчёты ─────────────────────────────────────────────────────────────────

CREATE TYPE calculation_status AS ENUM ('draft', 'saved');

CREATE TABLE calculations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  status         calculation_status NOT NULL DEFAULT 'draft',

  -- Данные лота — вынесены в колонки, потому что по ним ищут и фильтруют
  lot_number     text,
  vin            text,
  make_model     text,
  year           integer,
  engine_volume  numeric(5, 2),
  battery_power  numeric(7, 2),
  fuel           fuel_type NOT NULL DEFAULT 'petrol',
  platform       platform NOT NULL DEFAULT 'copart',
  location       text NOT NULL DEFAULT '',
  vehicle_kind   vehicle_kind NOT NULL DEFAULT 'sedan',

  bid            numeric(12, 2) NOT NULL DEFAULT 0,

  -- Полный снимок: входные данные, применённые настройки, правки, курс.
  -- Старый расчёт открывается ровно таким, каким был, даже если тарифы уехали.
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  fx_snapshot    jsonb NOT NULL DEFAULT '{}'::jsonb,

  cost_usd       numeric(14, 2) NOT NULL DEFAULT 0,
  margin_usd     numeric(14, 2) NOT NULL DEFAULT 0,
  client_total_usd numeric(14, 2) NOT NULL DEFAULT 0,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX calculations_user_idx ON calculations (user_id, created_at DESC);
CREATE INDEX calculations_recent_idx ON calculations (created_at DESC);
CREATE INDEX calculations_search_idx ON calculations
  USING gin (to_tsvector('simple',
    coalesce(make_model, '') || ' ' || coalesce(lot_number, '') || ' ' || coalesce(vin, '')));

-- Один черновик на менеджера: автосохранение всегда пишет в него
CREATE UNIQUE INDEX calculations_single_draft_idx
  ON calculations (user_id) WHERE status = 'draft';

-- ─── Кеш ответов baza-gai.com.ua ─────────────────────────────────────────────
-- Держим последний успешный ответ на конкретный набор параметров: если API лёг,
-- показываем его с пометкой «не обновлено».

CREATE TABLE customs_cache (
  cache_key   text PRIMARY KEY,
  request     jsonb NOT NULL,
  response    jsonb NOT NULL,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customs_cache_age_idx ON customs_cache (fetched_at DESC);

-- ─── Курсы валют ─────────────────────────────────────────────────────────────

CREATE TABLE fx_rates (
  id          bigserial PRIMARY KEY,
  usd_uah     numeric(12, 4) NOT NULL,
  eur_uah     numeric(12, 4) NOT NULL,
  source      text NOT NULL,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fx_rates_recent_idx ON fx_rates (fetched_at DESC);
