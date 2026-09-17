import { pool, query } from '../db/pool.js';
import { config } from '../lib/env.js';
import { fetchLot } from './lot-fetcher/index.js';

/**
 * Отслеживание активных лотов.
 *
 * Пока авто не куплено, ставка растёт, и менеджеру важно не пропустить момент,
 * когда лот вышел за согласованный с клиентом потолок.
 *
 * Работает поверх того же модуля подтяжки лотов и наследует его ненадёжность:
 * площадки закрываются от автоматики, и проверка регулярно не удаётся. Поэтому
 * осечка — это не ошибка, а текст в карточке наблюдения: менеджер видит, что
 * данные устарели, и не принимает молчание за «ставка не растёт».
 *
 * Уведомления складываются в приложение, а не уходят письмами: почтового
 * сервера у системы нет, и обещать письма было бы нечестно.
 */

const CHECK_INTERVAL_MS = 15 * 60_000;
/** Сколько наблюдений обрабатываем за один проход — площадки не любят напора */
const BATCH_SIZE = 5;
/** Пауза между лотами внутри прохода */
const GAP_MS = 3000;

let timer: NodeJS.Timeout | null = null;

export function startLotWatcher(): void {
  if (!config.LOT_FETCHER_ENABLED) {
    console.log('[watcher] подтяжка лотов отключена — наблюдение не запускается');
    return;
  }

  // Первый проход с задержкой: при старте у сервиса есть дела поважнее
  timer = setInterval(() => void runOnce(), CHECK_INTERVAL_MS);
  setTimeout(() => void runOnce(), 60_000);

  console.log(
    `[watcher] наблюдение за лотами запущено, проверка каждые ${CHECK_INTERVAL_MS / 60000} мин`,
  );
}

export function stopLotWatcher(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

export async function runOnce(): Promise<{ checked: number; changed: number }> {
  const due = await query<{
    id: string;
    user_id: string;
    platform: 'copart' | 'iaai';
    lot_number: string;
    title: string | null;
    max_bid: number | null;
    last_bid: number | null;
  }>(
    `SELECT id, user_id, platform, lot_number, title, max_bid, last_bid
       FROM lot_watches
      WHERE is_active
        AND (last_checked_at IS NULL OR last_checked_at < now() - interval '15 minutes')
      ORDER BY last_checked_at NULLS FIRST
      LIMIT $1`,
    [BATCH_SIZE],
  );

  let changed = 0;

  for (const watch of due) {
    const result = await fetchLot({
      identifier: watch.lot_number,
      platform: watch.platform,
    }).catch(() => ({ ok: false as const, reason: 'исключение при запросе' }));

    if (!result.ok || result.data.currentBid === null) {
      await pool.query(
        `UPDATE lot_watches
            SET last_checked_at = now(),
                last_error = $1,
                updated_at = now()
          WHERE id = $2`,
        [result.ok ? 'ставка на странице не найдена' : result.reason, watch.id],
      );
      await sleep(GAP_MS);
      continue;
    }

    const bid = result.data.currentBid;
    const previous = watch.last_bid;

    await pool.query(
      `UPDATE lot_watches
          SET previous_bid = last_bid,
              last_bid = $1,
              title = COALESCE(title, $2),
              last_checked_at = now(),
              last_error = NULL,
              updated_at = now()
        WHERE id = $3`,
      [bid, result.data.makeModel, watch.id],
    );

    // Историю пишем только когда ставка реально изменилась: иначе таблица
    // распухает одинаковыми строками и график становится нечитаемым
    if (previous === null || Number(previous) !== bid) {
      await pool.query('INSERT INTO lot_bid_history (watch_id, bid) VALUES ($1, $2)', [
        watch.id,
        bid,
      ]);
      changed += 1;

      const label = watch.title ?? result.data.makeModel ?? `лот ${watch.lot_number}`;

      if (previous !== null) {
        const delta = bid - Number(previous);
        await notify(watch.user_id, {
          kind: 'bid_changed',
          title: `${label}: ставка ${delta > 0 ? 'выросла' : 'снизилась'}`,
          body: `$${Number(previous)} → $${bid} (${delta > 0 ? '+' : ''}$${delta})`,
          link: '/watchlist',
        });
      }

      // Превышение потолка — то, ради чего наблюдение и заводится
      if (watch.max_bid !== null && bid > Number(watch.max_bid)) {
        await notify(watch.user_id, {
          kind: 'max_bid_exceeded',
          title: `${label}: ставка выше потолка`,
          body: `Текущая $${bid}, потолок $${Number(watch.max_bid)}. Пересчитайте или снимите лот с наблюдения.`,
          link: '/watchlist',
        });
      }
    }

    await sleep(GAP_MS);
  }

  return { checked: due.length, changed };
}

async function notify(
  userId: string,
  payload: { kind: string; title: string; body: string; link: string },
): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, kind, title, body, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, payload.kind, payload.title, payload.body, payload.link],
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
