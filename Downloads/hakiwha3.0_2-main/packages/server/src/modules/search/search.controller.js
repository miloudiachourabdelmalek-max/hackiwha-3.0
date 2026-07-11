const searchService = require("./search.service");
const apiResponse = require("../../utils/apiResponse");

async function search(req, res, next) {
  try {
    const results = await searchService.globalSearch(req.user.organizationId, req.query.q);
    return apiResponse.success(res, results);
  } catch (error) {
    next(error);
  }
}

async function suggest(req, res, next) {
  try {
    const suggestions = await searchService.suggest(req.user.organizationId, req.query.q);
    return apiResponse.success(res, suggestions);
  } catch (error) {
    next(error);
  }
}

module.exports = { search, suggest };
