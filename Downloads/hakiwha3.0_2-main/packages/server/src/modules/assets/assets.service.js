const prisma = require("../../config/database");
const ApiError = require("../../utils/ApiError");

async function listAssets(orgId, filters) {
  const { type, page = 1, limit = 30 } = filters;
  const where = { assetGroup: { campaign: { organizationId: orgId } } };

  if (type) where.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assetGroup: {
          include: {
            campaign: { select: { id: true, name: true, country: true, status: true } },
          },
        },
      },
      skip,
      take: parseInt(limit),
    }),
    prisma.asset.count({ where }),
  ]);

  const enriched = assets.map((a) => ({
    id: a.id,
    type: a.type,
    content: a.content,
    url: a.url,
    status: a.status,
    campaignId: a.assetGroup.campaign.id,
    campaignName: a.assetGroup.campaign.name,
    country: a.assetGroup.campaign.country,
  }));

  return { assets: enriched, total, page: parseInt(page), limit: parseInt(limit) };
}

async function getAssetById(orgId, assetId) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, assetGroup: { campaign: { organizationId: orgId } } },
    include: {
      assetGroup: {
        include: {
          campaign: {
            include: {
              metrics: { orderBy: { date: "desc" }, take: 5 },
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!asset) throw ApiError.notFound("Asset not found");
  return asset;
}

async function getBestAssets(orgId) {
  const assets = await prisma.asset.findMany({
    where: { assetGroup: { campaign: { organizationId: orgId } } },
    include: {
      assetGroup: {
        include: {
          campaign: { select: { id: true, name: true, country: true } },
        },
      },
    },
  });

  const grouped = {};
  assets.forEach((a) => {
    if (!grouped[a.type]) grouped[a.type] = [];
    grouped[a.type].push({
      id: a.id,
      content: a.content,
      url: a.url,
      campaignName: a.assetGroup.campaign.name,
      country: a.assetGroup.campaign.country,
      campaignId: a.assetGroup.campaign.id,
    });
  });

  return grouped;
}

async function getAssetStats(orgId) {
  const assets = await prisma.asset.findMany({
    where: { assetGroup: { campaign: { organizationId: orgId } } },
    select: { type: true },
  });

  const typeCounts = {};
  assets.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  return { totalAssets: assets.length, byType: typeCounts };
}

module.exports = { listAssets, getAssetById, getBestAssets, getAssetStats };
