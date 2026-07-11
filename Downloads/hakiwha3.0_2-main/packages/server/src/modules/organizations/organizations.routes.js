const { Router } = require("express");
const organizationsController = require("./organizations.controller");
const { authenticate } = require("../../middleware/auth");

const router = Router();

router.get("/", authenticate, organizationsController.getOrganization);
router.put("/", authenticate, organizationsController.updateOrganization);

module.exports = router;
