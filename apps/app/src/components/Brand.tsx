import { splitBrandName, type BrandMark, type CrmBrand } from '@avtoklyuch/shared';
import { KeyMark, ShipMark } from './Icons';

/**
 * Показ бренда экземпляра. Два места — экран входа и шапка приложения —
 * рисуют его одинаково, поэтому разбор профиля живёт здесь, а не дважды.
 *
 * Имя знака приходит из реестра строкой: shared собирается без React и про
 * компоненты знать не может. Сопоставление — здесь.
 */
const MARKS: Record<BrandMark, typeof KeyMark> = {
  key: KeyMark,
  ship: ShipMark,
};

/**
 * Название бренда. Хвост имени выделяется курсивом (`.brand em` в app.css) —
 * так в макете набран «АвтоКлюч».
 *
 * Пока бренд не приехал, показываем нейтральное «CRM»: пустое место на месте
 * названия выглядит сломанной вёрсткой, а чужое имя — хуже, чем сломанная
 * вёрстка.
 */
export function BrandName({ brand }: { brand: CrmBrand | null }) {
  if (!brand) return <>CRM</>;

  const { lead, emphasis } = splitBrandName(brand);
  return (
    <>
      {lead}
      {emphasis ? <em>{emphasis}</em> : null}
    </>
  );
}

/**
 * Знак бренда — только сам svg, без обёртки.
 *
 * Обёртку с цветом ставит вызывающий: в шапке у неё `display: flex`, а на
 * крупном знаке экрана входа — нет, и от этого зависит высота блока. Спрятав
 * обёртку внутрь, мы бы незаметно поменяли отбивку на живом экране входа.
 *
 * Пока бренда нет — не рисуем ничего: любой знак сейчас был бы знаком
 * какого-то конкретного клиента.
 */
export function BrandMarkIcon({ brand, size }: { brand: CrmBrand | null; size?: number }) {
  if (!brand) return null;

  const Mark = MARKS[brand.mark];
  return <Mark size={size} />;
}
