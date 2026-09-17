-- ─────────────────────────────────────────────────────────────────────────────
-- 003 — публичная ссылка на расчёт и отслеживание активных лотов
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Ссылка на расчёт для клиента ───────────────────────────────────────────
--
-- ТЗ упоминало роль «клиент, видит только итоговую цену». Отдельные учётки для
-- клиентов здесь были бы лишней поверхностью атаки и противоречили бы более
-- позднему брифу («клиентского доступа нет»). Вместо этого — одноразовая
-- ссылка: менеджер делится ей, клиент открывает страницу только со своей
-- ценой, без входа в систему. Ссылку можно отозвать в любой момент.

ALTER TABLE calculations
  ADD COLUMN share_token       text UNIQUE,
  ADD COLUMN share_expires_at  timestamptz,
  ADD COLUMN share_locale      text NOT NULL DEFAULT 'uk',
  ADD COLUMN share_views       integer NOT NULL DEFAULT 0,
  ADD COLUMN share_last_seen   timestamptz;

-- Частичный индекс: ищем только по живым ссылкам
CREATE INDEX calculations_share_idx
  ON calculations (share_token) WHERE share_token IS NOT NULL;

-- ─── Отслеживание лотов на аукционе ─────────────────────────────────────────
--
-- Пока авто не куплено, ставка растёт. Список наблюдения периодически
-- перечитывает страницу лота и пишет историю ставки, чтобы менеджер видел
-- динамику и не пропустил превышение своего потолка.

CREATE TABLE lot_watches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  platform        platform NOT NULL,
  lot_number      text NOT NULL,
  title           text,

  -- Потолок, выше которого лот перестаёт быть интересным
  max_bid         numeric(12, 2),
  -- Последняя успешно прочитанная ставка
  last_bid        numeric(12, 2),
  previous_bid    numeric(12, 2),

  -- Связь с расчётом: удобно открыть и пересчитать по новой ставке
  calculation_id  uuid REFERENCES calculations (id) ON DELETE SET NULL,

  is_active       boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  -- Текст последней осечки: площадки регулярно закрываются, и менеджер
  -- должен видеть, что данные устарели, а не думать, что ставка не растёт
  last_error      text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lot_watches_key_idx ON lot_watches (user_id, platform, lot_number);
CREATE INDEX lot_watches_due_idx ON lot_watches (last_checked_at) WHERE is_active;

-- История ставок — из неё строится «ставка выросла на $400 за сутки»
CREATE TABLE lot_bid_history (
  id         bigserial PRIMARY KEY,
  watch_id   uuid NOT NULL REFERENCES lot_watches (id) ON DELETE CASCADE,
  bid        numeric(12, 2) NOT NULL,
  seen_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lot_bid_history_watch_idx ON lot_bid_history (watch_id, seen_at DESC);

-- ─── Уведомления внутри приложения ──────────────────────────────────────────
--
-- Почтового сервера у системы нет, поэтому уведомления живут в интерфейсе:
-- колокольчик в шапке. Это честнее, чем обещать письма, которые некому слать.

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_unread_idx
  ON notifications (user_id, created_at DESC) WHERE NOT is_read;
