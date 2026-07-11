const prisma = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { v4: uuidv4 } = require("uuid");

async function listCampaigns(orgId, filters) {
  const { country, status, type, search, page = 1, limit = 20 } = filters;
  const where = { organizationId: orgId };

  if (country) where.country = country;
  if (status) where.status = status;
  if (type) where.type = type;
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        metrics: {
          orderBy: { date: "desc" },
          take: 1,
        },
        assetGroups: {
          include: { assets: true },
        },
        _count: { select: { metrics: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    }),
    prisma.campaign.count({ where }),
  ]);

  const enriched = campaigns.map((c) => {
    const latestMetric = c.metrics[0] || {};
    const totalAssets = c.assetGroups.reduce((sum, ag) => sum + ag.assets.length, 0);
    return {
      ...c,
      latestROAS: latestMetric.roas,
      latestCTR: latestMetric.ctr,
      totalAssets,
      totalDays: c._count.metrics,
      assetGroups: undefined,
      metrics: undefined,
      _count: undefined,
    };
  });

  return { campaigns: enriched, total, page: parseInt(page), limit: parseInt(limit) };
}

async function getCampaignById(orgId, campaignId) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
    include: {
      assetGroups: {
        include: { assets: true },
      },
      metrics: {
        orderBy: { date: "desc" },
        take: 30,
      },
      experiments: true,
    },
  });

  if (!campaign) throw ApiError.notFound("Campaign not found");

  const aggregated = await prisma.campaignMetric.aggregate({
    where: { campaignId },
    _sum: { clicks: true, impressions: true, cost: true, revenue: true, conversions: true },
    _avg: { roas: true, cpa: true, ctr: true, cpc: true, convRate: true },
  });

  return {
    ...campaign,
    totals: aggregated._sum,
    averages: aggregated._avg,
  };
}

async function getCampaignMetrics(orgId, campaignId, days = 30) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
    select: { id: true },
  });
  if (!campaign) throw ApiError.notFound("Campaign not found");

  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const metrics = await prisma.campaignMetric.findMany({
    where: { campaignId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  return metrics;
}

async function createCampaign(orgId, data) {
  const campaign = await prisma.campaign.create({
    data: {
      id: uuidv4(),
      organizationId: orgId,
      name: data.name,
      type: data.type || "PERFORMANCE_MAX",
      status: data.status || "ACTIVE",
      country: data.country,
      currency: data.currency || "USD",
      dailyBudget: data.dailyBudget,
      totalBudget: data.totalBudget,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
    },
  });

  return campaign;
}

async function updateCampaign(orgId, campaignId, data) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound("Campaign not found");

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      name: data.name,
      status: data.status,
      country: data.country,
      dailyBudget: data.dailyBudget,
      totalBudget: data.totalBudget,
    },
  });

  return campaign;
}

async function getStats(orgId) {
  const campaigns = await prisma.campaign.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: true,
  });

  const metricsAgg = await prisma.campaignMetric.aggregate({
    where: { campaign: { organizationId: orgId } },
    _sum: { cost: true, revenue: true, clicks: true, impressions: true, conversions: true },
    _avg: { roas: true, ctr: true, cpa: true },
  });

  return {
    campaignCounts: campaigns,
    totals: metricsAgg._sum,
    averages: metricsAgg._avg,
  };
}

module.exports = { listCampaigns, getCampaignById, getCampaignMetrics, createCampaign, updateCampaign, getStats };
