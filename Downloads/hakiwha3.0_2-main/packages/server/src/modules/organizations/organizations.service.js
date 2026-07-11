const prisma = require("../../config/database");
const ApiError = require("../../utils/ApiError");

async function getOrganization(orgId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true, name: true, slug: true, logo: true, plan: true, createdAt: true,
      _count: { select: { users: true, campaigns: true, experiments: true, memories: true } },
    },
  });
  if (!org) throw ApiError.notFound("Organization not found");
  return org;
}

async function updateOrganization(orgId, data) {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data,
    select: { id: true, name: true, slug: true, logo: true, plan: true },
  });
  return org;
}

module.exports = { getOrganization, updateOrganization };
