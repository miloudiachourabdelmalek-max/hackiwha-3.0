const { prisma } = require('../config/db');

function findMany(organizationId, { country, status, sort = 'createdAt:desc', page = 1, limit = 20 }) {
  const [sortField, sortDir] = sort.split(':');
  return prisma.campaign.findMany({
    where: { organizationId, ...(country && { country }), ...(status && { status }) },
    orderBy: { [sortField]: sortDir === 'asc' ? 'asc' : 'desc' },
    skip: (page - 1) * limit,
    take: Number(limit),
    include: { metrics: { orderBy: { date: 'desc' }, take: 30 } },
  });
}

function count(organizationId, { country, status }) {
  return prisma.campaign.count({ where: { organizationId, ...(country && { country }), ...(status && { status }) } });
}

function findById(organizationId, id) {
  return prisma.campaign.findFirst({
    where: { id, organizationId },
    include: { metrics: { orderBy: { date: 'asc' } }, experiences: true },
  });
}

module.exports = { findMany, count, findById };
