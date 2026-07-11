const campaignsService = require("./campaigns.service");
const apiResponse = require("../../utils/apiResponse");

async function listCampaigns(req, res, next) {
  try {
    const result = await campaignsService.listCampaigns(req.user.organizationId, req.query);
    return apiResponse.paginated(res, result.campaigns, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
}

async function getCampaignById(req, res, next) {
  try {
    const campaign = await campaignsService.getCampaignById(req.user.organizationId, req.params.id);
    return apiResponse.success(res, campaign);
  } catch (error) {
    next(error);
  }
}

async function getCampaignMetrics(req, res, next) {
  try {
    const metrics = await campaignsService.getCampaignMetrics(req.user.organizationId, req.params.id, req.query.days);
    return apiResponse.success(res, metrics);
  } catch (error) {
    next(error);
  }
}

async function createCampaign(req, res, next) {
  try {
    const campaign = await campaignsService.createCampaign(req.user.organizationId, req.body);
    return apiResponse.created(res, campaign);
  } catch (error) {
    next(error);
  }
}

async function updateCampaign(req, res, next) {
  try {
    const campaign = await campaignsService.updateCampaign(req.user.organizationId, req.params.id, req.body);
    return apiResponse.success(res, campaign);
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await campaignsService.getStats(req.user.organizationId);
    return apiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
}

module.exports = { listCampaigns, getCampaignById, getCampaignMetrics, createCampaign, updateCampaign, getStats };
