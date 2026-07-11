const organizationsService = require("./organizations.service");
const ApiError = require("../../utils/ApiError");
const apiResponse = require("../../utils/apiResponse");

async function getOrganization(req, res, next) {
  try {
    const org = await organizationsService.getOrganization(req.user.organizationId);
    return apiResponse.success(res, org);
  } catch (error) {
    next(error);
  }
}

async function updateOrganization(req, res, next) {
  try {
    if (req.user.role !== "OWNER" && req.user.role !== "ADMIN") {
      throw ApiError.forbidden("Only owners and admins can update organization");
    }
    const org = await organizationsService.updateOrganization(req.user.organizationId, req.body);
    return apiResponse.success(res, org);
  } catch (error) {
    next(error);
  }
}

module.exports = { getOrganization, updateOrganization };
