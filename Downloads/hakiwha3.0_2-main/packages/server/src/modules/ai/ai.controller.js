const aiService = require("./ai.service");
const apiResponse = require("../../utils/apiResponse");

async function analyzeCampaign(req, res, next) {
  try {
    const result = await aiService.analyzeCampaign(req.user.organizationId, req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Campaign not found" });
    return apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function recommend(req, res, next) {
  try {
    const result = await aiService.recommend(req.user.organizationId, req.body);
    return apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function chat(req, res, next) {
  try {
    const result = await aiService.chat(req.user.organizationId, req.body.message);
    return apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = { analyzeCampaign, recommend, chat };
