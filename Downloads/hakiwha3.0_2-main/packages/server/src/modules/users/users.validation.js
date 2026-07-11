const { z } = require("zod");

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url().optional(),
  }),
};

const changeRoleSchema = {
  body: z.object({
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "ANALYST", "VIEWER"]),
  }),
  params: z.object({
    userId: z.string().uuid(),
  }),
};

module.exports = { updateProfileSchema, changeRoleSchema };
