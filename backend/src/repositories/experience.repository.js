const { prisma } = require('../config/db');

function findMany(organizationId, { country, category, status, tag, q, page = 1, limit = 20 }) {
  const where = {
    organizationId,
    ...(country && { country }),
    ...(category && { category }),
    ...(status && { status }),
    ...(tag && { tags: { has: tag } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { lessonsLearned: { contains: q, mode: 'insensitive' } },
        { mistakesMade: { contains: q, mode: 'insensitive' } },
        { result: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  return prisma.experience.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip: (page - 1) * limit,
    take: Number(limit),
    include: { author: { select: { id: true, name: true } } },
  });
}

function count(organizationId, filters) {
  const { page, limit, ...rest } = filters;
  return findMany(organizationId, { ...rest, page: 1, limit: 100000 }).then((r) => r.length);
}

function findById(organizationId, id) {
  return prisma.experience.findFirst({
    where: { id, organizationId },
    include: { author: { select: { id: true, name: true } }, campaign: true },
  });
}

function create(organizationId, authorId, data) {
  return prisma.experience.create({ data: { ...data, organizationId, authorId } });
}

function update(organizationId, id, data) {
  return prisma.experience.updateMany({ where: { id, organizationId }, data });
}

// Structured pre-filter for the recommendation engine (architecture doc §4, step 1).
// Matches on country / category / platform exactly, budget within +/-30%, ranked so
// failures (negative profit or explicitly flagged mistakes) surface first as warnings.
async function findSimilar(organizationId, { country, category, platform, budgetMicros }) {
  const budget = budgetMicros ? BigInt(budgetMicros) : null;
  const budgetLow = budget ? (budget * 70n) / 100n : undefined;
  const budgetHigh = budget ? (budget * 130n) / 100n : undefined;

  const candidates = await prisma.experience.findMany({
    where: {
      organizationId,
      OR: [
        country ? { country } : undefined,
        category ? { category } : undefined,
      ].filter(Boolean),
      ...(platform && { platform }),
    },
    include: { author: { select: { id: true, name: true } } },
    take: 50,
  });

  const scored = candidates.map((exp) => {
    let score = 0;
    if (country && exp.country === country) score += 3;
    if (category && exp.category === category) score += 3;
    if (platform && exp.platform === platform) score += 1;
    if (budget && exp.budgetMicros && exp.budgetMicros >= budgetLow && exp.budgetMicros <= budgetHigh) score += 2;
    const isFailure = (exp.profitMicros !== null && exp.profitMicros < 0n) || !!exp.mistakesMade;
    if (isFailure) score += 1; // surface warnings preferentially, not just best matches
    return { ...exp, _matchScore: score, _isWarning: isFailure };
  });

  return scored
    .filter((e) => e._matchScore > 0)
    .sort((a, b) => b._matchScore - a._matchScore || (b._isWarning ? 1 : -1))
    .slice(0, 10);
}

module.exports = { findMany, count, findById, create, update, findSimilar };
