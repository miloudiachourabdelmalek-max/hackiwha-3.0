const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { limiter } = require("./middleware/rateLimit");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const organizationsRoutes = require("./modules/organizations/organizations.routes");
const campaignsRoutes = require("./modules/campaigns/campaigns.routes");
const experimentsRoutes = require("./modules/experiments/experiments.routes");
const searchRoutes = require("./modules/search/search.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const assetsRoutes = require("./modules/assets/assets.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const subscriptionRoutes = require("./modules/subscription/subscription.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api", limiter);

app.get("/api/health", (_, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/campaigns", campaignsRoutes);
app.use("/api/experiments", experimentsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/subscription", subscriptionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
