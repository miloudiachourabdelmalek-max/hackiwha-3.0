const { prisma } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const listMine = asyncHandler(async (req, res) => {
  const memberships = await prisma.membership.findMany({
    where: { userId: req.userId },
    include: { organization: true },
  });
  res.json({ data: memberships.map((m) => ({ ...m.organization, role: m.role })) });
});

module.exports = { listMine };
