import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return next(new ApiError(401, 'Authentication required.'));
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new ApiError(401, 'Session expired. Please login again.'));
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission for this action.'));
  next();
};
