const { prisma } = require('../config/db');
const { ApiError } = require('./errorHandler');

// Resolves the caller's role within the org referenced by X-Org-Id (or req.params.orgId)
// and rejects if their role isn't in `allowedRoles`. Must run after requireAuth.
function requireOrgRole(...allowedRoles) {
  return async (req, res, next) => {
    const organizationId = req.headers['x-org-id'] || req.params.orgId;
    if (!organizationId) return next(new ApiError(400, 'MISSING_ORG', 'X-Org-Id header is required'));

    const membership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: req.userId, organizationId } },
    });

    if (!membership) return next(new ApiError(403, 'NOT_A_MEMBER', 'Not a member of this organization'));
    if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
      return next(new ApiError(403, 'INSUFFICIENT_ROLE', `Requires one of: ${allowedRoles.join(', ')}`));
    }

    req.organizationId = organizationId;
    req.role = membership.role;
    next();
  };
}

module.exports = { requireOrgRole };
