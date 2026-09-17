-- ─────────────────────────────────────────────────────────────────────────────
-- 002_showcase — витрина авто на публичном сайте
--
-- Наполняется из готовых расчётов: менеджер жмёт «Опубликовать на сайте»,
-- и лот попадает в витрину с ценой «под ключ» и свёрнутой разбивкой.
-- Внутренние строки (маржа, себестоимость) сюда не переносятся никогда.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE showcase_status AS ENUM ('available', 'at_auction', 'delivered_case');

CREATE TABLE showcase_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  status            showcase_status NOT NULL DEFAULT 'available',

  title             text NOT NULL,
  make_model        text NOT NULL,
  year              integer,
  fuel              fuel_type NOT NULL DEFAULT 'petrol',
  engine_volume     numeric(5, 2),
  vehicle_kind      vehicle_kind NOT NULL DEFAULT 'sedan',
  platform          platform NOT NULL DEFAULT 'copart',
  location          text NOT NULL DEFAULT '',
  lot_number        text,
  mileage           integer,
  damage            text,

  -- Цена «под ключ» и разбивка ровно те, что клиент видит в карточке расчёта
  turnkey_price_usd numeric(14, 2) NOT NULL,
  breakdown         jsonb NOT NULL DEFAULT '[]'::jsonb,
  description       text,

  is_published      boolean NOT NULL DEFAULT false,
  published_at      timestamptz,
  sort_order        integer NOT NULL DEFAULT 0,

  calculation_id    uuid REFERENCES calculations (id) ON DELETE SET NULL,
  created_by        uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX showcase_public_idx
  ON showcase_items (status, sort_order, published_at DESC) WHERE is_published;

CREATE TABLE showcase_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid NOT NULL REFERENCES showcase_items (id) ON DELETE CASCADE,
  -- Путь внутри тома загрузок: /uploads/showcase/<file>
  url         text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX showcase_photos_item_idx ON showcase_photos (item_id, sort_order);

-- ─── Заявки с сайта ──────────────────────────────────────────────────────────
-- Кнопка «Хочу это авто» на карточке витрины и форма из футера.

CREATE TABLE leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  phone           text NOT NULL,
  comment         text,
  showcase_item_id uuid REFERENCES showcase_items (id) ON DELETE SET NULL,
  source          text NOT NULL DEFAULT 'site',
  is_processed    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leads_new_idx ON leads (created_at DESC) WHERE NOT is_processed;
