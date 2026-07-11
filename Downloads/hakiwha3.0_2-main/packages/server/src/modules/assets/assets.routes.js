const { Router } = require("express");
const assetsController = require("./assets.controller");
const { authenticate } = require("../../middleware/auth");

const router = Router();

router.use(authenticate);

router.get("/best", assetsController.getBestAssets);
router.get("/stats", assetsController.getAssetStats);
router.get("/", assetsController.listAssets);
router.get("/:id", assetsController.getAssetById);

module.exports = router;
