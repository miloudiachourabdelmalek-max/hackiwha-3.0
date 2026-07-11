const { Router } = require("express");
const dashboardController = require("./dashboard.controller");
const { authenticate } = require("../../middleware/auth");

const router = Router();

router.use(authenticate);

router.get("/summary", dashboardController.getSummary);
router.get("/charts", dashboardController.getChartData);
router.get("/top-campaigns", dashboardController.getTopCampaigns);
router.get("/country-breakdown", dashboardController.getCountryBreakdown);
router.get("/ai-summary", dashboardController.getAISummary);

module.exports = router;
