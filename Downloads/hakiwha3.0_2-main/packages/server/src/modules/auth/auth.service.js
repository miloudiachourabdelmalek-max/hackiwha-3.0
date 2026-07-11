const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { generateTokens } = require("../../middleware/auth");

async function register(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw ApiError.conflict("Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const org = await prisma.organization.create({
    data: {
      id: uuidv4(),
      name: data.organizationName || `${data.name}'s Organization`,
      slug: data.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
    },
  });

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: data.email,
      password: passwordHash,
      name: data.name,
      role: "OWNER",
      organizationId: org.id,
    },
    select: { id: true, email: true, name: true, role: true, organizationId: true },
  });

  const userWithPlan = { ...user, plan: "ESSENTIAL" };

  const tokens = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user: userWithPlan, ...tokens };
}

async function login(data) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true, password: true, role: true, organizationId: true },
  });

  if (!user || !user.password) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, organizationId: true, avatar: true, provider: true, createdAt: true, organization: { select: { plan: true } } },
  });

  const { password, ...userWithoutPassword } = user;
  return { user: { ...userWithoutPassword, plan: userWithOrg.organization?.plan || "ESSENTIAL" }, ...tokens };
}

async function refreshToken(data) {
  const jwt = require("jsonwebtoken");
  const env = require("../../config/env");

  let decoded;
  try {
    decoded = jwt.verify(data.refreshToken, env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: data.refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const tokens = generateTokens(decoded.userId);

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: tokens.refreshToken,
      userId: decoded.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return tokens;
}

async function googleAuth(code) {
  const { createOAuth2Client, getGoogleTokens, getGoogleUserInfo } = require("../../config/google-auth");

  const oauth2Client = createOAuth2Client();
  const tokens = await getGoogleTokens(oauth2Client, code);
  const googleUser = await getGoogleUserInfo(oauth2Client);

  let user = await prisma.user.findUnique({ where: { googleId: googleUser.id } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: googleUser.email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id, provider: "GOOGLE", avatar: googleUser.picture },
      });
    } else {
      const org = await prisma.organization.create({
        data: {
          name: `${googleUser.name}'s Organization`,
          slug: googleUser.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
        },
      });

      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          provider: "GOOGLE",
          avatar: googleUser.picture,
          role: "OWNER",
          organizationId: org.id,
        },
      });
    }
  }

  const userTokens = generateTokens(user.id);

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: userTokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, ...userTokens };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, role: true, organizationId: true, avatar: true, provider: true, createdAt: true,
      organization: { select: { plan: true, name: true } },
    },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const { organization, ...rest } = user;
  return { ...rest, plan: organization?.plan || "ESSENTIAL", organizationName: organization?.name };
}

async function logout(userId, refreshToken) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
  } else {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}

module.exports = { register, login, refreshToken, googleAuth, getMe, logout };
