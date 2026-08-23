const { AppError } = require('../lib/errors');

// Validates req.body against a zod schema and replaces it with the parsed
// (defaulted/coerced) value. Runs before the controller so a bad payload
// never reaches the service layer — errors funnel into errorHandler as a 400.
function validateBody(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join('; ');
      return next(new AppError(message, 400));
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
