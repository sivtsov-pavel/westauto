/**
 * Ошибка с HTTP-статусом и текстом, который не стыдно показать пользователю.
 * Всё, что не HttpError, превращается в 500 с обезличенным текстом — детали
 * уходят в лог, а не клиенту.
 */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);

export const notFound = (message = 'Не найдено') => new HttpError(404, message);

export const conflict = (message: string) => new HttpError(409, message);
