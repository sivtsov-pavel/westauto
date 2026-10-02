import { FONTS, PALETTE } from '@/content/brand';

/**
 * Палитра и шрифты бренда — переменными на :root.
 *
 * site.css один на все экземпляры и к цветам обращается только через
 * переменные; сами значения приходят отсюда, из профиля. Единственный источник
 * правды по цвету — профиль: держать те же значения ещё и в site.css нельзя,
 * две копии однажды разойдутся, и половина сайта останется в чужих цветах.
 *
 * Тег <style> уезжает вместе с разметкой — и при сборке страницы на сервере, и
 * в браузере. В документе он стоит после <link> на site.css, поэтому
 * переопределяет его по порядку каскада, без !important и без вспышки чужого
 * цвета при первой отрисовке.
 *
 * dangerouslySetInnerHTML здесь не риск, а необходимость: React экранирует
 * текст внутри <style>, и кавычки в именах шрифтов превратились бы в &#x27; —
 * для разбора CSS это мусор. Строка собирается из наших же файлов, снаружи в
 * неё ничего не попадает.
 */
const ROOT_CSS = [
  ':root{',
  `--brand:${PALETTE.brand};`,
  `--brand-deep:${PALETTE.brandDeep};`,
  `--brand-soft:${PALETTE.brandSoft};`,
  `--brand-raise:${PALETTE.brandRaise};`,
  `--brand-darkest:${PALETTE.brandDarkest};`,
  `--accent:${PALETTE.accent};`,
  `--accent-deep:${PALETTE.accentDeep};`,
  `--paper:${PALETTE.paper};`,
  `--card:${PALETTE.card};`,
  `--sand:${PALETTE.sand};`,
  `--sand-tint:${PALETTE.sandTint};`,
  `--sand-deep:${PALETTE.sandDeep};`,
  `--ink:${PALETTE.ink};`,
  `--ink-soft:${PALETTE.inkSoft};`,
  `--ink-faint:${PALETTE.inkFaint};`,
  `--line:${PALETTE.line};`,
  `--line-strong:${PALETTE.lineStrong};`,
  `--on-dark:${PALETTE.onDark};`,
  `--on-dark-soft:${PALETTE.onDarkSoft};`,
  `--on-dark-mid:${PALETTE.onDarkMid};`,
  `--on-dark-faint:${PALETTE.onDarkFaint};`,
  `--brand-rgb:${PALETTE.brandRgb};`,
  `--accent-rgb:${PALETTE.accentRgb};`,
  `--paper-rgb:${PALETTE.paperRgb};`,
  `--ink-rgb:${PALETTE.inkRgb};`,
  `--display:${FONTS.display};`,
  `--sans:${FONTS.sans};`,
  `--mono:${FONTS.mono};`,
  '}',
].join('');

export function BrandTheme() {
  return (
    <>
      {/*
        Шрифты профиля. Ссылка стоит здесь, а не в <head> index.html: там она
        была бы одна на все бренды, и экземпляр клиента тянул бы два набора —
        свой и чужой. Стилевая ссылка в <body> допустима, работает во всех
        браузерах и находится предсканером так же рано, как в шапке.
      */}
      {FONTS.href ? <link rel="stylesheet" href={FONTS.href} /> : null}
      <style dangerouslySetInnerHTML={{ __html: ROOT_CSS }} />
    </>
  );
}
