import express from 'express';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

export function createApp() {
  const app = express();

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const configuredOrigins = env.corsOrigins;
    const allowAnyOrigin = configuredOrigins.length === 0;
    const isAllowedOrigin =
      allowAnyOrigin || (requestOrigin ? configuredOrigins.includes(requestOrigin) : false);

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

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'vetchain-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
