import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { httpError } from './httpError.js';

export function signToken(payload) {
  return jwt.sign(payload, env.authSecret, {
    algorithm: 'HS256',
    expiresIn: env.authTokenTtlSeconds,
    issuer: env.authIssuer,
    audience: env.authAudience,
    jwtid: randomUUID(),
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.authSecret, {
      algorithms: ['HS256'],
      issuer: env.authIssuer,
      audience: env.authAudience,
    });
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw httpError(401, 'Token expirado.');
    }
    throw httpError(401, 'Token invalido.');
  }
}

