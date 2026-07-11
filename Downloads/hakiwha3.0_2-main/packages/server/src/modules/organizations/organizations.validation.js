const { z } = require("zod");

const createOrgSchema = {
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  }),
};

const updateOrgSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    logo: z.string().url().optional(),
    plan: z.enum(["ESSENTIAL", "PREMIUM"]).optional(),
  }),
};

module.exports = { createOrgSchema, updateOrgSchema };
