const prisma = require("../../config/database");
const ApiError = require("../../utils/ApiError");

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, role: true,
      organizationId: true, avatar: true, provider: true,
      createdAt: true, lastLoginAt: true,
    },
  });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, avatar: true },
  });
  return user;
}

async function getOrgUsers(organizationId) {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: "asc" },
  });
  return users;
}

async function changeUserRole(organizationId, targetUserId, newRole, currentUserRole) {
  const { ROLE_HIERARCHY } = require("../../middleware/role");

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, organizationId: true, role: true },
  });

  if (!targetUser || targetUser.organizationId !== organizationId) {
    throw ApiError.notFound("User not found in this organization");
  }

  if (targetUser.role === "OWNER" && currentUserRole !== "OWNER") {
    throw ApiError.forbidden("Cannot change the role of the organization owner");
  }

  const userLevel = ROLE_HIERARCHY[currentUserRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0;
  if (userLevel <= targetLevel && currentUserRole !== "OWNER") {
    throw ApiError.forbidden("Cannot change role of a user with equal or higher permissions");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: { id: true, email: true, name: true, role: true },
  });
  return updated;
}

module.exports = { getProfile, updateProfile, getOrgUsers, changeUserRole };
