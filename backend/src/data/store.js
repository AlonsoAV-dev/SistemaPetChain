import { randomUUID } from 'node:crypto';
import { seed } from './seed.js';

const state = structuredClone(seed);

export function list(collectionName) {
  return state[collectionName] ?? [];
}

export function findById(collectionName, id) {
  return list(collectionName).find((record) => record.id === id) ?? null;
}

export function findUserById(id) {
  return findById('users', id);
}

export function findUserByEmail(email) {
  return list('users').find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function createRecord(collectionName, payload) {
  const record = {
    id: `${collectionName}_${randomUUID()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  state[collectionName].unshift(record);
  return record;
}

export function updateRecord(collectionName, id, payload) {
  const collection = list(collectionName);
  const index = collection.findIndex((record) => record.id === id);

  if (index === -1) {
    return null;
  }

  collection[index] = {
    ...collection[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  return collection[index];
}

export function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

