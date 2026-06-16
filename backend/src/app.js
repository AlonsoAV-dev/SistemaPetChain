import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { checkDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

function originMatches(requestOrigin, allowedOrigin) {
  if (allowedOrigin === '*') return true;
  if (requestOrigin === allowedOrigin) return true;

  try {
    const requestUrl = new URL(requestOrigin);
    const allowedUrl = new URL(allowedOrigin);

    if (!allowedUrl.hostname.startsWith('*.')) return false;
    if (requestUrl.protocol !== allowedUrl.protocol) return false;

    const suffix = allowedUrl.hostname.slice(1);
    return requestUrl.hostname.endsWith(suffix) && requestUrl.hostname !== suffix.slice(1);
  } catch {
    return false;
  }
}

function isAllowedCorsOrigin(requestOrigin, configuredOrigins) {
  if (!requestOrigin) return configuredOrigins.length === 0;
  if (configuredOrigins.length === 0) return true;
  return configuredOrigins.some((origin) => originMatches(requestOrigin, origin));
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const configuredOrigins = env.corsOrigins;
    const isAllowedOrigin = isAllowedCorsOrigin(requestOrigin, configuredOrigins);

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin ?? '*');
      if (requestOrigin) {
        res.setHeader('Vary', 'Origin');
      }
    }

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        res.sendStatus(403);
        return;
      }
      res.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: { message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' } },
    }),
  );

  app.get('/health', async (_req, res, next) => {
    try {
      const databaseTime = await checkDatabaseConnection();
      res.json({
        status: 'ok',
        service: 'petchain-api',
        timestamp: new Date().toISOString(),
        databaseTime,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/v1', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
