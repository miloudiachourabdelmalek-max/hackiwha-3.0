const { Router } = require("express");
const experimentsController = require("./experiments.controller");
const { authenticate } = require("../../middleware/auth");
const { requireMinRole } = require("../../middleware/role");

const router = Router();

router.use(authenticate);

router.get("/stats", experimentsController.getStats);
router.get("/", experimentsController.listExperiments);
router.get("/:id", experimentsController.getExperimentById);
router.post("/", requireMinRole("MANAGER"), experimentsController.createExperiment);
router.put("/:id", requireMinRole("MANAGER"), experimentsController.updateExperiment);
router.delete("/:id", requireMinRole("MANAGER"), experimentsController.deleteExperiment);

module.exports = router;
