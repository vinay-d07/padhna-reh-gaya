// Wraps an async Express handler so a rejected promise reaches next(error)
// instead of crashing the process — lets every controller drop its
// try/catch and rely on middleware/errorHandler.js for the response.
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
