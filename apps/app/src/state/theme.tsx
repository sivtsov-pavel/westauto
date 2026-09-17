import { useCallback, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'avk-theme';

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'dark' || value === 'light') return value;
  } catch {
    // приватный режим — просто работаем с темой по умолчанию
  }
  return 'dark';
}

/**
 * Тема приложения. Тёмная по умолчанию — так нарисован макет и так удобнее
 * работать целый день; светлая нужна для проекторов и печати.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStored);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // не критично
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
