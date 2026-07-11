const prisma = require("../config/database");

async function requirePremium(req, res, next) {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.status(403).json({ success: false, message: "No organization found" });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { plan: true },
    });

    if (!org || org.plan !== "PREMIUM") {
      return res.status(403).json({
        success: false,
        message: "This feature requires a Premium plan. Upgrade at /dashboard/pricing.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requirePremium };
