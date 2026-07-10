const repo = require('../repositories/campaign.repository');
const { ApiError } = require('../middleware/errorHandler');

async function list(organizationId, query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const [items, total] = await Promise.all([
    repo.findMany(organizationId, { ...query, page, limit }),
    repo.count(organizationId, query),
  ]);
  return { items, meta: { page, limit, total } };
}

async function getById(organizationId, id) {
  const campaign = await repo.findById(organizationId, id);
  if (!campaign) throw new ApiError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  return campaign;
}

module.exports = { list, getById };
