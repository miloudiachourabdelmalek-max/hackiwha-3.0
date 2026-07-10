const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function register({ email, password, name, orgName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = orgName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `org-${Date.now()}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      memberships: {
        create: {
          role: 'OWNER',
          organization: { create: { name: orgName, slug } },
        },
      },
    },
    include: { memberships: { include: { organization: true } } },
  });

  return issueTokens(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  return issueTokens(user);
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30) * 86400000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

// Refresh token rotation: the incoming token is revoked and replaced by a new one on every use.
// If a revoked token is presented again, that's a reuse signal — treat the whole chain as compromised.
async function refresh(oldRefreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await prisma.refreshToken.findFirst({ where: { userId: payload.sub, tokenHash } });

  if (!stored || stored.revoked) {
    if (stored?.revoked) {
      await prisma.refreshToken.updateMany({ where: { userId: payload.sub }, data: { revoked: true } });
    }
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid');
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return issueTokens(user);
}

async function logout(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}

module.exports = { register, login, refresh, logout };
