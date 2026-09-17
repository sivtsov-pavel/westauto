import { z } from 'zod';

/**
 * Единственное место, где читается process.env. Всё остальное получает config.
 * Секреты живут только здесь и никогда не уезжают во фронтенд-бандл.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть не короче 32 символов'),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(12),

  BOOTSTRAP_ADMIN_LOGIN: z.string().default('admin'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().default('admin12345'),
  BOOTSTRAP_ADMIN_NAME: z.string().default('Администратор'),

  BAZA_GAI_API_KEY: z.string().default(''),
  BAZA_GAI_BASE_URL: z.string().url().default('https://baza-gai.com.ua'),
  BAZA_GAI_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

  NBU_RATES_URL: z
    .string()
    .url()
    .default('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json'),
  FX_REFRESH_MINUTES: z.coerce.number().int().positive().default(180),

  LOT_FETCHER_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  LOT_FETCHER_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),

  UPLOADS_DIR: z.string().default('/data/uploads'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // Падаем громко и сразу: полуживой конфиг хуже остановленного сервиса
  throw new Error(`Некорректные переменные окружения:\n${issues}`);
}

export const config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';

/** Ключ baza-gai не задан — калькулятор уходит в оценочный режим. */
export const hasBazaGaiKey = config.BAZA_GAI_API_KEY.trim().length > 0;
