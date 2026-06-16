import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;

  const [iterations, salt, originalHash] = storedHash.split(':');
  if (!iterations || !salt || !originalHash) return false;

  const hash = pbkdf2Sync(password, salt, Number(iterations), KEY_LENGTH, DIGEST).toString('hex');
  const originalBuffer = Buffer.from(originalHash, 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');

  return originalBuffer.length === hashBuffer.length && timingSafeEqual(originalBuffer, hashBuffer);
}

