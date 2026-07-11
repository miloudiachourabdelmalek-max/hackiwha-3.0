const prisma = require("../../config/database");

async function globalSearch(orgId, query) {
  if (!query || query.length < 2) return { campaigns: [], experiments: [], memories: [] };

  const q = { contains: query, mode: "insensitive" };

  const [campaigns, experiments, memories] = await Promise.all([
    prisma.campaign.findMany({
      where: { organizationId: orgId, OR: [{ name: q }, { country: q }] },
      take: 10,
      select: { id: true, name: true, country: true, status: true, type: true },
    }),
    prisma.experiment.findMany({
      where: { organizationId: orgId, OR: [{ title: q }, { product: q }, { description: q }] },
      take: 10,
      select: { id: true, title: true, country: true, product: true, result: true },
    }),
    prisma.memory.findMany({
      where: { organizationId: orgId, OR: [{ title: q }, { content: q }] },
      take: 10,
      select: { id: true, title: true, type: true },
    }),
  ]);

  return { campaigns, experiments, memories };
}

async function suggest(orgId, query) {
  if (!query || query.length < 1) return [];

  const q = { contains: query, mode: "insensitive" };

  const [campaigns, products] = await Promise.all([
    prisma.campaign.findMany({
      where: { organizationId: orgId, name: q },
      take: 5,
      select: { id: true, name: true },
    }),
    prisma.experiment.findMany({
      where: { organizationId: orgId, product: q },
      take: 5,
      select: { product: true },
      distinct: ["product"],
    }),
  ]);

  const suggestions = [
    ...campaigns.map((c) => ({ type: "campaign", id: c.id, label: c.name })),
    ...products.filter((p) => p.product).map((p) => ({ type: "product", label: p.product })),
  ];

  return suggestions.slice(0, 8);
}

module.exports = { globalSearch, suggest };
