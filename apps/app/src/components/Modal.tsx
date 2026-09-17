import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Обработчик закрытия держим в ссылке, а не в зависимостях эффекта.
  // Родители передают его стрелкой — onClose={() => setDraft(null)}, — то есть
  // на каждом рендере это новая функция. С ней в зависимостях эффект
  // перезапускался после каждого нажатия клавиши: его уборка возвращала фокус
  // туда, откуда окно открыли, а новый заход уводил его в первое поле формы.
  // Со стороны это выглядело так, будто поле принимает по одному символу.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Esc закрывает, фокус уезжает внутрь окна — иначе Tab уводит на фон
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);

    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
    // Только при открытии и закрытии окна: список намеренно пуст
  }, []);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="spread" style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        {children}
        {footer && (
          <div className="row-flex" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
