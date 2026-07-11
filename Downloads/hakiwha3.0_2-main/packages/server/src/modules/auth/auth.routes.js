const { Router } = require("express");
const authController = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { authLimiter } = require("../../middleware/rateLimit");
const { registerSchema, loginSchema, refreshSchema } = require("./auth.validation");

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.get("/google", authController.googleUrl);
router.get("/google/callback", authController.googleCallback);
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
