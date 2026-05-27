import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { httpError } from './httpError.js';

function encode(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function sign(value) {
  return createHmac('sha256', env.authSecret).update(value).digest('base64url');
}

export function signToken(payload) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + env.authTokenTtlSeconds,
  });
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  const [header, body, signature] = token?.split('.') ?? [];

  if (!header || !body || !signature) {
    throw httpError(401, 'Token invalido.');
  }

  const expectedSignature = sign(`${header}.${body}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw httpError(401, 'Token invalido.');
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw httpError(401, 'Token expirado.');
  }

  return payload;
}

