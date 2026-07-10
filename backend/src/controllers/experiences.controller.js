const { z } = require('zod');
const service = require('../services/experience.service');
const { asyncHandler } = require('../utils/asyncHandler');

const experienceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  goal: z.string().optional(),
  hypothesis: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  targetAudience: z.string().optional(),
  industry: z.string().optional(),
  category: z.string().optional(),
  productName: z.string().optional(),
  platform: z.string().optional(),
  budgetMicros: z.union([z.string(), z.number()]).optional(),
  spendMicros: z.union([z.string(), z.number()]).optional(),
  roas: z.number().optional(),
  cpaMicros: z.union([z.string(), z.number()]).optional(),
  ctr: z.number().optional(),
  conversionRate: z.number().optional(),
  revenueMicros: z.union([z.string(), z.number()]).optional(),
  profitMicros: z.union([z.string(), z.number()]).optional(),
  creativeUsed: z.string().optional(),
  offer: z.string().optional(),
  landingPage: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  audience: z.string().optional(),
  result: z.string().optional(),
  lessonsLearned: z.string().optional(),
  mistakesMade: z.string().optional(),
  recommendations: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  campaignId: z.string().optional(),
});

function coerceBigInts(input) {
  const bigIntFields = ['budgetMicros', 'spendMicros', 'cpaMicros', 'revenueMicros', 'profitMicros'];
  const out = { ...input };
  for (const f of bigIntFields) if (out[f] !== undefined) out[f] = BigInt(out[f]);
  return out;
}

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.organizationId, req.query);
  res.json({ data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const exp = await service.getById(req.organizationId, req.params.id);
  res.json({ data: exp });
});

const create = asyncHandler(async (req, res) => {
  const input = coerceBigInts(experienceSchema.parse(req.body));
  const exp = await service.create(req.organizationId, req.userId, input);
  res.status(201).json({ data: exp });
});

const update = asyncHandler(async (req, res) => {
  const input = coerceBigInts(experienceSchema.partial().parse(req.body));
  const exp = await service.update(req.organizationId, req.params.id, input);
  res.json({ data: exp });
});

const similar = asyncHandler(async (req, res) => {
  const { country, category, platform, budgetMicros } = req.query;
  const results = await service.findSimilar(req.organizationId, { country, category, platform, budgetMicros });
  res.json({ data: results });
});

module.exports = { list, getById, create, update, similar };
