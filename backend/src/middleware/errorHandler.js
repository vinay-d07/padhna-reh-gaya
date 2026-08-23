const logger = require('../lib/logger');
const Sentry = require('../lib/sentry');

// Every service in this codebase throws plain `new Error('X not found')` for
// missing resources and `new Error('X is required' | 'X cannot be empty' | ...)`
// for validation failures — this mirrors the per-controller statusCode
// heuristic that used to be duplicated in every catch block. An explicit
// `error.statusCode` (see lib/errors.js AppError) always wins; anything that
// matches neither pattern is treated as unexpected and reported as a 500.
const NOT_FOUND_RE = /not found$/i;
const VALIDATION_RE = /(is required|cannot be empty|must be|invalid|only .* are supported|exceeds the .* limit|still processing)/i;

function inferStatusCode(message = '') {
  if (NOT_FOUND_RE.test(message)) return 404;
  if (VALIDATION_RE.test(message)) return 400;
  return 500;
}

// 404 fallback for routes that don't match any handler — must be mounted
// after every route but before errorHandler.
function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `No route for ${req.method} ${req.originalUrl}` });
}

// Final Express error-handling middleware (4-arg signature is required by
// Express to be recognized as one) — every asyncHandler-wrapped controller
// funnels its errors here instead of duplicating status-code logic.
function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || inferStatusCode(error.message);

  if (statusCode >= 500) {
    logger.error({ err: error, path: req.path, method: req.method }, error.message);
    Sentry.captureException(error);
  } else {
    logger.warn({ path: req.path, method: req.method, statusCode }, error.message);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Something went wrong' : error.message,
  });
}

module.exports = { errorHandler, notFoundHandler };
