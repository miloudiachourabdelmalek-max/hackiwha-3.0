const experimentsService = require("./experiments.service");
const apiResponse = require("../../utils/apiResponse");

async function listExperiments(req, res, next) {
  try {
    const result = await experimentsService.listExperiments(req.user.organizationId, req.query);
    return apiResponse.paginated(res, result.experiments, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
}

async function getExperimentById(req, res, next) {
  try {
    const experiment = await experimentsService.getExperimentById(req.user.organizationId, req.params.id);
    return apiResponse.success(res, experiment);
  } catch (error) {
    next(error);
  }
}

async function createExperiment(req, res, next) {
  try {
    const experiment = await experimentsService.createExperiment(req.user.organizationId, req.user.id, req.body);
    return apiResponse.created(res, experiment);
  } catch (error) {
    next(error);
  }
}

async function updateExperiment(req, res, next) {
  try {
    const experiment = await experimentsService.updateExperiment(req.user.organizationId, req.params.id, req.body);
    return apiResponse.success(res, experiment);
  } catch (error) {
    next(error);
  }
}

async function deleteExperiment(req, res, next) {
  try {
    await experimentsService.deleteExperiment(req.user.organizationId, req.params.id);
    return apiResponse.success(res, { message: "Experiment deleted" });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await experimentsService.getStats(req.user.organizationId);
    return apiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
}

module.exports = { listExperiments, getExperimentById, createExperiment, updateExperiment, deleteExperiment, getStats };
