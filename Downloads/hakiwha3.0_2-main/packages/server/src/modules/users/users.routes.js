const { Router } = require("express");
const usersController = require("./users.controller");
const { authenticate } = require("../../middleware/auth");
const { requireMinRole } = require("../../middleware/role");
const validate = require("../../middleware/validate");
const { updateProfileSchema } = require("./users.validation");

const router = Router();

router.get("/me", authenticate, usersController.getProfile);
router.put("/me", authenticate, validate(updateProfileSchema), usersController.updateProfile);
router.get("/organization", authenticate, usersController.getOrgUsers);
router.put("/:userId/role", authenticate, requireMinRole("ADMIN"), usersController.changeUserRole);

module.exports = router;
