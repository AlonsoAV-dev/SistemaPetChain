export class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function httpError(statusCode, message, details = null) {
  return new HttpError(statusCode, message, details);
}

