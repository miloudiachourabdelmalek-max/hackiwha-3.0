const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('./errorHandler');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing bearer token'));

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (e) {
    next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

module.exports = { requireAuth };
