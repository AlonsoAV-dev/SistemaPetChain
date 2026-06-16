import { HttpError } from '../utils/httpError.js';

export function errorHandler(error, _req, res, _next) {
  const databaseStatusByCode = {
    '22P02': 400,
    '22023': 400,
    '23503': 409,
    '23505': 409,
    '23514': 400,
    '42501': 403,
    P0002: 404,
  };
  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : error?.name === 'MulterError'
        ? 400
        : (databaseStatusByCode[error.code] ?? 500);
  const message = statusCode === 500 ? 'Error interno del servidor.' : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: {
      message,
      details: error.details ?? null,
    },
  });
}

