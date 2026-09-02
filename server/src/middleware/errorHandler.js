import { env } from '../config/env.js';

export function errorHandler(error, req, res, next) {
  const status = error.statusCode || 500;
  const message = status === 500 && env.nodeEnv === 'production'
    ? 'Something went wrong.'
    : error.message;
  res.status(status).json({ success: false, message, ...(error.details ? { details: error.details } : {}) });
}
