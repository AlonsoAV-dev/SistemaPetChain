import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(process.cwd(), '.env');

if (existsSync(envFile)) {
  const lines = readFileSync(envFile, 'utf8').split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX ?? 5),
  databaseSsl:
    (process.env.DATABASE_SSL ?? '').toLowerCase() === 'true' ||
    (process.env.DATABASE_URL ?? '').includes('supabase'),
  corsOrigins: (process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  authSecret: process.env.AUTH_SECRET ?? '',
  authIssuer: process.env.AUTH_ISSUER ?? 'petchain-api',
  authAudience: process.env.AUTH_AUDIENCE ?? 'petchain-web',
  authTokenTtlSeconds: Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 86400),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'petchain-media',
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL es obligatorio.');
}

if (!env.authSecret || env.authSecret.length < 32) {
  throw new Error('AUTH_SECRET es obligatorio y debe tener al menos 32 caracteres.');
}
