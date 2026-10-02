import type { BrandStep } from '@/content/brands/types';
import { useI18n } from '@/i18n';
import { CheckIcon } from './Icons';

/**
 * Горизонтальный таймлайн — главный приём темы larus.
 *
 * Кружки с номерами соединены линией, последний шаг — зелёный с галочкой
 * вместо цифры: дорога закончилась. На узком экране линия становится
 * вертикальной (см. медиазапрос в site.css), а не ломается посередине.
 *
 * Шаги приходят параметром, а не берутся из профиля: тем же таймлайном
 * нарисованы и этапы доставки на главной, и «як почати» на партнёрской
 * странице. Вторая копия разметки разошлась бы с первой на первой правке
 * стилей — а выглядеть они должны одинаково.
 */
export function Timeline({ steps }: { steps: readonly BrandStep[] }) {
  const { t } = useI18n();
  const last = steps.length - 1;

  return (
    <ol className="timeline">
      {steps.map((step, index) => (
        <li className={index === last ? 'tl-step tl-step-done' : 'tl-step'} key={step.titleKey}>
          <span className="tl-dot">{index === last ? <CheckIcon size={18} /> : index + 1}</span>
          <h3>{t(step.titleKey)}</h3>
          <p>{t(step.descKey)}</p>
        </li>
      ))}
    </ol>
  );
}
