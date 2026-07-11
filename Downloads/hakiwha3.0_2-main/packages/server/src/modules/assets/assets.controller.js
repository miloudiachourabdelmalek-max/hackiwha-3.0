const assetsService = require("./assets.service");
const apiResponse = require("../../utils/apiResponse");

async function listAssets(req, res, next) {
  try {
    const result = await assetsService.listAssets(req.user.organizationId, req.query);
    return apiResponse.paginated(res, result.assets, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
}

async function getAssetById(req, res, next) {
  try {
    const asset = await assetsService.getAssetById(req.user.organizationId, req.params.id);
    return apiResponse.success(res, asset);
  } catch (error) {
    next(error);
  }
}

async function getBestAssets(req, res, next) {
  try {
    const assets = await assetsService.getBestAssets(req.user.organizationId);
    return apiResponse.success(res, assets);
  } catch (error) {
    next(error);
  }
}

async function getAssetStats(req, res, next) {
  try {
    const stats = await assetsService.getAssetStats(req.user.organizationId);
    return apiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
}

module.exports = { listAssets, getAssetById, getBestAssets, getAssetStats };
