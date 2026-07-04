import type { ErrorHandler } from 'hono';
import { logger } from '../utils/logger.js';

export const onErrorHandler: ErrorHandler = (err, c) => {
  logger.error('Unhandled Server Error:', err);
  return c.json(
    {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.',
    },
    500
  );
};
