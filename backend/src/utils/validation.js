import { httpError } from './httpError.js';

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateEmail(value) {
  const email = normalizeEmail(value);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw httpError(400, 'Correo electronico invalido.');
  }

  return email;
}

export function validatePassword(value) {
  const password = String(value ?? '');

  if (password.length < 8 || password.length > 128) {
    throw httpError(400, 'La contrasena debe tener entre 8 y 128 caracteres.');
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw httpError(400, 'La contrasena debe incluir letras y numeros.');
  }

  return password;
}

export function validateText(value, field, { min = 1, max = 1000 } = {}) {
  const text = String(value ?? '').trim();

  if (text.length < min || text.length > max) {
    throw httpError(400, `${field} debe tener entre ${min} y ${max} caracteres.`);
  }

  return text;
}

export function optionalText(value, field, max = 1000) {
  if (value === undefined || value === null || value === '') return null;
  return validateText(value, field, { min: 1, max });
}

export function validateUrl(value, field = 'URL') {
  if (value === undefined || value === null || value === '') return null;

  try {
    const url = new URL(String(value));
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw httpError(400, `${field} invalida.`);
  }
}

export function parseDate(value, field) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw httpError(400, `${field} debe ser una fecha valida.`);
  }

  return date.toISOString();
}
