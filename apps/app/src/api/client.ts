/**
 * Тонкий клиент над fetch. Сессия живёт в httpOnly-куке, поэтому токенов
 * в JS нет и хранить их негде — браузер шлёт куку сам.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues?: { field: string; message: string }[],
    /** Машиночитаемая причина отказа. Разбирать текст сообщения нельзя:
        он меняется при первой же правке формулировки */
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Код из `details.code`, которым сервер держит человека на экране смены
 * выданного пароля (apps/api/src/lib/password-policy.ts).
 */
export const PASSWORD_CHANGE_REQUIRED = 'password_change_required';

/**
 * Единая точка, где приложение узнаёт о требовании сменить пароль.
 *
 * Флаг может появиться, пока человек работает: администратор сбросил пароль,
 * и следующий же запрос вернёт 403. Разбирать это в каждом месте, где мы
 * что-то грузим, невозможно — поэтому слушателя ставит AuthProvider, а
 * клиент сообщает ему о таком ответе до того, как бросит ошибку наверх.
 */
type PasswordChangeListener = () => void;
let passwordChangeListener: PasswordChangeListener | null = null;

export function onPasswordChangeRequired(listener: PasswordChangeListener): () => void {
  passwordChangeListener = listener;
  return () => {
    if (passwordChangeListener === listener) passwordChangeListener = null;
  };
}

/** Собирает ApiError из неуспешного ответа и попутно ловит 403 про пароль */
function toApiError(status: number, payload: unknown, fallback: string): ApiError {
  const body = payload as {
    error?: string;
    issues?: { field: string; message: string }[];
    details?: { code?: string };
  } | null;
  const code = body?.details?.code;

  if (status === 403 && code === PASSWORD_CHANGE_REQUIRED) {
    passwordChangeListener?.();
  }

  return new ApiError(status, body?.error ?? fallback, body?.issues, code);
}

type Query = Record<string, string | number | boolean | undefined | null>;

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query; signal?: AbortSignal } = {},
): Promise<T> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: options.body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'Сервер недоступен. Проверьте соединение.');
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, payload, `Ошибка ${response.status}`);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('POST', path, { body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('PUT', path, { body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('PATCH', path, { body, signal }),
  delete: <T>(path: string) => request<T>('DELETE', path),

  /** Загрузка файла: FormData, без Content-Type — его ставит браузер */
  upload: async <T>(path: string, file: File): Promise<T> => {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw toApiError(response.status, payload, 'Не удалось загрузить файл');
    }
    return payload as T;
  },
};
