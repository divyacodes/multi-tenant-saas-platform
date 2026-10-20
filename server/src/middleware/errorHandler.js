import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {})
    });
  }

  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  // Handle PostgreSQL specific constraint errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      success: false,
      message: 'A record with this unique value already exists',
      detail: env.IS_PRODUCTION ? undefined : err.detail
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist or relation constraint violated',
      detail: env.IS_PRODUCTION ? undefined : err.detail
    });
  }

  if (err.code === '22P02') {
    // Invalid input syntax
    return res.status(400).json({
      success: false,
      message: 'Invalid data format or identifier provided'
    });
  }

  // Body parser syntax error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload'
    });
  }

  // Generic internal server error
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred',
    ...(env.IS_PRODUCTION ? {} : { stack: err.stack, error: err.message })
  });
};
