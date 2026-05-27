import { HttpError } from '../utils/httpError.js';

export function errorHandler(error, _req, res, _next) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
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

