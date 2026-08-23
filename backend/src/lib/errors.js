// Thrown by services when the response status is known at the throw site
// (e.g. a 404 for a missing resource, a 409 for a conflict). Plain
// `new Error(...)` still works everywhere else — the error handler falls
// back to inferring a status from the message (see middleware/errorHandler.js)
// so existing services didn't need to be migrated to this class.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

module.exports = { AppError, NotFoundError };
