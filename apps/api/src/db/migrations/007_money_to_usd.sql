-- ─────────────────────────────────────────────────────────────────────────────
-- 007 — приведение сумм сделки к доллару
--
-- Растаможка платится в гривне, лот и доставка — в долларах. Складывать их
-- напрямую нельзя, а пересчитывать в приложении — значит получить одну сумму
-- в списке сделок и другую в карточке, потому что считают их разные запросы.
-- Поэтому пересчёт живёт в базе, одной функцией, и у всех он один.
--
-- fx_rate у платежа — это множитель «сколько долларов за единицу валюты»,
-- записанный в день платежа. Курс за полгода уходит заметно, и гривневый
-- платёж, пересчитанный сегодняшним курсом, перестанет сходиться с кассой.
-- Если множитель не записан, берём последний известный курс НБУ — приблизительно,
-- зато сумма не превращается в ноль.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION to_usd(currency text, fx_rate numeric)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN currency = 'USD' THEN 1::numeric
    WHEN fx_rate IS NOT NULL AND fx_rate > 0 THEN fx_rate
    WHEN currency = 'UAH' THEN
      coalesce((SELECT 1 / nullif(usd_uah, 0) FROM fx_rates ORDER BY fetched_at DESC LIMIT 1), 0)
    WHEN currency = 'EUR' THEN
      coalesce((SELECT eur_uah / nullif(usd_uah, 0) FROM fx_rates ORDER BY fetched_at DESC LIMIT 1), 0)
    ELSE 0::numeric
  END;
$$;

COMMENT ON FUNCTION to_usd(text, numeric) IS
  'Множитель для перевода суммы в доллары: 1 для USD, записанный курс платежа или последний курс НБУ';
