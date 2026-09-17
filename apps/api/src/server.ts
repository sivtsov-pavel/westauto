import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import { migrate } from './db/migrate.js';
import { pool } from './db/pool.js';
import { seed } from './db/seed.js';
import { config, hasBazaGaiKey, isProduction } from './lib/env.js';
import { HttpError } from './lib/errors.js';
import { agentAdminRoutes, agentPublicRoutes, agentSelfRoutes } from './routes/agents.js';
import { authRoutes } from './routes/auth.js';
import { calculationRoutes } from './routes/calculations.js';
import { adminLeadRoutes, publicLeadRoutes } from './routes/leads.js';
import { lotRoutes } from './routes/lots.js';
import { publicQuoteRoutes } from './routes/public-quote.js';
import { seoRoutes } from './routes/seo.js';
import { settingsRoutes } from './routes/settings.js';
import { shareAdminRoutes, sharePublicRoutes } from './routes/share.js';
import { adminShowcaseRoutes, publicShowcaseRoutes } from './routes/showcase.js';
import { tariffRoutes } from './routes/tariffs.js';
import { userRoutes } from './routes/users.js';
import { watchlistRoutes } from './routes/watchlist.js';
import { startLotWatcher, stopLotWatcher } from './services/lot-watcher.js';

async function buildServer() {
  const app = Fastify({
    logger: {
      level: isProduction ? 'info' : 'debug',
      transport: isProduction
        ? undefined
        : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
      // Куки и заголовок с ключом API не должны попадать в лог ни в каком виде
      redact: ['req.headers.cookie', 'req.headers["x-api-key"]', 'res.headers["set-cookie"]'],
    },
    trustProxy: true,
    bodyLimit: 1024 * 1024,
  });

  await app.register(cookie);
  await app.register(rateLimit, {
    global: false,
    max: 300,
    timeWindow: '1 minute',
  });
  await app.register(multipart, {
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });

  // Загруженные фото витрины
  const uploadsDir = join(config.UPLOADS_DIR);
  await mkdir(join(uploadsDir, 'showcase'), { recursive: true });
  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    cacheControl: true,
    maxAge: '7d',
  });

  // ─── Единый формат ошибок ─────────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const issues = error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return reply.code(400).send({
        error: issues[0]?.message ?? 'Проверьте заполненные поля',
        issues,
      });
    }

    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        details: error.details,
      });
    }

    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.code(429).send({ error: 'Слишком много запросов, подождите немного' });
    }

    // Всё остальное — наша вина: подробности в лог, клиенту обезличенный текст
    request.log.error({ err: error }, 'необработанная ошибка');
    return reply.code(500).send({ error: 'Внутренняя ошибка сервера' });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: 'Маршрут не найден' });
  });

  // ─── Маршруты ─────────────────────────────────────────────────────────────
  app.get('/api/health', async () => ({
    ok: true,
    customsMode: hasBazaGaiKey ? 'api' : 'estimate',
    time: new Date().toISOString(),
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(calculationRoutes, { prefix: '/api/calculations' });
  await app.register(tariffRoutes, { prefix: '/api/tariffs' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(lotRoutes, { prefix: '/api/lots' });
  await app.register(adminShowcaseRoutes, { prefix: '/api/showcase' });
  await app.register(adminLeadRoutes, { prefix: '/api/leads' });
  await app.register(shareAdminRoutes, { prefix: '/api/share' });
  await app.register(watchlistRoutes, { prefix: '/api/watchlist' });
  await app.register(agentAdminRoutes, { prefix: '/api/agents' });
  await app.register(agentSelfRoutes, { prefix: '/api/agent' });

  // Публичная часть для сайта — без авторизации
  await app.register(publicShowcaseRoutes, { prefix: '/api/public/showcase' });
  await app.register(publicLeadRoutes, { prefix: '/api/public/leads' });
  await app.register(sharePublicRoutes, { prefix: '/api/public/calculation' });
  await app.register(publicQuoteRoutes, { prefix: '/api/public/quote' });
  await app.register(agentPublicRoutes, { prefix: '/api/public/agent' });

  // robots.txt и sitemap.xml отдаются с корня, без префикса /api
  await app.register(seoRoutes);

  return app;
}

async function start(): Promise<void> {
  await migrate();
  await seed();

  const app = await buildServer();

  // Фоновая проверка ставок на отслеживаемых лотах
  startLotWatcher();

  const shutdown = async (signal: string) => {
    app.log.info(`получен ${signal}, закрываюсь`);
    stopLotWatcher();
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ port: config.API_PORT, host: '0.0.0.0' });

  if (isProduction) {
    /*
     * В боевом режиме кука сессии помечается Secure — браузер отдаёт её
     * только по https. Без TLS вход будет выглядеть как «залогинился и тут
     * же разлогинился», и причину искать долго. Предупреждаем заранее.
     */
    app.log.info(
      'Боевой режим: кука сессии помечена Secure — сайт обязан работать по https. ' +
        'Настройка TLS: infra/nginx/prod-tls.conf',
    );
  }

  if (!hasBazaGaiKey) {
    app.log.warn(
      'BAZA_GAI_API_KEY не задан — растаможка считается локальной оценочной формулой. ' +
        'Бесплатный ключ: форма на https://baza-gai.com.ua/',
    );
  }
}

start().catch((error) => {
  console.error('[api] не удалось стартовать:', error);
  process.exit(1);
});
