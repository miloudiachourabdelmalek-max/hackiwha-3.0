const { Router } = require("express");
const campaignsController = require("./campaigns.controller");
const { authenticate } = require("../../middleware/auth");

const router = Router();

router.use(authenticate);

router.get("/stats", campaignsController.getStats);
router.get("/", campaignsController.listCampaigns);
router.get("/:id", campaignsController.getCampaignById);
router.get("/:id/metrics", campaignsController.getCampaignMetrics);
router.post("/", campaignsController.createCampaign);
router.put("/:id", campaignsController.updateCampaign);

module.exports = router;
