/**
 * 404 handler — forwards an error to the centralized error handler.
 */
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not found - ${req.originalUrl}`));
}

/**
 * Centralized error handler. Hides stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
