const express = require("express");
const { authenticate } = require("../../middleware/auth");
const router = express.Router();

router.get("/plan", authenticate, async (req, res, next) => {
  try {
    const prisma = require("../../config/database");
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { plan: true, planSince: true, name: true },
    });
    return res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
});

router.post("/upgrade", authenticate, async (req, res, next) => {
  try {
    const prisma = require("../../config/database");
    const { plan } = req.body;

    if (!["ESSENTIAL", "PREMIUM"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan. Must be ESSENTIAL or PREMIUM." });
    }

    const org = await prisma.organization.update({
      where: { id: req.user.organizationId },
      data: { plan, planSince: new Date() },
      select: { plan: true, planSince: true, name: true },
    });

    return res.json({ success: true, data: org, message: `Upgraded to ${plan} plan` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
