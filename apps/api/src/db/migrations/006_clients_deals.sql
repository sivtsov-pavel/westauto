-- ─────────────────────────────────────────────────────────────────────────────
-- 006 — учёт клиентов и сделок
--
-- До этой миграции система умела считать и делиться расчётом, но не помнила
-- людей: заявка с сайта лежала в leads, расчёт — в calculations, и связи
-- между ними не было никакой. На вопрос «сколько у нас клиентов и кто из них
-- вернулся» ответить было нечем.
--
-- Клиент и сделка разделены намеренно. Один человек привозит машину не раз,
-- и если хранить его в строке сделки, второй приход станет новым человеком —
-- а именно повторные клиенты показывают, работает ли сервис.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Клиент ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  phone       text NOT NULL,
  -- Мессенджеры: половина людей пишет, а не звонит
  telegram    text,
  viber       text,
  whatsapp    text,
  email       text,
  city        text,
  -- Откуда пришёл: сайт, telegram, whatsapp, viber, звонок, рекомендация…
  source      text NOT NULL DEFAULT 'site',
  -- Кто привёл: агент получает комиссию, менеджер — своих клиентов в работе
  agent_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  manager_id  uuid REFERENCES users (id) ON DELETE SET NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Телефон — естественный ключ человека. Один и тот же номер не должен
-- заводиться дважды: иначе «вернувшийся клиент» превращается в двух новых.
-- Сравниваем только по цифрам: +380 67 123-45-67 и 0671234567 — один человек.
CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_idx
  ON clients (regexp_replace(phone, '\D', '', 'g'))
  WHERE phone <> '';

