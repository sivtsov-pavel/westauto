import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { useTour } from '@/state/tour';

/**
 * Тур по системе: затемнение, вырез вокруг нужного элемента и карточка с
 * текстом рядом.
 *
 * Подсветка сделана без SVG-масок: прямоугольник с огромной тенью
 * `box-shadow: 0 0 0 9999px` затемняет всё вокруг себя и оставляет себя
 * светлым. Клики при этом перехватывает отдельный прозрачный слой под ним —
 * сама тень не участвует в попадании курсора, и без этого слоя человек
 * нажимал бы по кнопкам сквозь затемнение.
 *
 * Работа с фокусом и Esc — как в components/Modal.tsx: обработчик держим в
 * ссылке, список зависимостей эффекта пустой.
 */

/** Воздух вокруг подсвечиваемого элемента */
const SPOT_PADDING = 8;
/** Зазор между вырезом и карточкой */
const CARD_GAP = 14;
/** Отступ от краёв экрана — и для выреза, и для карточки */
const EDGE = 12;
/**
 * Сколько ждём появления элемента, прежде чем показать карточку по центру.
 * Элемент может ещё не отрисоваться после перехода по маршруту, а может не
 * существовать вовсе — например, список пуст. Ни то ни другое не должно
 * останавливать тур.
 */
const LOOKUP_TIMEOUT_MS = 1800;
/**
 * Через столько переключаемся на пункт меню раздела.
 *
 * Содержимое может не появиться вовсе — на свежем экземпляре списки пусты, и
 * подсвечивать на «Клиентах» нечего. Пункт меню на месте всегда и указывает
 * как минимум на верный раздел: это лучше, чем карточка без подсветки.
 * Выжидаем, чтобы не мелькнуть меню на пути к содержимому.
 */
const FALLBACK_AFTER_MS = 700;
/** Ниже этой ширины карточку прижимаем к низу: сбоку от выреза места нет */
const NARROW_WIDTH = 760;

interface Spot {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Tour() {
  const { phase, step, steps, index, start, next, prev, finish, decline } = useTour();

  if (phase === 'offer') {
    return <TourOffer onAccept={start} onDecline={decline} />;
  }

  if (phase !== 'running' || !step) return null;

  return (
    <TourRunner
      key={step.id}
      total={steps.length}
      number={index + 1}
      route={step.route}
      target={step.target}
      title={step.title}
      text={step.text}
      onNext={next}
      onPrev={prev}
      onFinish={finish}
      isFirst={index === 0}
      isLast={index === steps.length - 1}
    />
  );
}

/**
 * Предложение пройти тур.
 *
 * Именно предложение: насильно запущенный тур люди закрывают не читая, и
 * второй раз его уже не откроют. Отказ помним — повторно не предлагаем.
 */
function TourOffer({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <Modal
      title="Показать, как всё устроено?"
      onClose={onDecline}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onDecline}>
            Потом
          </button>
          <button type="button" className="btn btn-primary" onClick={onAccept}>
            Давайте
          </button>
        </>
      }
    >
      <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
        Пара минут: пройдём по разделам и на каждом скажем, зачем он нужен. Прервать
        можно в любой момент, а запустить заново — из документации.
      </p>
    </Modal>
  );
}

interface RunnerProps {
  total: number;
  number: number;
  route: string;
  target: string;
  title: string;
  text: string;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

function TourRunner(props: RunnerProps) {
  const { total, number, route, target, title, text, isFirst, isLast } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW_WIDTH);
  const [cardSize, setCardSize] = useState({ width: 340, height: 190 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Тур сам переводит между экранами: показываем «Расчёт» — значит, сначала
  // переходим на /calc, иначе подсвечивать было бы нечего
  useEffect(() => {
    if (location.pathname !== route) navigate(route);
  }, [location.pathname, route, navigate]);

  // Клавиши: как в модальном окне, обработчики держим в ссылке
  const actions = useRef(props);
  actions.current = props;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        actions.current.onFinish();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        actions.current.onNext();
        return;
      }
      if (event.key === 'ArrowLeft' && !actions.current.isFirst) {
        event.preventDefault();
        actions.current.onPrev();
      }
    };
    document.addEventListener('keydown', onKey);

