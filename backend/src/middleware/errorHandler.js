function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.expose ? err.message : (status === 500 ? 'Something went wrong' : err.message),
    },
  };
  if (err.details) payload.error.details = err.details;
  if (status >= 500) req.log?.error({ err }, 'Unhandled error');
  res.status(status).json(payload);
}

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = true;
    this.details = details;
  }
}

module.exports = { errorHandler, ApiError };
