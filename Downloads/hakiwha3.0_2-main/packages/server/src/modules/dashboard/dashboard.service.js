const prisma = require("../../config/database");

async function getSummary(orgId) {
  const metricsAgg = await prisma.campaignMetric.aggregate({
    where: { campaign: { organizationId: orgId } },
    _sum: { cost: true, revenue: true, clicks: true, impressions: true, conversions: true },
    _avg: { roas: true, cpa: true, ctr: true, convRate: true },
  });

  const campaignCount = await prisma.campaign.count({ where: { organizationId: orgId } });
  const experimentCount = await prisma.experiment.count({ where: { organizationId: orgId } });

  const bestCampaign = await prisma.campaignMetric.groupBy({
    by: ["campaignId"],
    where: { campaign: { organizationId: orgId } },
    _sum: { revenue: true },
    orderBy: { _sum: { revenue: "desc" } },
    take: 1,
  });

  const worstCampaign = await prisma.campaignMetric.groupBy({
    by: ["campaignId"],
    where: { campaign: { organizationId: orgId } },
    _sum: { revenue: true },
    orderBy: { _sum: { revenue: "asc" } },
    take: 1,
  });

  let bestCampaignData = null;
  let worstCampaignData = null;

  if (bestCampaign.length > 0) {
    bestCampaignData = await prisma.campaign.findUnique({
      where: { id: bestCampaign[0].campaignId },
      select: { name: true, country: true, type: true },
    });
  }

  if (worstCampaign.length > 0) {
    worstCampaignData = await prisma.campaign.findUnique({
      where: { id: worstCampaign[0].campaignId },
      select: { name: true, country: true, type: true },
    });
  }

  return {
    totalSpend: metricsAgg._sum.cost || 0,
    totalRevenue: metricsAgg._sum.revenue || 0,
    avgROAS: metricsAgg._avg.roas || 0,
    avgCPA: metricsAgg._avg.cpa || 0,
    avgCTR: metricsAgg._avg.ctr || 0,
    totalConversions: metricsAgg._sum.conversions || 0,
    totalClicks: metricsAgg._sum.clicks || 0,
    totalImpressions: metricsAgg._sum.impressions || 0,
    campaignCount,
    experimentCount,
    bestCampaign: bestCampaignData,
    worstCampaign: worstCampaignData,
  };
}

async function getChartData(orgId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  const metrics = await prisma.campaignMetric.findMany({
    where: {
      campaign: { organizationId: orgId },
      date: { gte: since },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      cost: true,
      revenue: true,
      clicks: true,
      impressions: true,
      conversions: true,
      roas: true,
    },
  });

  const byDate = {};
  metrics.forEach((m) => {
    const key = m.date.toISOString().split("T")[0];
    if (!byDate[key]) {
      byDate[key] = { date: key, cost: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0, roasSum: 0, count: 0 };
    }
    byDate[key].cost += Number(m.cost);
    byDate[key].revenue += Number(m.revenue);
    byDate[key].clicks += m.clicks;
    byDate[key].impressions += m.impressions;
    byDate[key].conversions += Number(m.conversions);
    if (m.roas) { byDate[key].roasSum += Number(m.roas); byDate[key].count += 1; }
  });

  return Object.values(byDate).map((d) => ({
    date: d.date,
    cost: Math.round(d.cost * 100) / 100,
    revenue: Math.round(d.revenue * 100) / 100,
    clicks: d.clicks,
    impressions: d.impressions,
    conversions: d.conversions,
    roas: d.count > 0 ? Math.round((d.roasSum / d.count) * 100) / 100 : 0,
  }));
}

async function getTopCampaigns(orgId) {
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: orgId },
    include: {
      metrics: {
        orderBy: { date: "desc" },
        take: 1,
      },
      _count: { select: { metrics: true } },
    },
  });

  const enriched = campaigns
    .map((c) => {
      const m = c.metrics[0] || {};
      return {
        id: c.id,
        name: c.name,
        country: c.country,
        type: c.type,
        status: c.status,
        roas: m.roas ? Number(m.roas) : 0,
        ctr: m.ctr ? Number(m.ctr) : 0,
        cost: m.cost ? Number(m.cost) : 0,
        revenue: m.revenue ? Number(m.revenue) : 0,
      };
    })
    .sort((a, b) => b.roas - a.roas);

  return {
    best: enriched.slice(0, 5),
    worst: enriched.slice(-5).reverse(),
  };
}

async function getCountryBreakdown(orgId) {
  const metrics = await prisma.campaignMetric.findMany({
    where: { campaign: { organizationId: orgId } },
    select: {
      cost: true,
      revenue: true,
      conversions: true,
      campaign: { select: { country: true } },
    },
  });

  const byCountry = {};
  metrics.forEach((m) => {
    const c = m.campaign.country;
    if (!byCountry[c]) {
      byCountry[c] = { country: c, cost: 0, revenue: 0, conversions: 0 };
    }
    byCountry[c].cost += Number(m.cost);
    byCountry[c].revenue += Number(m.revenue);
    byCountry[c].conversions += Number(m.conversions);
  });

  return Object.values(byCountry).map((d) => ({
    ...d,
    cost: Math.round(d.cost * 100) / 100,
    revenue: Math.round(d.revenue * 100) / 100,
    roas: d.cost > 0 ? Math.round((d.revenue / d.cost) * 100) / 100 : 0,
  }));
}

module.exports = { getSummary, getChartData, getTopCampaigns, getCountryBreakdown };
