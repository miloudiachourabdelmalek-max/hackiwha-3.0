const { z } = require("zod");

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["PERFORMANCE_MAX", "SEARCH", "DISPLAY", "SHOPPING", "VIDEO", "APP", "SMART"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  country: z.string().min(2).max(5),
  currency: z.string().max(5).optional(),
  dailyBudget: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  startDate: z.string().optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  country: z.string().min(2).max(5).optional(),
  dailyBudget: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
});

module.exports = { createCampaignSchema, updateCampaignSchema };