CREATE INDEX IF NOT EXISTS clients_agent_idx   ON clients (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS clients_created_idx ON clients (created_at DESC);

-- ─── Сделка ─────────────────────────────────────────────────────────────────
--
-- Сделка — это одно авто от заявки до выдачи. У клиента их может быть
-- несколько, в том числе одновременно.

DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM (
    'lead',       -- заявка принята, ещё ничего не считали
    'quoted',     -- расчёт отдан клиенту
    'bidding',    -- торгуемся на аукционе
    'purchased',  -- лот выигран и оплачен
    'shipping',   -- в пути, контейнер
    'port',       -- пришло в порт Одессы
    'customs',    -- на растаможке
    'delivered'   -- выдано клиенту
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deal_outcome AS ENUM ('active', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS deals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  -- Откуда выросла сделка и по какому расчёту работаем
  lead_id        uuid REFERENCES leads (id) ON DELETE SET NULL,
  calculation_id uuid REFERENCES calculations (id) ON DELETE SET NULL,
  agent_id       uuid REFERENCES users (id) ON DELETE SET NULL,
  manager_id     uuid REFERENCES users (id) ON DELETE SET NULL,

  stage          deal_stage   NOT NULL DEFAULT 'lead',
  outcome        deal_outcome NOT NULL DEFAULT 'active',

  -- ─ Авто ─
  platform       platform,          -- copart / iaai / manheim: тип уже есть
  lot_number     text,
  vin            text,
  make_model     text,
  year           integer,
  location       text,              -- штат и площадка, откуда едет

  -- Цена покупки: то, за что лот реально ушёл с молотка
  purchase_price_usd numeric(12, 2),

  -- ─ Логистика ─
  port_eta       date,              -- прибытие в порт по плану
  port_arrived_at date,             -- и когда пришло на самом деле
  delivered_at   date,

  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_client_idx  ON deals (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deals_stage_idx   ON deals (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS deals_agent_idx   ON deals (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deals_vin_idx     ON deals (lower(vin)) WHERE vin IS NOT NULL;
CREATE INDEX IF NOT EXISTS deals_lot_idx     ON deals (lot_number) WHERE lot_number IS NOT NULL;

-- ─── Деньги ─────────────────────────────────────────────────────────────────
--
-- Начисление и платёж — разные вещи. Начисление говорит, сколько клиент
-- должен по статье, платежи — сколько и когда он внёс. Частичная оплата это
-- обычное дело, и без отдельной таблицы платежей её записать некуда: остаётся
-- только держать в голове, а долг клиента в голове — верный способ его
-- потерять.

DO $$ BEGIN
  CREATE TYPE deal_charge_article AS ENUM (
    'lot',       -- лот + аукционный сбор
    'delivery',  -- доставка + комплекс
    'customs',   -- растаможка
    'parking'    -- стоянка
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS deal_charges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE,
  article    deal_charge_article NOT NULL,
  -- Сколько клиент должен по этой статье
  planned    numeric(12, 2) NOT NULL DEFAULT 0,
  -- Растаможка платится в гривне, остальное обычно в долларах. Без валюты
  -- у суммы отчёты складывают гривны с долларами и врут.
  currency   text NOT NULL DEFAULT 'USD',
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE deal_charges ADD CONSTRAINT deal_charges_currency_check
    CHECK (currency IN ('USD', 'UAH', 'EUR'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- По одной строке начисления на статью в сделке
CREATE UNIQUE INDEX IF NOT EXISTS deal_charges_unique_idx
  ON deal_charges (deal_id, article);

CREATE TABLE IF NOT EXISTS deal_payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE,
  article    deal_charge_article NOT NULL,
  amount     numeric(12, 2) NOT NULL,
  currency   text NOT NULL DEFAULT 'USD',
  paid_at    date NOT NULL DEFAULT current_date,
  -- Курс на день платежа: гривневый платёж в отчёте по доллару иначе
  -- пересчитается сегодняшним курсом и разойдётся с кассой
  fx_rate    numeric(12, 4),
  method     text,          -- банк, наличные, карта
  comment    text,
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE deal_payments ADD CONSTRAINT deal_payments_currency_check
    CHECK (currency IN ('USD', 'UAH', 'EUR'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS deal_payments_deal_idx ON deal_payments (deal_id, paid_at DESC);

-- ─── Фото ───────────────────────────────────────────────────────────────────
--
-- Снимки с аукциона и из порта. Хранить их у себя целыми альбомами незачем:
-- сотня фото на сделку съест диск и ничего не даст. Поэтому основной путь —
-- ссылка на облако, а загрузка на сервер оставлена для двух-трёх снимков,
-- которые нужны прямо в карточке.

DO $$ BEGIN
  CREATE TYPE deal_photo_kind AS ENUM ('auction', 'port', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS deal_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE,
  kind       deal_photo_kind NOT NULL DEFAULT 'other',
  -- Либо ссылка на облако, либо файл, загруженный к нам
  url        text,
  file_path  text,
  caption    text,
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deal_photos_source_check CHECK (url IS NOT NULL OR file_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS deal_photos_deal_idx ON deal_photos (deal_id, created_at);

-- ─── Комментарии ────────────────────────────────────────────────────────────
--
-- Отдельной строкой, а не текстовым полем в сделке: важно, кто и когда
-- написал. Поле затирается следующим менеджером, переписка — нет.

CREATE TABLE IF NOT EXISTS deal_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE,
  author_id  uuid REFERENCES users (id) ON DELETE SET NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_comments_deal_idx ON deal_comments (deal_id, created_at DESC);

-- ─── История этапов ─────────────────────────────────────────────────────────
--
-- Нужна не для красоты: без неё нельзя сказать, сколько авто в среднем стоит
-- на растаможке и где сделки застревают. Это первый вопрос, который возникает,
-- когда клиент спрашивает «а когда?».

CREATE TABLE IF NOT EXISTS deal_stage_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES deals (id) ON DELETE CASCADE,
  from_stage deal_stage,
  to_stage   deal_stage NOT NULL,
  author_id  uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_stage_history_deal_idx
  ON deal_stage_history (deal_id, created_at);

-- ─── Связь со старыми заявками ──────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_client_idx ON leads (client_id);

ALTER TABLE calculations
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES deals (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS calculations_deal_idx ON calculations (deal_id);