    const previous = document.activeElement as HTMLElement | null;
    return () => {
      document.removeEventListener('keydown', onKey);
      // isConnected: шаг сменился — карточка предыдущего шага уже убрана из
      // документа, и возвращать фокус в неё нечего
      if (previous?.isConnected) previous.focus();
    };
    // Только на открытии и закрытии тура: список намеренно пуст
  }, []);

  // Узкий экран отслеживаем, а не спрашиваем один раз: телефон поворачивают
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW_WIDTH);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /*
   * Ищем цель и мерим её положение.
   *
   * Повторяем замер по таймеру, а не один раз: элемент появляется после
   * перехода по маршруту и после загрузки данных, да и страница в этот
   * момент ещё доезжает плавной прокруткой. Если за отведённое время цели
   * не нашлось — показываем карточку по центру и тур идёт дальше.
   */
  useEffect(() => {
    const started = Date.now();
    let scrolledTo: HTMLElement | null = null;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const waited = Date.now() - started;

      let element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (!element && waited > FALLBACK_AFTER_MS) {
        // Пункт меню раздела — атрибут ставит components/Layout.tsx из того
        // же списка NAV, так что он есть ровно у доступных роли разделов
        element = document.querySelector<HTMLElement>(`[data-tour="nav:${route}"]`);
      }

      if (!element) {
        if (waited > LOOKUP_TIMEOUT_MS) setSpot(null);
        return;
      }

      if (scrolledTo !== element) {
        scrolledTo = element;
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }

      const rect = element.getBoundingClientRect();
      // Скрытый элемент (display: none, свёрнутая колонка) даёт нулевой
      // прямоугольник — подсвечивать точку бессмысленно
      if (rect.width < 1 || rect.height < 1) {
        setSpot(null);
        return;
      }
      setSpot((current) => {
        const fresh = clampSpot(rect);
        return sameSpot(current, fresh) ? current : fresh;
      });
    };

    measure();
    const timer = window.setInterval(measure, 160);
    window.addEventListener('resize', measure);
    // capture: прокручивается не окно, а внутренний контейнер страницы
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [target, route]);

  // Размер карточки нужен, чтобы положить её над или под вырезом.
  // Условие внутри обязательно: без него setState зациклил бы отрисовку
  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setCardSize((current) =>
      Math.abs(current.height - rect.height) > 2 || Math.abs(current.width - rect.width) > 2
        ? { width: rect.width, height: rect.height }
        : current,
    );
  });

  useEffect(() => {
    // Фокус уводим в карточку: иначе Tab гуляет по затемнённой странице
    cardRef.current?.focus();
  }, [target]);

  const centered = narrow || !spot;
  const cardStyle = centered ? undefined : placeCard(spot, cardSize);
  // На узком экране карточка прижата к низу и может накрыть подсветку.
  // Считаем это при отрисовке, а не в замере: иначе эффект замера держал бы
  // в себе устаревшие высоту карточки и признак узкого экрана
  const visibleSpot = spot && narrow ? fitAboveCard(spot, cardSize.height + 24) : spot;

  return (
    <>
      {/*
        Слой, перехватывающий клики: пока идёт тур, приложением не управляют.
        Затемняет он сам только когда выреза нет — иначе затемнение легло бы
        дважды, слоем и тенью выреза, и страница ушла бы в черноту.
      */}
      <div className={`tour-blocker${spot ? '' : ' tour-blocker-dim'}`} />

      {visibleSpot && <div className="tour-spot" style={visibleSpot} aria-hidden="true" />}

      <div
        className={`tour-card${centered ? ' tour-card-centered' : ''}`}
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Тур по системе: ${title}`}
        ref={cardRef}
        tabIndex={-1}
      >
        <div className="tour-counter mono">шаг {number} из {total}</div>
        <div className="tour-title">{title}</div>
        <p className="tour-text">{text}</p>

        <div className="tour-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={props.onFinish}>
            Пропустить
          </button>
          <span className="grow" />
          <button
            type="button"
            className="btn btn-sm"
            onClick={props.onPrev}
            disabled={isFirst}
          >
            Назад
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={props.onNext}>
            {isLast ? 'Понятно' : 'Далее'}
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Приводит прямоугольник элемента к вырезу, который не уезжает за край.
 *
 * На узком экране это главная морока: карточка товара шире окна, и вырез
 * вместе с ней уходит вправо за границу — человек видит затемнение и
 * половину подсветки.
 */
function clampSpot(rect: DOMRect): Spot {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let width = Math.min(rect.width + SPOT_PADDING * 2, viewportWidth - EDGE * 2);
  let left = rect.left - SPOT_PADDING;
  left = Math.max(EDGE, Math.min(left, viewportWidth - width - EDGE));

  let height = Math.min(rect.height + SPOT_PADDING * 2, viewportHeight - EDGE * 2);
  let top = rect.top - SPOT_PADDING;
  top = Math.max(EDGE, Math.min(top, viewportHeight - height - EDGE));

  // Защита от отрицательных значений при совсем узком окне
  if (width < 1) width = 1;
  if (height < 1) height = 1;

  return { top, left, width, height };
}

/**
 * Подрезает подсветку снизу, чтобы её не накрыла карточка.
 *
 * Только подрезает, но не сдвигает: сдвинутая подсветка показывала бы не на
 * тот элемент, а это хуже, чем частично закрытая. Если подрезать нечего —
 * элемент целиком ниже карточки, — оставляем как есть.
 */
function fitAboveCard(spot: Spot, reserve: number): Spot {
  const limit = window.innerHeight - reserve;
  if (spot.top + spot.height <= limit) return spot;
  const height = limit - spot.top;
  if (height < 48) return spot;
  return { ...spot, height };
}

function sameSpot(a: Spot | null, b: Spot): boolean {
  if (!a) return false;
  return (
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
}

/** Карточка под вырезом, если места нет — над ним, если и там нет — по центру */
function placeCard(
  spot: Spot,
  card: { width: number; height: number },
): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const below = spot.top + spot.height + CARD_GAP;
  const above = spot.top - CARD_GAP - card.height;

  let top: number;
  if (below + card.height <= viewportHeight - EDGE) top = below;
  else if (above >= EDGE) top = above;
  else top = Math.max(EDGE, (viewportHeight - card.height) / 2);

  let left = spot.left + spot.width / 2 - card.width / 2;
  left = Math.max(EDGE, Math.min(left, viewportWidth - card.width - EDGE));

  return { top, left };
}
