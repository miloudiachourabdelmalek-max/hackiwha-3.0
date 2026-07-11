const { Router } = require("express");
const aiController = require("./ai.controller");
const { authenticate } = require("../../middleware/auth");
const { requirePremium } = require("../../middleware/requirePremium");

const router = Router();

router.use(authenticate);
router.use(requirePremium);

router.post("/analyze-campaign/:id", aiController.analyzeCampaign);
router.post("/recommend", aiController.recommend);
router.post("/chat", aiController.chat);

module.exports = router;
