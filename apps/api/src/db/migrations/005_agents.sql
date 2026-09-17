-- ─────────────────────────────────────────────────────────────────────────────
-- 005 — агентская сеть
--
-- Агент — партнёр, который приводит клиентов и получает комиссию. От
-- менеджера он отличается принципиально: агент НЕ должен видеть закупочные
-- тарифы, маржу и себестоимость. Иначе, узнав внутреннюю кухню, он уходит
-- работать напрямую. Поэтому роль отдельная, а не «менеджер с ограничениями».
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

-- ─── Профиль агента ─────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS public_name       text,
  ADD COLUMN IF NOT EXISTS phone             text,
  ADD COLUMN IF NOT EXISTS telegram          text,
  -- Метка для ссылок вида ?ref=ivan — работает без отдельного поддомена
  ADD COLUMN IF NOT EXISTS referral_code     text,
  -- Фиксированная сумма за авто или процент от маржи компании по сделке
  ADD COLUMN IF NOT EXISTS commission_type   text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS commission_value  numeric(12, 2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_commission_type_check
    CHECK (commission_type IN ('fixed', 'percent_of_margin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Метка уникальна и нечувствительна к регистру: по ней ищут агента
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_idx
  ON users (lower(referral_code)) WHERE referral_code IS NOT NULL;

-- ─── Домены агентов ─────────────────────────────────────────────────────────
--
-- Сайт отвечает на любой домен. Здесь связываем домен с агентом: заявка
-- с ivan.westauto.seoshkin.tools автоматически достаётся Ивану.

CREATE TABLE IF NOT EXISTS agent_domains (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  host       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_domains_host_idx ON agent_domains (lower(host));
CREATE INDEX IF NOT EXISTS agent_domains_agent_idx ON agent_domains (agent_id);

-- ─── Привязка заявок и расчётов ─────────────────────────────────────────────
--
-- Без этого на вопрос «кому платить комиссию» ответить нечем.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_agent_idx ON leads (agent_id, created_at DESC);

ALTER TABLE calculations
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_at timestamptz,
  -- Сумма фиксируется в момент выигрыша: изменение условий агента задним
  -- числом не должно переписывать уже начисленное
  ADD COLUMN IF NOT EXISTS commission_usd numeric(12, 2),
  ADD COLUMN IF NOT EXISTS commission_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads (id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE calculations ADD CONSTRAINT calculations_outcome_check
    CHECK (outcome IS NULL OR outcome IN ('won', 'lost'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS calculations_agent_idx ON calculations (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS calculations_outcome_idx
  ON calculations (outcome, outcome_at DESC) WHERE outcome IS NOT NULL;
