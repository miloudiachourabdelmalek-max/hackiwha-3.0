const repo = require('../repositories/experience.repository');
const { ApiError } = require('../middleware/errorHandler');

async function list(organizationId, query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const items = await repo.findMany(organizationId, { ...query, page, limit });
  return { items, meta: { page, limit } };
}

async function getById(organizationId, id) {
  const exp = await repo.findById(organizationId, id);
  if (!exp) throw new ApiError(404, 'EXPERIENCE_NOT_FOUND', 'Experience not found');
  return exp;
}

function create(organizationId, authorId, data) {
  return repo.create(organizationId, authorId, data);
}

async function update(organizationId, id, data) {
  const result = await repo.update(organizationId, id, data);
  if (result.count === 0) throw new ApiError(404, 'EXPERIENCE_NOT_FOUND', 'Experience not found');
  return repo.findById(organizationId, id);
}

// Feature 4: "did we already try this, and did it fail before" — called live from the
// new-experience form as the user fills in country/category/budget.
function findSimilar(organizationId, params) {
  return repo.findSimilar(organizationId, params);
}

module.exports = { list, getById, create, update, findSimilar };
