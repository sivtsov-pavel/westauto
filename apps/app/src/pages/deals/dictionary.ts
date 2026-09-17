import type { DealArticle, DealStage } from '@/api/types';

/**
 * Названия этапов и статей — в одном месте.
 *
 * Разойдись они между доской, карточкой и отчётом — и один и тот же этап
 * назывался бы в системе трижды по-разному. Пользователь решит, что это
 * разные вещи.
 */

export const STAGES: DealStage[] = [
  'lead',
  'quoted',
  'bidding',
  'purchased',
  'shipping',
  'port',
  'customs',
  'delivered',
];

export const STAGE_LABELS: Record<DealStage, string> = {
  lead: 'Заявка',
  quoted: 'Расчёт отдан',
  bidding: 'Торги',
  purchased: 'Куплено',
  shipping: 'В пути',
  port: 'В порту',
  customs: 'Растаможка',
  delivered: 'Выдано',
};

/** Короткие подписи для колонок доски, где места мало. */
export const STAGE_HINTS: Record<DealStage, string> = {
  lead: 'обратился, ещё не считали',
  quoted: 'цена у клиента, ждём решения',
  bidding: 'торгуемся на аукционе',
  purchased: 'лот выигран и оплачен',
  shipping: 'контейнер в море',
  port: 'пришло в Одессу',
  customs: 'оформление на границе',
  delivered: 'ключи у клиента',
};

/**
 * Цвет этапа. Холодные — пока ничего не куплено, тёплые — деньги в пути,
 * зелёный — сделка закрыта. По одному взгляду на доску видно, где стадия
 * ожидания, а где уже вложены деньги.
 */
export const STAGE_COLORS: Record<DealStage, string> = {
  lead: '#64748b',
  quoted: '#0ea5e9',
  bidding: '#6366f1',
  purchased: '#8b5cf6',
  shipping: '#d97706',
  port: '#ea580c',
  customs: '#dc2626',
  delivered: '#16a34a',
};

export const ARTICLES: DealArticle[] = ['lot', 'delivery', 'customs', 'parking'];

export const ARTICLE_LABELS: Record<DealArticle, string> = {
  lot: 'Лот + сбор',
  delivery: 'Доставка + комплекс',
  customs: 'Растаможка',
  parking: 'Стоянка',
};

/** Откуда пришёл клиент. Список открытый — в базе это обычный текст. */
export const SOURCE_LABELS: Record<string, string> = {
  site: 'Сайт',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
  instagram: 'Instagram',
  facebook: 'Facebook',
  call: 'Звонок',
  referral: 'Рекомендация',
  agent: 'Агент',
  other: 'Другое',
};

export const SOURCES = Object.keys(SOURCE_LABELS);

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

/** $12 340 — без копеек: в сделках они только мешают читать. */
export function money(amount: number, currency = 'USD'): string {
  const sign = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₴';
  const value = Math.round(amount).toLocaleString('ru-RU').replace(/,/g, ' ');
  return currency === 'UAH' ? `${value} ${sign}` : `${sign}${value}`;
}

/** 20 нояб. — короткая дата, как её произносят вслух. */
export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** «3 дня назад» — для истории и комментариев. */
export function ago(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
}
