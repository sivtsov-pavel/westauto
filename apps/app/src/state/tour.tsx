import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { can } from '@avtoklyuch/shared';
import { useAuth } from '@/state/auth';
import { TOUR_STEPS, type TourStep } from '@/state/tour-steps';

/**
 * Состояние тура по системе.
 *
 * Своё, без driver.js и подобных: у приложения своя палитра и свои отступы,
 * а возня с фокусом и Esc уже решена в components/Modal.tsx — повторить её
 * дешевле, чем переопределять чужие стили.
 *
 * Здесь только состояние и память о пройденном. Подсветка и карточка —
 * в components/Tour.tsx.
 */

/**
 * Версия в ключе. Содержание тура со временем меняется; человеку, прошедшему
 * прошлую версию, новые шаги не покажутся, и это сознательно: повторно
 * приставать к тому, кто уже разобрался, хуже, чем не рассказать о новом
 * разделе. Версию поднимаем, когда тур переписан целиком.
 */
const STORAGE_VERSION = 1;

/** Ключ привязан к пользователю: за одним браузером работают разные люди */
function storageKey(userId: string): string {
  return `avk.tour.v${STORAGE_VERSION}.${userId}`;
}

interface StoredProgress {
  /** Тур пройден или пропущен — больше не предлагаем */
  done?: boolean;
  /** На предложение ответили «потом» — тоже больше не предлагаем */
  declined?: boolean;
  /**
   * Тур начат. Отдельно от номера шага: человек, закрывший вкладку на первом
   * шаге, уже сказал «Давайте» — предлагать ему второй раз незачем
   */
  started?: boolean;
  /** Номер шага, на котором остановились */
  step?: number;
}

function readProgress(userId: string): StoredProgress {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as StoredProgress;
  } catch {
    // Приватное окно или запрет данных сайта: localStorage бросает сам по
    // себе. Тур от этого работать не перестаёт — просто каждый раз заново
    return {};
  }
}

function writeProgress(userId: string, progress: StoredProgress): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(progress));
  } catch {
    // Не критично: прогресс не сохранится, тур пройдёт целиком
  }
}

type TourPhase = 'idle' | 'offer' | 'running';

interface TourContextValue {
  /** Шаги, отсеянные по правам — счётчик «шаг N из M» считает именно их */
  steps: TourStep[];
  /** Текущий шаг, пока тур идёт */
  step: TourStep | null;
  index: number;
  phase: TourPhase;
  /** Согласие на предложение либо запуск из документации */
  start: () => void;
  next: () => void;
  prev: () => void;
  /** «Пропустить» и конец тура: больше не предлагаем */
  finish: () => void;
  /** «Потом» в предложении */
  decline: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<TourPhase>('idle');
  const [index, setIndex] = useState(0);

  /*
   * Фильтр ровно тот же, что у навигации в components/Layout.tsx: сначала
   * роль, потом право. Нельзя показывать пальцем на кнопку, которой у
   * человека нет — а список шагов и список пунктов меню живут в разных
   * файлах и однажды разойдутся, если проверять их по-разному.
   */
  const steps = useMemo<TourStep[]>(() => {
    if (!user) return [];
    return TOUR_STEPS[user.role].filter((item) => {
      if (item.roles && !item.roles.includes(user.role)) return false;
      if (item.needs && !can(user.role, item.needs)) return false;
      return true;
    });
  }, [user]);

  /*
   * Решение «предлагать или нет» принимается один раз на пользователя.
   *
   * Ссылка, а не состояние: без неё повторный запуск эффекта — профиль
   * перечитан, объект пользователя стал новым — сбросил бы идущий тур на
   * первом шаге обратно в предложение.
   */
  const decidedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Вышли из системы: следующий вход примет решение заново
      decidedFor.current = null;
      setPhase('idle');
      return;
    }
    if (steps.length === 0 || decidedFor.current === user.id) return;
    decidedFor.current = user.id;

    const progress = readProgress(user.id);
    if (progress.done || progress.declined) {
      setPhase('idle');
      return;
    }
    // Начатый и брошенный тур продолжаем с того же места: человек закрыл
    // вкладку посреди знакомства, а не отказался от него
    if (progress.started) {
      const saved = progress.step ?? 0;
      setIndex(saved < steps.length ? saved : 0);
      setPhase('running');
      return;
    }
    setIndex(0);
    setPhase('offer');
  }, [user, steps.length]);

  const start = useCallback(() => {
    if (!user) return;
    setIndex(0);
    setPhase('running');
    writeProgress(user.id, { started: true, step: 0 });
  }, [user]);

  const finish = useCallback(() => {
    setPhase('idle');
    setIndex(0);
    if (user) writeProgress(user.id, { done: true });
  }, [user]);

  const decline = useCallback(() => {
    setPhase('idle');
    if (user) writeProgress(user.id, { declined: true });
  }, [user]);

  // Шаг считаем от текущего значения, а не функцией-обновителем: внутри
  // обновителя нельзя менять другое состояние и писать в localStorage —
  // React вправе вызвать его дважды
  const next = useCallback(() => {
    const target = index + 1;
    if (target >= steps.length) {
      // Последний шаг пройден — тур закончен, а не «застрял на конце»
      setPhase('idle');
      setIndex(0);
      if (user) writeProgress(user.id, { done: true });
      return;
    }
    setIndex(target);
    if (user) writeProgress(user.id, { started: true, step: target });
  }, [index, steps.length, user]);

  const prev = useCallback(() => {
    const target = Math.max(0, index - 1);
    setIndex(target);
    if (user) writeProgress(user.id, { started: true, step: target });
  }, [index, user]);

  const value = useMemo<TourContextValue>(
    () => ({
      steps,
      step: phase === 'running' ? steps[index] ?? null : null,
      index,
      phase,
      start,
      next,
      prev,
      finish,
      decline,
    }),
    [steps, phase, index, start, next, prev, finish, decline],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour вызван вне TourProvider');
  return context;
}
