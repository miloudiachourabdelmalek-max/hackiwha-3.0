const dashboardService = require("./dashboard.service");
const apiResponse = require("../../utils/apiResponse");

async function getSummary(req, res, next) {
  try {
    const summary = await dashboardService.getSummary(req.user.organizationId);
    return apiResponse.success(res, summary);
  } catch (error) {
    next(error);
  }
}

async function getChartData(req, res, next) {
  try {
    const data = await dashboardService.getChartData(req.user.organizationId, req.query.days);
    return apiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
}

async function getTopCampaigns(req, res, next) {
  try {
    const data = await dashboardService.getTopCampaigns(req.user.organizationId);
    return apiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
}

async function getCountryBreakdown(req, res, next) {
  try {
    const data = await dashboardService.getCountryBreakdown(req.user.organizationId);
    return apiResponse.success(res, data);
  } catch (error) {
    next(error);
  }
}

async function getAISummary(req, res, next) {
  try {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${AI_SERVICE_URL}/analyze/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: req.user.organizationId }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        return apiResponse.success(res, data);
      }
    } catch (err) {
      console.error("[AI Summary] AI service unavailable, using mock:", err.message);
    }

    const summary = await dashboardService.getSummary(req.user.organizationId);
    const mockSummary = generateMockSummary(summary);
    return apiResponse.success(res, mockSummary);
  } catch (error) {
    next(error);
  }
}

function generateMockSummary(data) {
  const roas = Number(data.avgROAS) || 0;
  let sentiment = "positive";
  let headline = "Your campaigns are performing well";
  if (roas < 2) { sentiment = "negative"; headline = "Your campaigns need attention"; }
  else if (roas < 3.5) { sentiment = "neutral"; headline = "Your campaigns have room for improvement"; }

  return {
    headline,
    sentiment,
    highlights: [
      `Total spend: $${Number(data.totalSpend).toLocaleString()} generating $${Number(data.totalRevenue).toLocaleString()} in revenue`,
      `Average ROAS: ${Number(data.avgROAS).toFixed(2)}x across ${data.campaignCount} campaigns`,
      data.bestCampaign ? `Best performer: ${data.bestCampaign.name} (${data.bestCampaign.country})` : null,
    ].filter(Boolean),
    recommendations: [
      "Consider reallocating budget from underperforming campaigns to top performers",
      "Review asset performance to identify reusable creative elements",
      "Document lessons from completed campaigns for future reference",
    ],
  };
}

module.exports = { getSummary, getChartData, getTopCampaigns, getCountryBreakdown, getAISummary };
